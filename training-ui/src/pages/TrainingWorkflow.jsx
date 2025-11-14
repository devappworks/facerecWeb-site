import { useState } from 'react'
import { trainingService } from '../services/training'
import { usePolling } from '../hooks/usePolling'
import HelpButton from '../components/HelpButton'
import '../styles/training-workflow.css'

export default function TrainingWorkflow() {
  // Generate Names State
  const [country, setCountry] = useState('Serbia')
  const [selectedCategories, setSelectedCategories] = useState(['Actor', 'Musician', 'Athlete'])
  const [customCategory, setCustomCategory] = useState('')
  const [generating, setGenerating] = useState(false)
  const [generateError, setGenerateError] = useState(null)
  const [generateSuccess, setGenerateSuccess] = useState(null)

  // Queue Manager State
  const [processing, setProcessing] = useState(false)
  const [processingAll, setProcessingAll] = useState(false)
  const [currentPerson, setCurrentPerson] = useState(null)
  const [queueError, setQueueError] = useState(null)
  const [queueSuccess, setQueueSuccess] = useState(null)

  // Progress Monitor State
  const [pollingEnabled, setPollingEnabled] = useState(true)

  const commonCountries = [
    'Serbia', 'United States', 'United Kingdom', 'France', 'Germany',
    'Italy', 'Spain', 'Canada', 'Australia', 'Japan',
    'South Korea', 'India', 'Brazil', 'Argentina', 'Mexico'
  ]

  const celebrityCategories = [
    'Actor',
    'Musician',
    'Athlete',
    'Politician',
    'Director',
    'Writer',
    'Comedian',
    'TV Host',
    'Model',
    'Chef',
    'Scientist',
    'Business Leader',
    'Artist',
    'Dancer',
    'Singer',
  ]

  // Progress Monitor Data
  const fetchProgress = async () => {
    const response = await trainingService.getTrainingProgress()
    if (response.success) {
      return response.data.folders || []
    }
    throw new Error(response.message || 'Failed to fetch progress')
  }

  const {
    data: folders,
    loading: progressLoading,
    error: progressError,
    refetch,
    isPolling,
    startPolling,
    stopPolling
  } = usePolling(fetchProgress, 15000, pollingEnabled)

  // Category Selection Handlers
  const toggleCategory = (category) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }

  const addCustomCategory = () => {
    if (customCategory.trim() && !selectedCategories.includes(customCategory.trim())) {
      setSelectedCategories(prev => [...prev, customCategory.trim()])
      setCustomCategory('')
    }
  }

  // Generate Names Handler
  const handleGenerate = async (e) => {
    e.preventDefault()
    setGenerateError(null)
    setGenerateSuccess(null)

    // Validation
    if (selectedCategories.length === 0) {
      setGenerateError('Please select at least one category')
      return
    }

    setGenerating(true)

    try {
      // Combine selected and custom categories
      const categories = [...selectedCategories]

      const response = await trainingService.generateNames(country, categories)

      if (response.success) {
        const count = categories.length * 20 // ~20 names per category
        setGenerateSuccess(`Successfully generated ~${count} names for ${country} (${categories.join(', ')})!`)
        // Auto-refresh progress after 2 seconds
        setTimeout(() => refetch(), 2000)
      } else {
        setGenerateError(response.message || 'Failed to generate names')
      }
    } catch (err) {
      setGenerateError(err.message || 'An error occurred while generating names')
    } finally {
      setGenerating(false)
    }
  }

  // Process Next Handler
  const handleProcessNext = async () => {
    setQueueError(null)
    setQueueSuccess(null)
    setProcessing(true)

    try {
      const response = await trainingService.processNext()

      if (response.success && response.data) {
        // Check if we actually got person data
        const personName = response.data.name && response.data.last_name
          ? `${response.data.name} ${response.data.last_name}`
          : response.data.person

        if (!personName || personName === 'N/A' || !response.images?.count) {
          setQueueError('Queue is empty. Generate names first to add people to the queue.')
          setCurrentPerson(null)
          return
        }

        setCurrentPerson(response.data)
        setQueueSuccess(`Processed: ${personName} (${response.images?.count || 0} images downloaded)`)
        // Refresh progress
        refetch()
      } else {
        // Handle empty queue or failure
        const errorMsg = response.message || 'Queue is empty. Generate names first.'
        setQueueError(errorMsg)
        setCurrentPerson(null)
      }
    } catch (err) {
      // Check if it's a "no data" error
      if (err.message?.toLowerCase().includes('no data') || err.message?.toLowerCase().includes('not found')) {
        setQueueError('Queue is empty. Click "Generate Names" to add people to the queue.')
      } else {
        setQueueError(err.message || 'An error occurred while processing')
      }
      setCurrentPerson(null)
    } finally {
      setProcessing(false)
    }
  }

  // Process All Handler
  const handleProcessAll = async () => {
    setQueueError(null)
    setQueueSuccess(null)
    setProcessingAll(true)
    setCurrentPerson(null)

    try {
      setQueueSuccess('Batch processing started. Check progress monitor for updates.')
      // Refresh progress every few seconds
      const interval = setInterval(() => refetch(), 5000)
      setTimeout(() => clearInterval(interval), 60000) // Stop after 1 minute
    } catch (err) {
      setQueueError(err.message || 'An error occurred')
    } finally {
      setProcessingAll(false)
    }
  }

  // Progress Monitor Helpers
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
      <HelpButton pageName="training-workflow" />

      {/* Header with Step Indicator */}
      <div className="workflow-header">
        <div>
          <h1>Training Workflow</h1>
          <p className="subtitle">Complete pipeline: Generate → Process → Monitor</p>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="step-indicator">
        <div className="step">
          <div className="step-number">1</div>
          <div className="step-label">Generate Names</div>
        </div>
        <div className="step-divider"></div>
        <div className="step">
          <div className="step-number">2</div>
          <div className="step-label">Process Queue</div>
        </div>
        <div className="step-divider"></div>
        <div className="step">
          <div className="step-number">3</div>
          <div className="step-label">Monitor Progress</div>
        </div>
      </div>

      {/* Main Workflow Grid */}
      <div className="workflow-grid">
        {/* Left Column: Generate + Queue */}
        <div className="workflow-actions">
          {/* Step 1: Generate Names */}
          <div className="workflow-card">
            <div className="card-header">
              <h2>
                <span className="step-badge">1</span>
                Generate Names
              </h2>
              <span className="card-subtitle">AI-powered name generation (~30-60s)</span>
            </div>

            <form onSubmit={handleGenerate} style={{ marginTop: '1.5rem' }}>
              <div className="form-group">
                <label htmlFor="country">Select Country</label>
                <select
                  id="country"
                  className="form-input"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  disabled={generating}
                >
                  {commonCountries.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>
                  Select Categories ({selectedCategories.length} selected)
                  <small style={{ marginLeft: '0.5rem', color: '#6b7280', fontWeight: 'normal' }}>
                    ~20 names per category
                  </small>
                </label>
                <div className="category-grid">
                  {celebrityCategories.map((category) => (
                    <label
                      key={category}
                      className={`category-checkbox ${selectedCategories.includes(category) ? 'checked' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(category)}
                        onChange={() => toggleCategory(category)}
                        disabled={generating}
                      />
                      <span>{category}</span>
                    </label>
                  ))}
                </div>

                {/* Custom Category Input */}
                <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Add custom category (e.g., 'Basketball Players')"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomCategory())}
                    disabled={generating}
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={addCustomCategory}
                    disabled={generating || !customCategory.trim()}
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    + Add
                  </button>
                </div>
              </div>

              {generateError && <div className="alert alert-error">{generateError}</div>}
              {generateSuccess && <div className="alert alert-success">{generateSuccess}</div>}

              <button
                type="submit"
                className="btn btn-primary btn-block"
                disabled={generating || !country.trim() || selectedCategories.length === 0}
              >
                {generating ? (
                  <>
                    <span className="spinner"></span>
                    Generating... (30-60s)
                  </>
                ) : (
                  <>✨ Generate ~{selectedCategories.length * 20} Names</>
                )}
              </button>
            </form>
          </div>

          {/* Step 2: Process Queue */}
          <div className="workflow-card">
            <div className="card-header">
              <h2>
                <span className="step-badge">2</span>
                Process Queue
              </h2>
              <span className="card-subtitle">Download training images (~5-15s per person)</span>
            </div>

            <div className="button-group" style={{ marginTop: '1.5rem' }}>
              <button
                className="btn btn-primary"
                onClick={handleProcessNext}
                disabled={processing || processingAll || generating}
                style={{ flex: 1 }}
              >
                {processing ? (
                  <>
                    <span className="spinner"></span>
                    Processing...
                  </>
                ) : (
                  <>▶️ Process Next</>
                )}
              </button>

              <button
                className="btn"
                style={{
                  flex: 1,
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                }}
                onClick={handleProcessAll}
                disabled={processing || processingAll || generating}
              >
                {processingAll ? (
                  <>
                    <span className="spinner"></span>
                    Processing...
                  </>
                ) : (
                  <>⏩ Process All</>
                )}
              </button>
            </div>

            {queueError && <div className="alert alert-error">{queueError}</div>}
            {queueSuccess && <div className="alert alert-success">{queueSuccess}</div>}

            {currentPerson && (
              <div className="result-box">
                <h4>Last Processed</h4>
                <div className="result-details">
                  <div className="result-row">
                    <span>Person:</span>
                    <strong>{currentPerson.person || 'N/A'}</strong>
                  </div>
                  <div className="result-row">
                    <span>Images:</span>
                    <strong>{currentPerson.images_downloaded || 0}</strong>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Progress Monitor */}
        <div className="workflow-monitor">
          <div className="workflow-card">
            <div className="card-header">
              <h2>
                <span className="step-badge">3</span>
                Training Progress
              </h2>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                {isPolling && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#10b981', fontSize: '0.75rem' }}>
                    <span className="spinner" style={{ width: '12px', height: '12px', borderWidth: '2px' }}></span>
                    Auto-updating
                  </span>
                )}
                <button
                  className="btn btn-sm"
                  onClick={togglePolling}
                  title={isPolling ? 'Pause auto-updates' : 'Resume auto-updates'}
                  style={{
                    padding: '0.25rem 0.75rem',
                    fontSize: '0.75rem',
                    background: isPolling ? '#ef4444' : '#10b981',
                    color: 'white',
                    border: 'none',
                  }}
                >
                  {isPolling ? '⏸️' : '▶️'}
                </button>
                <button
                  className="btn btn-sm btn-primary"
                  onClick={refetch}
                  disabled={progressLoading}
                  title="Refresh now"
                  style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}
                >
                  🔄
                </button>
              </div>
            </div>

            {progressError && <div className="alert alert-error">{progressError}</div>}

            {progressLoading ? (
              <div className="loading-state-inline">
                <span className="spinner"></span>
                <span>Loading...</span>
              </div>
            ) : !folders || folders.length === 0 ? (
              <div className="empty-state-inline">
                <div className="empty-icon">📂</div>
                <p>No training data yet</p>
                <small>Generate names and process queue to start</small>
              </div>
            ) : (
              <>
                <div className="stats-summary-compact">
                  <div className="summary-item-compact">
                    <strong>{folders.length}</strong>
                    <span>Folders</span>
                  </div>
                  <div className="summary-item-compact">
                    <strong>{folders.reduce((sum, f) => sum + (f.imageCount || 0), 0)}</strong>
                    <span>Images</span>
                  </div>
                  <div className="summary-item-compact">
                    <strong>{folders.filter(f => (f.imageCount || 0) >= 20).length}</strong>
                    <span>Ready</span>
                  </div>
                </div>

                <div className="folders-list">
                  {folders.slice(0, 10).map((folder, index) => {
                    const status = getStatusBadge(folder.imageCount || 0)
                    return (
                      <div key={index} className="folder-item">
                        <div className="folder-item-header">
                          <span className="folder-name-short">{folder.name || 'Unknown'}</span>
                          <span className={`status-badge-sm ${status.className}`}>
                            {status.label}
                          </span>
                        </div>
                        <div className="folder-item-stats">
                          <span>{folder.imageCount || 0} images</span>
                          {folder.imageCount > 0 && (
                            <div className="progress-bar-sm">
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
                      </div>
                    )
                  })}
                  {folders.length > 10 && (
                    <div className="folder-item-more">
                      +{folders.length - 10} more folders
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="info-box" style={{ marginTop: '2rem' }}>
        <h4>ℹ️ Complete Workflow Guide</h4>
        <ul style={{ marginTop: '1rem', paddingLeft: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '0.5rem' }}>
          <li><strong>Step 1:</strong> AI generates ~50 celebrity names</li>
          <li><strong>Step 2:</strong> Download images (5-15s each)</li>
          <li><strong>Step 3:</strong> Monitor progress (auto-updates every 15s)</li>
          <li><strong>Ready:</strong> 40+ images optimal for training</li>
        </ul>
      </div>
    </div>
  )
}
