import { useState } from 'react'
import { automatedTrainingService } from '../services/automatedTraining'

export function useCandidates() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [candidates, setCandidates] = useState([])
  const [statistics, setStatistics] = useState(null)

  const generateCandidates = async (country, occupation, domain) => {
    setLoading(true)
    setError(null)
    setCandidates([])
    setStatistics(null)

    try {
      const response = await automatedTrainingService.generateCandidates(
        country,
        occupation,
        domain
      )

      if (response.success) {
        // Auto-select new people (not existing in DB)
        const candidatesWithSelection = response.candidates.map((c) => ({
          ...c,
          isSelected: !c.exists_in_db,
        }))

        setCandidates(candidatesWithSelection)
        setStatistics(response.statistics)
        return response
      } else {
        throw new Error(response.message || 'Failed to generate candidates')
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.error || err.message || 'Failed to generate candidates'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const toggleCandidate = (wikidataId) => {
    setCandidates((prev) =>
      prev.map((c) =>
        c.wikidata_id === wikidataId ? { ...c, isSelected: !c.isSelected } : c
      )
    )
  }

  const selectAll = () => {
    setCandidates((prev) => prev.map((c) => ({ ...c, isSelected: true })))
  }

  const selectOnlyNew = () => {
    setCandidates((prev) =>
      prev.map((c) => ({ ...c, isSelected: !c.exists_in_db }))
    )
  }

  const deselectAll = () => {
    setCandidates((prev) => prev.map((c) => ({ ...c, isSelected: false })))
  }

  const getSelectedCandidates = () => {
    return candidates.filter((c) => c.isSelected)
  }

  const getSelectedCount = () => {
    return candidates.filter((c) => c.isSelected).length
  }

  const clearCandidates = () => {
    setCandidates([])
    setStatistics(null)
    setError(null)
  }

  return {
    candidates,
    statistics,
    loading,
    error,
    generateCandidates,
    toggleCandidate,
    selectAll,
    selectOnlyNew,
    deselectAll,
    getSelectedCandidates,
    getSelectedCount,
    clearCandidates,
  }
}
