import { useState } from 'react'
import { trainingService } from '../services/training'
import HelpButton from '../components/HelpButton'

export default function GenerateNames() {
  const [country, setCountry] = useState('Serbia')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const commonCountries = [
    'Serbia', 'United States', 'United Kingdom', 'France', 'Germany',
    'Italy', 'Spain', 'Canada', 'Australia', 'Japan',
    'South Korea', 'India', 'Brazil', 'Argentina', 'Mexico'
  ]

  const handleGenerate = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      const response = await trainingService.generateNames(country)

      if (response.success) {
        setSuccess(`Successfully generated names for ${country}!`)
      } else {
        setError(response.message || 'Failed to generate names')
      }
    } catch (err) {
      setError(err.message || 'An error occurred while generating names')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-container">
      <HelpButton pageName="generate" />
      <h1>Generate Celebrity Names</h1>
      <p className="subtitle">
        Generate lists of celebrities by country using AI. This process typically takes 30-60 seconds.
      </p>

      <div className="card" style={{ maxWidth: '600px', marginTop: '2rem' }}>
        <form onSubmit={handleGenerate}>
          <div className="form-group">
            <label htmlFor="country">Country</label>
            <select
              id="country"
              className="form-input"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              disabled={loading}
            >
              {commonCountries.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <small className="form-hint">
              Select a country to generate celebrity names from that region
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="custom-country">Or enter custom country</label>
            <input
              id="custom-country"
              type="text"
              className="form-input"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="Enter country name"
              disabled={loading}
            />
          </div>

          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !country.trim()}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Generating... (30-60s)
              </>
            ) : (
              'Generate Names'
            )}
          </button>
        </form>

        <div className="info-box" style={{ marginTop: '2rem' }}>
          <h4>ℹ️ How it works</h4>
          <ul style={{ marginTop: '1rem', paddingLeft: '1.5rem' }}>
            <li>AI generates ~50 celebrity names for the selected country</li>
            <li>Names are added to the processing queue</li>
            <li>Each name will be processed to download training images</li>
            <li>Process takes 30-60 seconds depending on AI response time</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
