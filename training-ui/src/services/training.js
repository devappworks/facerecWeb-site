import api from './api'

export const trainingService = {
  // Generate celebrity names by country and categories
  async generateNames(country, categories = []) {
    const params = { country }

    // Add categories if provided (comma-separated)
    if (categories && categories.length > 0) {
      params.categories = categories.join(',')
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

  // Get queue status (placeholder - backend endpoint needed)
  async getQueueStatus() {
    // TODO: Backend needs to implement this endpoint
    // For now, return mock data
    return {
      success: true,
      data: {
        queueSize: 0,
        processed: 0,
        remaining: 0,
      },
    }
  },

  // Get training progress (placeholder - backend endpoint needed)
  async getTrainingProgress() {
    // TODO: Backend needs to implement this endpoint
    return {
      success: true,
      data: {
        folders: [],
        totalImages: 0,
      },
    }
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
      timeout: 10000, // 10 seconds
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
      timeout: 15000, // 15 seconds for both systems
    })
    return response.data
  },

  // Get name mappings
  async getNameMappings() {
    const response = await api.get('/admin/name-mappings')
    return response.data
  },

  // Delete image
  async deleteImage(imagePath) {
    const formData = new FormData()
    formData.append('image_path', imagePath)
    formData.append('action', 'delete')

    const response = await api.post('/manage-image', formData)
    return response.data
  },

  // Get folder images (for gallery view)
  async getFolderImages(folderName) {
    // TODO: Backend needs to implement this endpoint
    // For now, return mock data
    return {
      success: true,
      data: {
        folderName,
        images: [],
        totalCount: 0,
      },
    }
  },
}
