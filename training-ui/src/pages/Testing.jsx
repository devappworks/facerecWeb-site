import { useState } from 'react'
import { trainingService } from '../services/training'

export default function Testing() {
  const [files, setFiles] = useState([])
  const [testing, setTesting] = useState(false)
  const [results, setResults] = useState([])
  const [error, setError] = useState(null)
  const [dragActive, setDragActive] = useState(false)
  const [batchMode, setBatchMode] = useState(false)

  const handleFiles = (selectedFiles) => {
    if (!selectedFiles || selectedFiles.length === 0) return

    const validFiles = []
    const errors = []

    Array.from(selectedFiles).forEach((file, index) => {
      // Validate file
      if (!file.type.startsWith('image/')) {
        errors.push(`${file.name}: Not an image file`)
        return
      }

      if (file.size > 10 * 1024 * 1024) {
        errors.push(`${file.name}: File size must be less than 10MB`)
        return
      }

      validFiles.push(file)
    })

    if (errors.length > 0) {
      setError(errors.join(', '))
      if (validFiles.length === 0) return
    } else {
      setError(null)
    }

    // Create previews
    const fileObjects = validFiles.map((file) => ({
      file,
      preview: null,
      result: null,
      loading: false,
    }))

    fileObjects.forEach((fileObj, index) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        fileObj.preview = reader.result
        if (index === fileObjects.length - 1) {
          setFiles([...files, ...fileObjects])
          setResults([])
        }
      }
      reader.readAsDataURL(fileObj.file)
    })

    if (fileObjects.length === 0) {
      setFiles([...files, ...fileObjects])
    }
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

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const handleChange = (e) => {
    e.preventDefault()
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files)
    }
  }

  const handleTestAll = async () => {
    if (files.length === 0) return

    setTesting(true)
    setError(null)
    const newResults = []

    for (let i = 0; i < files.length; i++) {
      try {
        const response = await trainingService.testRecognition(files[i].file)
        newResults.push({
          fileName: files[i].file.name,
          ...response,
        })
      } catch (err) {
        newResults.push({
          fileName: files[i].file.name,
          status: 'error',
          message: err.message || 'Failed to test recognition',
        })
      }
    }

    setResults(newResults)
    setTesting(false)
  }

  const handleClear = () => {
    setFiles([])
    setResults([])
    setError(null)
  }

  const removeFile = (index) => {
    const newFiles = files.filter((_, i) => i !== index)
    setFiles(newFiles)
    if (results.length > 0) {
      const newResults = results.filter((_, i) => i !== index)
      setResults(newResults)
    }
  }

  return (
    <div className="page-container">
      <h1>Test Recognition</h1>
      <p className="subtitle">
        Upload one or multiple images to test face recognition accuracy.
      </p>

      {/* Upload Section */}
      <div className="card" style={{ marginTop: '2rem' }}>
        <h3 style={{ marginTop: 0 }}>Upload Images</h3>

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
            multiple
            onChange={handleChange}
            style={{ display: 'none' }}
          />
          <label htmlFor="file-upload" style={{ cursor: 'pointer', display: 'block' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📸</div>
            <p style={{ margin: '0 0 0.5rem 0', fontWeight: 500 }}>
              Drop images here or click to browse
            </p>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>
              Supports JPG, PNG, GIF (max 10MB per file) - Multiple files supported
            </p>
          </label>
        </div>

        {error && <div className="alert alert-error" style={{ marginTop: '1rem' }}>{error}</div>}

        {files.length > 0 && (
          <div style={{ marginTop: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h4 style={{ margin: 0 }}>{files.length} image{files.length > 1 ? 's' : ''} selected</h4>
              <div className="button-group">
                <button
                  className="btn btn-primary"
                  onClick={handleTestAll}
                  disabled={testing || files.length === 0}
                >
                  {testing ? (
                    <>
                      <span className="spinner"></span>
                      Testing...
                    </>
                  ) : (
                    `🧪 Test All (${files.length})`
                  )}
                </button>
                <button
                  className="btn"
                  onClick={handleClear}
                  disabled={testing}
                  style={{ background: '#ef4444', color: 'white', border: 'none' }}
                >
                  Clear All
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' }}>
              {files.map((fileObj, index) => (
                <div key={index} style={{ position: 'relative', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
                  {fileObj.preview && (
                    <img
                      src={fileObj.preview}
                      alt={`Preview ${index + 1}`}
                      style={{
                        width: '100%',
                        height: '150px',
                        objectFit: 'cover',
                      }}
                    />
                  )}
                  <div style={{ padding: '0.5rem', fontSize: '0.75rem', wordBreak: 'break-all' }}>
                    {fileObj.file.name}
                  </div>
                  {!testing && (
                    <button
                      onClick={() => removeFile(index)}
                      style={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        background: 'rgba(239, 68, 68, 0.9)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '24px',
                        height: '24px',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        lineHeight: '1',
                        padding: 0
                      }}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Results Section */}
      {results.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <h2>Recognition Results</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem', marginTop: '1rem' }}>
            {results.map((result, index) => (
              <div key={index} className="card">
                <h4 style={{ marginTop: 0, fontSize: '0.875rem', color: '#6b7280', wordBreak: 'break-all' }}>
                  {result.fileName}
                </h4>
                {result.status === 'success' && result.person ? (
                  <div className="result-box" style={{ border: '2px solid #10b981' }}>
                    <h4 style={{ margin: '0 0 0.5rem 0', color: '#10b981' }}>
                      ✅ Recognized
                    </h4>
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                      {result.person}
                    </div>
                    {result.best_match?.confidence_metrics?.confidence_percentage && (
                      <div style={{ marginTop: '0.75rem' }}>
                        <div style={{ marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                          Confidence: {result.best_match.confidence_metrics.confidence_percentage.toFixed(2)}%
                        </div>
                        <div className="progress-bar" style={{ height: '6px' }}>
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
                    <p style={{ margin: 0, fontSize: '0.875rem' }}>
                      {result.message || 'No valid faces found in the image'}
                    </p>
                  </div>
                ) : (
                  <div className="result-box" style={{ border: '2px solid #6b7280' }}>
                    <h4 style={{ margin: '0 0 0.5rem 0', color: '#6b7280' }}>
                      ❓ Unknown Person
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.875rem' }}>
                      No matching person found
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

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
