import '../styles/smart-training.css'

export default function ScoreGauge({ score, size = 80 }) {
  const normalizedScore = Math.min(Math.max(score || 0, 0), 100)
  const radius = (size - 8) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (normalizedScore / 100) * circumference

  const getScoreClass = () => {
    if (normalizedScore >= 80) return 'score-high'
    if (normalizedScore >= 50) return 'score-medium'
    return 'score-low'
  }

  return (
    <div className="score-gauge" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle
          className="gauge-bg"
          cx={size / 2}
          cy={size / 2}
          r={radius}
        />
        <circle
          className={`gauge-fill ${getScoreClass()}`}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="score-gauge-label">
        {Math.round(normalizedScore)}
      </div>
    </div>
  )
}
