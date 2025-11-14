import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useHelp } from '../contexts/HelpContext'
import '../styles/tutorial.css'

const tutorialSteps = [
  {
    title: 'Welcome to Training UI!',
    content:
      'This interactive tutorial will guide you through the main features of the application. You can skip this tutorial at any time.',
    image: '📚',
    route: '/dashboard',
  },
  {
    title: 'Dashboard Overview',
    content:
      'The Dashboard shows your training system status, including queue statistics and recent activity. It\'s your home base for monitoring everything.',
    image: '📊',
    route: '/dashboard',
    target: 'a[href="/dashboard"]',
    arrowPosition: 'right',
  },
  {
    title: 'Sidebar Navigation',
    content:
      'Use the sidebar to navigate between different sections. The main training pages are at the top.',
    image: '🧭',
    route: '/dashboard',
    target: '.sidebar',
    arrowPosition: 'right',
  },
  {
    title: 'Training Workflow',
    content:
      'Add people to train manually via "Generate Names" or use AI-powered Automated Training to find celebrities from Wikipedia/Wikidata automatically. The workflow is semi-automated and uses AI to increase speed!',
    image: '🤖',
    route: '/dashboard',
    target: 'a[href="/generate"]',
    arrowPosition: 'right',
  },
  {
    title: 'A/B Testing',
    content:
      'Compare different face recognition models side-by-side. Find it in the A/B Testing section of the sidebar.',
    image: '⚖️',
    route: '/dashboard',
    target: '.nav-section-toggle',
    arrowPosition: 'right',
  },
  {
    title: 'Video Recognition (NEW!)',
    content:
      'Upload videos to automatically extract frames and recognize faces in each frame. Perfect for analyzing video footage!',
    image: '🎬',
    route: '/dashboard',
    target: 'a[href="/video-recognition"]',
    arrowPosition: 'right',
  },
  {
    title: 'Getting Help',
    content:
      'See the blue ? button? Click it on any page to get detailed help. Hover over UI elements for quick tips.',
    image: '❓',
    route: '/dashboard',
    target: '.help-button',
    arrowPosition: 'left',
  },
  {
    title: 'Ready to Start!',
    content:
      'You\'re all set! Explore the application at your own pace. Remember, you can always click the ? button for help on any page.',
    image: '🚀',
    route: '/dashboard',
  },
]

