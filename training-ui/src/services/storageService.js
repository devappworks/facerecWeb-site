import api from './api'

/**
 * Storage Management Service
 * Handles video storage management and cleanup operations
 */

export const storageService = {
  /**
   * Get storage statistics (disk usage, video list)
   */
  async getStorageStats() {
    try {
      const response = await api.get('/api/storage/stats')
      return response.data
    } catch (error) {
      console.error('Failed to get storage stats:', error)
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get storage stats',
      }
    }
  },

  /**
   * Get list of all stored videos
   */
  async getVideos() {
    try {
      const response = await api.get('/api/storage/videos')
      return response.data
    } catch (error) {
      console.error('Failed to get videos list:', error)
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get videos list',
      }
    }
  },

  /**
   * Delete a specific video and its associated files
   * @param {string} videoId - Video identifier
   */
  async deleteVideo(videoId) {
    try {
      const response = await api.delete(`/api/storage/videos/${videoId}`)
      return response.data
    } catch (error) {
      console.error(`Failed to delete video ${videoId}:`, error)
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to delete video',
      }
    }
  },

  /**
   * Cleanup videos older than specified days
   * @param {number} days - Delete videos older than this many days
   */
  async cleanupOldVideos(days) {
    try {
      const response = await api.post('/api/storage/cleanup', { days })
      return response.data
    } catch (error) {
      console.error(`Failed to cleanup videos:`, error)
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to cleanup videos',
      }
    }
  },

  /**
   * Format bytes to human-readable size
   * @param {number} mb - Size in megabytes
   */
  formatSize(mb) {
    if (mb < 1) {
      return `${(mb * 1024).toFixed(2)} KB`
    } else if (mb < 1024) {
      return `${mb.toFixed(2)} MB`
    } else {
      return `${(mb / 1024).toFixed(2)} GB`
    }
  },

  /**
   * Format duration in seconds to human-readable format
   * @param {number} seconds - Duration in seconds
   */
  formatDuration(seconds) {
    if (!seconds) return 'N/A'

    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)

    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
    } else {
      return `${minutes}:${String(secs).padStart(2, '0')}`
    }
  },

  /**
   * Format date to local string
   * @param {string} isoDate - ISO date string
   */
  formatDate(isoDate) {
    if (!isoDate) return 'N/A'

    try {
      const date = new Date(isoDate)
      return date.toLocaleString()
    } catch (error) {
      return isoDate
    }
  },
}
