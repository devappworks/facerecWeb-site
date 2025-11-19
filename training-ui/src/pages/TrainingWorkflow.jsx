import { useState, useEffect } from 'react'
import { trainingService } from '../services/training'
import { automatedTrainingService } from '../services/automatedTraining'
import { usePolling } from '../hooks/usePolling'
import HelpButton from '../components/HelpButton'
import '../styles/training-workflow.css'

export default function TrainingWorkflow() {
  // Generate Candidates State (Wikidata-based)
  const [country, setCountry] = useState('serbia')
  const [selectedOccupations, setSelectedOccupations] = useState(['actor'])
  const [occupationDropdownOpen, setOccupationDropdownOpen] = useState(false)
  const [countries, setCountries] = useState([])
  const [occupations, setOccupations] = useState([])
  const [generating, setGenerating] = useState(false)
  const [generateError, setGenerateError] = useState(null)
  const [generateSuccess, setGenerateSuccess] = useState(null)
  const [candidates, setCandidates] = useState([])
  const [statistics, setStatistics] = useState(null)
  const [showGeneratedNames, setShowGeneratedNames] = useState(false)
  const [showFilter, setShowFilter] = useState('new') // 'all', 'new', 'existing'

  // Queue Manager State
  const [processing, setProcessing] = useState(false)
  const [processingAll, setProcessingAll] = useState(false)
  const [currentPerson, setCurrentPerson] = useState(null)
  const [queueError, setQueueError] = useState(null)
  const [queueSuccess, setQueueSuccess] = useState(null)

  // Progress Monitor State
  const [pollingEnabled, setPollingEnabled] = useState(true)

  // Load countries and occupations on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [countriesRes, occupationsRes] = await Promise.all([
          automatedTrainingService.getCountries(),
          automatedTrainingService.getOccupations(),
        ])
        if (countriesRes.success) setCountries(countriesRes.countries)
        if (occupationsRes.success) setOccupations(occupationsRes.occupations)
      } catch (err) {
        console.error('Failed to load data:', err)
      }
    }
    loadData()
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (occupationDropdownOpen) {
        // Check if click is outside both the button and the dropdown menu
        const clickedInsideDropdown = event.target.closest('.occupation-dropdown-container')
        if (!clickedInsideDropdown) {
          setOccupationDropdownOpen(false)
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [occupationDropdownOpen])

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

  // Occupation Selection Handlers
  const toggleOccupation = (occupationCode) => {
    console.log('Toggling occupation:', occupationCode)
    setSelectedOccupations(prev => {
      console.log('Previous selections:', prev)
      const newSelections = prev.includes(occupationCode)
        ? prev.filter(o => o !== occupationCode)
        : [...prev, occupationCode]
      console.log('New selections:', newSelections)
      return newSelections
    })
  }

  // Generate Candidates Handler (Wikidata) - supports multiple occupations
  const handleGenerate = async (e) => {
    e.preventDefault()
    setGenerateError(null)
    setGenerateSuccess(null)
    setCandidates([])
    setStatistics(null)

    if (selectedOccupations.length === 0) {
      setGenerateError('Please select at least one occupation')
      return
    }

    setGenerating(true)

    try {
      // Fetch candidates for each selected occupation
      const allPromises = selectedOccupations.map(occupation =>
        automatedTrainingService.generateCandidates(
          country,
          occupation,
          country // domain = country
        )
      )

      const responses = await Promise.all(allPromises)

      // Combine all candidates from all occupations
      let allCandidates = []
      let totalNew = 0
      let totalExisting = 0

      responses.forEach(response => {
        if (response.success && response.candidates) {
          // Add occupation info to each candidate for display
          const candidatesWithOccupation = response.candidates.map(c => ({
            ...c,
            isSelected: !c.exists_in_db,
          }))
          allCandidates = [...allCandidates, ...candidatesWithOccupation]

          totalNew += response.statistics?.new_people || response.candidates.filter(c => !c.exists_in_db).length
          totalExisting += response.statistics?.existing_people || response.candidates.filter(c => c.exists_in_db).length
        }
      })

      // Remove duplicates based on wikidata_id
      const uniqueCandidates = allCandidates.filter((candidate, index, self) =>
        index === self.findIndex(c => c.wikidata_id === candidate.wikidata_id)
      )

      setCandidates(uniqueCandidates)
      setStatistics({
        total: uniqueCandidates.length,
        new_people: uniqueCandidates.filter(c => !c.exists_in_db).length,
        existing_people: uniqueCandidates.filter(c => c.exists_in_db).length,
      })
      setShowGeneratedNames(true)
      setShowFilter('new')

      const occupationNames = selectedOccupations.map(id =>
        occupations.find(o => o.id === id)?.name || id
      ).join(', ')

      setGenerateSuccess(`Found ${uniqueCandidates.length} people in ${selectedOccupations.length} occupation(s) from ${country}! (${statistics?.new_people || totalNew} new)`)
    } catch (err) {
      const errorMessage =
        err.response?.data?.error || err.message || 'Failed to generate candidates from Wikidata'
      setGenerateError(errorMessage)
    } finally {
      setGenerating(false)
    }
  }

  // Candidate Selection Handlers
  const toggleCandidate = (wikidataId) => {
    setCandidates((prev) =>
      prev.map((c) =>
        c.wikidata_id === wikidataId ? { ...c, isSelected: !c.isSelected } : c
      )
    )
  }

  const selectAll = () => {
    setCandidates((prev) => prev.map((c) => ({ ...c, isSelected: true })))
  }

  const selectOnlyNew = () => {
    setCandidates((prev) =>
      prev.map((c) => ({ ...c, isSelected: !c.exists_in_db }))
    )
  }

  const deselectAll = () => {
    setCandidates((prev) => prev.map((c) => ({ ...c, isSelected: false })))
  }

  const getSelectedCount = () => {
    return candidates.filter((c) => c.isSelected).length
  }

  const clearCandidates = () => {
    setCandidates([])
    setStatistics(null)
    setGenerateError(null)
    setGenerateSuccess(null)
    setShowGeneratedNames(false)
  }

  // Filter candidates based on showFilter
  const filteredCandidates = candidates.filter((c) => {
    if (showFilter === 'new') return !c.exists_in_db
    if (showFilter === 'existing') return c.exists_in_db
    return true // 'all'
  })

  // Process Next Handler
  const handleProcessNext = async () => {
    setQueueError(null)
    setQueueSuccess(null)
    setProcessing(true)

    try {
      const response = await trainingService.processNext()

      if (response.success && response.data) {
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
        refetch()
      } else {
        const errorMsg = response.message || 'Queue is empty. Generate names first.'
        setQueueError(errorMsg)
        setCurrentPerson(null)
      }
    } catch (err) {
      if (err.message?.toLowerCase().includes('no data') || err.message?.toLowerCase().includes('not found')) {
        setQueueError('Queue is empty. Click "Generate from Wikidata" to add people to the queue.')
      } else {
        setQueueError(err.message || 'An error occurred while processing')
      }
      setCurrentPerson(null)
    } finally {
      setProcessing(false)
    }
  }

  // Start Batch Training Handler
  const handleStartTraining = async () => {
    const selectedCandidates = candidates.filter((c) => c.isSelected)
    if (selectedCandidates.length === 0) {
      setGenerateError('Please select at least one candidate to train')
      return
    }

    setQueueError(null)
    setQueueSuccess(null)
    setProcessingAll(true)

    try {
      const response = await automatedTrainingService.startBatch(
        selectedCandidates,
        country
      )

      if (response.success) {
        setQueueSuccess(`Started training ${selectedCandidates.length} people! Monitor progress below.`)
        // Clear candidates after starting batch
        clearCandidates()
        // Refresh progress
        setTimeout(() => refetch(), 2000)
      } else {
        setQueueError(response.message || 'Failed to start batch training')
      }
    } catch (err) {
      setQueueError(err.message || 'Failed to start batch training')
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
          <p className="subtitle">Complete pipeline: Generate → Select → Train → Monitor</p>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="step-indicator">
        <div className="step">
          <div className="step-number">1</div>
          <div className="step-label">Generate from Wikidata</div>
        </div>
        <div className="step-divider"></div>
        <div className="step">
          <div className="step-number">2</div>
          <div className="step-label">Select Candidates</div>
        </div>
        <div className="step-divider"></div>
        <div className="step">
          <div className="step-number">3</div>
          <div className="step-label">Train & Monitor</div>
        </div>
      </div>

      {/* Main Workflow Grid */}
      <div className="workflow-grid">
        {/* Left Column: Generate + Select */}
        <div className="workflow-actions">
          {/* Step 1: Generate from Wikidata */}
          <div className="workflow-card">
            <div className="card-header">
              <h2>
                <span className="step-badge">1</span>
                Generate from Wikidata
              </h2>
              <span className="card-subtitle">Query Wikidata for celebrities (~5-10s)</span>
            </div>

            <form onSubmit={handleGenerate} style={{ marginTop: '1.5rem' }}>
              <div className="form-group">
                <label htmlFor="country">Country</label>
                <select
                  id="country"
                  className="form-input"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  disabled={generating}
                >
                  {countries.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="occupation-dropdown">
                  Select Occupations
                </label>
                <div className="occupation-dropdown-container" style={{ position: 'relative' }}>
                  <button
                    type="button"
                    id="occupation-dropdown"
                    className="form-input"
                    onClick={() => setOccupationDropdownOpen(!occupationDropdownOpen)}
                    disabled={generating}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.75rem',
                      background: 'white',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{ color: selectedOccupations.length > 0 ? '#111827' : '#6b7280' }}>
                      {selectedOccupations.length > 0
                        ? `${selectedOccupations.length} occupation${selectedOccupations.length > 1 ? 's' : ''} selected`
                        : 'Select occupations...'}
                    </span>
                    <span style={{ fontSize: '0.875rem' }}>
                      {occupationDropdownOpen ? '▲' : '▼'}
                    </span>
                  </button>

                  {occupationDropdownOpen && (
                    <div
                      className="occupation-dropdown-menu"
                      style={{
                        position: 'absolute',
                        top: 'calc(100% + 0.25rem)',
                        left: 0,
                        right: 0,
                        background: 'white',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.375rem',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                        maxHeight: '300px',
                        overflowY: 'auto',
                        zIndex: 1000,
                      }}
                    >
                      {occupations.map((occ) => {
                        const isChecked = selectedOccupations.includes(occ.id)
                        return (
                          <div
                            key={occ.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.75rem',
                              padding: '0.75rem 1rem',
                              cursor: 'pointer',
                              background: isChecked ? '#eff6ff' : 'white',
                              borderBottom: '1px solid #f3f4f6',
                              transition: 'background 0.15s',
                            }}
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleOccupation(occ.id)
                            }}
                            onMouseEnter={(e) => {
                              if (!isChecked) e.currentTarget.style.background = '#f9fafb'
                            }}
                            onMouseLeave={(e) => {
                              if (!isChecked) e.currentTarget.style.background = 'white'
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}}
                              style={{ width: '16px', height: '16px', cursor: 'pointer', pointerEvents: 'none', margin: 0 }}
                            />
                            <span style={{ fontSize: '0.875rem', fontWeight: isChecked ? 600 : 400, userSelect: 'none' }}>
                              {occ.name}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
                <small style={{ display: 'block', marginTop: '0.25rem', color: '#6b7280' }}>
                  Click to select multiple occupations
                </small>
              </div>

              {generateError && <div className="alert alert-error">{generateError}</div>}
              {generateSuccess && <div className="alert alert-success">{generateSuccess}</div>}

              <button
                type="submit"
                className="btn btn-primary btn-block"
                disabled={generating}
              >
                {generating ? (
                  <>
                    <span className="spinner"></span>
                    Querying Wikidata...
                  </>
                ) : (
                  <>✨ Generate from Wikidata</>
                )}
              </button>
            </form>
          </div>

          {/* Step 2: Select Candidates */}
          {candidates.length > 0 && (
            <div className="workflow-card">
              <div className="card-header">
                <h2>
                  <span className="step-badge">2</span>
                  Select Candidates
                </h2>
                <span className="card-subtitle">
                  {statistics?.total || candidates.length} found ({statistics?.new_people || candidates.filter(c => !c.exists_in_db).length} new)
                </span>
              </div>

              {/* Statistics */}
              {statistics && (
                <div className="stats-summary-compact" style={{ marginTop: '1rem' }}>
                  <div className="summary-item-compact">
                    <strong>{statistics.total}</strong>
                    <span>Total</span>
                  </div>
                  <div className="summary-item-compact">
                    <strong>{statistics.new_people}</strong>
                    <span>New</span>
                  </div>
                  <div className="summary-item-compact">
                    <strong>{statistics.existing_people}</strong>
                    <span>Existing</span>
                  </div>
                </div>
              )}

              {/* Filter Buttons */}
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button
                  onClick={() => setShowFilter('new')}
                  className="btn btn-sm"
                  style={{
                    flex: 1,
                    fontSize: '0.75rem',
                    padding: '0.4rem',
                    background: showFilter === 'new' ? '#10b981' : '#e5e7eb',
                    color: showFilter === 'new' ? 'white' : '#374151',
                    border: 'none',
                  }}
                >
                  New ({statistics?.new_people || 0})
                </button>
                <button
                  onClick={() => setShowFilter('existing')}
                  className="btn btn-sm"
                  style={{
                    flex: 1,
                    fontSize: '0.75rem',
                    padding: '0.4rem',
                    background: showFilter === 'existing' ? '#6b7280' : '#e5e7eb',
                    color: showFilter === 'existing' ? 'white' : '#374151',
                    border: 'none',
                  }}
                >
                  Existing ({statistics?.existing_people || 0})
                </button>
                <button
                  onClick={() => setShowFilter('all')}
                  className="btn btn-sm"
                  style={{
                    flex: 1,
                    fontSize: '0.75rem',
                    padding: '0.4rem',
                    background: showFilter === 'all' ? '#3b82f6' : '#e5e7eb',
                    color: showFilter === 'all' ? 'white' : '#374151',
                    border: 'none',
                  }}
                >
                  All ({statistics?.total || 0})
                </button>
              </div>

              {/* Selection Controls */}
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                <button
                  onClick={selectOnlyNew}
                  className="btn btn-sm"
                  style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem', background: '#10b981', color: 'white', border: 'none' }}
                >
                  ✓ New Only
                </button>
                <button
                  onClick={selectAll}
                  className="btn btn-sm"
                  style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem', background: '#3b82f6', color: 'white', border: 'none' }}
                >
                  ✓ All
                </button>
                <button
                  onClick={deselectAll}
                  className="btn btn-sm"
                  style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem', background: '#6b7280', color: 'white', border: 'none' }}
                >
                  ✗ None
                </button>
                <button
                  onClick={clearCandidates}
                  className="btn btn-sm"
                  style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem', background: '#ef4444', color: 'white', border: 'none', marginLeft: 'auto' }}
                >
                  Clear
                </button>
              </div>

              {/* Candidates List */}
              <div className="folders-list" style={{ marginTop: '1rem', maxHeight: '300px', overflowY: 'auto' }}>
                {filteredCandidates.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                    No candidates match the current filter
                  </div>
                ) : (
                  filteredCandidates.slice(0, 50).map((candidate) => (
                    <div
                      key={candidate.wikidata_id}
                      className="folder-item"
                      style={{ padding: '0.75rem', cursor: 'pointer', borderBottom: '1px solid #e5e7eb' }}
                      onClick={() => toggleCandidate(candidate.wikidata_id)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <input
                          type="checkbox"
                          checked={candidate.isSelected}
                          onChange={() => toggleCandidate(candidate.wikidata_id)}
                          onClick={(e) => e.stopPropagation()}
                          style={{ width: '16px', height: '16px' }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 500, color: '#111827' }}>
                            {candidate.full_name}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                            {candidate.description}
                          </div>
                        </div>
                        {candidate.exists_in_db ? (
                          <span className="status-badge-sm" style={{ background: '#e5e7eb', color: '#6b7280' }}>
                            ✓ EXISTS
                          </span>
                        ) : (
                          <span className="status-badge-sm" style={{ background: '#d1fae5', color: '#065f46' }}>
                            ✨ NEW
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
                {filteredCandidates.length > 50 && (
                  <div style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.875rem', color: '#6b7280' }}>
                    ... and {filteredCandidates.length - 50} more
                  </div>
                )}
              </div>

              {/* Start Training Button */}
              <button
                onClick={handleStartTraining}
                disabled={getSelectedCount() === 0 || processingAll}
                className="btn btn-block"
                style={{
                  marginTop: '1rem',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem',
                  fontSize: '1rem',
                  fontWeight: 600,
                }}
              >
                {processingAll ? (
                  <>
                    <span className="spinner"></span>
                    Starting Training...
                  </>
                ) : (
                  <>🚀 Start Training ({getSelectedCount()} selected)</>
                )}
              </button>
            </div>
          )}

          {/* Process Queue (Legacy) */}
          {candidates.length === 0 && (
            <div className="workflow-card">
              <div className="card-header">
                <h2>
                  <span className="step-badge">2</span>
                  Process Queue
                </h2>
                <span className="card-subtitle">Process Excel-based queue (legacy)</span>
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
          )}
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
            {queueSuccess && <div className="alert alert-success">{queueSuccess}</div>}

            {progressLoading ? (
              <div className="loading-state-inline">
                <span className="spinner"></span>
                <span>Loading...</span>
              </div>
            ) : !folders || folders.length === 0 ? (
              <div className="empty-state-inline">
                <div className="empty-icon">📂</div>
                <p>No training data yet</p>
                <small>Generate and train candidates to start</small>
              </div>
            ) : (
              <>
                <div className="stats-summary-compact">
                  <div className="summary-item-compact">
                    <strong>{folders.length}</strong>
                    <span>Folders</span>
                  </div>
                  <div className="summary-item-compact">
                    <strong>{folders.reduce((sum, f) => sum + (f.image_count || 0), 0)}</strong>
                    <span>Images</span>
                  </div>
                  <div className="summary-item-compact">
                    <strong>{folders.filter(f => (f.image_count || 0) >= 20).length}</strong>
                    <span>Ready</span>
                  </div>
                </div>

                <div className="folders-list">
                  {folders.slice(0, 10).map((folder, index) => {
                    const status = getStatusBadge(folder.image_count || 0)
                    return (
                      <div key={index} className="folder-item">
                        <div className="folder-item-header">
                          <span className="folder-name-short" title={folder.display_name}>
                            {folder.display_name || folder.name || 'Unknown'}
                          </span>
                          <span className={`status-badge-sm ${status.className}`}>
                            {status.label}
                          </span>
                        </div>
                        <div className="folder-item-stats">
                          <span>{folder.image_count || 0} images</span>
                          {folder.image_count > 0 && (
                            <div className="progress-bar-sm">
                              <div
                                className="progress-fill"
                                style={{
                                  width: `${Math.min((folder.image_count / 40) * 100, 100)}%`,
                                  backgroundColor: folder.image_count >= 20 ? '#10b981' : '#f59e0b'
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
          <li><strong>Step 1:</strong> Query Wikidata for celebrities by occupation</li>
          <li><strong>Step 2:</strong> Select which candidates to train</li>
          <li><strong>Step 3:</strong> Start batch training & monitor progress</li>
          <li><strong>Ready:</strong> 40+ images optimal for training</li>
        </ul>
      </div>
    </div>
  )
}