export default function Tutorial() {
  const navigate = useNavigate()
  const location = useLocation()
  const {
    tutorialActive,
    tutorialStep,
    nextTutorialStep,
    previousTutorialStep,
    endTutorial,
  } = useHelp()

  const [targetElement, setTargetElement] = useState(null)
  const [spotlightPosition, setSpotlightPosition] = useState(null)

  const currentStep = tutorialSteps[tutorialStep]
  const isLastStep = tutorialStep === tutorialSteps.length - 1
  const isFirstStep = tutorialStep === 0

  // Find and highlight target element
  const updateSpotlight = useCallback(() => {
    if (!currentStep?.target) {
      setTargetElement(null)
      setSpotlightPosition(null)
      return
    }

    // Wait a bit for page to render
    setTimeout(() => {
      let element = document.querySelector(currentStep.target)

      // Try fallback if main target not found
      if (!element && currentStep.fallbackTarget) {
        element = document.querySelector(currentStep.fallbackTarget)
      }

      if (element) {
        const rect = element.getBoundingClientRect()
        setTargetElement(element)
        setSpotlightPosition({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        })
      } else {
        setTargetElement(null)
        setSpotlightPosition(null)
      }
    }, 300)
  }, [currentStep])

  // Navigate to route and update spotlight
  useEffect(() => {
    if (currentStep?.route && tutorialActive) {
      if (location.pathname !== currentStep.route) {
        navigate(currentStep.route)
      }
    }
  }, [tutorialStep, currentStep, tutorialActive, navigate, location.pathname])

  // Update spotlight when step changes or window resizes
  useEffect(() => {
    if (tutorialActive) {
      updateSpotlight()
      window.addEventListener('resize', updateSpotlight)
      return () => window.removeEventListener('resize', updateSpotlight)
    }
  }, [tutorialActive, tutorialStep, updateSpotlight])

  if (!tutorialActive) return null

  // Calculate modal position to avoid covering highlighted element
  const getModalPosition = () => {
    if (!spotlightPosition) return {}

    const modalHeight = 400 // Approximate modal height
    const modalWidth = 600 // Approximate modal width
    const windowHeight = window.innerHeight
    const windowWidth = window.innerWidth

    // Try to position modal away from spotlight
    let top = '50%'
    let left = '50%'
    let transform = 'translate(-50%, -50%)'

    if (spotlightPosition) {
      // If spotlight is on the left, move modal to the right
      if (spotlightPosition.left < windowWidth / 2) {
        left = 'auto'
        transform = 'translateY(-50%)'
        // Position to the right of spotlight
        const rightSpace = windowWidth - (spotlightPosition.left + spotlightPosition.width + 40)
        if (rightSpace > modalWidth) {
          left = `${spotlightPosition.left + spotlightPosition.width + 40}px`
        } else {
          left = '60%'
          transform = 'translate(-50%, -50%)'
        }
      }
      // If spotlight is at top, move modal to bottom
      else if (spotlightPosition.top < windowHeight / 3) {
        top = 'auto'
        bottom = '5%'
        transform = 'translateX(-50%)'
      }
      // If spotlight is at bottom, move modal to top
      else if (spotlightPosition.top > (windowHeight * 2) / 3) {
        top = '20%'
        transform = 'translate(-50%, 0)'
      }
    }

    return { top, left, transform, bottom: undefined }
  }

  return (
    <>
      {/* Spotlight Overlay */}
      <div className="tutorial-spotlight-overlay">
        {spotlightPosition && (
          <>
            {/* Spotlight highlight */}
            <div
              className="tutorial-spotlight-highlight"
              style={{
                top: `${spotlightPosition.top - 8}px`,
                left: `${spotlightPosition.left - 8}px`,
                width: `${spotlightPosition.width + 16}px`,
                height: `${spotlightPosition.height + 16}px`,
              }}
            />
            {/* Arrow pointing to element */}
            {currentStep.arrowPosition && (
              <div
                className={`tutorial-arrow tutorial-arrow-${currentStep.arrowPosition}`}
                style={{
                  top: `${
                    currentStep.arrowPosition === 'top'
                      ? spotlightPosition.top - 40
                      : currentStep.arrowPosition === 'bottom'
                      ? spotlightPosition.top + spotlightPosition.height + 20
                      : spotlightPosition.top + spotlightPosition.height / 2 - 20
                  }px`,
                  left: `${
                    currentStep.arrowPosition === 'left'
                      ? spotlightPosition.left - 60
                      : currentStep.arrowPosition === 'right'
                      ? spotlightPosition.left + spotlightPosition.width + 20
                      : spotlightPosition.left + spotlightPosition.width / 2 - 20
                  }px`,
                }}
              >
                {currentStep.arrowPosition === 'left' && '👉'}
                {currentStep.arrowPosition === 'right' && '👈'}
                {currentStep.arrowPosition === 'top' && '👇'}
                {currentStep.arrowPosition === 'bottom' && '👆'}
              </div>
            )}
          </>
        )}

        {/* Tutorial Modal */}
        <div
          className="tutorial-modal"
          style={getModalPosition()}
        >
          <div className="tutorial-progress">
            <div className="tutorial-progress-bar">
              <div
                className="tutorial-progress-fill"
                style={{
                  width: `${((tutorialStep + 1) / tutorialSteps.length) * 100}%`,
                }}
              />
            </div>
            <span className="tutorial-progress-text">
              Step {tutorialStep + 1} of {tutorialSteps.length}
            </span>
          </div>

          <div className="tutorial-content">
            <div className="tutorial-image">{currentStep.image}</div>
            <h2 className="tutorial-title">{currentStep.title}</h2>
            <p className="tutorial-text">{currentStep.content}</p>
          </div>

          <div className="tutorial-actions">
            <button className="tutorial-btn tutorial-btn-skip" onClick={endTutorial}>
              Skip Tutorial
            </button>
            <div className="tutorial-nav">
              {!isFirstStep && (
                <button
                  className="tutorial-btn tutorial-btn-secondary"
                  onClick={previousTutorialStep}
                >
                  Previous
                </button>
              )}
              {!isLastStep ? (
                <button
                  className="tutorial-btn tutorial-btn-primary"
                  onClick={nextTutorialStep}
                >
                  Next
                </button>
              ) : (
                <button className="tutorial-btn tutorial-btn-primary" onClick={endTutorial}>
                  Get Started!
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
