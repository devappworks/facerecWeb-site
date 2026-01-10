import { useState, useEffect } from 'react'
import { automatedTrainingService } from '../../services/automatedTraining'

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '24px',
  },
  header: {
    marginBottom: '32px',
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1f2937',
    margin: '0 0 8px 0',
  },
  subtitle: {
    fontSize: '14px',
    color: '#6b7280',
    margin: 0,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '24px',
    border: '1px solid #e5e7eb',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
    margin: '0 0 16px 0',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  badge: {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '500',
  },
  batchCard: {
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '12px',
  },
  batchHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  batchId: {
    fontWeight: '600',
    color: '#1f2937',
    fontSize: '14px',
  },
  progressBar: {
    width: '100%',
    height: '6px',
    backgroundColor: '#e5e7eb',
    borderRadius: '3px',
    overflow: 'hidden',
    marginBottom: '8px',
  },
  progressFill: {
    height: '100%',
    transition: 'width 0.3s ease',
  },
  peopleList: {
    fontSize: '13px',
    color: '#4b5563',
  },
  personTag: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '4px',
    marginRight: '4px',
    marginBottom: '4px',
    fontSize: '11px',
  },
  emptyState: {
    textAlign: 'center',
    padding: '48px 24px',
    color: '#6b7280',
  },
  emptyStateIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  btn: {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
  },
  loadingSpinner: {
    display: 'inline-block',
    width: '16px',
    height: '16px',
    border: '2px solid #e5e7eb',
    borderTop: '2px solid #3b82f6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '20px',
    border: '1px solid #e5e7eb',
    textAlign: 'center',
  },
  statValue: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: '4px',
  },
  statLabel: {
    fontSize: '13px',
    color: '#6b7280',
    fontWeight: '500',
  },
  controlsBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    padding: '16px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
  },
  pollingIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    color: '#10b981',
  },
}

