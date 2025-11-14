import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useHelp } from '../contexts/HelpContext'
import { useAuth } from '../hooks/useAuth'

export default function TutorialTrigger() {
  const { isAuthenticated } = useAuth()
  const { shouldShowTutorial, startTutorial, tutorialActive } = useHelp()
  const location = useLocation()

  useEffect(() => {
    // Only trigger on dashboard after login, and only if not already active
    if (
      isAuthenticated &&
      location.pathname === '/dashboard' &&
      shouldShowTutorial() &&
      !tutorialActive
    ) {
      // Delay slightly to let the page load
      const timer = setTimeout(() => {
        startTutorial()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [isAuthenticated, location.pathname, shouldShowTutorial, startTutorial, tutorialActive])

  return null
}
