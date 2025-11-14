import api from './api'

/**
 * Video Recognition Service
 * Handles video upload, processing, and status checking for face recognition
 */

const USE_MOCK_DATA = true // Set to false when backend is ready

// Mock data for development
const mockVideoInfo = {
  success: true,
  supported_formats: ['mp4', 'avi', 'mov', 'mkv', 'webm', 'flv', 'wmv'],
  max_file_size_mb: 100,
  default_interval_seconds: 3.0,
  min_interval_seconds: 0.1,
  max_interval_seconds: 60.0,
  endpoints: {
    upload: '/api/video/upload',
    upload_async: '/api/video/upload-async',
    status: '/api/video/status/{video_id}',
    info: '/api/video/info',
  },
}

const generateMockVideoId = () => {
  return Math.random().toString(36).substring(2, 15)
}

const mockProcessingResults = {
  success: true,
  video_id: 'mock-video-123',
  domain: 'serbia',
  processed_at: new Date().toISOString(),
  extraction_info: {
    total_frames: 900,
    extracted_count: 30,
    extraction_time: 5.2,
    video_info: {
      fps: 30.0,
      duration: 30.5,
      width: 1920,
      height: 1080,
    },
  },
  statistics: {
    total_frames: 30,
    recognized_frames: 18,
    failed_frames: 0,
    recognition_rate: 60.0,
    unique_persons: 3,
    persons_list: ['Novak Djokovic', 'Ana Ivanovic', 'Emir Kusturica'],
  },
  performance: {
    processing_time_seconds: 45.3,
    frames_per_second: 0.66,
    avg_cpu_percent: 78.5,
    memory_used_mb: 1250.4,
    final_memory_mb: 2100.8,
  },
  results: [
    {
      frame_number: 0,
      timestamp: 0.0,
      filename: 'frame_000000_t0.00s.jpg',
      recognized: true,
      person: 'Novak Djokovic',
      confidence: 99.2,
    },
    {
      frame_number: 90,
      timestamp: 3.0,
      filename: 'frame_000090_t3.00s.jpg',
      recognized: true,
      person: 'Ana Ivanovic',
      confidence: 98.5,
    },
    {
      frame_number: 180,
      timestamp: 6.0,
      filename: 'frame_000180_t6.00s.jpg',
      recognized: true,
      person: 'Emir Kusturica',
      confidence: 97.8,
    },
    {
      frame_number: 270,
      timestamp: 9.0,
      filename: 'frame_000270_t9.00s.jpg',
      recognized: true,
      person: 'Novak Djokovic',
      confidence: 98.9,
    },
    {
      frame_number: 360,
      timestamp: 12.0,
      filename: 'frame_000360_t12.00s.jpg',
      recognized: false,
      person: null,
      confidence: null,
    },
    {
      frame_number: 450,
      timestamp: 15.0,
      filename: 'frame_000450_t15.00s.jpg',
      recognized: true,
      person: 'Ana Ivanovic',
      confidence: 99.1,
    },
  ],
}

export const videoRecognitionService = {
  /**
   * Get API information (supported formats, limits, endpoints)
   */
  async getInfo() {
    if (USE_MOCK_DATA) {
      return mockVideoInfo
    }

    try {
      const response = await api.get('/api/video/info')
      return response.data
    } catch (error) {
      console.error('Failed to get video API info:', error)
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get API info',
      }
    }
  },

  /**
   * Upload video synchronously (wait for complete results)
   * Use for short videos (< 1 minute)
   */
  async uploadSync(file, domain = 'serbia', intervalSeconds = 3.0) {
    if (USE_MOCK_DATA) {
      // Simulate processing delay
      await new Promise((resolve) => setTimeout(resolve, 2000))
      return {
        ...mockProcessingResults,
        video_id: generateMockVideoId(),
        domain,
      }
    }

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('domain', domain)
      formData.append('interval_seconds', intervalSeconds)

      const response = await api.post('/api/video/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      return response.data
    } catch (error) {
      console.error('Failed to upload video:', error)
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to upload video',
      }
    }
  },

  /**
   * Upload video asynchronously (returns immediately with video_id)
   * Use for long videos (> 1 minute)
   */
  async uploadAsync(file, domain = 'serbia', intervalSeconds = 3.0) {
    if (USE_MOCK_DATA) {
      // Simulate upload delay
      await new Promise((resolve) => setTimeout(resolve, 500))
      const videoId = generateMockVideoId()
      return {
        success: true,
        message: 'Video uploaded successfully. Processing in background.',
        video_id: videoId,
        status_endpoint: `/api/video/status/${videoId}`,
      }
    }

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('domain', domain)
      formData.append('interval_seconds', intervalSeconds)

      const response = await api.post('/api/video/upload-async', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      return response.data
    } catch (error) {
      console.error('Failed to upload video:', error)
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to upload video',
      }
    }
  },

  /**
   * Get video processing status
   * Returns processing status or complete results
   */
  async getStatus(videoId) {
    if (USE_MOCK_DATA) {
      // Simulate random processing state
      const isProcessing = Math.random() > 0.7 // 30% chance still processing

      if (isProcessing) {
        return {
          success: false,
          video_id: videoId,
          status: 'processing',
          message: 'Video is still being processed',
        }
      }

      // Return completed results
      return {
        ...mockProcessingResults,
        video_id: videoId,
        status: 'completed',
      }
    }

    try {
      const response = await api.get(`/api/video/status/${videoId}`)

      if (response.status === 202) {
        // Still processing
        return {
          success: false,
          video_id: videoId,
          status: 'processing',
          message: 'Video is still being processed',
        }
      }

      return response.data
    } catch (error) {
      if (error.response?.status === 404) {
        return {
          success: false,
          video_id: videoId,
          status: 'not_found',
          message: 'Video not found',
        }
      }

      console.error('Failed to get video status:', error)
      return {
        success: false,
        video_id: videoId,
        status: 'error',
        message: error.response?.data?.message || 'Failed to get video status',
      }
    }
  },

  /**
   * Validate video file before upload
   */
  validateFile(file) {
    const errors = []

    // Check if file exists
    if (!file) {
      errors.push('No file selected')
      return { valid: false, errors }
    }

    // Check file size (max 100MB)
    const maxSizeMB = 100
    const fileSizeMB = file.size / (1024 * 1024)
    if (fileSizeMB > maxSizeMB) {
      errors.push(`File too large. Maximum size: ${maxSizeMB} MB (current: ${fileSizeMB.toFixed(2)} MB)`)
    }

    // Check file format
    const allowedFormats = ['mp4', 'avi', 'mov', 'mkv', 'webm', 'flv', 'wmv']
    const extension = file.name.split('.').pop().toLowerCase()
    if (!allowedFormats.includes(extension)) {
      errors.push(`Invalid format. Allowed: ${allowedFormats.join(', ')}`)
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  },

  /**
   * Validate interval seconds
   */
  validateInterval(intervalSeconds) {
    const min = 0.1
    const max = 60.0

    if (intervalSeconds < min || intervalSeconds > max) {
      return {
        valid: false,
        error: `Interval must be between ${min} and ${max} seconds`,
      }
    }

    return { valid: true }
  },
}
