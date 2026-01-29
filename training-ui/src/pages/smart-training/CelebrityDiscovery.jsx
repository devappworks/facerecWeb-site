import { useState } from 'react'
import { smartTrainingService } from '../../services/smartTraining'
import '../../styles/smart-training.css'

export default function CelebrityDiscovery() {
  const [activeTab, setActiveTab] = useState('trending') // trending, top, search
  const [celebrities, setCelebrities] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [country, setCountry] = useState('serbia')
  const [searchQuery, setSearchQuery] = useState('')
  const [selected, setSelected] = useState(new Set())

  const discover = async () => {
    setLoading(true)
    setError(null)
    setCelebrities([])

    try {
      let result
      if (activeTab === 'trending') {
        result = await smartTrainingService.discoverTrending(country, 20)
      } else if (activeTab === 'top') {
        result = await smartTrainingService.getTopCelebrities(country, 50)
      } else if (activeTab === 'search' && searchQuery) {
        result = await smartTrainingService.searchCelebrity(searchQuery, country)
      }

      if (result?.success) {
        setCelebrities(result.celebrities || result.results || [])
      } else {
        setError(result?.error || 'Discovery failed')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAddToQueue = async (celeb) => {
    try {
      await smartTrainingService.addToQueue(
        celeb.name || celeb.full_name,
        'serbia',
        'medium',
        celeb.wikidata_id
      )
      alert(`Added ${celeb.name || celeb.full_name} to queue!`)
    } catch (err) {
      alert(`Failed: ${err.message}`)
    }
  }

  const handleBulkAdd = async () => {
    if (selected.size === 0) {
      alert('No celebrities selected')
      return
    }

    const selectedCelebs = celebrities.filter((_, i) => selected.has(i))
    for (const celeb of selectedCelebs) {
      try {
        await smartTrainingService.addToQueue(
          celeb.name || celeb.full_name,
          'serbia',
          'medium',
          celeb.wikidata_id
        )
      } catch (err) {
        console.error(`Failed to add ${celeb.name}:`, err)
      }
    }

    alert(`Added ${selectedCelebs.length} people to queue!`)
    setSelected(new Set())
  }

  return (
    <div className="page-container">
      <h1>Celebrity Discovery</h1>
      <p className="subtitle">Find trending celebrities to train</p>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Tabs */}
      <div className="tabs-container">
        <div className="tabs-list">
          <button
            className={`tab-button ${activeTab === 'trending' ? 'active' : ''}`}
            onClick={() => setActiveTab('trending')}
          >
            🔥 Trending
          </button>
          <button
            className={`tab-button ${activeTab === 'top' ? 'active' : ''}`}
            onClick={() => setActiveTab('top')}
          >
            ⭐ Top Celebrities
          </button>
          <button
            className={`tab-button ${activeTab === 'search' ? 'active' : ''}`}
            onClick={() => setActiveTab('search')}
          >
            🔍 Search
          </button>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
          <select
            className="form-select"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            style={{ flex: '0 0 200px' }}
          >
            <option value="serbia">Serbia</option>
            <option value="croatia">Croatia</option>
            <option value="slovenia">Slovenia</option>
            <option value="usa">USA</option>
            <option value="uk">UK</option>
          </select>

          {activeTab === 'search' && (
            <input
              type="text"
              className="form-input"
              placeholder="Search by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && discover()}
              style={{ flex: 1 }}
            />
          )}

          <button
            className="btn btn-primary"
            onClick={discover}
            disabled={loading || (activeTab === 'search' && !searchQuery)}
          >
            {loading ? 'Discovering...' : `🔍 Discover`}
          </button>

          {selected.size > 0 && (
            <button
              className="btn btn-success"
              onClick={handleBulkAdd}
            >
              Add Selected ({selected.size})
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="text-muted">Discovering celebrities...</div>
      ) : celebrities.length === 0 ? (
        <div
          style={{
            background: 'white',
            padding: '3rem',
            borderRadius: '12px',
            textAlign: 'center',
            color: '#999',
          }}
        >
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✨</div>
          <h3>No results yet</h3>
          <p>Click Discover to find celebrities</p>
        </div>
      ) : (
        <div className="celebrity-grid">
          {celebrities.map((celeb, index) => (
            <div key={index} className="celebrity-card">
              <div className="celebrity-card-image-container">
                {celeb.image_url && (
                  <img
                    src={celeb.image_url}
                    alt={celeb.name || celeb.full_name}
                    className="celebrity-card-image"
                    onError={(e) => {
                      e.target.style.display = 'none'
                    }}
                  />
                )}
                {celeb.score && (
                  <div className="celebrity-card-score">
                    {celeb.score}
                  </div>
                )}
              </div>
              <div className="celebrity-card-content">
                <h3 className="celebrity-card-name">{celeb.name || celeb.full_name}</h3>
                <p className="celebrity-card-description">
                  {celeb.description || celeb.occupation || 'Celebrity'}
                </p>
                <div className="celebrity-card-footer">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                    <input
                      type="checkbox"
                      checked={selected.has(index)}
                      onChange={(e) => {
                        const newSelected = new Set(selected)
                        if (e.target.checked) {
                          newSelected.add(index)
                        } else {
                          newSelected.delete(index)
                        }
                        setSelected(newSelected)
                      }}
                    />
                    <span style={{ fontSize: '0.875rem' }}>Select</span>
                  </label>
                  <button
                    className="btn btn-primary"
                    onClick={() => handleAddToQueue(celeb)}
                    style={{ padding: '0.5rem 1rem' }}
                  >
                    + Queue
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
