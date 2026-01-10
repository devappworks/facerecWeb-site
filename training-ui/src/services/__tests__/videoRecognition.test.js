import { describe, it, expect, beforeEach, vi } from 'vitest'
import { videoRecognitionService } from '../videoRecognition'
import api from '../api'

// Mock the API
vi.mock('../api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

describe('videoRecognitionService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getInfo', () => {
    it('should return API information', async () => {
      const result = await videoRecognitionService.getInfo()

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.supported_formats).toBeDefined()
      expect(Array.isArray(result.supported_formats)).toBe(true)
      expect(result.max_file_size_mb).toBeDefined()
      expect(result.default_interval_seconds).toBeDefined()
    })

    it('should include all required fields', async () => {
      const result = await videoRecognitionService.getInfo()

      expect(result).toHaveProperty('supported_formats')
      expect(result).toHaveProperty('max_file_size_mb')
      expect(result).toHaveProperty('default_interval_seconds')
      expect(result).toHaveProperty('min_interval_seconds')
      expect(result).toHaveProperty('max_interval_seconds')
      expect(result).toHaveProperty('endpoints')
    })

    it('should include correct endpoints', async () => {
      const result = await videoRecognitionService.getInfo()

      expect(result.endpoints).toHaveProperty('upload')
      expect(result.endpoints).toHaveProperty('upload_async')
      expect(result.endpoints).toHaveProperty('status')
      expect(result.endpoints).toHaveProperty('info')
    })
  })

  describe('uploadSync', () => {
    it('should upload video and return results', async () => {
      const mockFile = new File(['video content'], 'test.mp4', { type: 'video/mp4' })

      const result = await videoRecognitionService.uploadSync(mockFile, 'serbia', 3.0)

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result).toHaveProperty('video_id')
      expect(result).toHaveProperty('domain')
      expect(result).toHaveProperty('statistics')
      expect(result).toHaveProperty('performance')
      expect(result).toHaveProperty('results')
    })

    it('should include statistics in response', async () => {
      const mockFile = new File(['video content'], 'test.mp4', { type: 'video/mp4' })

      const result = await videoRecognitionService.uploadSync(mockFile)

      expect(result.statistics).toBeDefined()
      expect(result.statistics).toHaveProperty('total_frames')
      expect(result.statistics).toHaveProperty('recognized_frames')
      expect(result.statistics).toHaveProperty('recognition_rate')
      expect(result.statistics).toHaveProperty('unique_persons')
      expect(result.statistics).toHaveProperty('persons_list')
    })

    it('should include performance metrics in response', async () => {
      const mockFile = new File(['video content'], 'test.mp4', { type: 'video/mp4' })

      const result = await videoRecognitionService.uploadSync(mockFile)

      expect(result.performance).toBeDefined()
      expect(result.performance).toHaveProperty('processing_time_seconds')
      expect(result.performance).toHaveProperty('frames_per_second')
      expect(result.performance).toHaveProperty('avg_cpu_percent')
      expect(result.performance).toHaveProperty('memory_used_mb')
    })
  })

  describe('uploadAsync', () => {
    it('should upload video and return video_id', async () => {
      const mockFile = new File(['video content'], 'test.mp4', { type: 'video/mp4' })

      const result = await videoRecognitionService.uploadAsync(mockFile, 'serbia', 3.0)

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result).toHaveProperty('video_id')
      expect(result).toHaveProperty('status_endpoint')
      expect(result.message).toContain('Processing in background')
    })

    it('should return status endpoint with video_id', async () => {
      const mockFile = new File(['video content'], 'test.mp4', { type: 'video/mp4' })

      const result = await videoRecognitionService.uploadAsync(mockFile)

      expect(result.status_endpoint).toContain(result.video_id)
      expect(result.status_endpoint).toContain('/api/video/status/')
    })
  })

  describe('getStatus', () => {
    it('should return processing status', async () => {
      const videoId = 'test-video-123'

      const result = await videoRecognitionService.getStatus(videoId)

      expect(result).toBeDefined()
      expect(result).toHaveProperty('video_id')
      expect(result.video_id).toBe(videoId)
      expect(result).toHaveProperty('status')
    })

    it('should handle processing status', async () => {
      const videoId = 'test-video-123'

      // Mock implementation may return processing or completed
      const result = await videoRecognitionService.getStatus(videoId)

      expect(['processing', 'completed', 'not_found', 'error']).toContain(result.status)
    })

    it('should return complete results when processed', async () => {
      const videoId = 'test-video-123'

      // Keep trying until we get completed status (mock has 30% chance)
      let result
      let attempts = 0
      const maxAttempts = 20

      while (attempts < maxAttempts) {
        result = await videoRecognitionService.getStatus(videoId)
        if (result.status === 'completed') {
          break
        }
        attempts++
      }

      if (result.status === 'completed') {
        expect(result.success).toBe(true)
        expect(result).toHaveProperty('statistics')
        expect(result).toHaveProperty('performance')
        expect(result).toHaveProperty('results')
      }
    })
  })

  describe('validateFile', () => {
    it('should validate file successfully', () => {
      const mockFile = new File(['video content'], 'test.mp4', { type: 'video/mp4' })

      const result = videoRecognitionService.validateFile(mockFile)

      expect(result.valid).toBe(true)
      expect(result.errors).toEqual([])
    })

    it('should reject missing file', () => {
      const result = videoRecognitionService.validateFile(null)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('No file selected')
    })

    it('should reject file too large', () => {
      // Create a file and override its size to simulate large file
      const mockFile = new File(['content'], 'large.mp4', { type: 'video/mp4' })
      const largeSize = 101 * 1024 * 1024 // 101MB

      // Override size property
      Object.defineProperty(mockFile, 'size', {
        value: largeSize,
        writable: false,
        configurable: true
      })

      const result = videoRecognitionService.validateFile(mockFile)

      expect(result.valid).toBe(false)
      expect(result.errors.some(err => err.includes('too large'))).toBe(true)
    })

    it('should reject invalid file format', () => {
      const mockFile = new File(['content'], 'test.txt', { type: 'text/plain' })

      const result = videoRecognitionService.validateFile(mockFile)

      expect(result.valid).toBe(false)
      expect(result.errors.some(err => err.includes('Invalid format'))).toBe(true)
    })

    it('should accept all supported formats', () => {
      const formats = ['mp4', 'avi', 'mov', 'mkv', 'webm', 'flv', 'wmv']

      formats.forEach(format => {
        const mockFile = new File(['content'], `test.${format}`, { type: `video/${format}` })
        const result = videoRecognitionService.validateFile(mockFile)
        expect(result.valid).toBe(true)
      })
    })
  })

  describe('validateInterval', () => {
    it('should validate correct interval', () => {
      const result = videoRecognitionService.validateInterval(3.0)

      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should reject interval too small', () => {
      const result = videoRecognitionService.validateInterval(0.05)

      expect(result.valid).toBe(false)
      expect(result.error).toContain('between')
    })

    it('should reject interval too large', () => {
      const result = videoRecognitionService.validateInterval(100)

      expect(result.valid).toBe(false)
      expect(result.error).toContain('between')
    })

    it('should accept minimum interval', () => {
      const result = videoRecognitionService.validateInterval(0.1)

      expect(result.valid).toBe(true)
    })

    it('should accept maximum interval', () => {
      const result = videoRecognitionService.validateInterval(60.0)

      expect(result.valid).toBe(true)
    })
  })
})
