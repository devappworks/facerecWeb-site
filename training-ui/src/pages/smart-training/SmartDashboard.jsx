import { useState, useCallback, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { smartTrainingService } from '../../services/smartTraining'
import { useAuth } from '../../hooks/useAuth'
import PersonCard from '../../components/PersonCard'
import AddToQueueModal from '../../components/AddToQueueModal'
import RunConfigModal from '../../components/RunConfigModal'
import '../../styles/smart-training.css'
import '../../styles/dashboard.css'

export default function SmartDashboard() {
  const { user } = useAuth()
  const [pollingEnabled, setPollingEnabled] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showRunModal, setShowRunModal] = useState(false)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isPolling, setIsPolling] = useState(true)

  const domain = user?.domain || 'serbia'

  const fetchStats = useCallback(async () => {
    setLoading(true)
    try {
      const result = await smartTrainingService.getDashboardStats(domain)
      setData(result)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [domain])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  useEffect(() => {
    if (!pollingEnabled) return
    const interval = setInterval(fetchStats, 10000)
    return () => clearInterval(interval)
  }, [fetchStats, pollingEnabled])

  const refetch = fetchStats

  const togglePolling = () => {
    if (pollingEnabled) {
      setPollingEnabled(false)
      setIsPolling(false)
    } else {
      setPollingEnabled(true)
      setIsPolling(true)
    }
  }

  const handleAddSuccess = () => {
    refetch()
  }

  const handleRunSuccess = () => {
    // Show success message
    alert('Smart training cycle started! Check the History page for progress.')
    refetch()
  }

  const stats = data?.stats || {}
  const queue = data?.queue || []

  return (
    <div className="page-container">
      <div className="dashboard-header">
        <div>
          <h1>Smart Training Dashboard</h1>
          <p className="subtitle">Self-improving face recognition training system - <strong>{domain}</strong></p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {isPolling && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', fontSize: '0.875rem' }}>
              <span className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></span>
              <span>Auto-refresh: ON</span>
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
            onClick={() => setShowRunModal(true)}
          >
            ▶️ Run Smart Training
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
              {loading ? '...' : stats.queue_size || 0}
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🔴</div>
          <div className="stat-content">
            <div className="stat-label">High Priority</div>
            <div className="stat-value">
              {loading ? '...' : stats.high_priority || 0}
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-label">Avg Recognition</div>
            <div className="stat-value">
              {loading ? '...' : stats.avg_recognition_score ? `${stats.avg_recognition_score}%` : 'N/A'}
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⚠️</div>
          <div className="stat-content">
            <div className="stat-label">Need Training</div>
            <div className="stat-value">
              {loading ? '...' : stats.candidates_needing_training || 0}
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-columns">
        {/* Training Queue Preview */}
        <div className="section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2>Training Queue</h2>
            <button
              className="btn btn-primary"
              onClick={() => setShowAddModal(true)}
            >
              + Add Person
            </button>
          </div>

          {loading ? (
            <div className="text-muted">Loading queue...</div>
          ) : queue.length === 0 ? (
            <div
              style={{
                background: 'white',
                padding: '2rem',
                borderRadius: '12px',
                textAlign: 'center',
                color: '#999',
              }}
            >
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
              <p>No people in training queue</p>
              <button
                className="btn btn-primary"
                onClick={() => setShowAddModal(true)}
                style={{ marginTop: '1rem' }}
              >
                Add First Person
              </button>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {queue.slice(0, 5).map((person, index) => (
                  <PersonCard
                    key={index}
                    person={person}
                    showScore={person.recognition_score !== undefined}
                  />
                ))}
              </div>
              {queue.length > 5 && (
                <Link
                  to="/training/queue"
                  className="btn btn-secondary"
                  style={{ marginTop: '1rem', display: 'block', textAlign: 'center' }}
                >
                  View All ({queue.length} people)
                </Link>
              )}
            </>
          )}
        </div>

        {/* Quick Actions */}
        <div className="section">
          <h2>Quick Actions</h2>
          <div className="actions-grid-compact">
            <Link to="/training/discovery" className="action-card-compact">
              <div className="action-icon">✨</div>
              <div>
                <h3>Discover Celebrities</h3>
                <p>Find trending celebrities to train</p>
              </div>
            </Link>

            <Link to="/training/benchmarks" className="action-card-compact">
              <div className="action-icon">📊</div>
              <div>
                <h3>Benchmark Results</h3>
                <p>View recognition quality scores</p>
              </div>
            </Link>

            <Link to="/training/queue" className="action-card-compact">
              <div className="action-icon">📋</div>
              <div>
                <h3>Manage Queue</h3>
                <p>View and edit training queue</p>
              </div>
            </Link>

            <Link to="/training/history" className="action-card-compact">
              <div className="action-icon">📜</div>
              <div>
                <h3>Training History</h3>
                <p>View past training runs</p>
              </div>
            </Link>

            <button
              onClick={() => setShowRunModal(true)}
              className="action-card-compact"
              style={{
                background: 'linear-gradient(135deg, #f5a623 0%, #e09520 100%)',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <div className="action-icon">🚀</div>
              <div>
                <h3>Run Smart Training</h3>
                <p>Start automated training cycle</p>
              </div>
            </button>
          </div>

          {/* Info Box */}
          <div
            style={{
              marginTop: '2rem',
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '8px',
              padding: '1rem',
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: '0.5rem', color: '#1e40af' }}>
              💡 How Smart Training Works
            </div>
            <ul style={{ margin: 0, paddingLeft: '1.5rem', fontSize: '0.875rem', color: '#1e3a8a', lineHeight: 1.6 }}>
              <li>Discovers trending celebrities automatically</li>
              <li>Benchmarks recognition quality (0-100%)</li>
              <li>Queues people with low scores for training</li>
              <li>Trains using P18 + SERP image validation</li>
              <li>Re-tests periodically to detect drift</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddToQueueModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleAddSuccess}
      />

      <RunConfigModal
        isOpen={showRunModal}
        onClose={() => setShowRunModal(false)}
        onSuccess={handleRunSuccess}
      />
    </div>
  )
}
