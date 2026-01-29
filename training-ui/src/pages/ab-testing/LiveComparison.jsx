import { useState } from 'react'
import { useComparison } from '../../hooks/useComparison'
import HelpButton from '../../components/HelpButton'

export default function LiveComparison() {
  const { runComparison, clearResult, testing, result, error } = useComparison()

  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [groundTruth, setGroundTruth] = useState('')
  const [imageId, setImageId] = useState('')
  const [dragActive, setDragActive] = useState(false)

  const handleFile = (selectedFile) => {
    if (!selectedFile) return

    if (!selectedFile.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB')
      return
    }

    setFile(selectedFile)

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

  const handleRunComparison = async () => {
    if (!file) {
      alert('Please select an image first')
      return
    }

    await runComparison(file, {
      groundTruth: groundTruth.trim() || undefined,
      imageId: imageId.trim() || file.name,
    })
  }

  const handleClear = () => {
    setFile(null)
    setPreview(null)
    setGroundTruth('')
    setImageId('')
    clearResult()
  }

  const getStatusIcon = (status) => {
    return status === 'success' ? '✓' : status === 'no_faces' ? '⚠' : '✗'
  }

  const getStatusColor = (status) => {
    return status === 'success' ? '#10b981' : status === 'no_faces' ? '#f59e0b' : '#ef4444'
  }

  return (
    <div className="page-container">
      <HelpButton pageName="ab-testing-live" />
      <h1>A/B Testing - Live Comparison</h1>
      <p className="subtitle">
        Upload an image to compare both face recognition systems side-by-side.
      </p>

      {/* Upload Section */}
      <div className="card" style={{ marginTop: '2rem' }}>
        <h3 style={{ marginTop: 0 }}>Upload Test Image</h3>

        <div
          className={`upload-zone ${dragActive ? 'drag-active' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          style={{
            border: `2px dashed ${dragActive ? '#f5a623' : '#d1d5db'}`,
            borderRadius: '12px',
            padding: '2rem',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            background: dragActive ? 'rgba(245, 166, 35, 0.05)' : '#242424'
          }}
        >
          <input
            type="file"
            id="file-upload-ab"
            accept="image/*"
            onChange={handleChange}
            style={{ display: 'none' }}
          />
          <label htmlFor="file-upload-ab" style={{ cursor: 'pointer', display: 'block' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📸</div>
            <p style={{ margin: '0 0 0.5rem 0', fontWeight: 500 }}>
              Drop image here or click to browse
            </p>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#999' }}>
              Supports JPG, PNG, GIF (max 10MB)
            </p>
          </label>
        </div>

        {preview && (
          <div style={{ marginTop: '1.5rem' }}>
            <img
              src={preview}
              alt="Preview"
              style={{
                width: '100%',
                maxWidth: '400px',
                maxHeight: '300px',
                objectFit: 'contain',
                borderRadius: '8px',
                border: '1px solid #3a3a3a',
                display: 'block',
                margin: '0 auto'
              }}
            />
          </div>
        )}

        <div style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
          <div className="form-group">
            <label htmlFor="ground-truth">Ground Truth (Optional)</label>
            <input
              id="ground-truth"
              type="text"
              className="form-input"
              placeholder="e.g., John Doe"
              value={groundTruth}
              onChange={(e) => setGroundTruth(e.target.value)}
            />
            <small style={{ color: '#999', display: 'block', marginTop: '0.25rem' }}>
              Actual person name to check accuracy
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="image-id">Image ID (Optional)</label>
            <input
              id="image-id"
              type="text"
              className="form-input"
              placeholder="e.g., test_001.jpg"
              value={imageId}
              onChange={(e) => setImageId(e.target.value)}
            />
            <small style={{ color: '#999', display: 'block', marginTop: '0.25rem' }}>
              Custom identifier for this test
            </small>
          </div>
        </div>

        <div className="button-group" style={{ marginTop: '1.5rem' }}>
          <button
            className="btn btn-primary"
            onClick={handleRunComparison}
            disabled={testing || !file}
          >
            {testing ? (
              <>
                <span className="spinner"></span>
                Running Comparison...
              </>
            ) : (
              '🧪 Run Comparison Test'
            )}
          </button>
          <button
            className="btn"
            onClick={handleClear}
            disabled={testing}
            style={{ background: '#999', color: 'white', border: 'none' }}
          >
            Clear
          </button>
        </div>

        {error && <div className="alert alert-error" style={{ marginTop: '1rem' }}>{error}</div>}
      </div>

      {/* Results Section - Part 1 */}
      {result && (
        <>
          <h2 style={{ marginTop: '3rem' }}>Results</h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem', marginTop: '1.5rem' }}>
            {/* Pipeline A */}
            <div className="card" style={{ borderLeft: '4px solid #1976d2' }}>
              <h3 style={{ marginTop: 0, color: '#1976d2' }}>Pipeline A - Current System</h3>

              <div style={{ marginBottom: '1rem', padding: '0.75rem', background: '#333', borderRadius: '6px' }}>
                <div style={{ fontSize: '0.875rem', color: '#999' }}>
                  <div>Model: {result.pipeline_a_result.profile_used.model}</div>
                  <div>Threshold: {result.pipeline_a_result.profile_used.threshold}</div>
                  <div>Detection Confidence: {(result.pipeline_a_result.profile_used.detection_confidence * 100).toFixed(1)}%</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', padding: '0.75rem', background: getStatusColor(result.pipeline_a_result.status) + '20', borderRadius: '6px' }}>
                <span style={{ fontSize: '1.5rem', color: getStatusColor(result.pipeline_a_result.status) }}>
                  {getStatusIcon(result.pipeline_a_result.status)}
                </span>
                <div>
                  <div style={{ fontWeight: 600 }}>Status: {result.pipeline_a_result.status}</div>
                </div>
              </div>

              {result.pipeline_a_result.status === 'success' && (
                <>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                    {result.pipeline_a_result.person}
                  </div>
                  <div style={{ fontSize: '1.25rem', color: '#f5a623', marginBottom: '1rem' }}>
                    Confidence: {result.pipeline_a_result.confidence}%
                  </div>
                  <div className="progress-bar" style={{ height: '8px', marginBottom: '1rem' }}>
                    <div
                      className="progress-fill"
                      style={{
                        width: `${result.pipeline_a_result.confidence}%`,
                        backgroundColor: '#1976d2'
                      }}
                    ></div>
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#999' }}>
                    Processing Time: {result.pipeline_a_result.processing_time.toFixed(2)}s
                  </div>
                </>
              )}

              {result.pipeline_a_result.status !== 'success' && (
                <div style={{ color: '#999', fontStyle: 'italic' }}>
                  {result.pipeline_a_result.status === 'no_faces'
                    ? 'No face detected in image'
                    : result.pipeline_a_result.status === 'error'
                      ? `No match found (threshold: ${result.pipeline_a_result.profile_used.threshold})`
                      : 'Recognition failed'}
                  {result.pipeline_a_result.processing_time && (
                    <div style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                      Processing Time: {result.pipeline_a_result.processing_time.toFixed(2)}s
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Pipeline B */}
            <div className="card" style={{ borderLeft: '4px solid #2e7d32' }}>
              <h3 style={{ marginTop: 0, color: '#2e7d32' }}>Pipeline B - Improved System</h3>

              <div style={{ marginBottom: '1rem', padding: '0.75rem', background: '#333', borderRadius: '6px' }}>
                <div style={{ fontSize: '0.875rem', color: '#999' }}>
                  <div>Model: {result.pipeline_b_result.profile_used.model}</div>
                  <div>Threshold: {result.pipeline_b_result.profile_used.threshold}</div>
                  <div>Detection Confidence: {(result.pipeline_b_result.profile_used.detection_confidence * 100).toFixed(1)}%</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', padding: '0.75rem', background: getStatusColor(result.pipeline_b_result.status) + '20', borderRadius: '6px' }}>
                <span style={{ fontSize: '1.5rem', color: getStatusColor(result.pipeline_b_result.status) }}>
                  {getStatusIcon(result.pipeline_b_result.status)}
                </span>
                <div>
                  <div style={{ fontWeight: 600 }}>Status: {result.pipeline_b_result.status}</div>
                </div>
              </div>

              {result.pipeline_b_result.status === 'success' && (
                <>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                    {result.pipeline_b_result.person}
                  </div>
                  <div style={{ fontSize: '1.25rem', color: '#10b981', marginBottom: '1rem' }}>
                    Confidence: {result.pipeline_b_result.confidence}%
                  </div>
                  <div className="progress-bar" style={{ height: '8px', marginBottom: '1rem' }}>
                    <div
                      className="progress-fill"
                      style={{
                        width: `${result.pipeline_b_result.confidence}%`,
                        backgroundColor: '#2e7d32'
                      }}
                    ></div>
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#999' }}>
                    Processing Time: {result.pipeline_b_result.processing_time.toFixed(2)}s
                  </div>
                </>
              )}

              {result.pipeline_b_result.status !== 'success' && (
                <div style={{ color: '#999', fontStyle: 'italic' }}>
                  {result.pipeline_b_result.status === 'no_faces'
                    ? 'No face detected in image'
                    : result.pipeline_b_result.status === 'error'
                      ? `No match found (threshold: ${result.pipeline_b_result.profile_used.threshold})`
                      : 'Recognition failed'}
                  {result.pipeline_b_result.processing_time && (
                    <div style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                      Processing Time: {result.pipeline_b_result.processing_time.toFixed(2)}s
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Analysis Panel */}
          <div className="card" style={{ marginTop: '2rem', background: 'rgba(245, 166, 35, 0.05)', border: '1px solid #f5a623' }}>
            <h3 style={{ marginTop: 0, color: '#f5a623' }}>📊 Analysis</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {result.comparison.comparison_metrics.both_succeeded && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {result.comparison.comparison_metrics.results_match ? (
                      <>
                        <span style={{ fontSize: '1.5rem' }}>✓</span>
                        <div>
                          <strong>Both systems agree on: {result.pipeline_a_result.person}</strong>
                        </div>
                      </>
                    ) : (
                      <>
                        <span style={{ fontSize: '1.5rem', color: '#f59e0b' }}>⚠</span>
                        <div>
                          <strong>Systems disagree:</strong> Pipeline A says "{result.pipeline_a_result.person}", Pipeline B says "{result.pipeline_b_result.person}"
                        </div>
                      </>
                    )}
                  </div>

                  {result.comparison.comparison_metrics.confidence_difference !== null && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1.5rem' }}>📈</span>
                      <div>
                        Pipeline B has <strong>{result.comparison.comparison_metrics.confidence_difference > 0 ? '+' : ''}{result.comparison.comparison_metrics.confidence_difference.toFixed(1)}%</strong> {result.comparison.comparison_metrics.confidence_difference > 0 ? 'higher' : 'lower'} confidence
                      </div>
                    </div>
                  )}

                  {result.comparison.comparison_metrics.processing_time_difference !== null && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1.5rem' }}>⏱️</span>
                      <div>
                        Pipeline {result.comparison.comparison_metrics.faster_pipeline === 'pipeline_a' ? 'A' : 'B'} is faster by <strong>{Math.abs(result.comparison.comparison_metrics.processing_time_difference).toFixed(2)}s</strong>
                      </div>
                    </div>
                  )}

                  {result.comparison.comparison_metrics.accuracy && (
                    <div style={{ marginTop: '0.5rem', padding: '1rem', background: '#ffffff', borderRadius: '6px' }}>
                      <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Accuracy vs Ground Truth "{result.ground_truth}":</div>
                      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        <div style={{ padding: '0.5rem 1rem', borderRadius: '6px', background: result.comparison.comparison_metrics.accuracy.pipeline_a_correct ? '#d1fae5' : '#fee2e2', color: result.comparison.comparison_metrics.accuracy.pipeline_a_correct ? '#065f46' : '#991b1b' }}>
                          Pipeline A: {result.comparison.comparison_metrics.accuracy.pipeline_a_correct ? '✓ Correct' : '✗ Wrong'}
                        </div>
                        <div style={{ padding: '0.5rem 1rem', borderRadius: '6px', background: result.comparison.comparison_metrics.accuracy.pipeline_b_correct ? '#d1fae5' : '#fee2e2', color: result.comparison.comparison_metrics.accuracy.pipeline_b_correct ? '#065f46' : '#991b1b' }}>
                          Pipeline B: {result.comparison.comparison_metrics.accuracy.pipeline_b_correct ? '✓ Correct' : '✗ Wrong'}
                        </div>
                      </div>
                      <div style={{ marginTop: '0.5rem', fontWeight: 600 }}>
                        Winner: <span style={{ color: '#f5a623' }}>{result.comparison.comparison_metrics.accuracy.winner.toUpperCase()}</span>
                      </div>
                    </div>
                  )}
                </>
              )}

              {result.comparison.comparison_metrics.only_b_succeeded && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.5rem', color: '#10b981' }}>✓</span>
                  <div>
                    <strong>Only Pipeline B succeeded:</strong> Found {result.pipeline_b_result.person}
                  </div>
                </div>
              )}

              {result.comparison.comparison_metrics.only_a_succeeded && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.5rem', color: '#f59e0b' }}>⚠</span>
                  <div>
                    <strong>Only Pipeline A succeeded:</strong> Found {result.pipeline_a_result.person}
                  </div>
                </div>
              )}

              {result.comparison.comparison_metrics.both_failed && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.5rem', color: '#ef4444' }}>✗</span>
                  <div>
                    <strong>Both pipelines failed</strong> to recognize a face in this image
                  </div>
                </div>
              )}

              <div style={{ marginTop: '1rem', padding: '1rem', background: '#ffffff', borderRadius: '6px', borderLeft: '4px solid #f5a623' }}>
                <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Recommendation:</div>
                <div>{result.recommendation}</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
