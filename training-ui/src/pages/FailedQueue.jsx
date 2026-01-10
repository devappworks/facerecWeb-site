import { useState, useEffect } from 'react'
import api from '../services/api'

function FailedQueue() {
  const [failedEntries, setFailedEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [retrying, setRetrying] = useState(null)

  const fetchFailedEntries = async () => {
    try {
      setLoading(true)
      const response = await api.get('/training/queue-failed', {
        params: { domain: 'serbia' }
      })
      if (response.data.success) {
        setFailedEntries(response.data.data.failed || [])
      } else {
        setError(response.data.error || 'Failed to fetch failed entries')
      }
    } catch (err) {
      setError(err.message || 'Error fetching failed queue entries')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFailedEntries()
  }, [])

  const handleRetry = async (fileName, personName) => {
    try {
      setRetrying(fileName)
      const response = await api.post('/training/queue-retry', {
        domain: 'serbia',
        file_name: fileName
      })
      if (response.data.success) {
        // Remove from list
        setFailedEntries(prev => prev.filter(e => e.file_name !== fileName))
      } else {
        alert(`Failed to retry: ${response.data.error}`)
      }
    } catch (err) {
      alert(`Error retrying ${personName}: ${err.message}`)
    } finally {
      setRetrying(null)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Failed Queue Entries</h1>
        <p className="subtitle">Training attempts that failed (e.g., no SERP consensus)</p>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: '500' }}>
            Total failed: {failedEntries.length}
          </span>
          <button
            className="btn"
            onClick={fetchFailedEntries}
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {loading && failedEntries.length === 0 ? (
        <div className="loading-state">
          <span className="spinner" style={{ width: '2rem', height: '2rem' }}></span>
          <p>Loading failed entries...</p>
        </div>
      ) : failedEntries.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: '#38a169', fontSize: '1.125rem' }}>
            No failed entries! All queue items processed successfully.
          </p>
        </div>
      ) : (
        <div className="card">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: '600' }}>Person</th>
                <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: '600' }}>Error</th>
                <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: '600' }}>Priority</th>
                <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: '600' }}>Source</th>
                <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: '600' }}>Processed At</th>
                <th style={{ textAlign: 'center', padding: '0.75rem', fontWeight: '600' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {failedEntries.map((entry, index) => (
                <tr
                  key={entry.file_name || index}
                  style={{
                    borderBottom: '1px solid #e2e8f0',
                    backgroundColor: index % 2 === 0 ? '#f7fafc' : 'white'
                  }}
                >
                  <td style={{ padding: '0.75rem', fontWeight: '500' }}>
                    {entry.person_name}
                  </td>
                  <td style={{ padding: '0.75rem', color: '#e53e3e' }}>
                    {entry.error || 'Unknown error'}
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <span
                      style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.25rem',
                        fontSize: '0.875rem',
                        backgroundColor:
                          entry.priority === 'high' ? '#fed7d7' :
                          entry.priority === 'medium' ? '#feebc8' :
                          '#e2e8f0',
                        color:
                          entry.priority === 'high' ? '#c53030' :
                          entry.priority === 'medium' ? '#c05621' :
                          '#4a5568'
                      }}
                    >
                      {entry.priority || 'normal'}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem', color: '#718096' }}>
                    {entry.source || 'N/A'}
                  </td>
                  <td style={{ padding: '0.75rem', color: '#718096', fontSize: '0.875rem' }}>
                    {formatDate(entry.processed_at)}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                    <button
                      className="btn"
                      onClick={() => handleRetry(entry.file_name, entry.person_name)}
                      disabled={retrying === entry.file_name}
                      style={{
                        backgroundColor: '#3182ce',
                        color: 'white',
                        border: 'none',
                        padding: '0.375rem 0.75rem',
                        fontSize: '0.875rem'
                      }}
                    >
                      {retrying === entry.file_name ? 'Retrying...' : 'Retry'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="card" style={{ marginTop: '1.5rem', backgroundColor: '#fffbeb' }}>
        <h3 style={{ marginBottom: '0.75rem', color: '#92400e' }}>Why do entries fail?</h3>
        <ul style={{ paddingLeft: '1.5rem', color: '#78350f', lineHeight: '1.8' }}>
          <li><strong>No SERP consensus:</strong> Not enough matching faces found in search results (need 5+ images of the same person).</li>
          <li><strong>No faces detected:</strong> Search results contained images without detectable faces.</li>
          <li><strong>Download failures:</strong> Unable to download enough images from search results.</li>
        </ul>
        <p style={{ marginTop: '1rem', color: '#78350f' }}>
          Click <strong>Retry</strong> to reset the entry to pending status and attempt training again in the next batch.
        </p>
      </div>
    </div>
  )
}

export default FailedQueue
