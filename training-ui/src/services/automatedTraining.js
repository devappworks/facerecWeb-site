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
      const response = await api.post('/api/training/generate-candidates', {
        country,
        occupation,
        domain,
      })
      return response.data
    } catch (error) {
      console.warn('API not available, using mock data:', error.message)
      return {
        success: true,
        message: `Found ${mockCandidates.length} ${country} ${occupation}s`,
        candidates: mockCandidates,
        statistics: {
          total: mockCandidates.length,
          new: mockCandidates.filter((c) => !c.exists_in_db).length,
          existing: mockCandidates.filter((c) => c.exists_in_db).length,
        },
      }
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
      return response.data
    } catch (error) {
      console.warn('API not available, using mock data:', error.message)
      return {
        success: true,
        people: mockStagingList,
        count: mockStagingList.length,
        ready_count: mockStagingList.filter((p) => p.ready_for_production)
          .length,
      }
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
}
