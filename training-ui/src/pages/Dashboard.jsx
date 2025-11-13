import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { trainingService } from '../services/training'
import '../styles/dashboard.css'

export default function Dashboard() {
  const [stats, setStats] = useState({
    queueSize: 0,
    processed: 0,
    remaining: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const response = await trainingService.getQueueStatus()
      if (response.success) {
        setStats(response.data)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-container">
      <div className="dashboard-header">
        <h1>Training Dashboard</h1>
        <p className="subtitle">Overview of face recognition training status</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <div className="stat-label">Queue Size</div>
            <div className="stat-value">
              {loading ? '...' : stats.queueSize}
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-label">Processed</div>
            <div className="stat-value">
              {loading ? '...' : stats.processed}
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <div className="stat-label">Remaining</div>
            <div className="stat-value">
              {loading ? '...' : stats.remaining}
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
