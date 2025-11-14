import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { automatedTrainingService } from '../../services/automatedTraining'

export default function ReviewDeploy() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [stagingList, setStagingList] = useState([])
  const [selectedPeople, setSelectedPeople] = useState([])
  const [deploying, setDeploying] = useState(false)
  const [deploymentResult, setDeploymentResult] = useState(null)

  useEffect(() => {
    loadStagingList()
  }, [])

  const loadStagingList = async () => {
    setLoading(true)
    setError(null)
    try {
      // Domain is hardcoded to serbia for now
      const response = await automatedTrainingService.getStagingList('serbia')
      if (response.success) {
        setStagingList(response.people)
        // Auto-select ready people
        const readyPeople = response.people
          .filter((p) => p.ready_for_production)
          .map((p) => p.folder_name)
        setSelectedPeople(readyPeople)
      } else {
        throw new Error(response.message || 'Failed to load staging list')
      }
    } catch (err) {
      setError(err.message || 'Failed to load staging list')
    } finally {
      setLoading(false)
    }
  }

  const handleTogglePerson = (folderName) => {
    setSelectedPeople((prev) =>
      prev.includes(folderName)
        ? prev.filter((f) => f !== folderName)
        : [...prev, folderName]
    )
  }

  const handleSelectAllReady = () => {
    const readyPeople = stagingList
      .filter((p) => p.ready_for_production)
      .map((p) => p.folder_name)
    setSelectedPeople(readyPeople)
  }

  const handleDeselectAll = () => {
    setSelectedPeople([])
  }

  const handleDeploy = async () => {
    if (selectedPeople.length === 0) {
      alert('Please select at least one person to deploy')
      return
    }

    if (!confirm(`Deploy ${selectedPeople.length} people to production?`)) {
      return
    }

    setDeploying(true)
    setDeploymentResult(null)
    setError(null)

    try {
      // Domain is hardcoded to serbia for now
      const response = await automatedTrainingService.deployToProduction(
        selectedPeople,
        'serbia'
      )
      if (response.success) {
        setDeploymentResult(response)
        // Reload staging list to reflect changes
        setTimeout(() => {
          loadStagingList()
          setSelectedPeople([])
        }, 2000)
      } else {
        throw new Error(response.message || 'Deployment failed')
      }
    } catch (err) {
      setError(err.message || 'Deployment failed')
    } finally {
      setDeploying(false)
    }
  }

  const readyPeople = stagingList.filter((p) => p.ready_for_production)
  const notReadyPeople = stagingList.filter((p) => !p.ready_for_production)

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading staging list...</p>
        </div>
      </div>
    )
  }

  if (error && !deploymentResult) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-6">
          <p className="font-medium">Error</p>
          <p className="text-sm mt-2">{error}</p>
          <button
            onClick={loadStagingList}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Review & Deploy</h1>
        <p className="text-gray-600 mt-2">
          Review trained people in staging and deploy to production
        </p>
      </div>

      {/* Deployment Result */}
      {deploymentResult && (
        <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-6 mb-6">
          <p className="font-medium text-lg">Deployment Complete!</p>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium">Successfully Deployed</p>
              <p className="text-2xl font-bold text-green-600">
                {deploymentResult.deployed?.length || 0}
              </p>
              {deploymentResult.deployed?.length > 0 && (
                <ul className="mt-2 text-xs space-y-1">
                  {deploymentResult.deployed.map((name) => (
                    <li key={name}>✓ {name}</li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <p className="text-sm font-medium">Skipped (Not Ready)</p>
              <p className="text-2xl font-bold text-yellow-600">
                {deploymentResult.skipped?.length || 0}
              </p>
              {deploymentResult.skipped?.length > 0 && (
                <ul className="mt-2 text-xs space-y-1">
                  {deploymentResult.skipped.map((name) => (
                    <li key={name}>⚠ {name}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Total in Staging</p>
          <p className="text-2xl font-bold text-blue-600">
            {stagingList.length}
          </p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Ready for Production</p>
          <p className="text-2xl font-bold text-green-600">
            {readyPeople.length}
          </p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Not Ready</p>
          <p className="text-2xl font-bold text-yellow-600">
            {notReadyPeople.length}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={handleSelectAllReady}
          className="px-4 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
        >
          Select All Ready ({readyPeople.length})
        </button>
        <button
          onClick={handleDeselectAll}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
        >
          Deselect All
        </button>
        <button
          onClick={loadStagingList}
          className="px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
        >
          🔄 Refresh
        </button>
        <button
          onClick={handleDeploy}
          disabled={deploying || selectedPeople.length === 0}
          className="ml-auto px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {deploying
            ? 'Deploying...'
            : `Deploy to Production (${selectedPeople.length} selected)`}
        </button>
      </div>

      {/* Ready for Production */}
      {readyPeople.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Ready for Production
            <span className="ml-2 text-sm font-normal text-gray-600">
              (≥5 valid photos)
            </span>
          </h2>
          <div className="space-y-3">
            {readyPeople.map((person) => (
              <div
                key={person.folder_name}
                className="border border-green-200 bg-green-50 rounded-lg p-4"
              >
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedPeople.includes(person.folder_name)}
                    onChange={() => handleTogglePerson(person.folder_name)}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <div className="ml-3 flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          {person.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          Folder: {person.folder_name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-green-700">
                          ✓ Ready
                        </p>
                        <p className="text-sm text-gray-600">
                          {person.valid_photos} valid photos
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Not Ready for Production */}
      {notReadyPeople.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Not Ready for Production
            <span className="ml-2 text-sm font-normal text-gray-600">
              (&lt;5 valid photos - will be auto-deleted)
            </span>
          </h2>
          <div className="space-y-3">
            {notReadyPeople.map((person) => (
              <div
                key={person.folder_name}
                className="border border-yellow-200 bg-yellow-50 rounded-lg p-4 opacity-75"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{person.name}</p>
                    <p className="text-sm text-gray-600">
                      Folder: {person.folder_name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-yellow-700">
                      ⚠ Not Ready
                    </p>
                    <p className="text-sm text-gray-600">
                      Only {person.valid_photos} valid photos
                    </p>
                    <p className="text-xs text-red-600 mt-1">
                      Needs {5 - person.valid_photos} more
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-sm text-gray-600 bg-yellow-100 p-3 rounded">
            <p className="font-medium">Note:</p>
            <p>
              People with fewer than 5 valid photos will be automatically deleted
              from staging and cannot be deployed to production.
            </p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {stagingList.length === 0 && (
        <div className="bg-gray-50 rounded-lg p-12 text-center">
          <p className="text-gray-500 text-lg">
            No people in staging. Complete a batch training first.
          </p>
          <button
            onClick={() => navigate('/training/automated/generate')}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Start New Batch
          </button>
        </div>
      )}
    </div>
  )
}
