import { useState } from 'react'
import { trainingService } from '../services/training'

export default function ABTesting() {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [groundTruth, setGroundTruth] = useState('')
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [dragActive, setDragActive] = useState(false)

  const handleFile = (selectedFile) => {
    if (!selectedFile) return

    if (!selectedFile.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB')
      return
    }

    setFile(selectedFile)
    setError(null)
    setResult(null)

    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result)
    }
    reader.readAsDataURL(selectedFile)
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleChange = (e) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleTest = async () => {
    if (!file) return

    setTesting(true)
    setError(null)
    setResult(null)

    try {
      const response = await trainingService.abTestRecognition(file, groundTruth || null)
      setResult(response)
    } catch (err) {
      setError(err.message || 'Failed to run A/B test')
    } finally {
      setTesting(false)
    }
  }

  const handleClear = () => {
    setFile(null)
    setPreview(null)
    setResult(null)
    setError(null)
    setGroundTruth('')
  }

  const renderSystemResult = (system, data) => {
    if (!data) return null

    const isCorrect = groundTruth && data.person &&
      data.person.toLowerCase() === groundTruth.toLowerCase()

    return (
      <div className="card" style={{
        border: `2px solid ${isCorrect ? '#10b981' : data.person ? '#667eea' : '#6b7280'}`
      }}>
        <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {system === 'current' ? '📊 Current System' : '✨ Improved System'}
          {isCorrect && <span style={{ fontSize: '1.5rem' }}>✅</span>}
        </h3>

        {data.person ? (
          <>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
              {data.person}
            </div>
            {data.confidence && (
              <div style={{ marginTop: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 500 }}>Confidence:</span>
                  <strong>{data.confidence.toFixed(2)}%</strong>
                </div>
                <div className="progress-bar" style={{ height: '8px' }}>
                  <div
                    className="progress-fill"
                    style={{
                      width: `${data.confidence}%`,
                      backgroundColor: isCorrect ? '#10b981' : '#667eea'
                    }}
                  ></div>
                </div>
              </div>
            )}
            {data.processing_time && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
                Processing time: {data.processing_time}
              </div>
            )}
          </>
        ) : (
          <div style={{ color: '#6b7280', fontStyle: 'italic' }}>
            {data.error || 'Unknown person'}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="page-container">
      <h1>A/B Testing</h1>
      <p className="subtitle">
        Compare current vs improved face recognition systems side-by-side.
      </p>

      {/* Upload Section */}
      <div className="card" style={{ maxWidth: '800px', marginTop: '2rem' }}>
        <h3 style={{ marginTop: 0 }}>Upload Test Image</h3>

        <div
          className={`upload-zone ${dragActive ? 'drag-active' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          style={{
            border: `2px dashed ${dragActive ? '#667eea' : '#d1d5db'}`,
            borderRadius: '12px',
            padding: '2rem',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            background: dragActive ? '#f0f4ff' : '#f9fafb',
            marginBottom: '1.5rem'
          }}
        >
          <input
            type="file"
            id="ab-file-upload"
            accept="image/*"
            onChange={handleChange}
            style={{ display: 'none' }}
          />
          <label htmlFor="ab-file-upload" style={{ cursor: 'pointer', display: 'block' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚖️</div>
            <p style={{ margin: '0 0 0.5rem 0', fontWeight: 500 }}>
              Drop image here or click to browse
            </p>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>
              Supports JPG, PNG, GIF (max 10MB)
            </p>
          </label>
        </div>

        <div className="form-group">
          <label htmlFor="ground-truth">Ground Truth (Optional)</label>
          <input
            id="ground-truth"
            type="text"
            className="form-input"
            value={groundTruth}
            onChange={(e) => setGroundTruth(e.target.value)}
            placeholder="Enter expected person name"
            disabled={testing}
          />
          <small className="form-hint">
            Enter the correct person name to verify system accuracy
          </small>
        </div>

        {preview && (
          <div style={{ marginTop: '1rem' }}>
            <img
              src={preview}
              alt="Preview"
              style={{
                width: '100%',
                maxHeight: '200px',
                objectFit: 'contain',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                marginBottom: '1rem'
              }}
            />
          </div>
        )}

        {error && <div className="alert alert-error">{error}</div>}

        <div className="button-group">
          <button
            className="btn btn-primary"
            onClick={handleTest}
            disabled={testing || !file}
            style={{ flex: 1 }}
          >
            {testing ? (
              <>
                <span className="spinner"></span>
                Running A/B Test...
              </>
            ) : (
              '⚖️ Run A/B Test'
            )}
          </button>
          {file && (
            <button
              className="btn"
              onClick={handleClear}
              disabled={testing}
              style={{ background: '#ef4444', color: 'white', border: 'none' }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Results Section */}
      {result && (
        <>
          <h2 style={{ marginTop: '3rem', marginBottom: '1.5rem' }}>Comparison Results</h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
            gap: '2rem'
          }}>
            {renderSystemResult('current', result.current_system)}
            {renderSystemResult('improved', result.improved_system)}
          </div>

          {result.recommendation && (
            <div className="info-box" style={{ marginTop: '2rem', background: '#f0fdf4', borderColor: '#bbf7d0' }}>
              <h4 style={{ margin: '0 0 0.5rem 0', color: '#14532d' }}>
                💡 Recommendation
              </h4>
              <p style={{ margin: 0, color: '#14532d' }}>
                {result.recommendation}
              </p>
            </div>
          )}

          {groundTruth && (
            <div className="result-box" style={{ marginTop: '1rem' }}>
              <h4 style={{ margin: '0 0 0.5rem 0' }}>
                📌 Ground Truth: {groundTruth}
              </h4>
              <div style={{ marginTop: '0.5rem' }}>
                {result.current_system?.person && (
                  <p style={{ margin: '0.25rem 0' }}>
                    <strong>Current System:</strong>{' '}
                    {result.current_system.person.toLowerCase() === groundTruth.toLowerCase() ? (
                      <span style={{ color: '#10b981' }}>✅ Correct</span>
                    ) : (
                      <span style={{ color: '#ef4444' }}>❌ Incorrect</span>
                    )}
                  </p>
                )}
                {result.improved_system?.person && (
                  <p style={{ margin: '0.25rem 0' }}>
                    <strong>Improved System:</strong>{' '}
                    {result.improved_system.person.toLowerCase() === groundTruth.toLowerCase() ? (
                      <span style={{ color: '#10b981' }}>✅ Correct</span>
                    ) : (
                      <span style={{ color: '#ef4444' }}>❌ Incorrect</span>
                    )}
                  </p>
                )}
              </div>
            </div>
          )}
        </>
      )}

      <div className="info-box" style={{ marginTop: '2rem' }}>
        <h4>ℹ️ About A/B Testing</h4>
        <ul style={{ marginTop: '1rem', paddingLeft: '1.5rem' }}>
          <li><strong>Current System:</strong> VGG-Face model with threshold 0.35</li>
          <li><strong>Improved System:</strong> Facenet512 model with threshold 0.40</li>
          <li>Both systems run in parallel for direct comparison</li>
          <li>Ground truth helps validate accuracy improvements</li>
          <li>Confidence scores indicate recognition certainty</li>
        </ul>
      </div>
    </div>
  )
}
