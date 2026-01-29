import api from './api'

export const trainingService = {
  // Generate celebrity names by country and categories
  async generateNames(country, categories = []) {
    const params = { country }

    // Add categories if provided (comma-separated)
    // Backend expects 'occupation' parameter
    if (categories && categories.length > 0) {
      params.occupation = categories.join(',')
    }

    const response = await api.get('/api/excel/check-excel', {
      params,
      timeout: 60000, // 60 seconds for AI generation
    })
    return response.data
  },

  // Process next person in queue
  async processNext() {
    const response = await api.get('/api/excel/process', {
      timeout: 40000, // 40 seconds for image download and processing
    })
    return response.data
  },

  // Get queue status
  async getQueueStatus() {
    const response = await api.get('/api/training/queue-status')
    return response.data
  },

  // Get training progress
  async getTrainingProgress(domain = 'serbia', view = 'production', page = 1, limit = 50, search = null, hideApproved = false) {
    const params = { domain, view, page, limit }
    if (search) {
      params.search = search
    }
    if (hideApproved) {
      params.hide_approved = 'true'
    }
    const response = await api.get('/api/training/progress', { params })
    return response.data
  },

  // Get queue list
  async getQueueList() {
    const response = await api.get('/api/training/queue-list')
    return response.data
  },

  // Remove from queue
  async removeFromQueue(id) {
    const response = await api.delete('/api/training/queue', {
      data: { id },
    })
    return response.data
  },

  // Get available occupations/categories
  async getOccupations() {
    const response = await api.get('/api/excel/occupations')
    return response.data
  },

  // Sync faces to production
  async syncFaces() {
    const response = await api.post('/sync-faces')
    return response.data
  },

  // Test recognition (single image)
  async testRecognition(file) {
    const formData = new FormData()
    formData.append('image', file)

    const response = await api.post('/recognize', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 30000, // 30 seconds (increased for large images)
    })
    return response.data
  },

  // A/B test recognition
  async abTestRecognition(file, groundTruth = null) {
    const formData = new FormData()
    formData.append('image', file)
    if (groundTruth) {
      formData.append('ground_truth', groundTruth)
    }

    const response = await api.post('/api/test/recognize', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000, // 60 seconds for both systems (A/B testing takes longer)
    })
    return response.data
  },

  // Get name mappings
  async getNameMappings() {
    const response = await api.get('/admin/name-mappings')
    return response.data
  },

  // Delete image
  async deleteImage(imagePath, domain = 'serbia') {
    // Extract just the filename from the path
    // imagePath format: recognized_faces_prod/{domain}/{filename}
    const filename = imagePath.split('/').pop()

    const response = await api.post('/manage-image', {
      filename: filename,
      action: 'delete',
      domain: domain
    })
    return response.data
  },

  // Get folder images (for gallery view)
  async getFolderImages(folderName, domain = 'serbia', view = 'production', page = 1, limit = 50) {
    const response = await api.get(`/api/training/folders/${encodeURIComponent(folderName)}`, {
      params: { domain, view, page, limit },
    })
    return response.data
  },

  // Smart Training Queue endpoints
  async getSmartQueue(domain = 'serbia') {
    const response = await api.get('/api/training/smart/queue', {
      params: { domain },
    })
    return response.data
  },

  async startBatchTraining(options = {}) {
    const {
      domain = 'serbia',
      discoverNew = false,
      benchmarkExisting = false,
      maxTraining = 30,
      imagesPerPerson = 30,
    } = options

    const response = await api.post('/api/training/smart/run', {
      domain,
      discover_new: discoverNew,
      benchmark_existing: benchmarkExisting,
      max_new_discoveries: 0,
      max_training_per_run: maxTraining,
      images_per_person: imagesPerPerson,
    }, {
      timeout: 30000,
    })
    return response.data
  },

  async getTrainingRuns(domain = 'serbia', limit = 20) {
    const response = await api.get('/api/training/smart/runs', {
      params: { domain, limit },
    })
    return response.data
  },

  // Get all approvals for a domain/view
  async getApprovals(domain = 'serbia', view = 'production') {
    const response = await api.get('/api/training/approvals', {
      params: { domain, view },
    })
    return response.data
  },

  // Approve a person
  async approvePerson(personName, domain = 'serbia', view = 'production', imageCount = 0) {
    const response = await api.post(`/api/training/approvals/${encodeURIComponent(personName)}`, {
      domain,
      view,
      image_count: imageCount,
    })
    return response.data
  },

  // Remove approval for a person
  async unapprovePerson(personName, domain = 'serbia', view = 'production') {
    const response = await api.delete(`/api/training/approvals/${encodeURIComponent(personName)}`, {
      params: { domain, view },
    })
    return response.data
  },

  // Delete a person from the database
  async deletePerson(personName, domain = 'serbia') {
    const response = await api.post('/api/training/delete-person', {
      person_name: personName,
      domain,
    })
    return response.data
  },
}
