import api from './api'

// Mock data for development
const mockCountries = [
  { id: 'serbia', name: 'Serbia' },
  { id: 'usa', name: 'USA' },
  { id: 'uk', name: 'UK' },
  { id: 'france', name: 'France' },
  { id: 'croatia', name: 'Croatia' },
  { id: 'bosnia', name: 'Bosnia' },
]

const mockOccupations = [
  { id: 'actor', name: 'Actor' },
  { id: 'politician', name: 'Politician' },
  { id: 'tennis_player', name: 'Tennis Player' },
  { id: 'football_player', name: 'Football Player' },
  { id: 'basketball_player', name: 'Basketball Player' },
  { id: 'musician', name: 'Musician' },
  { id: 'singer', name: 'Singer' },
  { id: 'writer', name: 'Writer' },
  { id: 'director', name: 'Director' },
]

const mockCandidates = [
  {
    full_name: 'Novak Djokovic',
    name: 'Novak',
    last_name: 'Djokovic',
    occupation: 'tennis_player',
    country: 'serbia',
    description: 'Serbian tennis player',
    wikidata_id: 'Q5812',
    has_wikipedia_image: true,
    exists_in_db: false,
    existing_photo_count: 0,
    folder_name: 'novak_djokovic',
  },
  {
    full_name: 'Emir Kusturica',
    name: 'Emir',
    last_name: 'Kusturica',
    occupation: 'director',
    country: 'serbia',
    description: 'Serbian film director',
    wikidata_id: 'Q55411',
    has_wikipedia_image: true,
    exists_in_db: true,
    existing_photo_count: 47,
    folder_name: 'emir_kusturica',
  },
  {
    full_name: 'Ana Ivanovic',
    name: 'Ana',
    last_name: 'Ivanovic',
    occupation: 'tennis_player',
    country: 'serbia',
    description: 'Serbian tennis player',
    wikidata_id: 'Q11581',
    has_wikipedia_image: true,
    exists_in_db: false,
    existing_photo_count: 0,
    folder_name: 'ana_ivanovic',
  },
]

const mockBatchStatus = {
  success: true,
  batch_id: 'mock_batch_123',
  status: 'processing',
  created_at: new Date().toISOString(),
  total: 2,
  completed: 0,
  processing: 1,
  failed: 0,
  queued: 1,
  progress_percentage: 0,
  people: [
    {
      full_name: 'Novak Djokovic',
      name: 'Novak',
      last_name: 'Djokovic',
      occupation: 'tennis_player',
      folder_name: 'novak_djokovic',
      status: 'processing',
      current_step: 'downloading_images',
      photos_downloaded: 15,
      photos_validated: 0,
      error: null,
      started_at: new Date().toISOString(),
      completed_at: null,
    },
    {
      full_name: 'Ana Ivanovic',
      name: 'Ana',
      last_name: 'Ivanovic',
      occupation: 'tennis_player',
      folder_name: 'ana_ivanovic',
      status: 'queued',
      current_step: null,
      photos_downloaded: 0,
      photos_validated: 0,
      error: null,
      started_at: null,
      completed_at: null,
    },
  ],
}

const mockStagingList = [
  {
    folder_name: 'novak_djokovic',
    image_count: 28,
    ready_for_production: true,
  },
  {
    folder_name: 'ana_ivanovic',
    image_count: 31,
    ready_for_production: true,
  },
  {
    folder_name: 'unknown_person',
    image_count: 3,
    ready_for_production: false,
  },
]

