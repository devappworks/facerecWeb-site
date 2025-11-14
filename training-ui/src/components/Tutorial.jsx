import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useHelp } from '../contexts/HelpContext'
import '../styles/tutorial.css'

const tutorialSteps = [
  {
    title: 'Welcome to Training UI!',
    content:
      'This interactive tutorial will guide you through the main features of the application. You can skip this tutorial at any time.',
    image: '📚',
  },
  {
    title: 'Dashboard Overview',
    content:
      'The Dashboard shows your training system status, including queue statistics and recent activity. It\'s your home base for monitoring everything.',
    image: '📊',
    route: '/dashboard',
  },
  {
    title: 'Manual Training',
    content:
      'Use "Generate Names" to manually add people to the training queue. Then manage them in the "Queue Manager" and watch progress in the "Progress Monitor".',
    image: '✨',
    route: '/generate',
  },
  {
    title: 'Automated Training (NEW!)',
    content:
      'Our newest feature! Automatically find celebrities from Wikipedia/Wikidata by country and occupation. FREE and uses real public data. Train multiple people in batches.',
    image: '🤖',
    route: '/training/automated/generate',
  },
  {
    title: 'A/B Testing',
    content:
      'Compare different face recognition models side-by-side. Run tests, analyze metrics, and make data-driven decisions about which model to deploy.',
    image: '⚖️',
    route: '/ab-testing/live',
  },
  {
    title: 'Getting Help',
    content:
      'See the blue ? button in the bottom-right corner? Click it on any page to get detailed help. Hover over UI elements for quick tips.',
    image: '❓',
  },
  {
    title: 'Ready to Start!',
    content:
      'You\'re all set! Explore the application at your own pace. Remember, you can always click the ? button for help on any page.',
    image: '🚀',
  },
]

export default function Tutorial() {
  const navigate = useNavigate()
  const {
    tutorialActive,
    tutorialStep,
    nextTutorialStep,
    previousTutorialStep,
    endTutorial,
  } = useHelp()

  const currentStep = tutorialSteps[tutorialStep]
  const isLastStep = tutorialStep === tutorialSteps.length - 1
  const isFirstStep = tutorialStep === 0

  useEffect(() => {
    if (currentStep?.route && tutorialActive) {
      navigate(currentStep.route)
    }
  }, [tutorialStep, currentStep, tutorialActive, navigate])

  if (!tutorialActive) return null

  return (
    <div className="tutorial-overlay">
      <div className="tutorial-modal">
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
  )
}
