import { useState, useEffect, useCallback } from 'react'
import { smartTrainingService } from '../../services/smartTraining'
import { useAuth } from '../../hooks/useAuth'
import AddToQueueModal from '../../components/AddToQueueModal'
import PriorityBadge from '../../components/PriorityBadge'
import '../../styles/smart-training.css'

export default function SmartQueue() {
  const { user } = useAuth()
  const [showAddModal, setShowAddModal] = useState(false)
  const [filter, setFilter] = useState('all') // all, high, medium, low
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedPeople, setSelectedPeople] = useState(new Set())
  const [removing, setRemoving] = useState(false)

  const domain = user?.domain || 'serbia'

  const fetchQueue = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await smartTrainingService.getTrainingQueue(domain)
      setData(result)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [domain])

  // Load once on mount and when domain changes (no auto-refresh)
  useEffect(() => {
    fetchQueue()
  }, [fetchQueue])

  const refetch = fetchQueue

  const queue = data?.queue || []
  const filteredQueue = filter === 'all'
    ? queue
    : queue.filter(p => p.priority === filter)

  // Toggle selection for a person
  const toggleSelect = (personName) => {
    setSelectedPeople(prev => {
      const newSet = new Set(prev)
      if (newSet.has(personName)) {
        newSet.delete(personName)
      } else {
        newSet.add(personName)
      }
      return newSet
    })
  }

  // Select all visible (filtered) people
  const selectAll = () => {
    const allNames = filteredQueue.map(p => p.person_name)
    setSelectedPeople(new Set(allNames))
  }

  // Deselect all
  const deselectAll = () => {
    setSelectedPeople(new Set())
  }

  // Check if all filtered items are selected
  const allSelected = filteredQueue.length > 0 &&
    filteredQueue.every(p => selectedPeople.has(p.person_name))

  const handleRemove = async (person) => {
    if (!confirm(`Remove ${person.person_name} from queue?`)) return

    try {
      await smartTrainingService.removeFromQueue(person.person_name, domain)
      refetch()
    } catch (err) {
      alert(`Failed to remove: ${err.message}`)
    }
  }

  const handleMoveToTop = async (person) => {
    try {
      // Always set to high priority and move to absolute top (order=0)
      await smartTrainingService.updatePriority(person.person_name, 'high', domain, true)
      refetch()
    } catch (err) {
      alert(`Failed to move to top: ${err.message}`)
    }
  }

  // Bulk remove selected people
  const handleBulkRemove = async () => {
    if (selectedPeople.size === 0) return

    const count = selectedPeople.size
    if (!confirm(`Remove ${count} selected people from queue?`)) return

    setRemoving(true)
    try {
      // Remove all selected people (in parallel batches)
      const names = Array.from(selectedPeople)
      const batchSize = 5

      for (let i = 0; i < names.length; i += batchSize) {
        const batch = names.slice(i, i + batchSize)
        await Promise.all(
          batch.map(name => smartTrainingService.removeFromQueue(name, domain))
        )
      }

      setSelectedPeople(new Set())
      refetch()
    } catch (err) {
      alert(`Failed to remove some people: ${err.message}`)
      refetch()
    } finally {
      setRemoving(false)
    }
  }

  return (
    <div className="page-container">
      <div className="dashboard-header">
        <div>
          <h1>Training Queue Management</h1>
          <p className="subtitle">Manage people waiting for training - <strong>{domain}</strong></p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className="btn btn-secondary"
            onClick={refetch}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
          <button
            className="btn btn-primary"
            onClick={() => setShowAddModal(true)}
          >
            + Add Person
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Filters */}
      <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button
          className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setFilter('all')}
        >
          All ({queue.length})
        </button>
        <button
          className={`btn ${filter === 'high' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setFilter('high')}
        >
          High ({queue.filter(p => p.priority === 'high').length})
        </button>
        <button
          className={`btn ${filter === 'medium' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setFilter('medium')}
        >
          Medium ({queue.filter(p => p.priority === 'medium').length})
        </button>
        <button
          className={`btn ${filter === 'low' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setFilter('low')}
        >
          Low ({queue.filter(p => p.priority === 'low').length})
        </button>
      </div>

      {/* Selection Controls */}
      {filteredQueue.length > 0 && (
        <div style={{
          marginBottom: '1rem',
          padding: '0.75rem 1rem',
          background: selectedPeople.size > 0 ? '#fef3c7' : '#f3f4f6',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={allSelected}
                onChange={() => allSelected ? deselectAll() : selectAll()}
                style={{ width: '18px', height: '18px' }}
              />
              <span style={{ fontWeight: 500 }}>
                {allSelected ? 'Deselect All' : 'Select All'}
              </span>
            </label>
            {selectedPeople.size > 0 && (
              <span style={{ color: '#92400e', fontWeight: 600 }}>
                {selectedPeople.size} selected
              </span>
            )}
          </div>

          {selectedPeople.size > 0 && (
            <button
              className="btn btn-danger"
              onClick={handleBulkRemove}
              disabled={removing}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              {removing ? 'Removing...' : `Remove ${selectedPeople.size} Selected`}
            </button>
          )}
        </div>
      )}

      {/* Queue List */}
      {loading && !data ? (
        <div className="text-muted">Loading queue...</div>
      ) : filteredQueue.length === 0 ? (
        <div
          style={{
            background: 'white',
            padding: '3rem',
            borderRadius: '12px',
            textAlign: 'center',
            color: '#6b7280',
          }}
        >
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📭</div>
          <h3>{filter === 'all' ? 'No people in queue' : `No ${filter} priority people`}</h3>
          <p>Add people to start training</p>
        </div>
      ) : (
        <div className="queue-table-container">
          <table className="queue-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}></th>
                <th>Person</th>
                <th>Priority</th>
                <th>Source</th>
                <th>Recognition Score</th>
                <th>Added</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredQueue.map((person, index) => (
                <tr
                  key={index}
                  style={{
                    background: selectedPeople.has(person.person_name) ? '#fef9c3' : undefined
                  }}
                >
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedPeople.has(person.person_name)}
                      onChange={() => toggleSelect(person.person_name)}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{person.person_name}</div>
                    {person.wikidata_id && (
                      <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                        {person.wikidata_id}
                      </div>
                    )}
                  </td>
                  <td>
                    <PriorityBadge priority={person.priority} />
                  </td>
                  <td>{person.source || 'manual'}</td>
                  <td>
                    {person.recognition_score !== undefined && person.recognition_score !== null
                      ? `${person.recognition_score}%`
                      : 'N/A'}
                  </td>
                  <td style={{ fontSize: '0.875rem' }}>
                    {person.added_at ? new Date(person.added_at).toLocaleDateString() : 'N/A'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        className="btn btn-secondary"
                        onClick={() => handleMoveToTop(person)}
                        style={{ padding: '0.5rem 0.75rem', fontSize: '0.875rem' }}
                        title="Move to absolute top of queue"
                      >
                        ⬆️ Top
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={() => handleRemove(person)}
                        style={{ padding: '0.5rem 1rem' }}
                      >
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AddToQueueModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => refetch()}
      />
    </div>
  )
}
