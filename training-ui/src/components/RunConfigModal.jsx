import { useState } from 'react'
import { smartTrainingService } from '../services/smartTraining'
import '../styles/smart-training.css'

export default function RunConfigModal({ isOpen, onClose, onSuccess }) {
  const [config, setConfig] = useState({
    domain: 'serbia',
    discover_new: true,
    benchmark_existing: true,
    max_new_discoveries: 10,
    max_training_per_run: 5,
    images_per_person: 20,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const result = await smartTrainingService.startSmartCycle(config)

      if (result.success) {
        if (onSuccess) onSuccess(result)
        handleClose()
      } else {
        setError(result.error || 'Failed to start smart training')
      }
    } catch (err) {
      setError(err.message || 'Failed to start smart training')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setError(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Run Smart Training Cycle</h2>
          <button className="modal-close" onClick={handleClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
                {error}
              </div>
            )}

            <div
              style={{
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '8px',
                padding: '1rem',
                marginBottom: '1.5rem',
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>How it works:</div>
              <ol style={{ margin: 0, paddingLeft: '1.5rem', fontSize: '0.875rem', lineHeight: 1.6 }}>
                <li>Discovers trending celebrities (if enabled)</li>
                <li>Benchmarks existing trained people (if enabled)</li>
                <li>Builds priority queue based on recognition scores</li>
                <li>Trains top priority people automatically</li>
              </ol>
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="domain" className="form-label">
                Domain
              </label>
              <select
                id="domain"
                className="form-select"
                value={config.domain}
                onChange={(e) => setConfig({ ...config, domain: e.target.value })}
              >
                <option value="serbia">Serbia</option>
                <option value="croatia">Croatia</option>
                <option value="slovenia">Slovenia</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={config.discover_new}
                  onChange={(e) => setConfig({ ...config, discover_new: e.target.checked })}
                />
                <span>Discover new celebrities</span>
              </label>
              <div style={{ marginLeft: '1.75rem', fontSize: '0.875rem', color: '#6b7280' }}>
                Search for trending/hot celebrities in the selected country
              </div>
            </div>

            {config.discover_new && (
              <div className="form-group" style={{ marginBottom: '1.5rem', marginLeft: '1.75rem' }}>
                <label htmlFor="maxDiscoveries" className="form-label">
                  Max New Discoveries
                </label>
                <input
                  type="number"
                  id="maxDiscoveries"
                  className="form-input"
                  min="1"
                  max="50"
                  value={config.max_new_discoveries}
                  onChange={(e) =>
                    setConfig({ ...config, max_new_discoveries: parseInt(e.target.value) })
                  }
                />
              </div>
            )}

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={config.benchmark_existing}
                  onChange={(e) => setConfig({ ...config, benchmark_existing: e.target.checked })}
                />
                <span>Benchmark existing people</span>
              </label>
              <div style={{ marginLeft: '1.75rem', fontSize: '0.875rem', color: '#6b7280' }}>
                Re-test already trained people to detect quality drift
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="maxTraining" className="form-label">
                Max People to Train This Run
              </label>
              <input
                type="number"
                id="maxTraining"
                className="form-input"
                min="1"
                max="20"
                value={config.max_training_per_run}
                onChange={(e) =>
                  setConfig({ ...config, max_training_per_run: parseInt(e.target.value) })
                }
              />
              <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
                Prevents overwhelming the system with too many training jobs
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="imagesPerPerson" className="form-label">
                Target Images Per Person
              </label>
              <input
                type="number"
                id="imagesPerPerson"
                className="form-input"
                min="5"
                max="100"
                value={config.images_per_person}
                onChange={(e) =>
                  setConfig({ ...config, images_per_person: parseInt(e.target.value) })
                }
              />
              <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
                Number of images to collect and validate for training
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Starting...' : '▶️ Run Smart Training'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
