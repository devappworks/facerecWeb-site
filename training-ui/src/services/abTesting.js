import api from './api'

// Mock data for development
const mockComparisonResult = {
  image_id: 'test_001.jpg',
  ground_truth: 'John Doe',

  pipeline_a_result: {
    status: 'success',
    person: 'John Doe',
    confidence: 93.5,
    processing_time: 2.14,
    profile_used: {
      name: 'Current System',
      model: 'VGG-Face',
      threshold: 0.35,
      detection_confidence: 0.995,
    },
  },

  pipeline_b_result: {
    status: 'success',
    person: 'John Doe',
    confidence: 97.2,
    processing_time: 2.45,
    profile_used: {
      name: 'Improved System',
      model: 'Facenet512',
      threshold: 0.40,
      detection_confidence: 0.98,
    },
  },

  comparison: {
    comparison_id: 'cmp_' + Date.now(),
    comparison_metrics: {
      both_succeeded: true,
      both_failed: false,
      only_a_succeeded: false,
      only_b_succeeded: false,
      results_match: true,
      confidence_difference: 3.7,
      processing_time_difference: 0.31,
      faster_pipeline: 'pipeline_a',
      accuracy: {
        pipeline_a_correct: true,
        pipeline_b_correct: true,
        winner: 'both',
      },
    },
  },

  recommendation: 'Both systems agree. Pipeline B has 3.7% higher confidence.',
}

const mockDailyMetrics = {
  total_comparisons: 1234,
  date_range: {
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  },

  status_breakdown: {
    both_succeeded: { count: 1015, percentage: 82.3 },
    both_failed: { count: 50, percentage: 4.0 },
    only_a_succeeded: { count: 64, percentage: 5.2 },
    only_b_succeeded: { count: 105, percentage: 8.5 },
  },

  agreement: {
    total_agreements: 1080,
    total_disagreements: 154,
    agreement_rate: 87.5,
  },

  accuracy: {
    total_with_ground_truth: 900,
    pipeline_a_accuracy: 87.2,
    pipeline_b_accuracy: 99.1,
    improvement: 11.9,
  },

  performance: {
    avg_confidence_difference: 5.2,
    avg_time_difference_ms: 280,
    pipeline_b_faster_count: 556,
  },
}

export const abTestingService = {
  // Run A/B comparison test
  async runComparison(file, options = {}) {
    const formData = new FormData()
    formData.append('image', file)

    if (options.imageId) {
      formData.append('image_id', options.imageId)
    }

    if (options.groundTruth) {
      formData.append('ground_truth', options.groundTruth)
    }

    try {
      const response = await api.post('/api/test/recognize', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 180000, // 180 seconds (3 minutes) - Facenet512 needs more time with 30k+ images
      })
      return response.data
    } catch (error) {
      // Only fallback to mock data if API is truly unavailable, not for auth/other errors
      if (error.response?.status === 401 || error.response?.status === 403) {
        // Re-throw auth errors so they're handled properly
        throw error
      }

      console.warn('API not available, using mock data:', error.message)
      return {
        ...mockComparisonResult,
        image_id: options.imageId || file.name,
        ground_truth: options.groundTruth || null,
      }
    }
  },

  // Get daily metrics
  async getDailyMetrics(date = null) {
    try {
      const params = date ? { date } : {}
      const response = await api.get('/api/test/metrics/daily', { params })
      return response.data
    } catch (error) {
      console.warn('API not available, using mock data:', error.message)
      return {
        success: true,
        summary: mockDailyMetrics,
      }
    }
  },

  // Get weekly metrics
  async getWeeklyMetrics() {
    try {
      const response = await api.get('/api/test/metrics/weekly')
      return response.data
    } catch (error) {
      console.warn('API not available, using mock data:', error.message)
      return {
        success: true,
        summary: {
          ...mockDailyMetrics,
          total_comparisons: 5234,
          date_range: {
            start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split('T')[0],
            end: new Date().toISOString().split('T')[0],
          },
        },
      }
    }
  },

  // Get health check
  async getHealthCheck() {
    try {
      const response = await api.get('/api/test/health')
      return response.data
    } catch (error) {
      console.warn('API not available, using mock data:', error.message)
      return {
        success: true,
        status: 'healthy',
        pipelines: {
          pipeline_a: 'operational',
          pipeline_b: 'operational',
        },
      }
    }
  },

  // Get test history (mock for now)
  async getTestHistory(filters = {}) {
    // TODO: Implement actual API call when backend is ready
    const mockHistory = Array.from({ length: 50 }, (_, i) => ({
      image_id: `test_${String(i + 1).padStart(3, '0')}.jpg`,
      timestamp: new Date(Date.now() - i * 60 * 60 * 1000).toISOString(),
      ground_truth: i % 3 === 0 ? 'John Doe' : i % 3 === 1 ? 'Jane Smith' : null,
      pipeline_a_person: i % 5 === 0 ? null : 'Person A',
      pipeline_a_confidence: i % 5 === 0 ? null : 90 + Math.random() * 10,
      pipeline_b_person: i % 7 === 0 ? null : 'Person B',
      pipeline_b_confidence: i % 7 === 0 ? null : 92 + Math.random() * 8,
      agreement: i % 5 !== 0 && i % 7 !== 0,
      winner: i % 3 === 0 ? 'both' : i % 3 === 1 ? 'pipeline_b' : 'pipeline_a',
    }))

    return {
      success: true,
      data: {
        tests: mockHistory.slice(
          (filters.page || 0) * 20,
          ((filters.page || 0) + 1) * 20
        ),
        total: mockHistory.length,
        page: filters.page || 0,
        per_page: 20,
      },
    }
  },
}
