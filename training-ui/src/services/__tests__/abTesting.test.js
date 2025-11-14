import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { abTestingService } from '../abTesting'
import api from '../api'

// Mock the api module
vi.mock('../api', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}))

describe('abTestingService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Suppress console.warn in tests
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('runComparison', () => {
    it('should send file with FormData to API', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const mockResponse = {
        data: {
          image_id: 'test.jpg',
          pipeline_a_result: { status: 'success' },
          pipeline_b_result: { status: 'success' },
        },
      }

      api.post.mockResolvedValueOnce(mockResponse)

      const result = await abTestingService.runComparison(mockFile)

      expect(api.post).toHaveBeenCalledWith(
        '/api/test/recognize',
        expect.any(FormData),
        expect.objectContaining({
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 30000,
        })
      )
      expect(result).toEqual(mockResponse.data)
    })

    it('should include image_id and ground_truth when provided', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const options = {
        imageId: 'custom_id',
        groundTruth: 'John Doe',
      }

      api.post.mockResolvedValueOnce({ data: {} })

      await abTestingService.runComparison(mockFile, options)

      const formDataCall = api.post.mock.calls[0][1]
      expect(formDataCall).toBeInstanceOf(FormData)
    })

    it('should return mock data when API fails', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      api.post.mockRejectedValueOnce(new Error('Network error'))

      const result = await abTestingService.runComparison(mockFile, {
        imageId: 'test_001',
        groundTruth: 'Jane Doe',
      })

      expect(result).toHaveProperty('image_id', 'test_001')
      expect(result).toHaveProperty('ground_truth', 'Jane Doe')
      expect(result).toHaveProperty('pipeline_a_result')
      expect(result).toHaveProperty('pipeline_b_result')
    })

    it('should use file name as image_id when not provided', async () => {
      const mockFile = new File(['test'], 'photo.jpg', { type: 'image/jpeg' })
      api.post.mockRejectedValueOnce(new Error('API error'))

      const result = await abTestingService.runComparison(mockFile)

      expect(result.image_id).toBe('photo.jpg')
    })
  })

  describe('getDailyMetrics', () => {
    it('should fetch daily metrics from API', async () => {
      const mockResponse = {
        data: {
          success: true,
          summary: {
            total_comparisons: 100,
            agreement_rate: 85.5,
          },
        },
      }

      api.get.mockResolvedValueOnce(mockResponse)

      const result = await abTestingService.getDailyMetrics()

      expect(api.get).toHaveBeenCalledWith('/api/test/metrics/daily', { params: {} })
      expect(result).toEqual(mockResponse.data)
    })

    it('should include date parameter when provided', async () => {
      const date = '2025-01-15'
      api.get.mockResolvedValueOnce({ data: {} })

      await abTestingService.getDailyMetrics(date)

      expect(api.get).toHaveBeenCalledWith('/api/test/metrics/daily', {
        params: { date },
      })
    })

    it('should return mock data when API fails', async () => {
      api.get.mockRejectedValueOnce(new Error('Network error'))

      const result = await abTestingService.getDailyMetrics()

      expect(result).toHaveProperty('success', true)
      expect(result).toHaveProperty('summary')
      expect(result.summary).toHaveProperty('total_comparisons')
      expect(result.summary).toHaveProperty('status_breakdown')
      expect(result.summary).toHaveProperty('agreement')
    })
  })

  describe('getWeeklyMetrics', () => {
    it('should fetch weekly metrics from API', async () => {
      const mockResponse = {
        data: {
          success: true,
          summary: {
            total_comparisons: 5000,
            agreement_rate: 88.0,
          },
        },
      }

      api.get.mockResolvedValueOnce(mockResponse)

      const result = await abTestingService.getWeeklyMetrics()

      expect(api.get).toHaveBeenCalledWith('/api/test/metrics/weekly')
      expect(result).toEqual(mockResponse.data)
    })

    it('should return mock data when API fails', async () => {
      api.get.mockRejectedValueOnce(new Error('Network error'))

      const result = await abTestingService.getWeeklyMetrics()

      expect(result).toHaveProperty('success', true)
      expect(result).toHaveProperty('summary')
      expect(result.summary).toHaveProperty('total_comparisons')
      expect(result.summary.total_comparisons).toBeGreaterThan(1000)
    })
  })

  describe('getHealthCheck', () => {
    it('should fetch health status from API', async () => {
      const mockResponse = {
        data: {
          success: true,
          status: 'healthy',
          pipelines: {
            pipeline_a: 'operational',
            pipeline_b: 'operational',
          },
        },
      }

      api.get.mockResolvedValueOnce(mockResponse)

      const result = await abTestingService.getHealthCheck()

      expect(api.get).toHaveBeenCalledWith('/api/test/health')
      expect(result).toEqual(mockResponse.data)
    })

    it('should return mock health data when API fails', async () => {
      api.get.mockRejectedValueOnce(new Error('Network error'))

      const result = await abTestingService.getHealthCheck()

      expect(result).toHaveProperty('success', true)
      expect(result).toHaveProperty('status', 'healthy')
      expect(result).toHaveProperty('pipelines')
      expect(result.pipelines).toHaveProperty('pipeline_a', 'operational')
      expect(result.pipelines).toHaveProperty('pipeline_b', 'operational')
    })
  })

  describe('getTestHistory', () => {
    it('should return mock history data', async () => {
      const result = await abTestingService.getTestHistory()

      expect(result).toHaveProperty('success', true)
      expect(result).toHaveProperty('data')
      expect(result.data).toHaveProperty('tests')
      expect(result.data).toHaveProperty('total')
      expect(result.data).toHaveProperty('page', 0)
      expect(result.data).toHaveProperty('per_page', 20)
    })

    it('should generate array of test results', async () => {
      const result = await abTestingService.getTestHistory()

      expect(Array.isArray(result.data.tests)).toBe(true)
      expect(result.data.tests.length).toBeLessThanOrEqual(20)
      
      const firstTest = result.data.tests[0]
      expect(firstTest).toHaveProperty('image_id')
      expect(firstTest).toHaveProperty('timestamp')
      expect(firstTest).toHaveProperty('agreement')
    })

    it('should handle pagination', async () => {
      const page0 = await abTestingService.getTestHistory({ page: 0 })
      const page1 = await abTestingService.getTestHistory({ page: 1 })

      expect(page0.data.page).toBe(0)
      expect(page1.data.page).toBe(1)
      expect(page0.data.tests[0].image_id).not.toBe(page1.data.tests[0].image_id)
    })

    it('should return correct total count', async () => {
      const result = await abTestingService.getTestHistory()

      expect(result.data.total).toBe(50)
    })
  })

  describe('Error handling', () => {
    it('should log warning when API fails', async () => {
      api.get.mockRejectedValueOnce(new Error('Connection timeout'))

      await abTestingService.getDailyMetrics()

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('API not available'),
        expect.any(String)
      )
    })

    it('should handle null and undefined gracefully', async () => {
      api.post.mockRejectedValueOnce(new Error('Error'))

      const result = await abTestingService.runComparison(
        new File([''], 'test.jpg'),
        {}
      )

      expect(result.ground_truth).toBeNull()
    })
  })
})
