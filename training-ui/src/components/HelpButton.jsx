import { useHelp } from '../contexts/HelpContext'
import Tooltip from './Tooltip'
import '../styles/help-button.css'

export default function HelpButton({ pageName }) {
  const { openHelp } = useHelp()

  return (
    <Tooltip content="Get help for this page" position="left">
      <button
        className="help-button"
        onClick={() => openHelp(pageName)}
        aria-label="Help"
      >
        ?
      </button>
    </Tooltip>
  )
}
