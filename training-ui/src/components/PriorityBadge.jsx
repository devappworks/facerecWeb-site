import '../styles/smart-training.css'

export default function PriorityBadge({ priority }) {
  const getIcon = () => {
    switch (priority) {
      case 'high':
        return '🔴'
      case 'medium':
        return '🟡'
      case 'low':
        return '🟢'
      default:
        return '⚪'
    }
  }

  return (
    <span className={`priority-badge ${priority || 'medium'}`}>
      <span>{getIcon()}</span>
      <span>{priority || 'medium'}</span>
    </span>
  )
}
