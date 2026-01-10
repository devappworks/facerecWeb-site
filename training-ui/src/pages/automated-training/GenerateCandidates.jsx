import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCandidates } from '../../hooks/useCandidates'
import { automatedTrainingService } from '../../services/automatedTraining'
import HelpButton from '../../components/HelpButton'
import Tooltip from '../../components/Tooltip'
import '../../styles/generate-candidates.css'

export default function GenerateCandidates() {
  const navigate = useNavigate()
  const [countries, setCountries] = useState([])
  const [occupations, setOccupations] = useState([])
  const [selectedCountry, setSelectedCountry] = useState('serbia')
  const [selectedOccupation, setSelectedOccupation] = useState('')
  const [showFilter, setShowFilter] = useState('new') // 'all', 'new', 'existing'
  const [isGenerating, setIsGenerating] = useState(false)

  const {
    candidates,
    statistics,
    loading,
    error,
    generateCandidates,
    toggleCandidate,
    selectAll,
    selectOnlyNew,
    deselectAll,
    getSelectedCount,
    clearCandidates,
  } = useCandidates()

  // Load countries and occupations on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [countriesRes, occupationsRes] = await Promise.all([
          automatedTrainingService.getCountries(),
          automatedTrainingService.getOccupations(),
        ])
        if (countriesRes.success) setCountries(countriesRes.countries)
        if (occupationsRes.success) {
          setOccupations(occupationsRes.occupations)
        }
      } catch (err) {
        console.error('Failed to load data:', err)
      }
    }
    loadData()
  }, [])

  // Set default occupation after occupations are loaded
  useEffect(() => {
    if (occupations.length > 0 && !selectedOccupation) {
      setSelectedOccupation(occupations[0].id || occupations[0].code)
    }
  }, [occupations])

  const handleGenerate = async () => {
    if (!selectedCountry || !selectedOccupation) return

    setIsGenerating(true)
    try {
      // Domain always equals country
      await generateCandidates(selectedCountry, selectedOccupation, selectedCountry)
      setShowFilter('new') // Reset to show new candidates
    } catch (err) {
      console.error('Generate failed:', err)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleStartTraining = async () => {
    const selectedCandidates = candidates.filter((c) => c.isSelected)
    if (selectedCandidates.length === 0) {
      alert('Please select at least one candidate')
      return
    }

    try {
      const response = await automatedTrainingService.startBatch(
        selectedCandidates,
        selectedCountry
      )
      if (response.success) {
        // Navigate to batch progress page
        navigate(`/training/batch/${response.batch_id}`)
      }
    } catch (err) {
      console.error('Failed to start batch:', err)
    }
  }

  // Filter candidates based on showFilter
  const filteredCandidates = candidates.filter((c) => {
    if (showFilter === 'new') return !c.exists_in_db
    if (showFilter === 'existing') return c.exists_in_db
    return true // 'all'
  })

  return (
    <div className="generate-candidates-container">
      <HelpButton pageName="automated-generate" />
      <div className="generate-header">
        <h1>Generate Training Candidates</h1>
        <p>Select country and occupation to generate celebrity candidates from Wikidata</p>
      </div>

      {/* Selection Form */}
      <div className="form-section">
        <div className="form-grid">
          <div className="form-group">
            <label>Country</label>
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              disabled={isGenerating || loading}
            >
              {countries.map((country) => (
                <option key={country.id || country.code} value={country.id || country.code}>
                  {country.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Occupation</label>
            <select
              value={selectedOccupation}
              onChange={(e) => setSelectedOccupation(e.target.value)}
              disabled={isGenerating || loading}
            >
              {occupations.map((occupation) => (
                <option key={occupation.id || occupation.code} value={occupation.id || occupation.code}>
                  {occupation.name}
                </option>
              ))}
            </select>
          </div>

          <Tooltip content="Query Wikidata to find celebrities from the selected country and occupation" position="top">
            <button
              onClick={handleGenerate}
              disabled={isGenerating || loading}
              className="btn-primary"
              style={{ alignSelf: 'flex-end' }}
            >
              {isGenerating ? 'Generating...' : 'Generate'}
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-box">
          <p>Error</p>
          <p>{error}</p>
        </div>
      )}

      {/* Results Section */}
      {candidates.length > 0 && (
        <div className="results-section">
          {/* Statistics */}
          {statistics && (
            <div className="stats-grid">
              <div className="stat-box blue">
                <p>Total Found</p>
                <div className="stat-number">{statistics.total}</div>
              </div>
              <div className="stat-box green">
                <p>New People</p>
                <div className="stat-number">{statistics.new_people}</div>
              </div>
              <div className="stat-box gray">
                <p>Already in DB</p>
                <div className="stat-number">{statistics.existing_people}</div>
              </div>
            </div>
          )}

          {/* Filter Buttons */}
          <div className="filter-buttons">
            <button
              onClick={() => setShowFilter('new')}
              className={`filter-button ${showFilter === 'new' ? 'active green' : ''}`}
            >
              Show New ({statistics?.new_people || 0})
            </button>
            <button
              onClick={() => setShowFilter('existing')}
              className={`filter-button ${showFilter === 'existing' ? 'active gray' : ''}`}
            >
              Show Existing ({statistics?.existing_people || 0})
            </button>
            <button
              onClick={() => setShowFilter('all')}
              className={`filter-button ${showFilter === 'all' ? 'active blue' : ''}`}
            >
              Show All ({statistics?.total || 0})
            </button>
          </div>

          {/* Selection Controls */}
          <div className="selection-buttons">
            <button
              onClick={selectOnlyNew}
              className="selection-button green"
            >
              Select New Only
            </button>
            <button
              onClick={selectAll}
              className="selection-button blue"
            >
              Select All
            </button>
            <button
              onClick={deselectAll}
              className="selection-button gray"
            >
              Deselect All
            </button>
            <button
              onClick={clearCandidates}
              className="selection-button red"
            >
              Clear Results
            </button>
          </div>

          {/* Candidates List */}
          <div className="candidates-list">
            {filteredCandidates.length === 0 ? (
              <div className="candidates-empty">
                No candidates match the current filter
              </div>
            ) : (
              <>
                {filteredCandidates.map((candidate) => (
                  <div
                    key={candidate.wikidata_id}
                    className="candidate-item"
                  >
                    <input
                      type="checkbox"
                      checked={candidate.isSelected}
                      onChange={() => toggleCandidate(candidate.wikidata_id)}
                      className="candidate-checkbox"
                    />
                    <div className="candidate-content">
                      <div className="candidate-name">
                        {candidate.full_name || candidate.name}
                        {candidate.exists_in_db ? (
                          <Tooltip
                            content={`Already trained with ${candidate.existing_photo_count || 0} photos. Training again will add ${50 - (candidate.existing_photo_count || 0)} more photos (target: 50)`}
                            position="top"
                          >
                            <span className="candidate-badge exists">
                              ✓ EXISTS ({candidate.existing_photo_count || 0})
                            </span>
                          </Tooltip>
                        ) : (
                          <span className="candidate-badge new">
                            ✨ NEW
                          </span>
                        )}
                      </div>
                      <div className="candidate-meta">
                        <a
                          href={candidate.wikipedia_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Wikipedia
                        </a>
                        <span>Wikidata: {candidate.wikidata_id}</span>
                        {candidate.wikimedia_available_count > 0 && (
                          <span>📷 {candidate.wikimedia_available_count} Wikimedia photos</span>
                        )}
                        {candidate.exists_in_db && candidate.existing_photo_count > 0 && (
                          <span className="extra-info">
                            {candidate.existing_photo_count} in DB → Will add {Math.max(0, 50 - candidate.existing_photo_count)} more
                          </span>
                        )}
                      </div>                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Start Training Button */}
          <div className="action-buttons">
            <button
              onClick={handleStartTraining}
              disabled={getSelectedCount() === 0}
              className="btn-primary"
            >
              Start Training ({getSelectedCount()} selected)
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {candidates.length === 0 && !loading && !error && (
        <div className="empty-state">
          <p>
            Select a country and occupation, then click "Generate" to
            find celebrity candidates
          </p>
        </div>
      )}
    </div>
  )
}
