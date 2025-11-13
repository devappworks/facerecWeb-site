import { useState } from 'react'
import { trainingService } from '../services/training'

export default function Testing() {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [dragActive, setDragActive] = useState(false)

  const handleFile = (selectedFile) => {
    if (!selectedFile) return

    // Validate file
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

    // Create preview
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
      const response = await trainingService.testRecognition(file)
      setResult(response)
    } catch (err) {
      setError(err.message || 'Failed to test recognition')
    } finally {
      setTesting(false)
    }
  }

  const handleClear = () => {
    setFile(null)
    setPreview(null)
    setResult(null)
    setError(null)
  }

  return (
    <div className="page-container">
      <h1>Test Recognition</h1>
      <p className="subtitle">
        Upload an image to test face recognition accuracy.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem', marginTop: '2rem' }}>
        {/* Upload Section */}
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Upload Image</h3>

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
              background: dragActive ? '#f0f4ff' : '#f9fafb'
            }}
          >
            <input
              type="file"
              id="file-upload"
              accept="image/*"
              onChange={handleChange}
              style={{ display: 'none' }}
            />
            <label htmlFor="file-upload" style={{ cursor: 'pointer', display: 'block' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📸</div>
              <p style={{ margin: '0 0 0.5rem 0', fontWeight: 500 }}>
                Drop image here or click to browse
              </p>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>
                Supports JPG, PNG, GIF (max 10MB)
              </p>
            </label>
          </div>

          {preview && (
            <div style={{ marginTop: '1rem' }}>
              <img
                src={preview}
                alt="Preview"
                style={{
                  width: '100%',
                  maxHeight: '300px',
                  objectFit: 'contain',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}
              />
              <div className="button-group" style={{ marginTop: '1rem' }}>
                <button
                  className="btn btn-primary"
                  onClick={handleTest}
                  disabled={testing || !file}
                  style={{ flex: 1 }}
                >
                  {testing ? (
                    <>
                      <span className="spinner"></span>
                      Testing...
                    </>
                  ) : (
                    '🧪 Test Recognition'
                  )}
                </button>
                <button
                  className="btn"
                  onClick={handleClear}
                  disabled={testing}
                  style={{ background: '#ef4444', color: 'white', border: 'none' }}
                >
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Result Section */}
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Recognition Result</h3>

          {error && <div className="alert alert-error">{error}</div>}

          {result ? (
            <div>
              {result.status === 'success' && result.person ? (
                <div className="result-box" style={{ border: '2px solid #10b981' }}>
                  <h4 style={{ margin: '0 0 1rem 0', color: '#10b981' }}>
                    ✅ Person Recognized
                  </h4>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                    {result.person}
                  </div>
                  {result.best_match?.confidence_metrics?.confidence_percentage && (
                    <div style={{ marginTop: '1rem' }}>
                      <div style={{ marginBottom: '0.5rem', fontWeight: 500 }}>
                        Confidence: {result.best_match.confidence_metrics.confidence_percentage.toFixed(2)}%
                      </div>
                      <div className="progress-bar" style={{ height: '8px' }}>
                        <div
                          className="progress-fill"
                          style={{
                            width: `${result.best_match.confidence_metrics.confidence_percentage}%`,
                            backgroundColor: '#10b981'
                          }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              ) : result.status === 'no_faces' || result.status === 'error' ? (
                <div className="result-box" style={{ border: '2px solid #f59e0b' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: '#f59e0b' }}>
                    ⚠️ No Face Detected
                  </h4>
                  <p style={{ margin: 0 }}>
                    {result.message || 'No valid faces found in the image'}
                  </p>
                </div>
              ) : (
                <div className="result-box" style={{ border: '2px solid #6b7280' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: '#6b7280' }}>
                    ❓ Unknown Person
                  </h4>
                  <p style={{ margin: 0 }}>
                    No matching person found in the database
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
              <p>Upload an image to see recognition results</p>
            </div>
          )}
        </div>
      </div>

      <div className="info-box" style={{ marginTop: '2rem' }}>
        <h4>ℹ️ Testing Tips</h4>
        <ul style={{ marginTop: '1rem', paddingLeft: '1.5rem' }}>
          <li>Use clear, frontal face photos for best results</li>
          <li>Ensure good lighting and no obstructions</li>
          <li>Single face per image works best</li>
          <li>Test with various angles and expressions</li>
          <li>Images should be similar to training data quality</li>
        </ul>
      </div>
    </div>
  )
}