export const automatedTrainingService = {
  // Get available countries
  async getCountries() {
    try {
      const response = await api.get('/api/training/countries')
      return response.data
    } catch (error) {
      console.warn('API not available, using mock data:', error.message)
      return {
        success: true,
        countries: mockCountries,
      }
    }
  },

  // Get available occupations
  async getOccupations() {
    try {
      const response = await api.get('/api/training/occupations')
      return response.data
    } catch (error) {
      console.warn('API not available, using mock data:', error.message)
      return {
        success: true,
        occupations: mockOccupations,
      }
    }
  },

  // Generate candidates from Wikidata
  async generateCandidates(country, occupation, domain) {
    try {
      // Use longer timeout (120s) as this queries Wikidata and checks storage
      const response = await api.post('/api/training/generate-candidates', {
        country,
        occupation,
        domain,
      }, {
        timeout: 120000  // 120 seconds
      })
      return response.data
    } catch (error) {
      console.error('❌ Generate candidates API call failed:', error)
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url,
        params: { country, occupation, domain }
      })
      // Re-throw the error instead of using mock data
      throw error
    }
  },

  // Start batch training
  async startBatch(candidates, domain) {
    try {
      const response = await api.post('/api/training/start-batch', {
        candidates,
        domain,
      })
      return response.data
    } catch (error) {
      console.warn('API not available, using mock data:', error.message)
      return {
        success: true,
        message: `Started batch training for ${candidates.length} people`,
        batch_id: 'mock_batch_' + Date.now(),
        total_people: candidates.length,
      }
    }
  },

  // Get batch status (for polling)
  async getBatchStatus(batchId) {
    try {
      const response = await api.get(`/api/training/batch/${batchId}/status`)
      return response.data
    } catch (error) {
      console.warn('API not available, using mock data:', error.message)
      
      // Simulate progress for mock data
      const progress = Math.min(100, (Date.now() % 100000) / 1000)
      const completed = Math.floor((mockBatchStatus.total * progress) / 100)
      
      return {
        ...mockBatchStatus,
        batch_id: batchId,
        progress_percentage: Math.round(progress),
        completed,
        processing: completed < mockBatchStatus.total ? 1 : 0,
        queued: mockBatchStatus.total - completed - 1,
        status: completed === mockBatchStatus.total ? 'completed' : 'processing',
        people: mockBatchStatus.people.map((p, idx) => ({
          ...p,
          status:
            idx < completed
              ? 'completed'
              : idx === completed
                ? 'processing'
                : 'queued',
          photos_downloaded: idx < completed ? 28 : idx === completed ? 15 : 0,
          completed_at: idx < completed ? new Date().toISOString() : null,
        })),
      }
    }
  },

  // Cancel batch
  async cancelBatch(batchId) {
    try {
      const response = await api.post(`/api/training/batch/${batchId}/cancel`)
      return response.data
    } catch (error) {
      console.warn('API not available, using mock data:', error.message)
      return {
        success: true,
        message: 'Batch cancelled successfully',
        batch_id: batchId,
      }
    }
  },

  // Get staging list
  async getStagingList(domain) {
    try {
      const response = await api.get('/api/training/staging-list', {
        params: { domain },
      })
      console.log('✅ Staging list loaded from API:', response.data)
      return response.data
    } catch (error) {
      console.error('❌ Staging list API call failed:', error)
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url
      })
      // Re-throw the error instead of using mock data
      throw error
    }
  },

  // Deploy to production
  async deployToProduction(people, domain) {
    try {
      const response = await api.post('/api/training/deploy', {
        people,
        domain,
      })
      return response.data
    } catch (error) {
      console.warn('API not available, using mock data:', error.message)

      const readyPeople = mockStagingList.filter(
        (p) => people.includes(p.folder_name) && p.ready_for_production
      )
      const skippedPeople = mockStagingList.filter(
        (p) => people.includes(p.folder_name) && !p.ready_for_production
      )

      return {
        success: true,
        message: `Deployed ${readyPeople.length} people to production`,
        deployed: readyPeople.map((p) => ({
          folder: p.folder_name,
          image_count: p.image_count,
        })),
        skipped: skippedPeople.map((p) => ({
          folder: p.folder_name,
          reason: `Too few images (${p.image_count}), minimum is 5`,
        })),
        errors: [],
        statistics: {
          deployed_count: readyPeople.length,
          skipped_count: skippedPeople.length,
          error_count: 0,
        },
      }
    }
  },

  // Remove people from staging
  async removeFromStaging(people, domain) {
    try {
      const response = await api.post('/api/training/staging/remove', {
        people,
        domain,
      })
      return response.data
    } catch (error) {
      console.error('Failed to remove from staging:', error)
      throw error
    }
  },

  // Delete a single image from staging
  async deleteStagingImage(domain, folderName, filename) {
    try {
      const response = await api.delete(`/api/training/staging/image/${domain}/${folderName}/${filename}`)
      return response.data
    } catch (error) {
      console.error('Failed to delete staging image:', error)
      throw error
    }
  },

  // Train people via SERP (Google Custom Search)
  async trainViaSERP(people, domain) {
    try {
      const response = await api.post('/api/training/staging/train-serp', {
        people,
        domain,
      })
      return response.data
    } catch (error) {
      console.error('Failed to start SERP training:', error)
      throw error
    }
  },

  // Get SERP training batch status
  async getSerpBatchStatus(batchId) {
    try {
      const response = await api.get(`/api/training/staging/serp-status/${batchId}`)
      return response.data
    } catch (error) {
      console.error('Failed to get SERP batch status:', error)
      throw error
    }
  },

  // List all SERP batches (running and completed)
  async listSerpBatches() {
    try {
      const response = await api.get('/api/training/staging/serp-batches')
      return response.data
    } catch (error) {
      console.error('Failed to list SERP batches:', error)
      throw error
    }
  },

  // List all training batches (Wikidata/automated)
  async listTrainingBatches() {
    try {
      const response = await api.get('/api/training/staging/training-batches')
      return response.data
    } catch (error) {
      console.error('Failed to list training batches:', error)
      throw error
    }
  },

  // List ALL batches (merged Wikidata + SERP)
  async listAllBatches() {
    try {
      const [serpResponse, trainingResponse] = await Promise.all([
        api.get('/api/training/staging/serp-batches'),
        api.get('/api/training/staging/training-batches')
      ])

      const serpBatches = serpResponse.data
      const trainingBatches = trainingResponse.data

      // Merge running and completed batches from both sources
      const allRunning = [
        ...(serpBatches.running_batches || []).map(b => ({ ...b, type: 'serp' })),
        ...(trainingBatches.running_batches || []).map(b => ({ ...b, type: 'wikidata' }))
      ]

      const allCompleted = [
        ...(serpBatches.completed_batches || []).map(b => ({ ...b, type: 'serp' })),
        ...(trainingBatches.completed_batches || []).map(b => ({ ...b, type: 'wikidata' }))
      ]

      // Sort by created_at (most recent first)
      allRunning.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      allCompleted.sort((a, b) => new Date(b.created_at || b.completed_at) - new Date(a.created_at || a.completed_at))

      return {
        success: true,
        running_batches: allRunning,
        completed_batches: allCompleted,
        running_count: allRunning.length,
        completed_count: allCompleted.length
      }
    } catch (error) {
      console.error('Failed to list all batches:', error)
      throw error
    }
  },
}
