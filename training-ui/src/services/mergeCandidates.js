import api from './api'

/**
 * Merge Candidates Service
 *
 * Handles API calls for detecting and managing duplicate/similar person entries.
 */

// Mock data for offline development
const mockCandidates = {
  domain: 'serbia',
  scanned_at: new Date().toISOString(),
  total_persons: 5000,
  total_candidates: 8,
  summary: {
    typos: 2,
    duplicates: 3,
    spelling_variants: 2,
    nicknames: 1
  },
  candidates: [
    {
      source_id: 1,
      source_name: 'Kevin Durent',
      source_embeddings: 20,
      target_id: 2,
      target_name: 'Kevin Durant',
      target_embeddings: 45,
      type: 'SPELLING_VARIANT',
      reason: 'Serbian "durent" vs English "durant"',
      suggestion: 'Merge "Kevin Durent" into "Kevin Durant"',
      action: 'MERGE'
    },
    {
      source_id: 3,
      source_name: 'Kobi Brajant',
      source_embeddings: 15,
      target_id: 4,
      target_name: 'Kobe Bryant',
      target_embeddings: 50,
      type: 'SPELLING_VARIANT',
      reason: 'Serbian spelling variant',
      suggestion: 'Merge into English spelling',
      action: 'MERGE'
    }
  ]
}

export const mergeCandidatesService = {
  /**
   * Get the latest merge candidates scan results.
   * @param {string} domain - Domain code
   * @returns {Promise<Object>} Merge candidates data
   */
  async getCandidates(domain = 'serbia') {
    try {
      const response = await api.get('/api/training/merge-candidates', {
        params: { domain }
      })
      return response.data.data
    } catch (error) {
      console.warn('Using mock merge candidates:', error.message)
      return mockCandidates
    }
  },

  /**
   * Scan the database for new merge candidates.
   * @param {string} domain - Domain code
   * @returns {Promise<Object>} Scan results
   */
  async scanForCandidates(domain = 'serbia') {
    try {
      const response = await api.post('/api/training/merge-candidates/scan', {
        domain
      })
      return response.data.data
    } catch (error) {
      console.error('Error scanning for candidates:', error)
      throw error
    }
  },

  /**
   * Execute an action on a merge candidate.
   * @param {number} candidateId - Candidate index
   * @param {string} action - Action to execute (MERGE, RENAME, DELETE, SKIP)
   * @param {string} domain - Domain code
   * @param {string} newName - New name (required for RENAME action)
   * @param {boolean} swapDirection - If true, swap source and target for MERGE
   * @returns {Promise<Object>} Result of the action
   */
  async executeAction(candidateId, action, domain = 'serbia', newName = null, swapDirection = false) {
    try {
      const response = await api.post(`/api/training/merge-candidates/${candidateId}/action`, {
        domain,
        action,
        new_name: newName,
        swap_direction: swapDirection
      })
      return response.data
    } catch (error) {
      console.error('Error executing action:', error)
      throw error
    }
  },

  /**
   * Manually merge two persons.
   * @param {string} sourcePerson - Person to be merged (deleted)
   * @param {string} targetPerson - Person to receive images
   * @param {string} domain - Domain code
   * @returns {Promise<Object>} Result of the merge
   */
  async mergePersons(sourcePerson, targetPerson, domain = 'serbia') {
    try {
      const response = await api.post('/api/training/merge-persons', {
        source_person: sourcePerson,
        target_person: targetPerson,
        domain
      })
      return response.data
    } catch (error) {
      console.error('Error merging persons:', error)
      throw error
    }
  },

  /**
   * Get preview info for a person.
   * @param {string} personName - Person name
   * @param {string} domain - Domain code
   * @returns {Promise<Object>} Person preview data
   */
  async getPersonPreview(personName, domain = 'serbia') {
    try {
      const response = await api.get('/api/training/person-preview', {
        params: { name: personName, domain }
      })
      return response.data
    } catch (error) {
      console.error('Error getting person preview:', error)
      throw error
    }
  }
}

export default mergeCandidatesService
