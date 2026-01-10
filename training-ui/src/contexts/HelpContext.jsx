import { createContext, useContext, useState } from 'react'

const HelpContext = createContext()

export function HelpProvider({ children }) {
  const [helpModalOpen, setHelpModalOpen] = useState(false)
  const [currentHelpPage, setCurrentHelpPage] = useState(null)
  const [tutorialActive, setTutorialActive] = useState(false)
  const [tutorialStep, setTutorialStep] = useState(0)

  const openHelp = (pageName) => {
    setCurrentHelpPage(pageName)
    setHelpModalOpen(true)
  }

  const closeHelp = () => {
    setHelpModalOpen(false)
    setCurrentHelpPage(null)
  }

  const startTutorial = () => {
    setTutorialActive(true)
    setTutorialStep(0)
  }

  const nextTutorialStep = () => {
    setTutorialStep((prev) => prev + 1)
  }

  const previousTutorialStep = () => {
    setTutorialStep((prev) => Math.max(0, prev - 1))
  }

  const endTutorial = () => {
    setTutorialActive(false)
    setTutorialStep(0)
    localStorage.setItem('tutorial_completed', 'true')
  }

  const shouldShowTutorial = () => {
    return !localStorage.getItem('tutorial_completed')
  }

  return (
    <HelpContext.Provider
      value={{
        helpModalOpen,
        currentHelpPage,
        tutorialActive,
        tutorialStep,
        openHelp,
        closeHelp,
        startTutorial,
        nextTutorialStep,
        previousTutorialStep,
        endTutorial,
        shouldShowTutorial,
      }}
    >
      {children}
    </HelpContext.Provider>
  )
}

export function useHelp() {
  const context = useContext(HelpContext)
  if (!context) {
    throw new Error('useHelp must be used within HelpProvider')
  }
  return context
}
