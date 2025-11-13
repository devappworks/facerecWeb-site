import { useState, useEffect } from 'react'
import { abTestingService } from '../../services/abTesting'

export default function TestHistory() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [resultFilter, setResultFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await abTestingService.getTestHistory()
      if (response.success) {
        setHistory(response.data.tests)
      } else {
        throw new Error(response.message || 'Failed to fetch history')
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch test history')
    } finally {
      setLoading(false)
    }
  }

  // Apply filters
  const filteredHistory = history.filter((test) => {
    // Search filter
    if (
      searchTerm &&
      !test.image_id.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !test.pipeline_a_result?.person?.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !test.pipeline_b_result?.person?.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false
    }

    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'both_success' && !test.comparison_metrics.both_succeeded) {
        return false
      }
      if (statusFilter === 'only_a' && !test.comparison_metrics.only_pipeline_a) {
        return false
      }
      if (statusFilter === 'only_b' && !test.comparison_metrics.only_pipeline_b) {
        return false
      }
      if (statusFilter === 'both_failed' && !test.comparison_metrics.both_failed) {
        return false
      }
    }

    // Result filter
    if (resultFilter !== 'all') {
      if (resultFilter === 'agree' && !test.comparison_metrics.results_match) {
        return false
      }
      if (resultFilter === 'disagree' && test.comparison_metrics.results_match) {
        return false
      }
    }

    // Date filter
    if (dateFilter !== 'all') {
      const testDate = new Date(test.timestamp)
      const now = new Date()
      const daysDiff = (now - testDate) / (1000 * 60 * 60 * 24)

      if (dateFilter === 'today' && daysDiff > 1) return false
      if (dateFilter === 'week' && daysDiff > 7) return false
      if (dateFilter === 'month' && daysDiff > 30) return false
    }

    return true
  })

  // Pagination
  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedHistory = filteredHistory.slice(startIndex, startIndex + itemsPerPage)

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter, resultFilter, dateFilter])

  // Export functions
  const exportToCSV = () => {
    const headers = [
      'Timestamp',
      'Image ID',
      'Pipeline A Result',
      'Pipeline A Confidence',
      'Pipeline B Result',
      'Pipeline B Confidence',
      'Agreement',
      'Status',
    ]

    const rows = filteredHistory.map((test) => [
      new Date(test.timestamp).toLocaleString(),
      test.image_id,
      test.pipeline_a_result?.person || 'N/A',
      test.pipeline_a_result?.confidence?.toFixed(1) || 'N/A',
      test.pipeline_b_result?.person || 'N/A',
      test.pipeline_b_result?.confidence?.toFixed(1) || 'N/A',
      test.comparison_metrics.results_match ? 'Yes' : 'No',
      test.comparison_metrics.both_succeeded
        ? 'Both Success'
        : test.comparison_metrics.only_pipeline_a
          ? 'Only A'
          : test.comparison_metrics.only_pipeline_b
            ? 'Only B'
            : 'Both Failed',
    ])

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ab-test-history-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportToJSON = () => {
    const json = JSON.stringify(filteredHistory, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ab-test-history-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const getStatusBadge = (test) => {
    if (test.comparison_metrics.both_succeeded) {
      return {
        text: 'Both Success',
        color: '#10b981',
        bg: 'rgba(16, 185, 129, 0.1)',
      }
    } else if (test.comparison_metrics.only_pipeline_a) {
      return {
        text: 'Only Pipeline A',
        color: '#3b82f6',
        bg: 'rgba(59, 130, 246, 0.1)',
      }
    } else if (test.comparison_metrics.only_pipeline_b) {
      return {
        text: 'Only Pipeline B',
        color: '#f59e0b',
        bg: 'rgba(245, 158, 11, 0.1)',
      }
    } else {
      return {
        text: 'Both Failed',
        color: '#ef4444',
        bg: 'rgba(239, 68, 68, 0.1)',
      }
    }
  }

  return (
    <div className="page-container">
      <h1>A/B Testing - Test History</h1>
      <p className="subtitle">Browse and export past comparison test results.</p>

      {/* Controls */}
      <div className="card" style={{ marginTop: '2rem' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginBottom: '1rem',
          }}
        >
          {/* Search */}
          <div>
            <label
              htmlFor="search"
              style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}
            >
              Search
            </label>
            <input
              id="search"
              type="text"
              placeholder="Image ID or person name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input"
              style={{ width: '100%' }}
            />
          </div>

          {/* Status Filter */}
          <div>
            <label
              htmlFor="status"
              style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}
            >
              Status
            </label>
            <select
              id="status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input"
              style={{ width: '100%' }}
            >
              <option value="all">All Statuses</option>
              <option value="both_success">Both Success</option>
              <option value="only_a">Only Pipeline A</option>
              <option value="only_b">Only Pipeline B</option>
              <option value="both_failed">Both Failed</option>
            </select>
          </div>

          {/* Result Filter */}
          <div>
            <label
              htmlFor="result"
              style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}
            >
              Agreement
            </label>
            <select
              id="result"
              value={resultFilter}
              onChange={(e) => setResultFilter(e.target.value)}
              className="input"
              style={{ width: '100%' }}
            >
              <option value="all">All Results</option>
              <option value="agree">Agree</option>
              <option value="disagree">Disagree</option>
            </select>
          </div>

          {/* Date Filter */}
          <div>
            <label
              htmlFor="date"
              style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}
            >
              Date Range
            </label>
            <select
              id="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="input"
              style={{ width: '100%' }}
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>
          </div>
        </div>

        {/* Actions */}
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '1rem',
            borderTop: '1px solid rgba(107, 114, 128, 0.2)',
          }}
        >
          <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>
            Showing {paginatedHistory.length} of {filteredHistory.length} tests
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className="btn btn-secondary"
              onClick={exportToCSV}
              disabled={filteredHistory.length === 0}
              style={{ padding: '0.5rem 1rem' }}
            >
              Export CSV
            </button>
            <button
              className="btn btn-secondary"
              onClick={exportToJSON}
              disabled={filteredHistory.length === 0}
              style={{ padding: '0.5rem 1rem' }}
            >
              Export JSON
            </button>
            <button
              className="btn btn-secondary"
              onClick={fetchHistory}
              style={{ padding: '0.5rem 1rem' }}
            >
              🔄 Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="card" style={{ marginTop: '2rem', textAlign: 'center' }}>
          <p>Loading test history...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div
          className="card"
          style={{
            marginTop: '2rem',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderColor: '#ef4444',
          }}
        >
          <p style={{ color: '#ef4444', margin: 0 }}>⚠️ {error}</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredHistory.length === 0 && (
        <div className="card" style={{ marginTop: '2rem', textAlign: 'center' }}>
          <p style={{ color: '#6b7280' }}>
            {history.length === 0
              ? 'No test history available yet. Run some comparisons to see results here.'
              : 'No tests match the current filters.'}
          </p>
        </div>
      )}

      {/* History Table */}
      {!loading && !error && paginatedHistory.length > 0 && (
        <>
          <div className="card" style={{ marginTop: '2rem', padding: 0, overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: 'rgba(107, 114, 128, 0.1)' }}>
                  <th
                    style={{
                      padding: '1rem',
                      textAlign: 'left',
                      fontWeight: '500',
                      borderBottom: '2px solid rgba(107, 114, 128, 0.2)',
                    }}
                  >
                    Timestamp
                  </th>
                  <th
                    style={{
                      padding: '1rem',
                      textAlign: 'left',
                      fontWeight: '500',
                      borderBottom: '2px solid rgba(107, 114, 128, 0.2)',
                    }}
                  >
                    Image ID
                  </th>
                  <th
                    style={{
                      padding: '1rem',
                      textAlign: 'left',
                      fontWeight: '500',
                      borderBottom: '2px solid rgba(107, 114, 128, 0.2)',
                    }}
                  >
                    Pipeline A
                  </th>
                  <th
                    style={{
                      padding: '1rem',
                      textAlign: 'left',
                      fontWeight: '500',
                      borderBottom: '2px solid rgba(107, 114, 128, 0.2)',
                    }}
                  >
                    Pipeline B
                  </th>
                  <th
                    style={{
                      padding: '1rem',
                      textAlign: 'center',
                      fontWeight: '500',
                      borderBottom: '2px solid rgba(107, 114, 128, 0.2)',
                    }}
                  >
                    Agreement
                  </th>
                  <th
                    style={{
                      padding: '1rem',
                      textAlign: 'center',
                      fontWeight: '500',
                      borderBottom: '2px solid rgba(107, 114, 128, 0.2)',
                    }}
                  >
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedHistory.map((test, index) => {
                  const statusBadge = getStatusBadge(test)
                  return (
                    <tr
                      key={test.test_id || index}
                      style={{
                        borderBottom: '1px solid rgba(107, 114, 128, 0.1)',
                      }}
                    >
                      <td style={{ padding: '1rem', fontSize: '0.9rem' }}>
                        {new Date(test.timestamp).toLocaleString()}
                      </td>
                      <td
                        style={{
                          padding: '1rem',
                          fontSize: '0.9rem',
                          fontFamily: 'monospace',
                        }}
                      >
                        {test.image_id}
                      </td>
                      <td style={{ padding: '1rem', fontSize: '0.9rem' }}>
                        {test.pipeline_a_result?.person ? (
                          <div>
                            <div style={{ fontWeight: '500' }}>
                              {test.pipeline_a_result.person}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                              {test.pipeline_a_result.confidence.toFixed(1)}% confidence
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: '#6b7280' }}>
                            {test.pipeline_a_result?.status || 'N/A'}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '1rem', fontSize: '0.9rem' }}>
                        {test.pipeline_b_result?.person ? (
                          <div>
                            <div style={{ fontWeight: '500' }}>
                              {test.pipeline_b_result.person}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                              {test.pipeline_b_result.confidence.toFixed(1)}% confidence
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: '#6b7280' }}>
                            {test.pipeline_b_result?.status || 'N/A'}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        {test.comparison_metrics.both_succeeded ? (
                          test.comparison_metrics.results_match ? (
                            <span style={{ fontSize: '1.5rem', color: '#10b981' }}>✓</span>
                          ) : (
                            <span style={{ fontSize: '1.5rem', color: '#ef4444' }}>✗</span>
                          )
                        ) : (
                          <span style={{ fontSize: '0.9rem', color: '#6b7280' }}>-</span>
                        )}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <span
                          style={{
                            padding: '0.25rem 0.75rem',
                            borderRadius: '12px',
                            fontSize: '0.85rem',
                            fontWeight: '500',
                            backgroundColor: statusBadge.bg,
                            color: statusBadge.color,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {statusBadge.text}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div
              style={{
                marginTop: '1.5rem',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <button
                className="btn btn-secondary"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                style={{ padding: '0.5rem 1rem' }}
              >
                ← Previous
              </button>

              <div style={{ display: 'flex', gap: '0.25rem' }}>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((page) => {
                    // Show first page, last page, current page, and pages around current
                    return (
                      page === 1 ||
                      page === totalPages ||
                      Math.abs(page - currentPage) <= 1
                    )
                  })
                  .map((page, index, array) => {
                    // Add ellipsis if there's a gap
                    const showEllipsisBefore =
                      index > 0 && page - array[index - 1] > 1
                    return (
                      <div key={page} style={{ display: 'flex', gap: '0.25rem' }}>
                        {showEllipsisBefore && (
                          <span
                            style={{
                              padding: '0.5rem 0.75rem',
                              color: '#6b7280',
                            }}
                          >
                            ...
                          </span>
                        )}
                        <button
                          className={`btn ${page === currentPage ? 'btn-primary' : 'btn-secondary'}`}
                          onClick={() => setCurrentPage(page)}
                          style={{ padding: '0.5rem 0.75rem', minWidth: '40px' }}
                        >
                          {page}
                        </button>
                      </div>
                    )
                  })}
              </div>

              <button
                className="btn btn-secondary"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                style={{ padding: '0.5rem 1rem' }}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}

      {/* Info */}
      {!loading && !error && history.length > 0 && (
        <div
          style={{
            marginTop: '2rem',
            padding: '1rem',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderRadius: '8px',
            fontSize: '0.9rem',
            color: '#6b7280',
          }}
        >
          ℹ️ Test history is stored locally. Use export functions to save results for
          long-term archival.
        </div>
      )}
    </div>
  )
}
