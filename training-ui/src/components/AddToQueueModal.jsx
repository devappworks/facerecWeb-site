import { useState } from 'react'
import { smartTrainingService } from '../services/smartTraining'
import '../styles/smart-training.css'

export default function AddToQueueModal({ isOpen, onClose, onSuccess }) {
  const [personName, setPersonName] = useState('')
  const [priority, setPriority] = useState('medium')
  const [wikidataId, setWikidataId] = useState('')
  const [domain, setDomain] = useState('serbia')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)

  const handleSearch = async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([])
      return
    }

    setSearching(true)
    setError(null)

    try {
      const result = await smartTrainingService.searchCelebrity(query)
      if (result.success) {
        setSearchResults(result.results || [])
      } else {
        setError(result.error || 'Search failed')
      }
    } catch (err) {
      console.error('Search error:', err)
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }

  const handleSelectResult = (result) => {
    setPersonName(result.full_name || result.name)
    setWikidataId(result.wikidata_id || '')
    setSearchResults([])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!personName.trim()) {
      setError('Person name is required')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = await smartTrainingService.addToQueue(
        personName,
        domain,
        priority,
        wikidataId || null
      )

      if (result.success) {
        if (onSuccess) onSuccess(result)
        handleClose()
      } else {
        setError(result.error || 'Failed to add to queue')
      }
    } catch (err) {
      setError(err.message || 'Failed to add to queue')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setPersonName('')
    setPriority('medium')
    setWikidataId('')
    setSearchResults([])
    setError(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add Person to Training Queue</h2>
          <button className="modal-close" onClick={handleClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
                {error}
              </div>
            )}

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="personName" className="form-label">
                Person Name *
              </label>
              <input
                type="text"
                id="personName"
                className="form-input"
                value={personName}
                onChange={(e) => {
                  setPersonName(e.target.value)
                  handleSearch(e.target.value)
                }}
                placeholder="Search by name..."
                required
              />
              {searching && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#999' }}>
                  Searching Wikidata...
                </div>
              )}
              {searchResults.length > 0 && (
                <div
                  style={{
                    marginTop: '0.5rem',
                    border: '1px solid #3a3a3a',
                    borderRadius: '8px',
                    maxHeight: '200px',
                    overflowY: 'auto',
                  }}
                >
                  {searchResults.map((result, index) => (
                    <div
                      key={index}
                      onClick={() => handleSelectResult(result)}
                      style={{
                        padding: '0.75rem',
                        cursor: 'pointer',
                        borderBottom: index < searchResults.length - 1 ? '1px solid #3a3a3a' : 'none',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#242424'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent'
                      }}
                    >
                      <div style={{ fontWeight: 600 }}>{result.full_name || result.name}</div>
                      {result.description && (
                        <div style={{ fontSize: '0.875rem', color: '#999' }}>
                          {result.description}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="priority" className="form-label">
                Priority
              </label>
              <select
                id="priority"
                className="form-select"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="high">🔴 High</option>
                <option value="medium">🟡 Medium</option>
                <option value="low">🟢 Low</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="wikidataId" className="form-label">
                Wikidata ID (Optional)
              </label>
              <input
                type="text"
                id="wikidataId"
                className="form-input"
                value={wikidataId}
                onChange={(e) => setWikidataId(e.target.value)}
                placeholder="e.g., Q12345"
              />
              <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#999' }}>
                Automatically filled if you select from search results
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="domain" className="form-label">
                Domain
              </label>
              <select
                id="domain"
                className="form-select"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
              >
                <option value="serbia">Serbia</option>
                <option value="croatia">Croatia</option>
                <option value="slovenia">Slovenia</option>
              </select>
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
              disabled={loading || !personName.trim()}
            >
              {loading ? 'Adding...' : 'Add to Queue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