export default function BatchProcessing() {
  const [batchesList, setBatchesList] = useState({ running: [], completed: [] })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isPolling, setIsPolling] = useState(true)

  useEffect(() => {
    loadBatches()

    // Poll every 5 seconds only if polling is enabled
    if (isPolling) {
      const interval = setInterval(loadBatches, 5000)
      return () => clearInterval(interval)
    }
  }, [isPolling])

  const loadBatches = async () => {
    try {
      setError(null)
      const response = await automatedTrainingService.listAllBatches()
      if (response.success) {
        setBatchesList({
          running: response.running_batches || [],
          completed: response.completed_batches || [],
        })
      } else {
        setError(response.message || 'Failed to load batches')
      }
    } catch (err) {
      setError(err.message || 'Failed to load batches')
    } finally {
      setIsLoading(false)
    }
  }

  const togglePolling = () => {
    setIsPolling(!isPolling)
  }

  // Calculate statistics
  const getStatistics = () => {
    const allBatches = [...batchesList.running, ...batchesList.completed]
    const totalPeople = allBatches.reduce((sum, batch) => sum + (batch.people?.length || 0), 0)
    const completedPeople = allBatches.reduce((sum, batch) =>
      sum + (batch.people?.filter(p => p.status === 'completed').length || 0), 0
    )
    const totalGalleries = allBatches.reduce((sum, batch) =>
      sum + (batch.people?.filter(p => p.gallery_url).length || 0), 0
    )

    return {
      totalBatches: allBatches.length,
      runningBatches: batchesList.running.length,
      completedBatches: batchesList.completed.length,
      totalPeople,
      completedPeople,
      totalGalleries,
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return { bg: '#dcfce7', color: '#166534' }
      case 'processing':
        return { bg: '#dbeafe', color: '#1d4ed8' }
      case 'queued':
        return { bg: '#f3f4f6', color: '#666' }
      case 'failed':
        return { bg: '#fee2e2', color: '#991b1b' }
      default:
        return { bg: '#f3f4f6', color: '#666' }
    }
  }

  const getProgressColor = (status) => {
    switch (status) {
      case 'completed':
        return '#16a34a'
      case 'processing':
        return '#3b82f6'
      case 'failed':
        return '#dc2626'
      default:
        return '#9ca3af'
    }
  }

  if (isLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>Batch Processing</h1>
          <p style={styles.subtitle}>Monitor SERP training batches</p>
        </div>
        <div style={styles.emptyState}>
          <div style={styles.loadingSpinner} />
          <p style={{ marginTop: '16px' }}>Loading batches...</p>
        </div>
      </div>
    )
  }

  const stats = getStatistics()

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div style={styles.header}>
        <h1 style={styles.title}>Batch Processing</h1>
        <p style={styles.subtitle}>Monitor all automated training batches (Wikidata + SERP)</p>
      </div>

      {error && (
        <div style={{
          ...styles.section,
          backgroundColor: '#fee2e2',
          borderColor: '#fca5a5',
          color: '#991b1b',
        }}>
          {error}
        </div>
      )}

      {/* Statistics Dashboard */}
      {!isLoading && (batchesList.running.length > 0 || batchesList.completed.length > 0) && (
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{stats.totalBatches}</div>
            <div style={styles.statLabel}>Total Batches</div>
          </div>
          <div style={styles.statCard}>
            <div style={{ ...styles.statValue, color: '#3b82f6' }}>{stats.runningBatches}</div>
            <div style={styles.statLabel}>Running</div>
          </div>
          <div style={styles.statCard}>
            <div style={{ ...styles.statValue, color: '#10b981' }}>{stats.completedBatches}</div>
            <div style={styles.statLabel}>Completed</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{stats.totalPeople}</div>
            <div style={styles.statLabel}>Total People</div>
          </div>
          <div style={styles.statCard}>
            <div style={{ ...styles.statValue, color: '#10b981' }}>{stats.completedPeople}</div>
            <div style={styles.statLabel}>People Trained</div>
          </div>
          <div style={styles.statCard}>
            <div style={{ ...styles.statValue, color: '#8b5cf6' }}>{stats.totalGalleries}</div>
            <div style={styles.statLabel}>Galleries Available</div>
          </div>
        </div>
      )}

      {/* Controls Bar */}
      {!isLoading && (batchesList.running.length > 0 || batchesList.completed.length > 0) && (
        <div style={styles.controlsBar}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {isPolling && (
              <div style={styles.pollingIndicator}>
                <div style={styles.loadingSpinner} />
                <span>Auto-updating every 5s</span>
              </div>
            )}
            {!isPolling && (
              <div style={{ ...styles.pollingIndicator, color: '#6b7280' }}>
                <span>Auto-update paused</span>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={togglePolling}
              style={{
                ...styles.btn,
                backgroundColor: isPolling ? '#ef4444' : '#10b981',
                color: '#fff',
              }}
            >
              {isPolling ? '⏸️ Pause' : '▶️ Resume'}
            </button>
            <button
              onClick={loadBatches}
              disabled={isLoading}
              style={{
                ...styles.btn,
                backgroundColor: '#3b82f6',
                color: '#fff',
              }}
            >
              🔄 Refresh
            </button>
          </div>
        </div>
      )}

      {/* Running Batches */}
      {batchesList.running.length > 0 && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>
            <span>⚙️</span>
            Running Batches
            <span style={{
              ...styles.badge,
              backgroundColor: '#dbeafe',
              color: '#1d4ed8',
              marginLeft: 'auto',
            }}>
              {batchesList.running.length} active
            </span>
          </h2>

          {batchesList.running.map((batch) => (
            <div key={batch.batch_id} style={styles.batchCard}>
              <div style={styles.batchHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={styles.batchId}>
                    Batch: {batch.batch_id?.substring(0, 16)}
                  </span>
                  <span style={{
                    ...styles.badge,
                    backgroundColor: batch.type === 'wikidata' ? '#8b5cf6' : '#f59e0b',
                    color: '#fff',
                    fontSize: '10px',
                  }}>
                    {batch.type === 'wikidata' ? 'WIKIDATA' : 'SERP'}
                  </span>
                </div>
                <span style={{
                  ...styles.badge,
                  backgroundColor: '#3b82f6',
                  color: '#fff',
                }}>
                  {batch.completed || batch.people?.filter(p => p.status === 'completed').length || 0}/{batch.total || batch.total_people || 0} completed
                </span>
              </div>

              <div style={styles.progressBar}>
                <div
                  style={{
                    ...styles.progressFill,
                    width: `${((batch.completed || batch.people?.filter(p => p.status === 'completed').length || 0) / (batch.total || batch.total_people || 1)) * 100}%`,
                    backgroundColor: '#3b82f6',
                  }}
                />
              </div>

              <div style={styles.peopleList}>
                {batch.people?.map((p) => {
                  const colors = getStatusColor(p.status)
                  // Build image source breakdown string
                  let imageInfo = ''
                  if (p.photos_downloaded > 0) {
                    if (p.photos_from_wikimedia > 0 && p.photos_from_serp > 0) {
                      imageInfo = ` - ${p.photos_downloaded} images (Wikimedia: ${p.photos_from_wikimedia}, SERP: ${p.photos_from_serp})`
                    } else if (p.photos_from_wikimedia > 0) {
                      imageInfo = ` - ${p.photos_downloaded} images (Wikimedia: ${p.photos_from_wikimedia})`
                    } else if (p.photos_from_serp > 0) {
                      imageInfo = ` - ${p.photos_downloaded} images (SERP: ${p.photos_from_serp})`
                    } else {
                      imageInfo = ` - ${p.photos_downloaded} images`
                    }
                  }

                  return (
                    <div key={p.folder_name} style={{ display: 'inline-block', marginRight: '8px', marginBottom: '4px' }}>
                      <span
                        style={{
                          ...styles.personTag,
                          backgroundColor: colors.bg,
                          color: colors.color,
                        }}
                      >
                        {p.full_name} ({p.status}){imageInfo}
                      </span>
                      {p.gallery_url && (
                        <a
                          href={`https://facerecognition.mpanel.app${p.gallery_url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            marginLeft: '6px',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            backgroundColor: '#3b82f6',
                            color: '#fff',
                            textDecoration: 'none',
                            display: 'inline-block',
                          }}
                        >
                          View Gallery
                        </a>
                      )}
                    </div>
                  )
                })}
              </div>

              <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '8px' }}>
                Started: {new Date(batch.started_at).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Completed Batches */}
      {batchesList.completed.length > 0 && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>
            <span>✓</span>
            Completed Batches
            <span style={{
              ...styles.badge,
              backgroundColor: '#dcfce7',
              color: '#166534',
              marginLeft: 'auto',
            }}>
              {batchesList.completed.length} total
            </span>
          </h2>

          {batchesList.completed.map((batch) => (
            <div key={batch.batch_id} style={styles.batchCard}>
              <div style={styles.batchHeader}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={styles.batchId}>
                      {batch.people?.map((p) => p.full_name).join(', ') || `Batch ${batch.batch_id?.substring(0, 8)}`}
                    </span>
                    <span style={{
                      ...styles.badge,
                      backgroundColor: batch.type === 'wikidata' ? '#8b5cf6' : '#f59e0b',
                      color: '#fff',
                      fontSize: '10px',
                    }}>
                      {batch.type === 'wikidata' ? 'WIKIDATA' : 'SERP'}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    {batch.total || batch.total_people || batch.people?.length || 0} people processed
                  </div>
                </div>
                <span style={{
                  ...styles.badge,
                  backgroundColor: '#16a34a',
                  color: '#fff',
                }}>
                  COMPLETED
                </span>
              </div>

              {/* Gallery links for each person */}
              {batch.people?.some(p => p.gallery_url) && (
                <div style={{ marginTop: '12px', marginBottom: '8px' }}>
                  {batch.people?.map((p) => p.gallery_url && (
                    <a
                      key={p.folder_name}
                      href={`https://facerecognition.mpanel.app${p.gallery_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-block',
                        marginRight: '8px',
                        marginBottom: '4px',
                        padding: '4px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        backgroundColor: '#3b82f6',
                        color: '#fff',
                        textDecoration: 'none',
                      }}
                    >
                      📸 {p.full_name} Gallery
                    </a>
                  ))}
                </div>
              )}

              <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                Completed: {batch.completed_at ? new Date(batch.completed_at).toLocaleString() : 'N/A'}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {batchesList.running.length === 0 && batchesList.completed.length === 0 && (
        <div style={styles.section}>
          <div style={styles.emptyState}>
            <div style={styles.emptyStateIcon}>📭</div>
            <h3 style={{ margin: '0 0 8px 0', color: '#1f2937' }}>No batches yet</h3>
            <p style={{ margin: 0, color: '#6b7280' }}>
              Start SERP training from the Review & Deploy page to see batch processing here.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
