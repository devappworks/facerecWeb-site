import { useState } from 'react'
import { trainingService } from '../services/training'
import { usePolling } from '../hooks/usePolling'
import '../styles/progress.css'

export default function ProgressMonitor() {
  const [pollingEnabled, setPollingEnabled] = useState(true)

  const fetchProgress = async () => {
    const response = await trainingService.getTrainingProgress()
    if (response.success) {
      return response.data.folders || []
    }
    throw new Error(response.message || 'Failed to fetch progress')
  }

  const {
    data: folders,
    loading,
    error,
    refetch,
    isPolling,
    startPolling,
    stopPolling
  } = usePolling(
    fetchProgress,
    15000, // Poll every 15 seconds
    pollingEnabled
  )

  const handleRefresh = async () => {
    await refetch()
  }

  const togglePolling = () => {
    if (isPolling) {
      stopPolling()
      setPollingEnabled(false)
    } else {
      startPolling()
      setPollingEnabled(true)
    }
  }

  const getStatusBadge = (imageCount) => {
    if (imageCount === 0) return { label: 'Empty', className: 'status-empty' }
    if (imageCount < 20) return { label: 'Insufficient', className: 'status-insufficient' }
    if (imageCount < 40) return { label: 'Adequate', className: 'status-adequate' }
    return { label: 'Ready', className: 'status-ready' }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Training Progress</h1>
          <p className="subtitle">
            Monitor training folders and image counts. Minimum 20 images recommended per person.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {isPolling && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', fontSize: '0.875rem' }}>
              <span className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></span>
              Auto-updating
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
            onClick={handleRefresh}
            disabled={loading}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading-state">
          <span className="spinner" style={{ width: '2rem', height: '2rem' }}></span>
          <p>Loading training data...</p>
        </div>
      ) : !folders || folders.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📂</div>
          <h3>No Training Data Yet</h3>
          <p>Start by generating names and processing the queue to collect training images.</p>
        </div>
      ) : (
        <>
          <div className="stats-summary">
            <div className="summary-item">
              <strong>{folders.length}</strong>
              <span>Total Folders</span>
            </div>
            <div className="summary-item">
              <strong>{folders.reduce((sum, f) => sum + (f.imageCount || 0), 0)}</strong>
              <span>Total Images</span>
            </div>
            <div className="summary-item">
              <strong>{folders.filter(f => (f.imageCount || 0) >= 20).length}</strong>
              <span>Ready for Training</span>
            </div>
          </div>

          <div className="folders-grid">
            {folders.map((folder, index) => {
              const status = getStatusBadge(folder.imageCount || 0)
              return (
                <div key={index} className="folder-card">
                  <div className="folder-header">
                    <div className="folder-icon">👤</div>
                    <span className={`status-badge ${status.className}`}>
                      {status.label}
                    </span>
                  </div>
                  <h3 className="folder-name">{folder.name || 'Unknown'}</h3>
                  <div className="folder-stats">
                    <div className="stat-row">
                      <span>Images:</span>
                      <strong>{folder.imageCount || 0}</strong>
                    </div>
                    {folder.lastModified && (
                      <div className="stat-row">
                        <span>Updated:</span>
                        <strong>{new Date(folder.lastModified).toLocaleDateString()}</strong>
                      </div>
                    )}
                  </div>
                  {folder.imageCount > 0 && (
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${Math.min((folder.imageCount / 40) * 100, 100)}%`,
                          backgroundColor: folder.imageCount >= 20 ? '#10b981' : '#f59e0b'
                        }}
                      ></div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}

      <div className="info-box" style={{ marginTop: '2rem' }}>
        <h4>ℹ️ Status Meanings</h4>
        <ul style={{ marginTop: '1rem', paddingLeft: '1.5rem' }}>
          <li><strong>Empty (0 images):</strong> No images downloaded yet</li>
          <li><strong>Insufficient (&lt;20 images):</strong> More images needed for good training</li>
          <li><strong>Adequate (20-39 images):</strong> Minimum requirement met</li>
          <li><strong>Ready (40+ images):</strong> Optimal for high-quality training</li>
        </ul>
      </div>
    </div>
  )
}
