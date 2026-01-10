import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useVideoStatus } from '../hooks/useVideoStatus'
import { videoRecognitionService } from '../services/videoRecognition'
import HelpButton from '../components/HelpButton'
import Tooltip from '../components/Tooltip'
import VideoDetailsModal from '../components/VideoDetailsModal'

export default function VideoRecognitionResults() {
  const [searchParams] = useSearchParams()
  const videoIdFromUrl = searchParams.get('video_id')

  const [processingVideos, setProcessingVideos] = useState([])
  const [completedVideos, setCompletedVideos] = useState([])
  const [selectedVideo, setSelectedVideo] = useState(null)
  const [recheckingVideos, setRecheckingVideos] = useState(false)
  const [localStorageLoaded, setLocalStorageLoaded] = useState(false)

  // Poll the video from URL if present
  const { status: currentVideoStatus, isPolling } = useVideoStatus(
    videoIdFromUrl,
    3000,
    !!videoIdFromUrl
  )

  // Re-check status of all "processing" videos on page load
  const recheckProcessingVideos = useCallback(async (videos, currentCompleted = []) => {
    if (!videos || videos.length === 0) return

    setRecheckingVideos(true)
    const stillProcessing = []
    const newlyCompleted = []

    // Build a set of already completed video IDs to avoid duplicates
    const completedIds = new Set(currentCompleted.map(v => v.video_id))

    for (const video of videos) {
      // Skip if already in completed list
      if (completedIds.has(video.video_id)) {
        continue
      }

      try {
        const response = await videoRecognitionService.getStatus(video.video_id)
        if (response.success && response.status === 'completed') {
          // Video has completed - only add if not already present
          if (!completedIds.has(video.video_id)) {
            newlyCompleted.push({
              ...response,
              completedAt: response.processed_at || new Date().toISOString()
            })
            completedIds.add(video.video_id)
          }
        } else if (response.status === 'not_found') {
          // Video not found in backend - skip it (it was deleted or failed)
          console.warn(`Video ${video.video_id} not found, removing from processing list`)
          // Don't add to stillProcessing - effectively removes it from the list
        } else {
          // Still processing or error
          stillProcessing.push(video)
        }
      } catch (err) {
        console.error(`Failed to recheck video ${video.video_id}:`, err)
        stillProcessing.push(video)
      }
    }

    if (newlyCompleted.length > 0) {
      setCompletedVideos(prev => {
        const allVideos = [...newlyCompleted, ...prev]
        const seen = new Set()
        const deduplicated = allVideos.filter(v => {
          if (seen.has(v.video_id)) return false
          seen.add(v.video_id)
          return true
        })
        return deduplicated.slice(0, 20)
      })
    }
    setProcessingVideos(stillProcessing)
    setRecheckingVideos(false)
  }, [])

  // Load videos from backend on mount
  useEffect(() => {
    const loadVideosFromBackend = async () => {
      try {
        const response = await videoRecognitionService.getAllVideos()
        if (response.success && response.videos) {
          // Only store metadata - NOT full results (to avoid localStorage quota)
          const videoMetadata = response.videos
            .filter(v => v.results_available)
            .map(v => ({
              video_id: v.video_id,
              domain: v.domain || 'serbia',
              status: 'completed',
              completedAt: v.uploaded_at,
              fromBackend: true,
              // Include statistics and performance for table display
              statistics: v.statistics,
              performance: v.performance,
              // Don't load full results here - they'll be loaded on-demand when viewing
            }))

          setCompletedVideos(videoMetadata)
        }
      } catch (error) {
        console.error('Failed to load videos from backend:', error)
      }
    }

    loadVideosFromBackend()
  }, [])

  // Track videos in localStorage for persistence (processing videos only)
  useEffect(() => {
    // Load existing videos from localStorage
    const stored = localStorage.getItem('videoRecognitionHistory')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)

        // Get processing videos only - completed ones come from backend now
        const processing = parsed.processing || []

        setProcessingVideos(processing)

        // Re-check processing videos to see if any have completed
        if (processing.length > 0) {
          recheckProcessingVideos(processing, [])
        }
      } catch (e) {
        console.error('Failed to parse video history:', e)
      }
    }
    setLocalStorageLoaded(true)
  }, [recheckProcessingVideos])

  // Note: We no longer auto-add videos from URL to avoid duplicates on refresh
  // Videos are only added when:
  // 1. User uploads a new video (redirects to results with video_id)
  // 2. Video was already in localStorage
  // The useVideoStatus hook will still poll the video from URL for status updates

  // Update video status when polling completes
  // Only update if the video is already in our processing list (not just from URL)
  useEffect(() => {
    if (currentVideoStatus && currentVideoStatus.isComplete && currentVideoStatus.success) {
      // Only process if video is in our processing list
      const isTracked = processingVideos.find(v => v.video_id === currentVideoStatus.video_id)
      if (!isTracked) return

      // Move from processing to completed
      setProcessingVideos(prev => prev.filter(v => v.video_id !== currentVideoStatus.video_id))

      const completedVideo = {
        ...currentVideoStatus,
        completedAt: new Date().toISOString()
      }

      setCompletedVideos(prev => {
        const allVideos = [completedVideo, ...prev]
        const seen = new Set()
        const deduplicated = allVideos.filter(v => {
          if (seen.has(v.video_id)) return false
          seen.add(v.video_id)
          return true
        })
        return deduplicated.slice(0, 20) // Keep last 20
        // Note: localStorage save happens in the useEffect below, with metadata only
      })
    }
  }, [currentVideoStatus, processingVideos])

  // Save to localStorage whenever lists change (metadata only - not full results)
  useEffect(() => {
    try {
      // Only save metadata to avoid localStorage quota issues
      const metadataOnly = completedVideos.map(v => ({
        video_id: v.video_id,
        domain: v.domain,
        status: v.status,
        completedAt: v.completedAt,
        fromBackend: v.fromBackend
      }))

      localStorage.setItem('videoRecognitionHistory', JSON.stringify({
        completed: metadataOnly,
        processing: processingVideos
      }))
    } catch (e) {
      // If localStorage is still full, clear it and try again
      if (e.name === 'QuotaExceededError') {
        console.warn('localStorage quota exceeded, clearing old data')
        localStorage.removeItem('videoRecognitionHistory')
      }
    }
  }, [completedVideos, processingVideos])

  const getRecognitionRateColor = (rate) => {
    if (rate >= 70) return '#10b981'
    if (rate >= 40) return '#f59e0b'
    return '#ef4444'
  }

  const formatDate = (isoString) => {
    if (!isoString) return 'N/A'
    const date = new Date(isoString)
    return date.toLocaleString()
  }

  const handleRemoveCompleted = async (videoId) => {
    if (!confirm('Are you sure you want to delete this video? This will remove the video file, frames, and results permanently.')) {
      return
    }

    try {
      // Call backend to delete video
      const response = await videoRecognitionService.deleteVideo(videoId)

      if (response.success) {
        // Remove from UI on successful deletion
        setCompletedVideos(prev => prev.filter(v => v.video_id !== videoId))
      } else {
        alert(`Failed to delete video: ${response.message}`)
      }
    } catch (error) {
      console.error('Error deleting video:', error)
      alert('Failed to delete video. Please try again.')
    }
  }

  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear all completed videos from history?')) {
      setCompletedVideos([])
      localStorage.setItem('videoRecognitionHistory', JSON.stringify({
        completed: [],
        processing: processingVideos
      }))
    }
  }

  // Load full results for a video when viewing details
  const handleViewDetails = async (video) => {
    // If video already has full results loaded, just show it
    // Check both old format (flat) and new format (nested under face_recognition)
    const faceRec = video.face_recognition || {}
    if (video.results || video.multi_frame_voting || faceRec.frame_results || faceRec.tracking_results) {
      setSelectedVideo(video)
      return
    }

    // Otherwise, load full results from API
    try {
      const fullResults = await videoRecognitionService.getStatus(video.video_id)
      if (fullResults.success) {
        setSelectedVideo({
          ...video,
          ...fullResults
        })
      } else {
        alert('Failed to load video details. Please try again.')
      }
    } catch (error) {
      console.error('Error loading video details:', error)
      alert('Failed to load video details. Please try again.')
    }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Video Recognition Results</h1>
        <HelpButton topic="video-results" />
      </div>

      <p style={{ color: '#718096', marginBottom: '2rem' }}>
        View processing status and results for your video recognition tasks.
      </p>

      {/* Processing Videos Card */}
      {(processingVideos.length > 0 || (videoIdFromUrl && isPolling)) && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="spinner" style={{ width: '20px', height: '20px' }} />
            Currently Processing ({processingVideos.length || (videoIdFromUrl && isPolling ? 1 : 0)})
          </h3>

          <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Show current video from URL if polling */}
            {videoIdFromUrl && isPolling && !processingVideos.find(v => v.video_id === videoIdFromUrl) && (
              <div
                style={{
                  padding: '1.5rem',
                  backgroundColor: '#f7fafc',
                  borderRadius: '8px',
                  border: '2px solid #e2e8f0'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                  <div>
                    <p style={{ fontWeight: '500', margin: 0 }}>Video ID: {videoIdFromUrl}</p>
                    <p style={{ fontSize: '0.9rem', color: '#718096', margin: '0.25rem 0 0 0' }}>
                      Started: {formatDate(new Date().toISOString())}
                    </p>
                  </div>
                  <span
                    style={{
                      padding: '0.25rem 0.75rem',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      borderRadius: '12px',
                      fontSize: '0.85rem',
                      fontWeight: '500'
                    }}
                  >
                    Processing
                  </span>
                </div>

                {currentVideoStatus && currentVideoStatus.isProcessing && (
                  <div>
                    <p style={{ fontSize: '0.9rem', color: '#718096', margin: '0.5rem 0' }}>
                      🔄 Processing frames... This may take several minutes depending on video length.
                    </p>
                    <p style={{ fontSize: '0.85rem', color: '#718096', margin: 0 }}>
                      💡 You can leave this page and come back later. Processing continues in the background.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Show videos from processing list */}
            {processingVideos.map((video) => (
              <div
                key={video.video_id}
                style={{
                  padding: '1.5rem',
                  backgroundColor: '#f7fafc',
                  borderRadius: '8px',
                  border: '2px solid #e2e8f0'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                  <div>
                    <p style={{ fontWeight: '500', margin: 0 }}>Video ID: {video.video_id}</p>
                    <p style={{ fontSize: '0.9rem', color: '#718096', margin: '0.25rem 0 0 0' }}>
                      Started: {formatDate(video.addedAt)}
                    </p>
                  </div>
                  <span
                    style={{
                      padding: '0.25rem 0.75rem',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      borderRadius: '12px',
                      fontSize: '0.85rem',
                      fontWeight: '500'
                    }}
                  >
                    Processing
                  </span>
                </div>

                {video.video_id === videoIdFromUrl && currentVideoStatus && currentVideoStatus.isProcessing && (
                  <div>
                    <p style={{ fontSize: '0.9rem', color: '#718096', margin: '0.5rem 0' }}>
                      🔄 Processing frames... This may take several minutes depending on video length.
                    </p>
                    <p style={{ fontSize: '0.85rem', color: '#718096', margin: 0 }}>
                      💡 You can leave this page and come back later. Processing continues in the background.
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Button if no processing videos */}
      {processingVideos.length === 0 && (
        <div className="card" style={{ marginBottom: '2rem', textAlign: 'center', padding: '2rem' }}>
          <p style={{ color: '#718096', marginBottom: '1rem' }}>
            No videos currently processing
          </p>
          <Link to="/video-recognition/upload" className="btn btn-primary">
            Upload New Video
          </Link>
        </div>
      )}

      {/* Completed Videos Table */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0 }}>Completed Videos ({completedVideos.length})</h3>
          {completedVideos.length > 0 && (
            <button onClick={handleClearAll} className="btn btn-secondary" style={{ fontSize: '0.9rem' }}>
              Clear History
            </button>
          )}
        </div>

        {completedVideos.length === 0 ? (
          <p style={{ color: '#718096', textAlign: 'center', padding: '2rem 0' }}>
            No completed videos yet. Upload a video to get started.
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Video ID</th>
                  <th>Completed</th>
                  <th>Domain</th>
                  <th>Frames</th>
                  <th>Recognition Rate</th>
                  <th>Persons Found</th>
                  <th>Processing Time</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {completedVideos.map((video, index) => (
                  <tr key={`${video.video_id}-${index}`}>
                    <td>
                      <Tooltip content={video.video_id} position="top">
                        <code style={{ fontSize: '0.85rem' }}>
                          {video.video_id.substring(0, 12)}...
                        </code>
                      </Tooltip>
                    </td>
                    <td style={{ fontSize: '0.9rem' }}>{formatDate(video.completedAt)}</td>
                    <td>
                      <span
                        style={{
                          padding: '0.25rem 0.5rem',
                          backgroundColor: '#e2e8f0',
                          borderRadius: '4px',
                          fontSize: '0.85rem',
                          fontWeight: '500'
                        }}
                      >
                        {video.domain || 'N/A'}
                      </span>
                    </td>
                    <td>
                      <Tooltip content={`${video.statistics?.recognized_frames || 0} recognized out of ${video.statistics?.total_frames || 0} total`} position="top">
                        <span>{video.statistics?.total_frames || 0}</span>
                      </Tooltip>
                    </td>
                    <td>
                      <span
                        style={{
                          color: getRecognitionRateColor(video.statistics?.recognition_rate || 0),
                          fontWeight: '500'
                        }}
                      >
                        {video.statistics?.recognition_rate?.toFixed(1) || 0}%
                      </span>
                    </td>
                    <td>
                      <Tooltip
                        content={
                          video.statistics?.persons_list?.length > 0
                            ? video.statistics.persons_list.join(', ')
                            : 'No persons recognized'
                        }
                        position="top"
                      >
                        <span style={{ fontWeight: '500' }}>
                          {video.statistics?.unique_persons || 0}
                        </span>
                      </Tooltip>
                    </td>
                    <td>{video.performance?.processing_time_seconds?.toFixed(1) || 'N/A'}s</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <Tooltip content="View detailed results" position="top">
                          <button
                            onClick={() => handleViewDetails(video)}
                            className="btn btn-secondary"
                            style={{ fontSize: '0.85rem', padding: '0.25rem 0.75rem' }}
                          >
                            Details
                          </button>
                        </Tooltip>
                        <Tooltip content="Remove from history" position="top">
                          <button
                            onClick={() => handleRemoveCompleted(video.video_id)}
                            className="btn btn-secondary"
                            style={{ fontSize: '0.85rem', padding: '0.25rem 0.75rem' }}
                          >
                            Remove
                          </button>
                        </Tooltip>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Upload Another Video Button */}
      {completedVideos.length > 0 && (
        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <Link to="/video-recognition/upload" className="btn btn-primary">
            Upload Another Video
          </Link>
        </div>
      )}

      {/* Video Details Modal */}
      {selectedVideo && (
        <VideoDetailsModal
          video={selectedVideo}
          onClose={() => setSelectedVideo(null)}
        />
      )}
    </div>
  )
}
