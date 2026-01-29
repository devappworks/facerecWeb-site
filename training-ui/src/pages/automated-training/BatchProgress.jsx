import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useBatchStatus } from '../../hooks/useBatchStatus'
import HelpButton from '../../components/HelpButton'

export default function BatchProgress() {
  const { batchId } = useParams()
  const navigate = useNavigate()
  const {
    batchStatus,
    loading,
    error,
    isPolling,
    startPolling,
    stopPolling,
    cancelBatch,
  } = useBatchStatus(batchId, 3000)

  useEffect(() => {
    startPolling()
    return () => stopPolling()
  }, [startPolling, stopPolling])

  useEffect(() => {
    if (batchStatus?.status === 'completed') {
      stopPolling()
      setTimeout(() => {
        navigate('/training/review')
      }, 2000)
    }
  }, [batchStatus?.status, navigate, stopPolling])

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this batch?')) return
    try {
      await cancelBatch()
    } catch (err) {
      console.error('Failed to cancel batch:', err)
    }
  }

  const getProgressPercentage = () => {
    if (!batchStatus) return 0
    return Math.round((batchStatus.completed / batchStatus.total) * 100)
  }

  // Inline styles
  const styles = {
    page: {
      width: '100%',
      minHeight: '100vh',
      padding: '24px',
      paddingBottom: '100px',
      boxSizing: 'border-box',
      backgroundColor: '#f8fafc',
    },
    container: {
      maxWidth: '1200px',
      margin: '0 auto',
    },
    header: {
      marginBottom: '24px',
    },
    title: {
      fontSize: '28px',
      fontWeight: 'bold',
      color: '#1a1a1a',
      margin: '0 0 8px 0',
    },
    subtitle: {
      color: '#666',
      margin: 0,
      fontSize: '14px',
    },
    batchId: {
      fontFamily: 'monospace',
      backgroundColor: '#3a3a3a',
      padding: '2px 8px',
      borderRadius: '4px',
    },
    card: {
      backgroundColor: '#fff',
      borderRadius: '12px',
      padding: '24px',
      marginBottom: '24px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      border: '1px solid #3a3a3a',
    },
    cardHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px',
    },
    cardTitle: {
      fontSize: '20px',
      fontWeight: '600',
      color: '#1a1a1a',
      margin: 0,
    },
    statusBadge: {
      padding: '6px 16px',
      borderRadius: '20px',
      fontSize: '14px',
      fontWeight: '600',
    },
    progressBarContainer: {
      backgroundColor: '#3a3a3a',
      borderRadius: '10px',
      height: '20px',
      overflow: 'hidden',
      marginBottom: '24px',
    },
    progressBar: {
      height: '100%',
      borderRadius: '10px',
      transition: 'width 0.5s ease-in-out',
    },
    progressText: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: '14px',
      color: '#666',
      marginBottom: '8px',
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '16px',
    },
    statCard: {
      padding: '20px',
      borderRadius: '12px',
      textAlign: 'center',
    },
    statLabel: {
      fontSize: '13px',
      color: '#666',
      marginBottom: '4px',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
    },
    statValue: {
      fontSize: '32px',
      fontWeight: 'bold',
      margin: 0,
    },
    personCard: {
      border: '2px solid #3a3a3a',
      borderRadius: '12px',
      padding: '20px',
      marginBottom: '16px',
      backgroundColor: '#fff',
      transition: 'all 0.2s ease',
    },
    personHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '16px',
    },
    personInfo: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },
    personIcon: {
      fontSize: '28px',
      width: '40px',
      height: '40px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '50%',
    },
    personName: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#1a1a1a',
      margin: '0 0 4px 0',
      textTransform: 'capitalize',
    },
    wikidataId: {
      fontSize: '12px',
      color: '#666',
      margin: 0,
    },
    miniProgressContainer: {
      backgroundColor: '#3a3a3a',
      borderRadius: '4px',
      height: '8px',
      overflow: 'hidden',
      marginTop: '8px',
    },
    miniProgressBar: {
      height: '100%',
      borderRadius: '4px',
      transition: 'width 0.3s ease',
    },
    progressLabel: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: '12px',
      color: '#666',
      marginBottom: '4px',
    },
    btn: {
      padding: '10px 20px',
      borderRadius: '8px',
      border: 'none',
      cursor: 'pointer',
      fontWeight: '600',
      fontSize: '14px',
      transition: 'all 0.2s ease',
    },
    pollingIndicator: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginTop: '16px',
      fontSize: '13px',
      color: '#666',
    },
    pulsingDot: {
      width: '8px',
      height: '8px',
      backgroundColor: '#3b82f6',
      borderRadius: '50%',
      animation: 'pulse 1.5s ease-in-out infinite',
    },
    completionBanner: {
      marginTop: '24px',
      padding: '24px',
      borderRadius: '12px',
      border: '2px solid',
    },
  }

  // Get status-specific styling
  const getStatusStyle = (status) => {
    switch (status) {
      case 'completed':
        return {
          badge: { backgroundColor: '#dcfce7', color: '#166534' },
          border: '#86efac',
          bg: '#f0fdf4',
          icon: { backgroundColor: '#dcfce7' },
        }
      case 'processing':
        return {
          badge: { backgroundColor: '#dbeafe', color: '#1d4ed8' },
          border: '#93c5fd',
          bg: '#eff6ff',
          icon: { backgroundColor: '#dbeafe' },
        }
      case 'failed':
        return {
          badge: { backgroundColor: '#fef2f2', color: '#dc2626' },
          border: '#fca5a5',
          bg: '#fef2f2',
          icon: { backgroundColor: '#fef2f2' },
        }
      default:
        return {
          badge: { backgroundColor: '#333', color: '#999' },
          border: '#3a3a3a',
          bg: '#242424',
          icon: { backgroundColor: '#333' },
        }
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return '✓'
      case 'processing': return '↻'
      case 'failed': return '✗'
      default: return '○'
    }
  }

  const getProgressColor = () => {
    if (batchStatus?.status === 'completed') return '#16a34a'
    if (batchStatus?.status === 'cancelled') return '#dc2626'
    return '#3b82f6'
  }

  if (loading && !batchStatus) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <div style={{ ...styles.card, textAlign: 'center', padding: '60px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              border: '4px solid #3a3a3a',
              borderTopColor: '#3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px',
            }} />
            <p style={{ color: '#666', fontSize: '16px' }}>Loading batch status...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error && !batchStatus) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <div style={{
            ...styles.card,
            backgroundColor: '#fef2f2',
            borderColor: '#fca5a5',
          }}>
            <p style={{ fontWeight: '600', color: '#dc2626', marginBottom: '8px', fontSize: '18px' }}>
              Error Loading Batch
            </p>
            <p style={{ color: '#991b1b', marginBottom: '20px' }}>{error}</p>
            <button
              onClick={() => navigate('/training/generate')}
              style={{ ...styles.btn, backgroundColor: '#dc2626', color: '#fff' }}
            >
              Back to Generate
            </button>
          </div>
        </div>
      </div>
    )
  }

  const overallStatus = batchStatus?.status === 'running' ? 'Processing' :
                        batchStatus?.status === 'completed' ? 'Complete' :
                        batchStatus?.status === 'cancelled' ? 'Cancelled' : 'Unknown'

  return (
    <div style={styles.page}>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
      <div style={styles.container}>
        <HelpButton pageName="automated-batch" />

        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.title}>Batch Training Progress</h1>
          <p style={styles.subtitle}>
            Batch ID: <span style={styles.batchId}>{batchId}</span>
          </p>
        </div>

        {/* Overall Progress Card */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div>
              <h2 style={styles.cardTitle}>Overall Progress</h2>
              <p style={{ color: '#666', margin: '4px 0 0 0', fontSize: '14px' }}>{overallStatus}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {batchStatus?.status === 'running' && (
                <button
                  onClick={handleCancel}
                  style={{ ...styles.btn, backgroundColor: '#dc2626', color: '#fff' }}
                >
                  Cancel Batch
                </button>
              )}
              <div style={{
                ...styles.statusBadge,
                backgroundColor: batchStatus?.status === 'completed' ? '#dcfce7' :
                                batchStatus?.status === 'cancelled' ? '#fef2f2' : '#dbeafe',
                color: batchStatus?.status === 'completed' ? '#166534' :
                       batchStatus?.status === 'cancelled' ? '#dc2626' : '#1d4ed8',
              }}>
                {overallStatus}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div style={styles.progressText}>
            <span>{batchStatus?.completed || 0} of {batchStatus?.total || 0} people processed</span>
            <span style={{ fontWeight: '600' }}>{getProgressPercentage()}%</span>
          </div>
          <div style={styles.progressBarContainer}>
            <div
              style={{
                ...styles.progressBar,
                width: `${getProgressPercentage()}%`,
                backgroundColor: getProgressColor(),
              }}
            />
          </div>

          {/* Statistics Grid */}
          <div style={styles.statsGrid}>
            <div style={{ ...styles.statCard, backgroundColor: '#eff6ff', borderLeft: '4px solid #3b82f6' }}>
              <p style={styles.statLabel}>Total</p>
              <p style={{ ...styles.statValue, color: '#3b82f6' }}>{batchStatus?.total || 0}</p>
            </div>
            <div style={{ ...styles.statCard, backgroundColor: '#f0fdf4', borderLeft: '4px solid #16a34a' }}>
              <p style={styles.statLabel}>Completed</p>
              <p style={{ ...styles.statValue, color: '#16a34a' }}>{batchStatus?.completed || 0}</p>
            </div>
            <div style={{ ...styles.statCard, backgroundColor: '#fefce8', borderLeft: '4px solid #ca8a04' }}>
              <p style={styles.statLabel}>Processing</p>
              <p style={{ ...styles.statValue, color: '#ca8a04' }}>{batchStatus?.processing || 0}</p>
            </div>
            <div style={{ ...styles.statCard, backgroundColor: '#fef2f2', borderLeft: '4px solid #dc2626' }}>
              <p style={styles.statLabel}>Failed</p>
              <p style={{ ...styles.statValue, color: '#dc2626' }}>{batchStatus?.failed || 0}</p>
            </div>
          </div>

          {/* Polling Indicator */}
          {isPolling && batchStatus?.status === 'running' && (
            <div style={styles.pollingIndicator}>
              <div style={styles.pulsingDot} />
              <span>Auto-refreshing every 3 seconds...</span>
            </div>
          )}
        </div>

        {/* Person-by-Person Progress */}
        <div style={styles.card}>
          <h2 style={{ ...styles.cardTitle, marginBottom: '20px' }}>Person-by-Person Progress</h2>

          {batchStatus?.people?.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              No people in this batch
            </div>
          ) : (
            <div>
              {batchStatus?.people?.map((person) => {
                const statusStyle = getStatusStyle(person.status)
                return (
                  <div
                    key={person.person_id}
                    style={{
                      ...styles.personCard,
                      borderColor: statusStyle.border,
                      backgroundColor: statusStyle.bg,
                    }}
                  >
                    <div style={styles.personHeader}>
                      <div style={styles.personInfo}>
                        <div style={{
                          ...styles.personIcon,
                          ...statusStyle.icon,
                          color: statusStyle.badge.color,
                          fontWeight: 'bold',
                        }}>
                          {getStatusIcon(person.status)}
                        </div>
                        <div>
                          <h3 style={styles.personName}>
                            {person.full_name || person.name?.replace(/_/g, ' ')}
                          </h3>
                          <p style={styles.wikidataId}>
                            Wikidata: {person.wikidata_id}
                          </p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          ...styles.statusBadge,
                          ...statusStyle.badge,
                          textTransform: 'uppercase',
                          fontSize: '11px',
                          letterSpacing: '0.5px',
                        }}>
                          {person.status || 'pending'}
                        </div>
                        {person.gallery_url && (
                          <a
                            href={`https://facerecognition.mpanel.app${person.gallery_url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              padding: '4px 8px',
                              backgroundColor: '#3b82f6',
                              color: '#fff',
                              fontSize: '11px',
                              borderRadius: '4px',
                              textDecoration: 'none',
                            }}
                          >
                            Gallery
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Current Step */}
                    {person.current_step && (
                      <div style={{
                        fontSize: '13px',
                        color: '#666',
                        marginBottom: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}>
                        <span style={{ color: '#3b82f6' }}>&#9654;</span>
                        {person.current_step.replace(/_/g, ' ')}
                      </div>
                    )}

                    {/* Download Progress */}
                    {person.photos_downloaded !== undefined && (
                      <div style={{ marginBottom: '12px' }}>
                        <div style={styles.progressLabel}>
                          <span>Images Downloaded</span>
                          <span style={{ fontWeight: '600' }}>
                            {person.photos_downloaded || 0}
                            {(person.photos_from_wikimedia !== undefined || person.photos_from_serp !== undefined) && (
                              <span style={{ color: '#666', fontWeight: 'normal' }}>
                                {' '}(Wikimedia: {person.photos_from_wikimedia || 0}, SERP: {person.photos_from_serp || 0})
                              </span>
                            )}
                          </span>
                        </div>
                        <div style={styles.miniProgressContainer}>
                          <div
                            style={{
                              ...styles.miniProgressBar,
                              width: `${Math.min(100, (person.photos_downloaded / 40) * 100)}%`,
                              backgroundColor: '#3b82f6',
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Valid Photos */}
                    {person.valid_photos !== undefined && person.status === 'completed' && (
                      <div style={{
                        marginTop: '12px',
                        padding: '12px',
                        borderRadius: '8px',
                        backgroundColor: person.valid_photos >= 5 ? '#dcfce7' : '#fef9c3',
                        border: `1px solid ${person.valid_photos >= 5 ? '#86efac' : '#fde047'}`,
                      }}>
                        <p style={{
                          margin: 0,
                          fontSize: '13px',
                          color: person.valid_photos >= 5 ? '#166534' : '#854d0e',
                          fontWeight: '500',
                        }}>
                          {person.valid_photos >= 5
                            ? `✓ ${person.valid_photos} valid photos - Ready for production`
                            : `⚠ Only ${person.valid_photos} valid photos - Needs ${5 - person.valid_photos} more`}
                        </p>
                      </div>
                    )}

                    {/* Error Message */}
                    {person.error_message && (
                      <div style={{
                        marginTop: '12px',
                        padding: '12px',
                        borderRadius: '8px',
                        backgroundColor: '#fef2f2',
                        border: '1px solid #fca5a5',
                      }}>
                        <p style={{ margin: 0, fontSize: '13px', color: '#dc2626' }}>
                          {person.error_message}
                        </p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Completion Banner */}
        {batchStatus?.status === 'completed' && (
          <div style={{
            ...styles.completionBanner,
            backgroundColor: '#f0fdf4',
            borderColor: '#86efac',
          }}>
            <p style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '600', color: '#166534' }}>
              Batch Training Complete!
            </p>
            <p style={{ margin: 0, color: '#15803d', fontSize: '14px' }}>
              Redirecting to review and deploy page in a moment...
            </p>
          </div>
        )}

        {/* Cancellation Banner */}
        {batchStatus?.status === 'cancelled' && (
          <div style={{
            ...styles.completionBanner,
            backgroundColor: '#fef2f2',
            borderColor: '#fca5a5',
          }}>
            <p style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '600', color: '#dc2626' }}>
              Batch Cancelled
            </p>
            <p style={{ margin: '0 0 16px 0', color: '#991b1b', fontSize: '14px' }}>
              This batch was cancelled by the user.
            </p>
            <button
              onClick={() => navigate('/training/generate')}
              style={{ ...styles.btn, backgroundColor: '#dc2626', color: '#fff' }}
            >
              Start New Batch
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
