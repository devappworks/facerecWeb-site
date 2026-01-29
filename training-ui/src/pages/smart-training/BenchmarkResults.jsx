import { useState } from 'react'
import { smartTrainingService } from '../../services/smartTraining'
import ScoreGauge from '../../components/ScoreGauge'
import '../../styles/smart-training.css'

export default function BenchmarkResults() {
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [minScore, setMinScore] = useState(80)
  const [showBenchmarkModal, setShowBenchmarkModal] = useState(false)
  const [benchmarkName, setBenchmarkName] = useState('')
  const [benchmarkResult, setBenchmarkResult] = useState(null)
  const [benchmarking, setBenchmarking] = useState(false)

  const loadCandidates = async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await smartTrainingService.getBenchmarkCandidates('serbia', minScore)
      if (result.success) {
        setCandidates(result.candidates || [])
      } else {
        setError(result.error || 'Failed to load candidates')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleBenchmark = async (person) => {
    if (!confirm(`Benchmark ${person.person_name}? This may take 1-2 minutes.`)) return

    setLoading(true)
    try {
      const result = await smartTrainingService.benchmarkPerson(person.person_name, 'serbia', 10)
      if (result.success) {
        alert(`Benchmark complete! Score: ${result.benchmark.recognition_score}%`)
        loadCandidates()
      } else {
        alert(`Benchmark failed: ${result.error}`)
      }
    } catch (err) {
      alert(`Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleBenchmarkNewPerson = async () => {
    if (!benchmarkName.trim()) {
      alert('Please enter a person name')
      return
    }

    setBenchmarking(true)
    setBenchmarkResult(null)

    try {
      const result = await smartTrainingService.benchmarkPerson(benchmarkName.trim(), 'serbia', 10)
      if (result.success) {
        setBenchmarkResult(result.benchmark)
      } else {
        alert(`Benchmark failed: ${result.error}`)
      }
    } catch (err) {
      alert(`Error: ${err.message}`)
    } finally {
      setBenchmarking(false)
    }
  }

  const handleAddToQueueFromBenchmark = async () => {
    if (!benchmarkResult) return

    try {
      await smartTrainingService.addToQueue(
        benchmarkResult.person_name,
        'serbia',
        benchmarkResult.training_priority || 'medium',
        null,
        benchmarkResult.recognition_score
      )
      alert(`Added ${benchmarkResult.person_name} to training queue!`)
      setShowBenchmarkModal(false)
      setBenchmarkName('')
      setBenchmarkResult(null)
    } catch (err) {
      alert(`Failed to add to queue: ${err.message}`)
    }
  }

  return (
    <div className="page-container">
      <div className="dashboard-header">
        <div>
          <h1>Benchmark Results</h1>
          <p className="subtitle">Recognition quality scores for trained people</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            className="btn btn-primary"
            onClick={() => setShowBenchmarkModal(true)}
          >
            🎯 Benchmark Person
          </button>
          <button
            className="btn btn-secondary"
            onClick={loadCandidates}
            disabled={loading}
          >
            {loading ? 'Loading...' : '🔄 Refresh'}
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Score Filter */}
      <div style={{ marginBottom: '2rem' }}>
        <label htmlFor="minScore" className="form-label">
          Show people with score below:
        </label>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <input
            type="range"
            id="minScore"
            min="0"
            max="100"
            step="5"
            value={minScore}
            onChange={(e) => setMinScore(parseInt(e.target.value))}
            style={{ flex: 1, maxWidth: '300px' }}
          />
          <span style={{ fontWeight: 600, fontSize: '1.125rem' }}>{minScore}%</span>
          <button
            className="btn btn-primary"
            onClick={loadCandidates}
          >
            Apply Filter
          </button>
        </div>
      </div>

      {/* Results */}
      {!candidates.length && !loading && (
        <div
          style={{
            background: 'white',
            padding: '3rem',
            borderRadius: '12px',
            textAlign: 'center',
            color: '#999',
          }}
        >
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎯</div>
          <h3>No benchmark data yet</h3>
          <p>Click Refresh to load benchmark results</p>
        </div>
      )}

      {candidates.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {candidates.map((person, index) => (
            <div key={index} className="person-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <h3 className="person-card-name">{person.person_name}</h3>
                  <p className="person-card-meta">
                    Last checked: {person.last_benchmark ? new Date(person.last_benchmark).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <ScoreGauge score={person.recognition_score} size={64} />
              </div>

              <div className="person-card-stats">
                <div className="person-card-stat">
                  <div className="person-card-stat-label">Score</div>
                  <div className="person-card-stat-value">{person.recognition_score}%</div>
                </div>
                <div className="person-card-stat">
                  <div className="person-card-stat-label">Priority</div>
                  <div className="person-card-stat-value" style={{ fontSize: '0.875rem' }}>
                    {person.training_priority}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '1rem' }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => handleBenchmark(person)}
                  disabled={loading}
                  style={{ width: '100%' }}
                >
                  🔄 Re-benchmark
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Benchmark Person Modal */}
      {showBenchmarkModal && (
        <div className="modal-overlay" onClick={() => !benchmarking && setShowBenchmarkModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2>Benchmark Person</h2>
              <button
                className="modal-close"
                onClick={() => setShowBenchmarkModal(false)}
                disabled={benchmarking}
              >
                &times;
              </button>
            </div>

            <div className="modal-body">
              <p style={{ marginBottom: '1rem', color: '#999' }}>
                Test recognition quality for a specific person. Downloads test images from Google and runs them through face recognition.
              </p>

              <div className="form-group">
                <label className="form-label">Person Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., Ana Ivanovic"
                  value={benchmarkName}
                  onChange={(e) => setBenchmarkName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleBenchmarkNewPerson()}
                  disabled={benchmarking}
                />
              </div>

              {benchmarking && (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
                  <p>Running benchmark... This may take 1-2 minutes</p>
                  <p style={{ fontSize: '0.875rem', color: '#999' }}>
                    Downloading test images and running recognition
                  </p>
                </div>
              )}

              {benchmarkResult && (
                <div style={{
                  marginTop: '1.5rem',
                  padding: '1.5rem',
                  background: '#f8fafc',
                  borderRadius: '8px',
                  border: '1px solid #3a3a3a'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ margin: 0 }}>{benchmarkResult.person_name}</h3>
                    <ScoreGauge score={benchmarkResult.recognition_score} size={64} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#999', textTransform: 'uppercase' }}>Images Tested</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{benchmarkResult.num_images_downloaded}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#999', textTransform: 'uppercase' }}>Recognized Correctly</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{benchmarkResult.num_recognized_correctly}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#999', textTransform: 'uppercase' }}>Recognition Score</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 600, color: benchmarkResult.recognition_score >= 80 ? '#10b981' : benchmarkResult.recognition_score >= 50 ? '#f59e0b' : '#ef4444' }}>
                        {benchmarkResult.recognition_score}%
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#999', textTransform: 'uppercase' }}>Training Priority</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{benchmarkResult.training_priority}</div>
                    </div>
                  </div>

                  {/* Show suspicious matches if any */}
                  {benchmarkResult.details && benchmarkResult.details.some(d => d.recognized && !d.recognized_correctly) && (
                    <div style={{
                      marginTop: '1rem',
                      padding: '1rem',
                      background: '#fef3c7',
                      borderRadius: '6px',
                      border: '1px solid #fcd34d'
                    }}>
                      <div style={{ fontWeight: 600, color: '#92400e', marginBottom: '0.5rem' }}>
                        ⚠️ Suspicious Matches Detected
                      </div>
                      <ul style={{ margin: 0, paddingLeft: '1.5rem', fontSize: '0.875rem', color: '#78350f' }}>
                        {benchmarkResult.details
                          .filter(d => d.recognized && !d.recognized_correctly)
                          .map((d, i) => (
                            <li key={i}>
                              Recognized as "<strong>{d.recognized_as}</strong>" instead of "{benchmarkResult.person_name}"
                              {d.confidence && ` (${d.confidence.toFixed(1)}% confidence)`}
                            </li>
                          ))}
                      </ul>
                    </div>
                  )}

                  {benchmarkResult.needs_training && (
                    <button
                      className="btn btn-primary"
                      onClick={handleAddToQueueFromBenchmark}
                      style={{ width: '100%', marginTop: '1rem' }}
                    >
                      + Add to Training Queue
                    </button>
                  )}

                  {!benchmarkResult.needs_training && (
                    <div style={{
                      marginTop: '1rem',
                      padding: '0.75rem',
                      background: '#d1fae5',
                      borderRadius: '6px',
                      textAlign: 'center',
                      color: '#065f46'
                    }}>
                      ✅ Recognition quality is good - no training needed
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowBenchmarkModal(false)
                  setBenchmarkName('')
                  setBenchmarkResult(null)
                }}
                disabled={benchmarking}
              >
                Close
              </button>
              {!benchmarkResult && (
                <button
                  className="btn btn-primary"
                  onClick={handleBenchmarkNewPerson}
                  disabled={benchmarking || !benchmarkName.trim()}
                >
                  {benchmarking ? 'Running...' : '🎯 Run Benchmark'}
                </button>
              )}
              {benchmarkResult && (
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setBenchmarkResult(null)
                    setBenchmarkName('')
                  }}
                >
                  Test Another Person
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
