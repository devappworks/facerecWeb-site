import { useState } from 'react'
import { useMetrics } from '../../hooks/useMetrics'
import HelpButton from '../../components/HelpButton'

export default function DecisionSupport() {
  const [period] = useState('weekly')
  const { metrics, loading, error } = useMetrics(period, null, 30000)

  // Decision criteria weights
  const criteria = {
    accuracy: { weight: 0.35, threshold: 2 }, // 2% improvement
    confidence: { weight: 0.25, threshold: 3 }, // 3% improvement
    performance: { weight: 0.20, threshold: 10 }, // 10% faster
    agreement: { weight: 0.20, threshold: 85 }, // 85% agreement rate
  }

  // Calculate scores
  const calculateScores = () => {
    if (!metrics) return null

    const accuracyDiff =
      ((metrics.accuracy_comparison.pipeline_b_correct -
        metrics.accuracy_comparison.pipeline_a_correct) /
        metrics.accuracy_comparison.total_with_ground_truth) *
      100

    const confidenceDiff = metrics.avg_confidence_improvement

    const performanceDiff =
      ((metrics.avg_processing_time.pipeline_a - metrics.avg_processing_time.pipeline_b) /
        metrics.avg_processing_time.pipeline_a) *
      100

    const agreementRate = metrics.agreement_rate

    // Calculate weighted scores (0-100)
    const accuracyScore =
      accuracyDiff >= criteria.accuracy.threshold
        ? 100
        : accuracyDiff >= 0
          ? 50
          : 0
    const confidenceScore =
      confidenceDiff >= criteria.confidence.threshold
        ? 100
        : confidenceDiff >= 0
          ? 50
          : 0
    const performanceScore =
      performanceDiff >= criteria.performance.threshold
        ? 100
        : performanceDiff >= 0
          ? 50
          : 0
    const agreementScore =
      agreementRate >= criteria.agreement.threshold
        ? 100
        : agreementRate >= 70
          ? 50
          : 0

    const totalScore =
      accuracyScore * criteria.accuracy.weight +
      confidenceScore * criteria.confidence.weight +
      performanceScore * criteria.performance.weight +
      agreementScore * criteria.agreement.weight

    return {
      accuracy: { value: accuracyDiff, score: accuracyScore },
      confidence: { value: confidenceDiff, score: confidenceScore },
      performance: { value: performanceDiff, score: performanceScore },
      agreement: { value: agreementRate, score: agreementScore },
      total: totalScore,
    }
  }

  const scores = calculateScores()

  // Get recommendation
  const getRecommendation = () => {
    if (!scores) return null

    if (scores.total >= 80) {
      return {
        decision: 'Strong Recommendation to Migrate',
        color: '#10b981',
        icon: '✓✓',
        description:
          'Pipeline B (ArcFace) demonstrates significant improvements across all key metrics. Migration is strongly recommended.',
        confidence: 'High',
      }
    } else if (scores.total >= 60) {
      return {
        decision: 'Proceed with Migration',
        color: '#3b82f6',
        icon: '✓',
        description:
          'Pipeline B shows positive improvements in most areas. Migration is recommended with continued monitoring.',
        confidence: 'Moderate',
      }
    } else if (scores.total >= 40) {
      return {
        decision: 'Further Testing Recommended',
        color: '#f59e0b',
        icon: '⚠',
        description:
          'Results are mixed. Continue A/B testing to gather more data before making a final decision.',
        confidence: 'Low',
      }
    } else {
      return {
        decision: 'Do Not Migrate',
        color: '#ef4444',
        icon: '✗',
        description:
          'Pipeline B does not show sufficient improvements over Pipeline A. Migration is not recommended at this time.',
        confidence: 'High',
      }
    }
  }

  const recommendation = getRecommendation()

  const getScoreColor = (score) => {
    if (score >= 80) return '#10b981'
    if (score >= 50) return '#f59e0b'
    return '#ef4444'
  }

  return (
    <div className="page-container">
      <HelpButton pageName="ab-testing-decision" />
      <h1>A/B Testing - Decision Support</h1>
      <p className="subtitle">
        Analyze metrics and get recommendations for migration decision.
      </p>

      {/* Loading State */}
      {loading && !metrics && (
        <div className="card" style={{ marginTop: '2rem', textAlign: 'center' }}>
          <p>Loading decision analysis...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div
          className="card"
          style={{
            marginTop: '2rem',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderColor: '#ef4444',
          }}
        >
          <p style={{ color: '#ef4444', margin: 0 }}>⚠️ {error}</p>
        </div>
      )}

      {/* Decision Content */}
      {metrics && scores && recommendation && (
        <>
          {/* Recommendation Banner */}
          <div
            className="card"
            style={{
              marginTop: '2rem',
              backgroundColor: `${recommendation.color}15`,
              borderLeft: `4px solid ${recommendation.color}`,
              padding: '2rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                marginBottom: '1rem',
              }}
            >
              <div style={{ fontSize: '3rem' }}>{recommendation.icon}</div>
              <div>
                <h2 style={{ margin: 0, color: recommendation.color }}>
                  {recommendation.decision}
                </h2>
                <div
                  style={{
                    fontSize: '0.9rem',
                    color: '#999',
                    marginTop: '0.25rem',
                  }}
                >
                  Confidence: {recommendation.confidence} (Score: {scores.total.toFixed(1)}
                  /100)
                </div>
              </div>
            </div>
            <p style={{ margin: 0, fontSize: '1.1rem' }}>
              {recommendation.description}
            </p>
          </div>

          {/* Decision Matrix */}
          <div className="card" style={{ marginTop: '2rem' }}>
            <h2 style={{ marginTop: 0 }}>Decision Matrix</h2>
            <p style={{ color: '#999', marginTop: '0.5rem' }}>
              Weighted scoring based on {metrics.total_tests} tests
            </p>

            <div style={{ marginTop: '2rem' }}>
              {/* Accuracy */}
              <div style={{ marginBottom: '2rem' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '0.5rem',
                  }}
                >
                  <div>
                    <strong>Accuracy Improvement</strong>
                    <span style={{ marginLeft: '0.5rem', color: '#999' }}>
                      (Weight: {(criteria.accuracy.weight * 100).toFixed(0)}%)
                    </span>
                  </div>
                  <div>
                    <span
                      style={{
                        fontSize: '1.2rem',
                        fontWeight: 'bold',
                        color: getScoreColor(scores.accuracy.score),
                      }}
                    >
                      {scores.accuracy.value >= 0 ? '+' : ''}
                      {scores.accuracy.value.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div
                  style={{
                    height: '12px',
                    backgroundColor: 'rgba(107, 114, 128, 0.2)',
                    borderRadius: '6px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${scores.accuracy.score}%`,
                      backgroundColor: getScoreColor(scores.accuracy.score),
                    }}
                  />
                </div>
                <div style={{ marginTop: '0.25rem', fontSize: '0.85rem', color: '#999' }}>
                  {scores.accuracy.score === 100 && (
                    <span style={{ color: '#10b981' }}>
                      ✓ Exceeds threshold ({criteria.accuracy.threshold}%)
                    </span>
                  )}
                  {scores.accuracy.score === 50 && (
                    <span style={{ color: '#f59e0b' }}>
                      ⚠ Positive but below threshold ({criteria.accuracy.threshold}%)
                    </span>
                  )}
                  {scores.accuracy.score === 0 && (
                    <span style={{ color: '#ef4444' }}>✗ Below expectations</span>
                  )}
                </div>
              </div>

              {/* Confidence */}
              <div style={{ marginBottom: '2rem' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '0.5rem',
                  }}
                >
                  <div>
                    <strong>Confidence Improvement</strong>
                    <span style={{ marginLeft: '0.5rem', color: '#999' }}>
                      (Weight: {(criteria.confidence.weight * 100).toFixed(0)}%)
                    </span>
                  </div>
                  <div>
                    <span
                      style={{
                        fontSize: '1.2rem',
                        fontWeight: 'bold',
                        color: getScoreColor(scores.confidence.score),
                      }}
                    >
                      {scores.confidence.value >= 0 ? '+' : ''}
                      {scores.confidence.value.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div
                  style={{
                    height: '12px',
                    backgroundColor: 'rgba(107, 114, 128, 0.2)',
                    borderRadius: '6px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${scores.confidence.score}%`,
                      backgroundColor: getScoreColor(scores.confidence.score),
                    }}
                  />
                </div>
                <div style={{ marginTop: '0.25rem', fontSize: '0.85rem', color: '#999' }}>
                  {scores.confidence.score === 100 && (
                    <span style={{ color: '#10b981' }}>
                      ✓ Exceeds threshold ({criteria.confidence.threshold}%)
                    </span>
                  )}
                  {scores.confidence.score === 50 && (
                    <span style={{ color: '#f59e0b' }}>
                      ⚠ Positive but below threshold ({criteria.confidence.threshold}%)
                    </span>
                  )}
                  {scores.confidence.score === 0 && (
                    <span style={{ color: '#ef4444' }}>✗ Below expectations</span>
                  )}
                </div>
              </div>

              {/* Performance */}
              <div style={{ marginBottom: '2rem' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '0.5rem',
                  }}
                >
                  <div>
                    <strong>Performance Improvement</strong>
                    <span style={{ marginLeft: '0.5rem', color: '#999' }}>
                      (Weight: {(criteria.performance.weight * 100).toFixed(0)}%)
                    </span>
                  </div>
                  <div>
                    <span
                      style={{
                        fontSize: '1.2rem',
                        fontWeight: 'bold',
                        color: getScoreColor(scores.performance.score),
                      }}
                    >
                      {scores.performance.value >= 0 ? '+' : ''}
                      {scores.performance.value.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div
                  style={{
                    height: '12px',
                    backgroundColor: 'rgba(107, 114, 128, 0.2)',
                    borderRadius: '6px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${scores.performance.score}%`,
                      backgroundColor: getScoreColor(scores.performance.score),
                    }}
                  />
                </div>
                <div style={{ marginTop: '0.25rem', fontSize: '0.85rem', color: '#999' }}>
                  {scores.performance.score === 100 && (
                    <span style={{ color: '#10b981' }}>
                      ✓ Exceeds threshold ({criteria.performance.threshold}%)
                    </span>
                  )}
                  {scores.performance.score === 50 && (
                    <span style={{ color: '#f59e0b' }}>
                      ⚠ Positive but below threshold ({criteria.performance.threshold}%)
                    </span>
                  )}
                  {scores.performance.score === 0 && (
                    <span style={{ color: '#ef4444' }}>✗ Below expectations</span>
                  )}
                </div>
              </div>

              {/* Agreement */}
              <div style={{ marginBottom: '2rem' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '0.5rem',
                  }}
                >
                  <div>
                    <strong>Agreement Rate</strong>
                    <span style={{ marginLeft: '0.5rem', color: '#999' }}>
                      (Weight: {(criteria.agreement.weight * 100).toFixed(0)}%)
                    </span>
                  </div>
                  <div>
                    <span
                      style={{
                        fontSize: '1.2rem',
                        fontWeight: 'bold',
                        color: getScoreColor(scores.agreement.score),
                      }}
                    >
                      {scores.agreement.value.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div
                  style={{
                    height: '12px',
                    backgroundColor: 'rgba(107, 114, 128, 0.2)',
                    borderRadius: '6px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${scores.agreement.score}%`,
                      backgroundColor: getScoreColor(scores.agreement.score),
                    }}
                  />
                </div>
                <div style={{ marginTop: '0.25rem', fontSize: '0.85rem', color: '#999' }}>
                  {scores.agreement.score === 100 && (
                    <span style={{ color: '#10b981' }}>
                      ✓ Exceeds threshold ({criteria.agreement.threshold}%)
                    </span>
                  )}
                  {scores.agreement.score === 50 && (
                    <span style={{ color: '#f59e0b' }}>
                      ⚠ Acceptable but below threshold ({criteria.agreement.threshold}%)
                    </span>
                  )}
                  {scores.agreement.score === 0 && (
                    <span style={{ color: '#ef4444' }}>✗ Below expectations</span>
                  )}
                </div>
              </div>

              {/* Total Score */}
              <div
                style={{
                  marginTop: '2rem',
                  paddingTop: '2rem',
                  borderTop: '2px solid rgba(107, 114, 128, 0.2)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '0.5rem',
                  }}
                >
                  <strong style={{ fontSize: '1.2rem' }}>Overall Score</strong>
                  <span
                    style={{
                      fontSize: '2rem',
                      fontWeight: 'bold',
                      color: getScoreColor(scores.total),
                    }}
                  >
                    {scores.total.toFixed(1)}
                  </span>
                </div>
                <div
                  style={{
                    height: '16px',
                    backgroundColor: 'rgba(107, 114, 128, 0.2)',
                    borderRadius: '8px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${scores.total}%`,
                      backgroundColor: getScoreColor(scores.total),
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Key Insights */}
          <div className="card" style={{ marginTop: '2rem' }}>
            <h2 style={{ marginTop: 0 }}>Key Insights</h2>

            <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
              {/* Accuracy Insight */}
              <div
                style={{
                  padding: '1rem',
                  backgroundColor: 'rgba(107, 114, 128, 0.05)',
                  borderRadius: '8px',
                  borderLeft: `4px solid ${getScoreColor(scores.accuracy.score)}`,
                }}
              >
                <div style={{ fontWeight: '500', marginBottom: '0.5rem' }}>
                  Accuracy Analysis
                </div>
                <p style={{ margin: 0, fontSize: '0.95rem', color: '#999' }}>
                  Based on {metrics.accuracy_comparison.total_with_ground_truth} ground
                  truth tests, Pipeline B achieved{' '}
                  {metrics.accuracy_comparison.pipeline_b_correct} correct predictions vs
                  Pipeline A's {metrics.accuracy_comparison.pipeline_a_correct}.
                  {scores.accuracy.value > 0
                    ? ` This represents a ${scores.accuracy.value.toFixed(1)}% improvement.`
                    : scores.accuracy.value < 0
                      ? ` This is ${Math.abs(scores.accuracy.value).toFixed(1)}% worse than Pipeline A.`
                      : ' Both pipelines performed equally.'}
                </p>
              </div>

              {/* Agreement Insight */}
              <div
                style={{
                  padding: '1rem',
                  backgroundColor: 'rgba(107, 114, 128, 0.05)',
                  borderRadius: '8px',
                  borderLeft: `4px solid ${getScoreColor(scores.agreement.score)}`,
                }}
              >
                <div style={{ fontWeight: '500', marginBottom: '0.5rem' }}>
                  Agreement Analysis
                </div>
                <p style={{ margin: 0, fontSize: '0.95rem', color: '#999' }}>
                  The two pipelines agreed on {metrics.agreement_rate.toFixed(1)}% of all
                  tests.
                  {metrics.agreement_rate >= criteria.agreement.threshold
                    ? ' This high agreement rate indicates reliable and consistent results.'
                    : ' Lower agreement suggests the systems handle edge cases differently.'}
                </p>
              </div>

              {/* Performance Insight */}
              <div
                style={{
                  padding: '1rem',
                  backgroundColor: 'rgba(107, 114, 128, 0.05)',
                  borderRadius: '8px',
                  borderLeft: `4px solid ${getScoreColor(scores.performance.score)}`,
                }}
              >
                <div style={{ fontWeight: '500', marginBottom: '0.5rem' }}>
                  Performance Analysis
                </div>
                <p style={{ margin: 0, fontSize: '0.95rem', color: '#999' }}>
                  Pipeline B's average processing time is{' '}
                  {metrics.avg_processing_time.pipeline_b.toFixed(0)}ms compared to
                  Pipeline A's {metrics.avg_processing_time.pipeline_a.toFixed(0)}ms.
                  {scores.performance.value > 0
                    ? ` Pipeline B is ${scores.performance.value.toFixed(1)}% faster.`
                    : scores.performance.value < 0
                      ? ` Pipeline B is ${Math.abs(scores.performance.value).toFixed(1)}% slower.`
                      : ' Both pipelines have similar performance.'}
                </p>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="card" style={{ marginTop: '2rem' }}>
            <h2 style={{ marginTop: 0 }}>Recommended Next Steps</h2>

            <ol style={{ marginTop: '1rem', paddingLeft: '1.5rem' }}>
              {scores.total >= 80 && (
                <>
                  <li style={{ marginBottom: '0.75rem' }}>
                    <strong>Plan Migration Timeline:</strong> Begin planning the rollout
                    schedule for Pipeline B deployment
                  </li>
                  <li style={{ marginBottom: '0.75rem' }}>
                    <strong>Stakeholder Approval:</strong> Present these results to key
                    stakeholders for final sign-off
                  </li>
                  <li style={{ marginBottom: '0.75rem' }}>
                    <strong>Phased Rollout:</strong> Consider a gradual rollout starting
                    with low-risk deployments
                  </li>
                  <li style={{ marginBottom: '0.75rem' }}>
                    <strong>Monitoring Plan:</strong> Establish monitoring for post-migration
                    performance tracking
                  </li>
                </>
              )}
              {scores.total >= 60 && scores.total < 80 && (
                <>
                  <li style={{ marginBottom: '0.75rem' }}>
                    <strong>Extended Testing:</strong> Run A/B tests for another week to
                    confirm trends
                  </li>
                  <li style={{ marginBottom: '0.75rem' }}>
                    <strong>Edge Case Analysis:</strong> Review disagreement cases to
                    understand differences
                  </li>
                  <li style={{ marginBottom: '0.75rem' }}>
                    <strong>Pilot Deployment:</strong> Consider a limited pilot before full
                    migration
                  </li>
                  <li style={{ marginBottom: '0.75rem' }}>
                    <strong>Rollback Plan:</strong> Prepare rollback procedures in case issues
                    arise
                  </li>
                </>
              )}
              {scores.total >= 40 && scores.total < 60 && (
                <>
                  <li style={{ marginBottom: '0.75rem' }}>
                    <strong>Investigate Discrepancies:</strong> Analyze why results are mixed
                  </li>
                  <li style={{ marginBottom: '0.75rem' }}>
                    <strong>Expand Test Dataset:</strong> Include more diverse test cases
                  </li>
                  <li style={{ marginBottom: '0.75rem' }}>
                    <strong>Tune Parameters:</strong> Consider optimization of Pipeline B
                    settings
                  </li>
                  <li style={{ marginBottom: '0.75rem' }}>
                    <strong>Cost Analysis:</strong> Evaluate if partial improvements justify
                    migration costs
                  </li>
                </>
              )}
              {scores.total < 40 && (
                <>
                  <li style={{ marginBottom: '0.75rem' }}>
                    <strong>Root Cause Analysis:</strong> Investigate why Pipeline B
                    underperforms
                  </li>
                  <li style={{ marginBottom: '0.75rem' }}>
                    <strong>Model Retraining:</strong> Consider retraining Pipeline B with
                    better data
                  </li>
                  <li style={{ marginBottom: '0.75rem' }}>
                    <strong>Continue with Pipeline A:</strong> Maintain current system until
                    improvements are made
                  </li>
                  <li style={{ marginBottom: '0.75rem' }}>
                    <strong>Alternative Solutions:</strong> Explore other recognition models or
                    hybrid approaches
                  </li>
                </>
              )}
            </ol>
          </div>

          {/* Data Info */}
          <div
            style={{
              marginTop: '2rem',
              padding: '1rem',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              borderRadius: '8px',
              fontSize: '0.9rem',
              color: '#999',
            }}
          >
            ℹ️ Decision support based on weekly metrics from {metrics.total_tests} total
            tests. Scoring methodology: Accuracy (35%), Confidence (25%), Performance (20%),
            Agreement (20%).
          </div>
        </>
      )}
    </div>
  )
}
