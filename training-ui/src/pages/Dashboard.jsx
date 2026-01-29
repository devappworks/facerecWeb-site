import { useState } from 'react'
import { Link } from 'react-router-dom'
import { trainingService } from '../services/training'
import { usePolling } from '../hooks/usePolling'
import HelpButton from '../components/HelpButton'
import '../styles/dashboard.css'

export default function Dashboard() {
  const [pollingEnabled, setPollingEnabled] = useState(true)

  const fetchStats = async () => {
    const response = await trainingService.getQueueStatus()
    if (response.success) {
      return response.data
    }
    throw new Error(response.message || 'Failed to fetch stats')
  }

  const { data: stats, loading, error, isPolling, startPolling, stopPolling } = usePolling(
    fetchStats,
    10000, // Poll every 10 seconds
    pollingEnabled
  )

  const togglePolling = () => {
    if (isPolling) {
      stopPolling()
      setPollingEnabled(false)
    } else {
      startPolling()
      setPollingEnabled(true)
    }
  }

  return (
    <div className="page-container">
      <HelpButton pageName="dashboard" />
      <div className="dashboard-header">
        <div>
          <h1>Training Dashboard</h1>
          <p className="subtitle">Overview of face recognition training status</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {isPolling && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', fontSize: '0.875rem' }}>
              <span className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></span>
              <span title="Dashboard automatically refreshes queue statistics every 10 seconds to show real-time progress">
                Auto-refresh: ON
              </span>
            </div>
          )}
          {!isPolling && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#999', fontSize: '0.875rem' }}>
              <span>⏸️</span>
              <span>Auto-refresh: OFF</span>
            </div>
          )}
          <button
            className="btn"
            onClick={togglePolling}
            title={isPolling ? 'Stop automatic refresh of dashboard data' : 'Start automatic refresh of dashboard data'}
            style={{
              background: isPolling ? '#ef4444' : '#10b981',
              color: 'white',
              border: 'none',
            }}
          >
            {isPolling ? '⏸️ Pause Updates' : '▶️ Resume Updates'}
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <div className="stat-label">Queue Size</div>
            <div className="stat-value">
              {loading ? '...' : (stats?.queue?.total_in_queue ?? 0)}
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-label">Processed Today</div>
            <div className="stat-value">
              {loading ? '...' : (stats?.queue?.processed_today ?? 0)}
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <div className="stat-label">Remaining</div>
            <div className="stat-value">
              {loading ? '...' : (stats?.queue?.remaining ?? 0)}
            </div>
          </div>
        </div>

        {stats?.queue?.failed_today > 0 && (
          <Link to="/rejected-faces" className="stat-card" style={{ textDecoration: 'none', cursor: 'pointer' }}>
            <div className="stat-icon">❌</div>
            <div className="stat-content">
              <div className="stat-label">Failed Today</div>
              <div className="stat-value">
                {stats.queue.failed_today}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#999', marginTop: '0.25rem' }}>
                Click to view
              </div>
            </div>
          </Link>
        )}
      </div>

      {/* Two-column layout for larger screens */}
      <div className="dashboard-columns">
        {/* Quick Actions */}
        <div className="section">
          <h2>Quick Actions</h2>
          <div className="actions-grid-compact">
            <Link to="/training" className="action-card-compact">
              <div className="action-icon">🎯</div>
              <div>
                <h3>Training</h3>
                <p>Generate, queue, and benchmark training data</p>
              </div>
            </Link>

            <Link to="/training/benchmarks" className="action-card-compact">
              <div className="action-icon">📊</div>
              <div>
                <h3>Benchmarks</h3>
                <p>View recognition accuracy benchmarks</p>
              </div>
            </Link>

            <a href="https://photolytics.mpanel.app/" target="_blank" rel="noopener noreferrer" className="action-card-compact">
              <div className="action-icon">🧪</div>
              <div>
                <h3>Test Recognition</h3>
                <p>Upload images to test face recognition</p>
              </div>
            </a>

            <Link to="/video-recognition" className="action-card-compact">
              <div className="action-icon">🎥</div>
              <div>
                <h3>Video Recognition</h3>
                <p>Process videos for face recognition</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="section">
          <h2>Recent Activity</h2>
          <div className="activity-log">
            <p className="text-muted">
              Activity log will be displayed here once processing begins.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
