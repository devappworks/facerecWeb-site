import { useState, useEffect } from 'react'
import { storageService } from '../services/storageService'
import HelpButton from '../components/HelpButton'
import Tooltip from '../components/Tooltip'

export default function StorageManagement() {
  const [stats, setStats] = useState(null)
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [cleanupDays, setCleanupDays] = useState(30)
  const [cleaningUp, setCleaningUp] = useState(false)
  const [cleanupResult, setCleanupResult] = useState(null)

  useEffect(() => {
    fetchStorageData()
  }, [])

  const fetchStorageData = async () => {
    setLoading(true)
    setError(null)

    try {
      const statsData = await storageService.getStorageStats()

      if (statsData.success) {
        setStats(statsData)
        setVideos(statsData.videos || [])
      } else {
        setError(statsData.message || 'Failed to load storage data')
      }
    } catch (err) {
      setError(err.message || 'Failed to load storage data')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteVideo = async (videoId, filename) => {
    if (!confirm(`Are you sure you want to delete "${filename}"?\n\nThis will remove:\n- Video file\n- All extracted frames\n- Recognition results\n\nThis action cannot be undone.`)) {
      return
    }

    setDeleting(videoId)
    setError(null)

    try {
      const result = await storageService.deleteVideo(videoId)

      if (result.success) {
        // Refresh data after deletion
        await fetchStorageData()
        alert(`Successfully deleted video: ${filename}`)
      } else {
        setError(result.message || 'Failed to delete video')
      }
    } catch (err) {
      setError(err.message || 'Failed to delete video')
    } finally {
      setDeleting(null)
    }
  }

  const handleCleanup = async () => {
    if (!confirm(`Are you sure you want to delete all videos older than ${cleanupDays} days?\n\nThis action cannot be undone.`)) {
      return
    }

    setCleaningUp(true)
    setError(null)
    setCleanupResult(null)

    try {
      const result = await storageService.cleanupOldVideos(cleanupDays)

      if (result.success) {
        setCleanupResult(result)
        // Refresh data after cleanup
        await fetchStorageData()
      } else {
        setError(result.message || 'Cleanup failed')
      }
    } catch (err) {
      setError(err.message || 'Cleanup failed')
    } finally {
      setCleaningUp(false)
    }
  }

  const getStorageWarningLevel = () => {
    if (!stats || !stats.disk_usage) return 'normal'

    const totalMB = stats.disk_usage.total_mb

    if (totalMB > 5000) return 'critical' // > 5GB
    if (totalMB > 2000) return 'warning' // > 2GB
    return 'normal'
  }

  const warningLevel = getStorageWarningLevel()

  return (
    <div className="page-container">
      <HelpButton pageName="storage-management" />

      <h1>Storage Management</h1>
      <p className="subtitle">
        Manage video storage, monitor disk usage, and cleanup old files.
      </p>

      {error && (
        <div className="alert alert-error" style={{ marginTop: '1rem' }}>
          {error}
        </div>
      )}

      {/* Storage Statistics */}
      {loading ? (
        <div className="loading-state" style={{ marginTop: '3rem' }}>
          <span className="spinner" style={{ width: '2rem', height: '2rem' }}></span>
          <p>Loading storage data...</p>
        </div>
      ) : stats && (
        <>
          {/* Disk Usage Summary */}
          <div className="card" style={{ marginTop: '2rem' }}>
            <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Storage Overview
              {warningLevel === 'critical' && <span style={{ color: '#dc2626' }}>⚠️ Storage Full</span>}
              {warningLevel === 'warning' && <span style={{ color: '#f59e0b' }}>⚠️ High Usage</span>}
            </h3>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1.5rem',
              marginTop: '1.5rem'
            }}>
              <div style={{ padding: '1rem', background: '#f7fafc', borderRadius: '8px' }}>
                <p style={{ fontSize: '0.875rem', color: '#718096', margin: '0 0 0.5rem 0' }}>Total Videos</p>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2d3748', margin: 0 }}>
                  {stats.total_videos}
                </p>
              </div>

              <div style={{ padding: '1rem', background: '#f7fafc', borderRadius: '8px' }}>
                <p style={{ fontSize: '0.875rem', color: '#718096', margin: '0 0 0.5rem 0' }}>Total Size</p>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2d3748', margin: 0 }}>
                  {storageService.formatSize(stats.total_size_mb)}
                </p>
              </div>

              <div style={{ padding: '1rem', background: '#f7fafc', borderRadius: '8px' }}>
                <p style={{ fontSize: '0.875rem', color: '#718096', margin: '0 0 0.5rem 0' }}>Video Files</p>
                <p style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#3b82f6', margin: 0 }}>
                  {storageService.formatSize(stats.disk_usage.videos_mb)}
                </p>
              </div>

              <div style={{ padding: '1rem', background: '#f7fafc', borderRadius: '8px' }}>
                <p style={{ fontSize: '0.875rem', color: '#718096', margin: '0 0 0.5rem 0' }}>Extracted Frames</p>
                <p style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#10b981', margin: 0 }}>
                  {storageService.formatSize(stats.disk_usage.frames_mb)}
                </p>
              </div>

              <div style={{ padding: '1rem', background: '#f7fafc', borderRadius: '8px' }}>
                <p style={{ fontSize: '0.875rem', color: '#718096', margin: '0 0 0.5rem 0' }}>Results Data</p>
                <p style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#8b5cf6', margin: 0 }}>
                  {storageService.formatSize(stats.disk_usage.results_mb)}
                </p>
              </div>
            </div>
          </div>

          {/* Cleanup Settings */}
          <div className="card" style={{ marginTop: '2rem' }}>
            <h3 style={{ marginTop: 0 }}>Cleanup Old Videos</h3>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Delete videos older than:
                </label>
                <select
                  value={cleanupDays}
                  onChange={(e) => setCleanupDays(parseInt(e.target.value))}
                  className="input-field"
                  style={{ width: '200px' }}
                  disabled={cleaningUp}
                >
                  <option value={7}>7 days</option>
                  <option value={14}>14 days</option>
                  <option value={30}>30 days</option>
                  <option value={60}>60 days</option>
                  <option value={90}>90 days</option>
                </select>
              </div>

              <Tooltip content="Delete all videos older than the selected number of days. This action cannot be undone." position="top">
                <button
                  onClick={handleCleanup}
                  disabled={cleaningUp}
                  className="btn btn-primary"
                  style={{ background: '#dc2626', borderColor: '#dc2626' }}
                >
                  {cleaningUp ? (
                    <>
                      <span className="spinner" style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }}></span>
                      Cleaning up...
                    </>
                  ) : (
                    <>🗑️ Cleanup Old Videos</>
                  )}
                </button>
              </Tooltip>
            </div>

            {cleanupResult && (
              <div style={{
                marginTop: '1.5rem',
                padding: '1rem',
                background: '#f0fdf4',
                border: '1px solid #86efac',
                borderRadius: '8px'
              }}>
                <p style={{ fontWeight: '500', margin: '0 0 0.5rem 0', color: '#166534' }}>
                  ✅ Cleanup Complete
                </p>
                <p style={{ margin: '0 0 0.5rem 0', color: '#166534' }}>
                  Deleted {cleanupResult.videos_deleted} video(s) older than {cleanupResult.days_threshold} days
                </p>
                <p style={{ margin: 0, color: '#166534' }}>
                  Freed {storageService.formatSize(cleanupResult.size_freed_mb)} of disk space
                </p>
              </div>
            )}
          </div>

          {/* Videos List */}
          <div className="card" style={{ marginTop: '2rem' }}>
            <h3 style={{ marginTop: 0 }}>
              Stored Videos ({videos.length})
            </h3>

            {videos.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#718096' }}>
                <p style={{ fontSize: '3rem', margin: '0 0 1rem 0' }}>📹</p>
                <p style={{ fontSize: '1.125rem', fontWeight: '500', margin: 0 }}>No videos stored</p>
                <p style={{ fontSize: '0.875rem', margin: '0.5rem 0 0 0' }}>
                  Upload videos from the Video Recognition page
                </p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="table" style={{ width: '100%', marginTop: '1rem' }}>
                  <thead>
                    <tr>
                      <th>Filename</th>
                      <th>Upload Date</th>
                      <th>Size</th>
                      <th>Duration</th>
                      <th>Frames</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {videos.map((video) => (
                      <tr key={video.video_id}>
                        <td>
                          <Tooltip content={video.video_id} position="top">
                            <span style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                              {video.filename}
                            </span>
                          </Tooltip>
                        </td>
                        <td style={{ fontSize: '0.875rem' }}>
                          {storageService.formatDate(video.uploaded_at)}
                        </td>
                        <td style={{ fontSize: '0.875rem' }}>
                          {storageService.formatSize(video.size_mb)}
                        </td>
                        <td style={{ fontSize: '0.875rem' }}>
                          {storageService.formatDuration(video.duration_seconds)}
                        </td>
                        <td style={{ fontSize: '0.875rem', textAlign: 'center' }}>
                          {video.frames_extracted || 0}
                        </td>
                        <td>
                          {video.results_available ? (
                            <span className="badge badge-success">Processed</span>
                          ) : (
                            <span className="badge badge-secondary">Pending</span>
                          )}
                        </td>
                        <td>
                          <button
                            onClick={() => handleDeleteVideo(video.video_id, video.filename)}
                            disabled={deleting === video.video_id}
                            className="btn btn-secondary"
                            style={{
                              padding: '0.25rem 0.75rem',
                              fontSize: '0.875rem',
                              background: '#dc2626',
                              borderColor: '#dc2626',
                              color: 'white'
                            }}
                          >
                            {deleting === video.video_id ? (
                              <>
                                <span className="spinner" style={{ width: '0.75rem', height: '0.75rem' }}></span>
                                Deleting...
                              </>
                            ) : (
                              '🗑️ Delete'
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Info Box */}
          <div className="info-box" style={{ marginTop: '2rem' }}>
            <h4>ℹ️ Storage Management</h4>
            <ul style={{ marginTop: '1rem', paddingLeft: '1.5rem' }}>
              <li><strong>Video Files:</strong> Original uploaded video files</li>
              <li><strong>Extracted Frames:</strong> JPEG images extracted from videos for recognition</li>
              <li><strong>Results Data:</strong> JSON files containing recognition results</li>
              <li><strong>Delete:</strong> Removes video, all frames, and results (cannot be undone)</li>
              <li><strong>Cleanup:</strong> Automatically deletes videos older than specified days</li>
              <li><strong>Storage Warning:</strong> System shows warnings when storage exceeds 2GB</li>
            </ul>
          </div>
        </>
      )}
    </div>
  )
}
