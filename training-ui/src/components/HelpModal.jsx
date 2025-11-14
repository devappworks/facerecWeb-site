import { useHelp } from '../contexts/HelpContext'
import { helpContent } from '../data/helpContent'
import '../styles/help-modal.css'

export default function HelpModal() {
  const { helpModalOpen, currentHelpPage, closeHelp } = useHelp()

  if (!helpModalOpen || !currentHelpPage) return null

  const content = helpContent[currentHelpPage]

  if (!content) return null

  return (
    <div className="help-modal-overlay" onClick={closeHelp}>
      <div className="help-modal" onClick={(e) => e.stopPropagation()}>
        <div className="help-modal-header">
          <h2>{content.title} - Help</h2>
          <button className="help-modal-close" onClick={closeHelp}>
            ✕
          </button>
        </div>
        <div className="help-modal-content">
          {content.sections.map((section, index) => (
            <div key={index} className="help-section">
              <h3>{section.heading}</h3>
              <p>{section.content}</p>
            </div>
          ))}
        </div>
        <div className="help-modal-footer">
          <button className="btn btn-primary" onClick={closeHelp}>
            Got it!
          </button>
        </div>
      </div>
    </div>
  )
}
