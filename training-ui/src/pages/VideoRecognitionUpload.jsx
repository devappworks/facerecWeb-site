import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useVideoUpload } from '../hooks/useVideoUpload'
import { videoRecognitionService } from '../services/videoRecognition'
import HelpButton from '../components/HelpButton'
import Tooltip from '../components/Tooltip'

export default function VideoRecognitionUpload() {
  const navigate = useNavigate()
  const [selectedFile, setSelectedFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [domain, setDomain] = useState('serbia')
  const [intervalSeconds, setIntervalSeconds] = useState(3.0)
  const [dragActive, setDragActive] = useState(false)

  const { uploading, uploadProgress, error: uploadError, uploadAsync, clearError } = useVideoUpload()

  const handleFile = (file) => {
    if (!file) return

    const validation = videoRecognitionService.validateFile(file)
    if (!validation.valid) {
      alert(validation.errors.join('\n'))
      return
    }

    setSelectedFile(file)
    clearError()

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
      // Save to localStorage BEFORE navigating so results page sees it
      const stored = localStorage.getItem('videoRecognitionHistory')
      const history = stored ? JSON.parse(stored) : { completed: [], processing: [] }

      // Add to processing list
      const newVideo = {
        video_id: response.video_id,
        domain: domain,
        status: 'processing',
        addedAt: new Date().toISOString()
      }
      history.processing = [newVideo, ...history.processing]
      localStorage.setItem('videoRecognitionHistory', JSON.stringify(history))

      // Redirect to results page to see processing status
      navigate(`/video-recognition/results?video_id=${response.video_id}`)
    }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Upload Video for Recognition</h1>
        <HelpButton topic="video-upload" />
      </div>

      <div className="card">
        <h3>Upload Video File</h3>
        <p style={{ color: '#718096', marginBottom: '2rem' }}>
          Upload a video file to extract faces and perform recognition. The video will be processed frame by frame using the ArcFace model.
        </p>

        {/* File Upload Area */}
        {!selectedFile && (
          <div
            className={`upload-zone ${dragActive ? 'drag-active' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => document.getElementById('videoFileInput').click()}
          >
            <input
              id="videoFileInput"
              type="file"
              accept="video/*,.mp4,.avi,.mov,.mkv"
              onChange={handleFileInput}
              style={{ display: 'none' }}
            />
            <div className="upload-icon">🎬</div>
            <p className="upload-text">
              Drag and drop your video here, or click to browse
            </p>
            <p className="upload-hint">
              Supported formats: MP4, AVI, MOV, MKV (Max 100MB)
            </p>
          </div>
        )}

        {/* File Preview */}
        {selectedFile && preview && !uploading && (
          <div className="file-preview">
            <div className="file-info">
              <span className="file-icon">🎥</span>
              <div>
                <p className="file-name">{preview.name}</p>
                <p className="file-size">{preview.size}</p>
              </div>
            </div>
            <button onClick={() => setSelectedFile(null)} className="btn btn-secondary">
              Remove
            </button>
          </div>
        )}

        {/* Configuration */}
        {selectedFile && !uploading && (
          <div style={{ marginTop: '2rem' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                <Tooltip content="How many seconds between extracted frames. Lower = more frames = longer processing" position="right">
                  <span>Frame Extraction Interval</span>
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
                <Tooltip content="Select which face database to use for recognition" position="right">
                  <span>Recognition Domain</span>
                </Tooltip>
              </label>
              <select
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="input-field"
                style={{ width: '200px' }}
              >
                <option value="serbia">Serbia (ArcFace - Fast)</option>
                <option value="croatia">Croatia</option>
                <option value="bosnia">Bosnia</option>
              </select>
            </div>

            <Tooltip content="Upload video and start processing" position="top">
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

        {/* Error */}
        {uploadError && (
          <div className="error-message" style={{ marginTop: '1rem' }}>
            {uploadError}
          </div>
        )}
      </div>
    </div>
  )
}
