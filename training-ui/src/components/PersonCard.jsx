import PriorityBadge from './PriorityBadge'
import ScoreGauge from './ScoreGauge'
import '../styles/smart-training.css'

export default function PersonCard({ person, showScore = false, onRemove, onBenchmark, onTrain }) {
  const formatDate = (dateString) => {
    if (!dateString) return 'Never'
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffMs = now - date
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60))

      if (diffHours < 1) return 'Just now'
      if (diffHours < 24) return `${diffHours}h ago`
      const diffDays = Math.floor(diffHours / 24)
      if (diffDays < 7) return `${diffDays}d ago`
      return date.toLocaleDateString()
    } catch {
      return dateString
    }
  }

  return (
    <div className="person-card">
      <div className="person-card-header">
        {person.image_url && (
          <img
            src={person.image_url}
            alt={person.person_name || person.name}
            className="person-card-image"
            onError={(e) => {
              e.target.style.display = 'none'
            }}
          />
        )}
        <div className="person-card-info">
          <h3 className="person-card-name">{person.person_name || person.name}</h3>
          <p className="person-card-meta">
            {person.description || person.occupation || 'Celebrity'}
          </p>
          {person.priority && <PriorityBadge priority={person.priority} />}
        </div>
        {showScore && person.recognition_score !== undefined && (
          <ScoreGauge score={person.recognition_score} size={64} />
        )}
      </div>

      {showScore && (
        <div className="person-card-stats">
          <div className="person-card-stat">
            <div className="person-card-stat-label">Recognition</div>
            <div className="person-card-stat-value">
              {person.recognition_score !== undefined ? `${person.recognition_score}%` : 'N/A'}
            </div>
          </div>
          <div className="person-card-stat">
            <div className="person-card-stat-label">Last Checked</div>
            <div className="person-card-stat-value" style={{ fontSize: '0.875rem' }}>
              {formatDate(person.last_benchmark || person.added_at)}
            </div>
          </div>
        </div>
      )}

      <div className="person-card-actions">
        {onBenchmark && (
          <button
            className="btn btn-secondary"
            onClick={() => onBenchmark(person)}
            title="Run recognition benchmark"
          >
            📊 Benchmark
          </button>
        )}
        {onTrain && (
          <button
            className="btn btn-primary"
            onClick={() => onTrain(person)}
            title="Train this person"
          >
            🎯 Train
          </button>
        )}
        {onRemove && (
          <button
            className="btn btn-danger"
            onClick={() => onRemove(person)}
            title="Remove from queue"
            style={{ marginLeft: 'auto' }}
          >
            🗑️
          </button>
        )}
      </div>
    </div>
  )
}
