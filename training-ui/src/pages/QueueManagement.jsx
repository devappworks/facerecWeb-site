import { useState, useEffect } from 'react'
import { trainingService } from '../services/training'
import { usePolling } from '../hooks/usePolling'
import HelpButton from '../components/HelpButton'
import '../styles/queue-management.css'

export default function QueueManagement() {
  const [queue, setQueue] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pollingEnabled, setPollingEnabled] = useState(true)
  const [removeLoading, setRemoveLoading] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  // Fetch queue data
  const fetchQueue = async () => {
    const response = await trainingService.getQueueList()
    if (response.success) {
      return response.data
    }
    throw new Error(response.message || 'Failed to fetch queue')
  }

  const {
    data: queueData,
    loading: queueLoading,
    error: queueError,
    refetch,
    isPolling,
    startPolling,
    stopPolling,
  } = usePolling(fetchQueue, 30000, pollingEnabled) // Poll every 30 seconds

  // Update local state when queue data changes
  useEffect(() => {
    if (queueData) {
      setQueue(queueData.queue || [])
      setLoading(false)
    }
  }, [queueData])

  useEffect(() => {
    if (queueError) {
      setError(queueError)
      setLoading(false)
    }
  }, [queueError])

  const togglePolling = () => {
    if (isPolling) {
      stopPolling()
      setPollingEnabled(false)
    } else {
      startPolling()
      setPollingEnabled(true)
    }
  }

  const handleRemove = async (person) => {
    if (!confirm(`Remove "${person.name} ${person.last_name}" from queue?`)) {
      return
    }

    setRemoveLoading(person.id)
    setError(null)
    setSuccessMessage(null)

    try {
      const response = await trainingService.removeFromQueue(person.id)

      if (response.success) {
        setSuccessMessage(`Removed ${person.name} ${person.last_name}. ${response.remaining_count} remaining in queue.`)
        // Refresh queue
        refetch()
      } else {
        setError(response.message || 'Failed to remove entry')
      }
    } catch (err) {
      setError(err.message || 'An error occurred while removing entry')
    } finally {
      setRemoveLoading(null)
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000)
    }
  }

  const groupByOccupation = (queue) => {
    const grouped = {}
    queue.forEach(person => {
      const occupation = person.occupation || 'Unknown'
      if (!grouped[occupation]) {
        grouped[occupation] = []
      }
      grouped[occupation].push(person)
    })
    return grouped
  }

  const groupedQueue = queue.length > 0 ? groupByOccupation(queue) : {}

  return (
    <div className="page-container">
      <HelpButton pageName="queue-management" />

      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Queue Management</h1>
          <p className="subtitle">View and manage generated celebrity names waiting to be processed</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {isPolling && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', fontSize: '0.875rem' }}>
              <span className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></span>
              <span>Auto-refresh: ON</span>
            </div>
          )}
          {!isPolling && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#6b7280', fontSize: '0.875rem' }}>
              <span>⏸️</span>
              <span>Auto-refresh: OFF</span>
            </div>
          )}
          <button
            className="btn"
            onClick={togglePolling}
            style={{
              background: isPolling ? '#ef4444' : '#10b981',
              color: 'white',
              border: 'none',
            }}
          >
            {isPolling ? '⏸️ Pause' : '▶️ Resume'}
          </button>
          <button
            className="btn btn-primary"
            onClick={refetch}
            disabled={queueLoading}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="queue-stats">
        <div className="stat-card-simple">
          <span className="stat-icon">📋</span>
          <div>
            <div className="stat-value">{queueData?.total || 0}</div>
            <div className="stat-label">Total in Queue</div>
          </div>
        </div>
        <div className="stat-card-simple">
          <span className="stat-icon">✅</span>
          <div>
            <div className="stat-value">{queueData?.processed || 0}</div>
            <div className="stat-label">Processed</div>
          </div>
        </div>
        <div className="stat-card-simple">
          <span className="stat-icon">⏳</span>
          <div>
            <div className="stat-value">{queueData?.remaining || 0}</div>
            <div className="stat-label">Remaining</div>
          </div>
        </div>
        <div className="stat-card-simple">
          <span className="stat-icon">🎯</span>
          <div>
            <div className="stat-value">{Object.keys(groupedQueue).length}</div>
            <div className="stat-label">Categories</div>
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && <div className="alert alert-error">{error}</div>}
      {successMessage && <div className="alert alert-success">{successMessage}</div>}

      {/* Loading State */}
      {loading ? (
        <div className="loading-state">
          <span className="spinner"></span>
          <span>Loading queue...</span>
        </div>
      ) : queue.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h3>Queue is Empty</h3>
          <p>No celebrities in the training queue</p>
          <small>Go to Training Workflow to generate names</small>
        </div>
      ) : (
        <>
          {/* Grouped by Occupation */}
          <div className="queue-sections">
            {Object.entries(groupedQueue).map(([occupation, people]) => (
              <div key={occupation} className="queue-section">
                <div className="section-header">
                  <h2>
                    {occupation}
                    <span className="count-badge">{people.length}</span>
                  </h2>
                </div>

                <div className="queue-table-container">
                  <table className="queue-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Name</th>
                        <th>Country</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {people.map((person) => (
                        <tr key={person.id}>
                          <td>{person.id}</td>
                          <td>
                            <strong>{person.name} {person.last_name}</strong>
                          </td>
                          <td>
                            <span className="country-badge">{person.country || 'Unknown'}</span>
                          </td>
                          <td>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => handleRemove(person)}
                              disabled={removeLoading === person.id}
                            >
                              {removeLoading === person.id ? (
                                <>
                                  <span className="spinner-sm"></span>
                                  Removing...
                                </>
                              ) : (
                                <>🗑️ Remove</>
                              )}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Info Box */}
      <div className="info-box" style={{ marginTop: '2rem' }}>
        <h4>ℹ️ About Queue Management</h4>
        <ul style={{ marginTop: '1rem', paddingLeft: '1.5rem', lineHeight: '1.8' }}>
          <li><strong>Queue:</strong> These are celebrity names generated by AI, waiting to be processed</li>
          <li><strong>Processing:</strong> Each person will be processed to download 20-70 images from the web</li>
          <li><strong>Remove:</strong> Use the Remove button to delete names you don't want to train</li>
          <li><strong>Auto-refresh:</strong> Queue updates automatically every 30 seconds</li>
          <li><strong>Go to Training Workflow:</strong> To generate more names or start processing</li>
        </ul>
      </div>
    </div>
  )
}
