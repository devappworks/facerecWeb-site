import { useState } from 'react'
import '../styles/tooltip.css'

export default function Tooltip({ children, content, position = 'top' }) {
  const [visible, setVisible] = useState(false)

  if (!content) return children

  return (
    <div
      className="tooltip-wrapper"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div className={`tooltip tooltip-${position}`}>
          {content}
        </div>
      )}
    </div>
  )
}
