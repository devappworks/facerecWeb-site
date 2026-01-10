import { useState, useEffect, useCallback } from 'react'
import { smartTrainingService } from '../../services/smartTraining'
import '../../styles/smart-training.css'

const DOMAINS = ['serbia', 'slovenia']

export default function TrainingHistory() {
  const [allRuns, setAllRuns] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [expandedRunId, setExpandedRunId] = useState(null)
  const [domainFilter, setDomainFilter] = useState('all') // 'all', 'serbia', 'slovenia'

  const loadHistory = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // Fetch from both domains in parallel
      const results = await Promise.all(
        DOMAINS.map(async (domain) => {
          try {
            const result = await smartTrainingService.getSmartTrainingRuns(domain)
            if (result.success && result.runs) {
              // Add domain to each run
              return result.runs.map(run => ({ ...run, domain }))
            }
            return []
          } catch (err) {
            console.warn(`Failed to fetch ${domain} history:`, err.message)
            return []
          }
        })
      )

      // Combine and sort by date (newest first)
      const combinedRuns = results.flat().sort((a, b) => {
        const dateA = new Date(a.started_at || 0)
        const dateB = new Date(b.started_at || 0)
        return dateB - dateA
      })

      setAllRuns(combinedRuns)
    } catch (err) {
      console.error('Error loading history:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  // Filter runs by domain
  const filteredRuns = domainFilter === 'all'
    ? allRuns
    : allRuns.filter(run => run.domain === domainFilter)

  // Count runs per domain
  const serbiaCount = allRuns.filter(r => r.domain === 'serbia').length
  const sloveniaCount = allRuns.filter(r => r.domain === 'slovenia').length

  return (
    <div className="page-container">
      <div className="dashboard-header">
        <div>
          <h1>Training History</h1>
          <p className="subtitle">Past smart training cycles and results</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={loadHistory}
          disabled={loading}
        >
          {loading ? 'Loading...' : '🔄 Refresh'}
        </button>
      </div>

      {error && (
        <div className="alert alert-error">{error}</div>
      )}

      {/* Domain Filter */}
      <div style={{ marginBottom: '2rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button
          className={`btn ${domainFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setDomainFilter('all')}
        >
          All ({allRuns.length})
        </button>
        <button
          className={`btn ${domainFilter === 'serbia' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setDomainFilter('serbia')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          🇷🇸 Serbia ({serbiaCount})
        </button>
        <button
          className={`btn ${domainFilter === 'slovenia' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setDomainFilter('slovenia')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          🇸🇮 Slovenia ({sloveniaCount})
        </button>
      </div>

      {!loading && filteredRuns.length === 0 && (
        <div
          style={{
            background: 'white',
            padding: '4rem 2rem',
            borderRadius: '12px',
            textAlign: 'center',
            color: '#6b7280',
          }}
        >
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📜</div>
          <h3>No Training History Yet</h3>
          <p style={{ marginBottom: '1.5rem' }}>
            {domainFilter === 'all'
              ? 'Smart training runs will appear here once the automated training cycle runs.'
              : `No training runs found for ${domainFilter}.`}
          </p>
          <div
            style={{
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '8px',
              padding: '1.5rem',
              maxWidth: '600px',
              margin: '0 auto',
              textAlign: 'left',
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: '0.75rem', color: '#1e40af' }}>
              💡 Smart Training Schedule:
            </div>
            <ul style={{ margin: 0, paddingLeft: '1.5rem', fontSize: '0.875rem', color: '#1e3a8a', lineHeight: 1.8 }}>
              <li>🇸🇮 Slovenia runs at 2:00 AM daily</li>
              <li>🇷🇸 Serbia runs at 3:00 AM daily</li>
              <li>Results appear here after each run completes</li>
            </ul>
          </div>
        </div>
      )}

      {filteredRuns.length > 0 && (
        <div className="history-timeline">
          {filteredRuns.map((run, index) => (
            <div key={`${run.domain}-${run.run_id}-${index}`} className="history-item">
              <div
                className="history-item-content"
                onClick={() => setExpandedRunId(expandedRunId === `${run.domain}-${run.run_id}` ? null : `${run.domain}-${run.run_id}`)}
                style={{ cursor: 'pointer' }}
              >
                <div className="history-item-header">
                  <div>
                    <h3 className="history-item-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1.2rem' }}>
                        {run.domain === 'serbia' ? '🇷🇸' : '🇸🇮'}
                      </span>
                      <span style={{ textTransform: 'capitalize' }}>{run.domain}</span>
                      <span style={{ color: '#6b7280', fontWeight: 400 }}>#{run.run_id}</span>
                    </h3>
                    <div className="history-item-time">
                      {run.started_at ? new Date(run.started_at).toLocaleString() : 'N/A'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div
                      style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        background: run.status === 'completed' ? '#d1fae5' : '#fef3c7',
                        color: run.status === 'completed' ? '#065f46' : '#92400e',
                      }}
                    >
                      {run.status}
                    </div>
                    <span style={{ fontSize: '1.2rem' }}>
                      {expandedRunId === `${run.domain}-${run.run_id}` ? '▼' : '▶'}
                    </span>
                  </div>
                </div>

                <div className="history-item-stats">
                  {run.discovery && (
                    <div className="history-item-stat">
                      <span>✨</span>
                      <span>{run.discovery.discovered} discovered, {run.discovery.queued} queued</span>
                    </div>
                  )}
                  {run.benchmark && (
                    <div className="history-item-stat">
                      <span>📊</span>
                      <span>{run.benchmark.benchmarked} tested</span>
                    </div>
                  )}
                  {run.training && (
                    <div className="history-item-stat">
                      <span>🎯</span>
                      <span>{run.training.successful}/{run.training.attempted} trained</span>
                    </div>
                  )}
                </div>

                {run.error && (
                  <div
                    style={{
                      marginTop: '0.75rem',
                      padding: '0.75rem',
                      background: '#fee2e2',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      color: '#991b1b',
                    }}
                  >
                    Error: {run.error}
                  </div>
                )}
              </div>

              {/* Expanded Details */}
              {expandedRunId === `${run.domain}-${run.run_id}` && (
                <div
                  style={{
                    borderTop: '1px solid #e5e7eb',
                    padding: '1.5rem',
                    background: '#f9fafb',
                  }}
                >
                  {/* Training Details */}
                  {run.training && run.training.people && run.training.people.length > 0 && (
                    <div style={{ marginBottom: '2rem' }}>
                      <h4 style={{ marginBottom: '1rem', color: '#111827', fontWeight: 600 }}>
                        📋 Training Report ({run.training.successful} successful, {run.training.failed} failed)
                      </h4>
                      <div
                        style={{
                          background: 'white',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          border: '1px solid #e5e7eb',
                        }}
                      >
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ background: '#f3f4f6', borderBottom: '1px solid #e5e7eb' }}>
                              <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600 }}>
                                Person
                              </th>
                              <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: 600 }}>
                                Images
                              </th>
                              <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: 600 }}>
                                Status
                              </th>
                              <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600 }}>
                                Error
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {run.training.people.map((person, idx) => (
                              <tr
                                key={idx}
                                style={{
                                  borderBottom: '1px solid #e5e7eb',
                                  background: idx % 2 === 0 ? 'white' : '#f9fafb',
                                }}
                              >
                                <td style={{ padding: '0.75rem' }}>{person.name}</td>
                                <td style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 600 }}>
                                  {person.images_accepted || 0}
                                </td>
                                <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                  <span
                                    style={{
                                      display: 'inline-block',
                                      padding: '0.25rem 0.75rem',
                                      borderRadius: '6px',
                                      fontSize: '0.75rem',
                                      fontWeight: 600,
                                      background: person.success ? '#d1fae5' : '#fee2e2',
                                      color: person.success ? '#065f46' : '#991b1b',
                                    }}
                                  >
                                    {person.success ? '✓ Success' : '✗ Failed'}
                                  </span>
                                </td>
                                <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>
                                  {person.error ? person.error : '-'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Benchmark Details */}
                  {run.benchmark && run.benchmark.people && run.benchmark.people.length > 0 && (
                    <div>
                      <h4 style={{ marginBottom: '1rem', color: '#111827', fontWeight: 600 }}>
                        📊 Benchmark Results ({run.benchmark.benchmarked} tested)
                      </h4>
                      <div
                        style={{
                          background: 'white',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          border: '1px solid #e5e7eb',
                        }}
                      >
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ background: '#f3f4f6', borderBottom: '1px solid #e5e7eb' }}>
                              <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600 }}>
                                Person
                              </th>
                              <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: 600 }}>
                                Recognition Score
                              </th>
                              <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: 600 }}>
                                Queued
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {run.benchmark.people.map((person, idx) => (
                              <tr
                                key={idx}
                                style={{
                                  borderBottom: '1px solid #e5e7eb',
                                  background: idx % 2 === 0 ? 'white' : '#f9fafb',
                                }}
                              >
                                <td style={{ padding: '0.75rem' }}>{person.name}</td>
                                <td style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 600 }}>
                                  {(person.recognition_score || 0).toFixed(2)}%
                                </td>
                                <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                  {person.queued ? '✓ Yes' : '✗ No'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Timing Info */}
                  <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #e5e7eb' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', fontSize: '0.875rem' }}>
                      <div>
                        <div style={{ color: '#6b7280', marginBottom: '0.25rem' }}>Started</div>
                        <div style={{ fontWeight: 600 }}>
                          {new Date(run.started_at).toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div style={{ color: '#6b7280', marginBottom: '0.25rem' }}>Completed</div>
                        <div style={{ fontWeight: 600 }}>
                          {run.completed_at ? new Date(run.completed_at).toLocaleString() : 'N/A'}
                        </div>
                      </div>
                      <div>
                        <div style={{ color: '#6b7280', marginBottom: '0.25rem' }}>Duration</div>
                        <div style={{ fontWeight: 600 }}>
                          {run.started_at && run.completed_at
                            ? `${Math.round(
                                (new Date(run.completed_at) - new Date(run.started_at)) / 60000
                              )} minutes`
                            : 'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
