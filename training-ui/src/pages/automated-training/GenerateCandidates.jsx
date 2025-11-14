import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCandidates } from '../../hooks/useCandidates'
import { automatedTrainingService } from '../../services/automatedTraining'

export default function GenerateCandidates() {
  const navigate = useNavigate()
  const [countries, setCountries] = useState([])
  const [occupations, setOccupations] = useState([])
  const [selectedCountry, setSelectedCountry] = useState('serbia')
  const [selectedOccupation, setSelectedOccupation] = useState('actor')
  const [showFilter, setShowFilter] = useState('new') // 'all', 'new', 'existing'
  const [isGenerating, setIsGenerating] = useState(false)

  const {
    candidates,
    statistics,
    loading,
    error,
    generateCandidates,
    toggleCandidate,
    selectAll,
    selectOnlyNew,
    deselectAll,
    getSelectedCount,
    clearCandidates,
  } = useCandidates()

  // Load countries and occupations on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [countriesRes, occupationsRes] = await Promise.all([
          automatedTrainingService.getCountries(),
          automatedTrainingService.getOccupations(),
        ])
        if (countriesRes.success) setCountries(countriesRes.countries)
        if (occupationsRes.success) setOccupations(occupationsRes.occupations)
      } catch (err) {
        console.error('Failed to load data:', err)
      }
    }
    loadData()
  }, [])

  const handleGenerate = async () => {
    if (!selectedCountry || !selectedOccupation) return

    setIsGenerating(true)
    try {
      // Domain always equals country
      await generateCandidates(selectedCountry, selectedOccupation, selectedCountry)
      setShowFilter('new') // Reset to show new candidates
    } catch (err) {
      console.error('Generate failed:', err)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleStartTraining = async () => {
    const selectedCandidates = candidates.filter((c) => c.isSelected)
    if (selectedCandidates.length === 0) {
      alert('Please select at least one candidate')
      return
    }

    try {
      const response = await automatedTrainingService.startBatch(
        selectedCandidates,
        selectedCountry
      )
      if (response.success) {
        // Navigate to batch progress page
        navigate(`/training/automated/batch/${response.batch_id}`)
      }
    } catch (err) {
      console.error('Failed to start batch:', err)
    }
  }

  // Filter candidates based on showFilter
  const filteredCandidates = candidates.filter((c) => {
    if (showFilter === 'new') return !c.exists_in_db
    if (showFilter === 'existing') return c.exists_in_db
    return true // 'all'
  })

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Generate Training Candidates
        </h1>
        <p className="text-gray-600 mt-2">
          Select country and occupation to generate celebrity candidates from Wikidata
        </p>
      </div>

      {/* Selection Form */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Country
            </label>
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isGenerating || loading}
            >
              {countries.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Occupation
            </label>
            <select
              value={selectedOccupation}
              onChange={(e) => setSelectedOccupation(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isGenerating || loading}
            >
              {occupations.map((occupation) => (
                <option key={occupation.code} value={occupation.code}>
                  {occupation.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleGenerate}
              disabled={isGenerating || loading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isGenerating ? 'Generating...' : 'Generate from Wikidata'}
            </button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-6">
          <p className="font-medium">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Results Section */}
      {candidates.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          {/* Statistics */}
          {statistics && (
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Total Found</p>
                <p className="text-2xl font-bold text-blue-600">
                  {statistics.total}
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">New People</p>
                <p className="text-2xl font-bold text-green-600">
                  {statistics.new_people}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Already in DB</p>
                <p className="text-2xl font-bold text-gray-600">
                  {statistics.existing_people}
                </p>
              </div>
            </div>
          )}

          {/* Filter Buttons */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setShowFilter('new')}
              className={`px-4 py-2 rounded-md transition-colors ${
                showFilter === 'new'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Show Only New ({statistics?.new_people || 0})
            </button>
            <button
              onClick={() => setShowFilter('existing')}
              className={`px-4 py-2 rounded-md transition-colors ${
                showFilter === 'existing'
                  ? 'bg-gray-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Show Existing ({statistics?.existing_people || 0})
            </button>
            <button
              onClick={() => setShowFilter('all')}
              className={`px-4 py-2 rounded-md transition-colors ${
                showFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Show All ({statistics?.total || 0})
            </button>
          </div>

          {/* Selection Controls */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={selectOnlyNew}
              className="px-4 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
            >
              Select New Only
            </button>
            <button
              onClick={selectAll}
              className="px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
            >
              Select All
            </button>
            <button
              onClick={deselectAll}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              Deselect All
            </button>
            <button
              onClick={clearCandidates}
              className="px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors ml-auto"
            >
              Clear Results
            </button>
          </div>

          {/* Candidates List */}
          <div className="border border-gray-200 rounded-lg max-h-96 overflow-y-auto mb-6">
            {filteredCandidates.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No candidates match the current filter
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredCandidates.map((candidate) => (
                  <div
                    key={candidate.wikidata_id}
                    className="p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={candidate.isSelected}
                        onChange={() => toggleCandidate(candidate.wikidata_id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div className="ml-3 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900">
                            {candidate.name}
                          </p>
                          {candidate.exists_in_db ? (
                            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                              ✓ EXISTS
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">
                              ✨ NEW
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600">
                          <a
                            href={candidate.wikipedia_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            Wikipedia
                          </a>
                          {' • '}
                          <span>Wikidata: {candidate.wikidata_id}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Start Training Button */}
          <div className="flex justify-end">
            <button
              onClick={handleStartTraining}
              disabled={getSelectedCount() === 0}
              className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Start Training Process ({getSelectedCount()} selected)
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {candidates.length === 0 && !loading && !error && (
        <div className="bg-gray-50 rounded-lg p-12 text-center">
          <p className="text-gray-500 text-lg">
            Select a country and occupation, then click "Generate from Wikidata" to
            find celebrity candidates
          </p>
        </div>
      )}
    </div>
  )
}
