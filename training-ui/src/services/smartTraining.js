import api from './api'

export const smartTrainingService = {
  // ============================================================
  // TRAINING QUEUE MANAGEMENT
  // ============================================================

  /**
   * Get current training queue
   * @param {string} domain - Domain code (default 'serbia')
   * @returns {Promise} Queue data with list of people waiting to be trained
   */
  async getTrainingQueue(domain = 'serbia') {
    const response = await api.get('/api/training/smart/queue', {
      params: { domain },
    })
    return response.data
  },

  /**
   * Add person to training queue
   * @param {string} personName - Full name of person
   * @param {string} domain - Domain code
   * @param {string} priority - Priority level (high, medium, low)
   * @param {string} wikidataId - Optional Wikidata ID
   * @param {number} recognitionScore - Optional current recognition score
   * @returns {Promise} Queue entry confirmation
   */
  async addToQueue(personName, domain = 'serbia', priority = 'medium', wikidataId = null, recognitionScore = null) {
    const response = await api.post('/api/training/smart/queue/add', {
      person_name: personName,
      domain,
      priority,
      wikidata_id: wikidataId,
      recognition_score: recognitionScore,
    })
    return response.data
  },

  /**
   * Remove person from training queue
   * @param {string} personName - Person to remove
   * @param {string} domain - Domain code
   * @returns {Promise} Success confirmation
   */
  async removeFromQueue(personName, domain = 'serbia') {
    const response = await api.post('/api/training/smart/queue/remove', {
      person_name: personName,
      domain,
    })
    return response.data
  },

  /**
   * Update person's priority in the queue
   * @param {string} personName - Person to update
   * @param {string} priority - New priority (high, medium, low)
   * @param {string} domain - Domain code
   * @param {boolean} moveToTop - If true, move to absolute top of queue
   * @returns {Promise} Updated entry confirmation
   */
  async updatePriority(personName, priority, domain = 'serbia', moveToTop = false) {
    const response = await api.post('/api/training/smart/queue/priority', {
      person_name: personName,
      priority,
      domain,
      move_to_top: moveToTop,
    })
    return response.data
  },

  // ============================================================
  // SMART TRAINING CYCLE
  // ============================================================

  /**
   * Start a smart training cycle
   * @param {Object} config - Training configuration
   * @param {string} config.domain - Domain to train
   * @param {boolean} config.discover_new - Discover new celebrities
   * @param {boolean} config.benchmark_existing - Re-test existing people
   * @param {number} config.max_new_discoveries - Max new people to discover
   * @param {number} config.max_training_per_run - Max people to train
   * @param {number} config.images_per_person - Target images when training
   * @returns {Promise} Run ID and status
   */
  async startSmartCycle(config) {
    const response = await api.post('/api/training/smart/run', {
      domain: config.domain || 'serbia',
      discover_new: config.discover_new !== false,
      benchmark_existing: config.benchmark_existing !== false,
      max_new_discoveries: config.max_new_discoveries || 10,
      max_training_per_run: config.max_training_per_run || 5,
      images_per_person: config.images_per_person || 20,
    }, {
      timeout: 10000, // 10 seconds - runs in background
    })
    return response.data
  },

  /**
   * Get list of smart training runs
   * @param {string} domain - Domain code
   * @returns {Promise} List of training runs with stats
   */
  async getSmartTrainingRuns(domain = 'serbia') {
    try {
      console.log('📜 [Service] Calling /api/training/smart/runs with domain:', domain)
      const response = await api.get('/api/training/smart/runs', {
        params: { domain, limit: 50 },
      })
      console.log('📜 [Service] Response status:', response.status)
      console.log('📜 [Service] Response data:', response.data)
      return response.data
    } catch (error) {
      console.error('📜 [Service] Error calling API:', error.message)
      console.error('📜 [Service] Error response:', error.response?.data)
      throw error
    }
  },

  // ============================================================
  // BENCHMARKING
  // ============================================================

  /**
   * Benchmark a person's recognition quality
   * @param {string} personName - Person to benchmark
   * @param {string} domain - Domain code
   * @param {number} numImages - Number of test images (default 20)
   * @returns {Promise} Benchmark results with recognition score
   */
  async benchmarkPerson(personName, domain = 'serbia', numImages = 20) {
    const response = await api.post('/api/training/benchmark/person', {
      person_name: personName,
      domain,
      num_images: numImages,
    }, {
      timeout: 180000, // 3 minutes - benchmarking is slow
    })
    return response.data
  },

  /**
   * Benchmark multiple people
   * @param {Array<string>} people - List of person names
   * @param {string} domain - Domain code
   * @param {number} numImagesPerPerson - Test images per person
   * @returns {Promise} Array of benchmark results
   */
  async benchmarkBatch(people, domain = 'serbia', numImagesPerPerson = 10) {
    const response = await api.post('/api/training/benchmark/batch', {
      people,
      domain,
      num_images_per_person: numImagesPerPerson,
    }, {
      timeout: 300000, // 5 minutes for batch
    })
    return response.data
  },

  /**
   * Benchmark person and auto-queue if score is low
   * @param {string} personName - Person to benchmark
   * @param {string} domain - Domain code
   * @param {string} wikidataId - Optional Wikidata ID
   * @param {number} numImages - Test images
   * @returns {Promise} Benchmark result with queue status
   */
  async benchmarkAndQueue(personName, domain = 'serbia', wikidataId = null, numImages = 20) {
    const response = await api.post('/api/training/benchmark/and-queue', {
      person_name: personName,
      domain,
      wikidata_id: wikidataId,
      num_images: numImages,
    }, {
      timeout: 180000, // 3 minutes
    })
    return response.data
  },

  /**
   * Get people who need training based on benchmarks
   * @param {string} domain - Domain code
   * @param {number} minScore - Minimum acceptable score (default 80)
   * @returns {Promise} List of training candidates
   */
  async getBenchmarkCandidates(domain = 'serbia', minScore = 80) {
    const response = await api.get('/api/training/benchmark/candidates', {
      params: { domain, min_score: minScore },
    })
    return response.data
  },

  // ============================================================
  // CELEBRITY DISCOVERY
  // ============================================================

  /**
   * Discover trending celebrities for a country
   * @param {string} country - Country code
   * @param {number} maxResults - Max celebrities to return
   * @returns {Promise} List of trending celebrities
   */
  async discoverTrending(country = 'serbia', maxResults = 20) {
    const response = await api.get('/api/training/discover/trending', {
      params: { country, max_results: maxResults },
      timeout: 60000, // 60 seconds - discovery is slow
    })
    return response.data
  },

  /**
   * Get top celebrities for a country (cached)
   * @param {string} country - Country code
   * @param {number} limit - Max results
   * @returns {Promise} List of top celebrities
   */
  async getTopCelebrities(country = 'serbia', limit = 50) {
    const response = await api.get('/api/training/discover/top', {
      params: { country, limit },
      timeout: 60000,
    })
    return response.data
  },

  /**
   * Search for a specific celebrity by name
   * @param {string} query - Search query
   * @param {string} country - Optional country filter
   * @returns {Promise} Search results
   */
  async searchCelebrity(query, country = null) {
    const params = { q: query }
    if (country) {
      params.country = country
    }

    const response = await api.get('/api/training/discover/search', {
      params,
      timeout: 40000, // 40 seconds for Wikidata search
    })
    return response.data
  },

  // ============================================================
  // STATISTICS & ANALYTICS
  // ============================================================

  /**
   * Get smart training dashboard stats
   * @param {string} domain - Domain code
   * @returns {Promise} Dashboard statistics
   */
  async getDashboardStats(domain = 'serbia') {
    // Combine multiple calls for dashboard overview
    try {
      const [queueData, candidatesData] = await Promise.all([
        this.getTrainingQueue(domain),
        this.getBenchmarkCandidates(domain, 80),
      ])

      // Calculate stats
      const queue = queueData.queue || []
      const candidates = candidatesData.candidates || []

      return {
        success: true,
        stats: {
          queue_size: queueData.queue_size || 0,
          high_priority: queue.filter(p => p.priority === 'high').length,
          medium_priority: queue.filter(p => p.priority === 'medium').length,
          low_priority: queue.filter(p => p.priority === 'low').length,
          candidates_needing_training: candidates.length,
          avg_recognition_score: candidates.length > 0
            ? Math.round(candidates.reduce((sum, c) => sum + (c.recognition_score || 0), 0) / candidates.length)
            : null,
        },
        queue,
        candidates,
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        stats: {
          queue_size: 0,
          high_priority: 0,
          medium_priority: 0,
          low_priority: 0,
          candidates_needing_training: 0,
          avg_recognition_score: null,
        },
      }
    }
  },
}
