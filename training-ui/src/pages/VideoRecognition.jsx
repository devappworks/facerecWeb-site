import { useState, useEffect } from 'react'
import { useVideoUpload } from '../hooks/useVideoUpload'
import { useVideoStatus } from '../hooks/useVideoStatus'
import { videoRecognitionService } from '../services/videoRecognition'
import HelpButton from '../components/HelpButton'
import Tooltip from '../components/Tooltip'

export default function VideoRecognition() {
  const [selectedFile, setSelectedFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [domain, setDomain] = useState('serbia')
  const [intervalSeconds, setIntervalSeconds] = useState(3.0)
  const [videoId, setVideoId] = useState(null)
  const [result, setResult] = useState(null)
  const [dragActive, setDragActive] = useState(false)
  const [apiInfo, setApiInfo] = useState(null)

  const { uploading, uploadProgress, error: uploadError, uploadAsync, clearError } = useVideoUpload()
  const { status, loading: statusLoading, error: statusError, isPolling, startPolling } = useVideoStatus(videoId, 3000, false)

  // Load API info on mount
  useEffect(() => {
    const loadApiInfo = async () => {
      const info = await videoRecognitionService.getInfo()
      if (info.success) {
        setApiInfo(info)
      }
    }
    loadApiInfo()
  }, [])

  // Handle status updates
  useEffect(() => {
    if (status && status.isComplete && status.success) {
      setResult(status)
      setVideoId(null)
    }
  }, [status])

  const handleFile = (file) => {
    if (!file) return

    // Validate file type
    const validation = videoRecognitionService.validateFile(file)
    if (!validation.valid) {
      alert(validation.errors.join('\n'))
      return
    }

    setSelectedFile(file)
    setResult(null)
    setVideoId(null)
    clearError()

    // Create preview (first frame as thumbnail would be ideal, but for now just show file info)
    setPreview({
      name: file.name,
      size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
      type: file.type,
    })
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

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    const response = await uploadAsync(selectedFile, domain, intervalSeconds)

    if (response.success && response.video_id) {
      setVideoId(response.video_id)
      // Start polling for status
      startPolling()
    }
  }

  const handleClear = () => {
    setSelectedFile(null)
    setPreview(null)
    setResult(null)
    setVideoId(null)
    clearError()
  }

  const getRecognitionRateColor = (rate) => {
    if (rate >= 70) return 'text-green-600'
    if (rate >= 40) return 'text-yellow-600'
    return 'text-red-600'
  }

  const isProcessing = uploading || isPolling || statusLoading

  return (
    <div className="page-container">
      <HelpButton pageName="video-recognition" />

      <h1>Video Face Recognition</h1>
      <p className="subtitle">
        Upload a video to extract frames and recognize faces automatically. The system extracts 1 frame every {intervalSeconds} seconds.
      </p>

      {/* Upload Section */}
      <div className="card" style={{ marginTop: '2rem' }}>
        <h3 style={{ marginTop: 0 }}>Upload Video</h3>

        <div
          className={`upload-zone ${dragActive ? 'drag-active' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          style={{
            border: '2px dashed #cbd5e0',
            borderRadius: '8px',
            padding: '3rem',
            textAlign: 'center',
            backgroundColor: dragActive ? '#f7fafc' : '#ffffff',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          <input
            type="file"
            accept="video/*"
            onChange={handleFileInput}
            style={{ display: 'none' }}
            id="video-file-input"
            disabled={isProcessing}
          />

          {!selectedFile ? (
            <>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎬</div>
              <label htmlFor="video-file-input" style={{ cursor: 'pointer' }}>
                <p>
                  <strong>Click to upload</strong> or drag and drop
                </p>
                <p style={{ fontSize: '0.9rem', color: '#718096', marginTop: '0.5rem' }}>
                  Supported formats: {apiInfo?.supported_formats?.join(', ').toUpperCase() || 'MP4, AVI, MOV, MKV, WebM, FLV, WMV'}
                </p>
                <p style={{ fontSize: '0.9rem', color: '#718096' }}>
                  Maximum file size: {apiInfo?.max_file_size_mb || 100} MB
                </p>
              </label>
            </>
          ) : (
            <div>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
              <p>
                <strong>{preview.name}</strong>
              </p>
              <p style={{ fontSize: '0.9rem', color: '#718096' }}>
                Size: {preview.size}
              </p>
              <button
                onClick={handleClear}
                className="btn btn-secondary"
                style={{ marginTop: '1rem' }}
                disabled={isProcessing}
              >
                Choose Different Video
              </button>
            </div>
          )}
        </div>

        {selectedFile && !isProcessing && (
          <div style={{ marginTop: '2rem' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                <Tooltip content="Number of seconds between each extracted frame. Lower values = more frames = longer processing time" position="right">
                  <span>Frame Extraction Interval (seconds)</span>
                </Tooltip>
              </label>
              <input
                type="number"
                value={intervalSeconds}
                onChange={(e) => setIntervalSeconds(parseFloat(e.target.value))}
                min="0.1"
                max="60"
                step="0.5"
                className="input-field"
                style={{ width: '150px', marginRight: '1rem' }}
              />
              <span style={{ fontSize: '0.9rem', color: '#718096' }}>
                1 frame every {intervalSeconds}s
              </span>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                <Tooltip content="Select which face database to use for recognition. Each domain has its own trained faces" position="right">
                  <span>Recognition Domain</span>
                </Tooltip>
              </label>
              <select
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="input-field"
                style={{ width: '200px' }}
              >
                <option value="serbia">Serbia</option>
                <option value="croatia">Croatia</option>
                <option value="bosnia">Bosnia</option>
              </select>
            </div>

            <Tooltip content="Upload video and start face recognition processing" position="top">
              <button onClick={handleUpload} className="btn btn-primary">
                Upload and Process Video
              </button>
            </Tooltip>
          </div>
        )}

        {/* Upload Progress */}
        {uploading && (
          <div style={{ marginTop: '2rem' }}>
            <div style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
              <span>Uploading...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-bar-fill"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Processing Status */}
        {isPolling && status && (
          <div style={{ marginTop: '2rem', padding: '1.5rem', backgroundColor: '#edf2f7', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
              <div className="spinner" style={{ marginRight: '1rem' }} />
              <div>
                <p style={{ fontWeight: '500', margin: 0 }}>Processing Video...</p>
                <p style={{ fontSize: '0.9rem', color: '#718096', margin: 0 }}>
                  This may take a few minutes. You can leave this page and come back later.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Errors */}
        {(uploadError || statusError) && (
          <div className="error-message" style={{ marginTop: '1rem' }}>
            {uploadError || statusError}
          </div>
        )}
      </div>

      {/* Results Section */}
      {result && result.success && (
        <>
          {/* Statistics Card */}
          <div className="card" style={{ marginTop: '2rem' }}>
            <h3>Recognition Statistics</h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
              <Tooltip content="Total number of frames extracted from the video" position="top">
                <div className="stat-card">
                  <p className="stat-label">Total Frames</p>
                  <p className="stat-value">{result.statistics.total_frames}</p>
                </div>
              </Tooltip>
              <Tooltip content="Number of frames where a face was successfully recognized" position="top">
                <div className="stat-card">
                  <p className="stat-label">Recognized</p>
                  <p className="stat-value" style={{ color: '#10b981' }}>
                    {result.statistics.recognized_frames}
                  </p>
                </div>
              </Tooltip>
              <Tooltip content="Percentage of frames with recognized faces. Green (≥70%) = Excellent, Yellow (40-69%) = Moderate, Red (<40%) = Poor" position="top">
                <div className="stat-card">
                  <p className="stat-label">Recognition Rate</p>
                  <p className={`stat-value ${getRecognitionRateColor(result.statistics.recognition_rate)}`}>
                    {result.statistics.recognition_rate.toFixed(1)}%
                  </p>
                </div>
              </Tooltip>
              <Tooltip content="Number of different people identified in the video" position="top">
                <div className="stat-card">
                  <p className="stat-label">Unique Persons</p>
                  <p className="stat-value">{result.statistics.unique_persons}</p>
                </div>
              </Tooltip>
            </div>

            {result.statistics.persons_list.length > 0 && (
              <div style={{ marginTop: '2rem' }}>
                <p style={{ fontWeight: '500', marginBottom: '0.5rem' }}>Detected Persons:</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {result.statistics.persons_list.map((person, index) => (
                    <span
                      key={index}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        borderRadius: '20px',
                        fontSize: '0.9rem',
                      }}
                    >
                      {person}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Performance Card */}
          <div className="card" style={{ marginTop: '2rem' }}>
            <h3>System Performance</h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
              <Tooltip content="Total time taken to process all frames" position="top">
                <div className="stat-card">
                  <p className="stat-label">Processing Time</p>
                  <p className="stat-value">{result.performance.processing_time_seconds.toFixed(1)}s</p>
                </div>
              </Tooltip>
              <Tooltip content="Number of frames processed per second by the recognition engine" position="top">
                <div className="stat-card">
                  <p className="stat-label">Frames Per Second</p>
                  <p className="stat-value">{result.performance.frames_per_second.toFixed(2)} FPS</p>
                </div>
              </Tooltip>
              <Tooltip content="Average CPU utilization during video processing" position="top">
                <div className="stat-card">
                  <p className="stat-label">Avg CPU Usage</p>
                  <p className="stat-value">{result.performance.avg_cpu_percent.toFixed(1)}%</p>
                </div>
              </Tooltip>
              <Tooltip content="Peak memory usage during video processing" position="top">
                <div className="stat-card">
                  <p className="stat-label">Memory Used</p>
                  <p className="stat-value">{result.performance.memory_used_mb.toFixed(1)} MB</p>
                </div>
              </Tooltip>
            </div>

            <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#f7fafc', borderRadius: '8px' }}>
              <p style={{ fontSize: '0.9rem', margin: 0 }}>
                <strong>Video Info:</strong> {result.extraction_info.video_info.width}x{result.extraction_info.video_info.height} @ {result.extraction_info.video_info.fps} FPS, {result.extraction_info.video_info.duration.toFixed(1)}s duration
              </p>
              <p style={{ fontSize: '0.9rem', margin: '0.5rem 0 0 0' }}>
                <strong>Extraction:</strong> {result.extraction_info.extracted_count} frames extracted from {result.extraction_info.total_frames} total in {result.extraction_info.extraction_time.toFixed(1)}s
              </p>
            </div>
          </div>

          {/* Frame Results */}
          <div className="card" style={{ marginTop: '2rem' }}>
            <h3>Frame-by-Frame Results ({result.results.length} frames)</h3>

            <div style={{ maxHeight: '500px', overflowY: 'auto', marginTop: '1.5rem' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Frame</th>
                    <th>Person</th>
                    <th>Confidence</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {result.results.map((frame, index) => (
                    <tr key={index}>
                      <td>{frame.timestamp.toFixed(2)}s</td>
                      <td>#{frame.frame_number}</td>
                      <td>{frame.recognized ? frame.person : <em>Unknown</em>}</td>
                      <td>{frame.recognized ? `${frame.confidence.toFixed(1)}%` : '-'}</td>
                      <td>
                        <span
                          className={`badge ${frame.recognized ? 'badge-success' : 'badge-secondary'}`}
                        >
                          {frame.recognized ? 'Recognized' : 'Unknown'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
