import { useState, useEffect, useCallback } from 'react'
import { trainingService } from '../services/training'
import { useAuth } from '../hooks/useAuth'
import '../styles/smart-training.css'

export default function BatchTraining() {
  const { user } = useAuth()
  const domain = user?.domain || 'serbia'

  const [queue, setQueue] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [starting, setStarting] = useState(false)
  const [success, setSuccess] = useState(null)
  const [runs, setRuns] = useState([])

  // Training options
  const [maxTraining, setMaxTraining] = useState(30)
  const [imagesPerPerson, setImagesPerPerson] = useState(30)

  const fetchQueue = useCallback(async () => {
    try {
      const result = await trainingService.getSmartQueue(domain)
      if (result.success) {
        setQueue(result.queue || [])
      }
    } catch (err) {
      console.error('Error fetching queue:', err)
    }
  }, [domain])

  const fetchRuns = useCallback(async () => {
    try {
      const result = await trainingService.getTrainingRuns(domain, 10)
      if (result.success) {
        setRuns(result.runs || [])
      }
    } catch (err) {
      console.error('Error fetching runs:', err)
    }
  }, [domain])

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchQueue(), fetchRuns()])
      setLoading(false)
    }
    loadData()
  }, [fetchQueue, fetchRuns])

  const handleStartTraining = async () => {
    setStarting(true)
    setError(null)
    setSuccess(null)

    try {
      const result = await trainingService.startBatchTraining({
        domain,
        maxTraining,
        imagesPerPerson,
        discoverNew: false,
        benchmarkExisting: false,
      })

      if (result.success) {
        setSuccess(`Training started! Processing up to ${maxTraining} persons with ${imagesPerPerson} images each.`)
        // Refresh runs after a short delay
        setTimeout(fetchRuns, 2000)
      } else {
        setError(result.error || 'Failed to start training')
      }
    } catch (err) {
      setError(err.message || 'Failed to start training')
    } finally {
      setStarting(false)
    }
  }

  // Group queue by priority
  const queueByPriority = {
    high: queue.filter(q => q.priority === 'high'),
    medium: queue.filter(q => q.priority === 'medium'),
    low: queue.filter(q => q.priority === 'low'),
  }

  return (
    <div className="page-container">
      <div className="dashboard-header">
        <div>
          <h1>Batch Training</h1>
          <p className="subtitle">
            Train multiple persons from the queue - <strong>{domain}</strong>
          </p>
        </div>
        <button
          className="btn btn-secondary"
          onClick={() => { fetchQueue(); fetchRuns(); }}
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Queue Summary */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <div className="stat-label">Total in Queue</div>
            <div className="stat-value">{queue.length}</div>
          </div>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid #ef4444' }}>
          <div className="stat-icon">🔴</div>
          <div className="stat-content">
            <div className="stat-label">High Priority</div>
            <div className="stat-value">{queueByPriority.high.length}</div>
          </div>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div className="stat-icon">🟡</div>
          <div className="stat-content">
            <div className="stat-label">Medium Priority</div>
            <div className="stat-value">{queueByPriority.medium.length}</div>
          </div>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid #22c55e' }}>
          <div className="stat-icon">🟢</div>
          <div className="stat-content">
            <div className="stat-label">Low Priority</div>
            <div className="stat-value">{queueByPriority.low.length}</div>
          </div>
        </div>
      </div>

      {/* Training Controls */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '1.5rem',
        marginBottom: '1.5rem'
      }}>
        <h3 style={{ marginBottom: '1rem' }}>Start Batch Training</h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Max Persons to Train
            </label>
            <select
              value={maxTraining}
              onChange={(e) => setMaxTraining(Number(e.target.value))}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                fontSize: '1rem'
              }}
            >
              <option value={10}>10 persons</option>
              <option value={20}>20 persons</option>
              <option value={30}>30 persons</option>
              <option value={50}>50 persons</option>
              <option value={100}>100 persons</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Images per Person
            </label>
            <select
              value={imagesPerPerson}
              onChange={(e) => setImagesPerPerson(Number(e.target.value))}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                fontSize: '1rem'
              }}
            >
              <option value={20}>20 images</option>
              <option value={30}>30 images</option>
              <option value={40}>40 images</option>
              <option value={50}>50 images</option>
            </select>
          </div>
        </div>

        <div style={{
          background: '#f3f4f6',
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            <strong>Estimated:</strong> Training {Math.min(maxTraining, queue.length)} persons
            {' '}with {imagesPerPerson} images each = ~{Math.min(maxTraining, queue.length) * imagesPerPerson} total images
          </div>
          <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
            <strong>Time:</strong> ~{Math.ceil(Math.min(maxTraining, queue.length) * 0.5)} - {Math.ceil(Math.min(maxTraining, queue.length) * 1)} minutes
          </div>
        </div>

        <button
          onClick={handleStartTraining}
          disabled={starting || queue.length === 0}
          style={{
            width: '100%',
            padding: '1rem',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: queue.length === 0 ? '#9ca3af' : '#10b981',
            color: 'white',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: queue.length === 0 ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}
        >
          {starting ? (
            <>
              <span className="spinner" style={{ width: '20px', height: '20px' }}></span>
              Starting Training...
            </>
          ) : queue.length === 0 ? (
            'No persons in queue'
          ) : (
            <>
              <span style={{ fontSize: '1.25rem' }}>🚀</span>
              Start Training ({Math.min(maxTraining, queue.length)} persons)
            </>
          )}
        </button>
      </div>

      {/* Recent Training Runs */}
      {runs.length > 0 && (
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '1.5rem'
        }}>
          <h3 style={{ marginBottom: '1rem' }}>Recent Training Runs</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {runs.slice(0, 5).map((run, index) => (
              <div
                key={run.run_id || index}
                style={{
                  padding: '0.75rem',
                  background: '#f9fafb',
                  borderRadius: '6px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.5rem'
                }}
              >
                <div>
                  <span style={{ fontWeight: 500 }}>{run.run_id || 'Unknown'}</span>
                  <span style={{ color: '#6b7280', marginLeft: '0.5rem', fontSize: '0.875rem' }}>
                    {run.started_at ? new Date(run.started_at).toLocaleString() : ''}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {run.training?.successful !== undefined && (
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      backgroundColor: '#dcfce7',
                      color: '#16a34a'
                    }}>
                      {run.training.successful} trained
                    </span>
                  )}
                  {run.training?.failed > 0 && (
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      backgroundColor: '#fee2e2',
                      color: '#dc2626'
                    }}>
                      {run.training.failed} failed
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Queue Preview */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '1.5rem'
      }}>
        <h3 style={{ marginBottom: '1rem' }}>Queue Preview (First {Math.min(20, queue.length)})</h3>

        {loading ? (
          <div className="text-muted">Loading queue...</div>
        ) : queue.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
            <p>Training queue is empty</p>
            <p style={{ fontSize: '0.875rem' }}>Run a benchmark to add persons needing training</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
            gap: '0.5rem'
          }}>
            {queue.slice(0, 20).map((item, index) => (
              <div
                key={item.person_name || index}
                style={{
                  padding: '0.75rem',
                  background: '#f9fafb',
                  borderRadius: '6px',
                  borderLeft: `3px solid ${
                    item.priority === 'high' ? '#ef4444' :
                    item.priority === 'medium' ? '#f59e0b' : '#22c55e'
                  }`
                }}
              >
                <div style={{ fontWeight: 500, marginBottom: '0.25rem' }}>
                  {item.person_name}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                  Score: {item.recognition_score?.toFixed(0) || 'N/A'}%
                  {' | '}
                  {item.priority} priority
                </div>
              </div>
            ))}
          </div>
        )}

        {queue.length > 20 && (
          <div style={{
            textAlign: 'center',
            marginTop: '1rem',
            color: '#6b7280',
            fontSize: '0.875rem'
          }}>
            ... and {queue.length - 20} more
          </div>
        )}
      </div>
    </div>
  )
}
