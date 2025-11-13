import { useState } from 'react'
import { Link } from 'react-router-dom'
import { trainingService } from '../services/training'
import { usePolling } from '../hooks/usePolling'
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
      <div className="dashboard-header">
        <div>
          <h1>Training Dashboard</h1>
          <p className="subtitle">Overview of face recognition training status</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
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
              {loading ? '...' : (stats?.queueSize ?? 0)}
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-label">Processed</div>
            <div className="stat-value">
              {loading ? '...' : (stats?.processed ?? 0)}
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <div className="stat-label">Remaining</div>
            <div className="stat-value">
              {loading ? '...' : (stats?.remaining ?? 0)}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="section">
        <h2>Quick Actions</h2>
        <div className="actions-grid">
          <Link to="/generate" className="action-card">
            <div className="action-icon">✨</div>
            <h3>Generate Names</h3>
            <p>Generate celebrity lists by country</p>
          </Link>

          <Link to="/queue" className="action-card">
            <div className="action-icon">▶️</div>
            <h3>Process Queue</h3>
            <p>Download images for people in queue</p>
          </Link>

          <Link to="/progress" className="action-card">
            <div className="action-icon">📊</div>
            <h3>Monitor Progress</h3>
            <p>View training folders and image counts</p>
          </Link>

          <Link to="/sync" className="action-card">
            <div className="action-icon">🔄</div>
            <h3>Sync to Production</h3>
            <p>Move validated data to production</p>
          </Link>

          <Link to="/test" className="action-card">
            <div className="action-icon">🧪</div>
            <h3>Test Recognition</h3>
            <p>Upload images to test face recognition</p>
          </Link>

          <Link to="/ab-test" className="action-card">
            <div className="action-icon">⚖️</div>
            <h3>A/B Testing</h3>
            <p>Compare recognition system versions</p>
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
  )
}
