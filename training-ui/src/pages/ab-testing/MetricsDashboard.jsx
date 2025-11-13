import { useState } from 'react'
import { useMetrics } from '../../hooks/useMetrics'

export default function MetricsDashboard() {
  const [period, setPeriod] = useState('daily')
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  )

  const { metrics, loading, error, isPolling, startPolling, stopPolling } =
    useMetrics(period, period === 'daily' ? selectedDate : null, 30000)

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod)
  }

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value)
  }

  // Calculate improvement percentages
  const getImprovementColor = (value) => {
    if (value > 0) return '#10b981'
    if (value < 0) return '#ef4444'
    return '#6b7280'
  }

  const getImprovementIcon = (value) => {
    if (value > 0) return '↑'
    if (value < 0) return '↓'
    return '='
  }

  return (
    <div className="page-container">
      <h1>A/B Testing - Metrics Dashboard</h1>
      <p className="subtitle">
        View statistics and performance metrics for both recognition systems.
      </p>

      {/* Controls */}
      <div
        style={{
          display: 'flex',
          gap: '1rem',
          alignItems: 'center',
          marginTop: '2rem',
          flexWrap: 'wrap',
        }}
      >
        {/* Period Selector */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className={`btn ${period === 'daily' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => handlePeriodChange('daily')}
            style={{ padding: '0.5rem 1rem' }}
          >
            Daily
          </button>
          <button
            className={`btn ${period === 'weekly' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => handlePeriodChange('weekly')}
            style={{ padding: '0.5rem 1rem' }}
          >
            Weekly
          </button>
        </div>

        {/* Date Picker (only for daily) */}
        {period === 'daily' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label htmlFor="date-picker" style={{ fontWeight: '500' }}>
              Date:
            </label>
            <input
              id="date-picker"
              type="date"
              value={selectedDate}
              onChange={handleDateChange}
              max={new Date().toISOString().split('T')[0]}
              className="input"
              style={{ padding: '0.5rem' }}
            />
          </div>
        )}

        {/* Polling Status */}
        <div
          style={{
            marginLeft: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          {isPolling && (
            <span style={{ fontSize: '0.9rem', color: '#6b7280' }}>
              🔄 Auto-updating every 30s
            </span>
          )}
          <button
            className="btn btn-secondary"
            onClick={isPolling ? stopPolling : startPolling}
            style={{ padding: '0.5rem 1rem' }}
          >
            {isPolling ? 'Pause' : 'Resume'}
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && !metrics && (
        <div className="card" style={{ marginTop: '2rem', textAlign: 'center' }}>
          <p>Loading metrics...</p>
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

      {/* Metrics Display */}
      {metrics && (
        <>
          {/* Key Metrics Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              marginTop: '2rem',
            }}
          >
            {/* Total Tests */}
            <div className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>
                {metrics.total_tests}
              </div>
              <div style={{ color: '#6b7280', marginTop: '0.5rem' }}>
                Total Tests
              </div>
            </div>

            {/* Agreement Rate */}
            <div className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#667eea' }}>
                {metrics.agreement_rate.toFixed(1)}%
              </div>
              <div style={{ color: '#6b7280', marginTop: '0.5rem' }}>
                Agreement Rate
              </div>
            </div>

            {/* Pipeline B Accuracy */}
            <div className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#10b981' }}>
                {metrics.pipeline_b_accuracy.toFixed(1)}%
              </div>
              <div style={{ color: '#6b7280', marginTop: '0.5rem' }}>
                Pipeline B Accuracy
              </div>
            </div>

            {/* Pipeline B Faster */}
            <div className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#3b82f6' }}>
                {metrics.pipeline_b_faster_percent.toFixed(1)}%
              </div>
              <div style={{ color: '#6b7280', marginTop: '0.5rem' }}>
                Pipeline B Faster
              </div>
            </div>

            {/* Average Improvement */}
            <div className="card" style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontSize: '2.5rem',
                  fontWeight: 'bold',
                  color: getImprovementColor(metrics.avg_confidence_improvement),
                }}
              >
                {getImprovementIcon(metrics.avg_confidence_improvement)}{' '}
                {Math.abs(metrics.avg_confidence_improvement).toFixed(1)}%
              </div>
              <div style={{ color: '#6b7280', marginTop: '0.5rem' }}>
                Avg Confidence Change
              </div>
            </div>
          </div>

          {/* Status Breakdown */}
          <div className="card" style={{ marginTop: '2rem' }}>
            <h2 style={{ marginTop: 0 }}>Status Breakdown</h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1.5rem',
                marginTop: '1rem',
              }}
            >
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '0.5rem',
                  }}
                >
                  <span>Both Succeeded</span>
                  <strong>{metrics.status_breakdown.both_succeeded}</strong>
                </div>
                <div
                  style={{
                    height: '8px',
                    backgroundColor: 'rgba(16, 185, 129, 0.2)',
                    borderRadius: '4px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${(metrics.status_breakdown.both_succeeded / metrics.total_tests) * 100}%`,
                      backgroundColor: '#10b981',
                    }}
                  />
                </div>
              </div>

              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '0.5rem',
                  }}
                >
                  <span>Only Pipeline A</span>
                  <strong>{metrics.status_breakdown.only_pipeline_a}</strong>
                </div>
                <div
                  style={{
                    height: '8px',
                    backgroundColor: 'rgba(59, 130, 246, 0.2)',
                    borderRadius: '4px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${(metrics.status_breakdown.only_pipeline_a / metrics.total_tests) * 100}%`,
                      backgroundColor: '#3b82f6',
                    }}
                  />
                </div>
              </div>

              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '0.5rem',
                  }}
                >
                  <span>Only Pipeline B</span>
                  <strong>{metrics.status_breakdown.only_pipeline_b}</strong>
                </div>
                <div
                  style={{
                    height: '8px',
                    backgroundColor: 'rgba(245, 158, 11, 0.2)',
                    borderRadius: '4px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${(metrics.status_breakdown.only_pipeline_b / metrics.total_tests) * 100}%`,
                      backgroundColor: '#f59e0b',
                    }}
                  />
                </div>
              </div>

              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '0.5rem',
                  }}
                >
                  <span>Both Failed</span>
                  <strong>{metrics.status_breakdown.both_failed}</strong>
                </div>
                <div
                  style={{
                    height: '8px',
                    backgroundColor: 'rgba(239, 68, 68, 0.2)',
                    borderRadius: '4px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${(metrics.status_breakdown.both_failed / metrics.total_tests) * 100}%`,
                      backgroundColor: '#ef4444',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Accuracy Comparison */}
          <div className="card" style={{ marginTop: '2rem' }}>
            <h2 style={{ marginTop: 0 }}>Accuracy Comparison</h2>
            <p style={{ color: '#6b7280', marginTop: '0.5rem' }}>
              Based on {metrics.accuracy_comparison.total_with_ground_truth} tests
              with ground truth labels
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '2rem',
                marginTop: '1.5rem',
              }}
            >
              {/* Pipeline A */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: '500' }}>Pipeline A (VGG-Face)</span>
                  <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                    {metrics.accuracy_comparison.pipeline_a_correct}
                  </span>
                </div>
                <div
                  style={{
                    marginTop: '0.5rem',
                    height: '12px',
                    backgroundColor: 'rgba(59, 130, 246, 0.2)',
                    borderRadius: '6px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${(metrics.accuracy_comparison.pipeline_a_correct / metrics.accuracy_comparison.total_with_ground_truth) * 100}%`,
                      backgroundColor: '#3b82f6',
                    }}
                  />
                </div>
                <div style={{ marginTop: '0.25rem', fontSize: '0.9rem', color: '#6b7280' }}>
                  {(
                    (metrics.accuracy_comparison.pipeline_a_correct /
                      metrics.accuracy_comparison.total_with_ground_truth) *
                    100
                  ).toFixed(1)}
                  % accuracy
                </div>
              </div>

              {/* Pipeline B */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: '500' }}>Pipeline B (Facenet512)</span>
                  <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                    {metrics.accuracy_comparison.pipeline_b_correct}
                  </span>
                </div>
                <div
                  style={{
                    marginTop: '0.5rem',
                    height: '12px',
                    backgroundColor: 'rgba(16, 185, 129, 0.2)',
                    borderRadius: '6px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${(metrics.accuracy_comparison.pipeline_b_correct / metrics.accuracy_comparison.total_with_ground_truth) * 100}%`,
                      backgroundColor: '#10b981',
                    }}
                  />
                </div>
                <div style={{ marginTop: '0.25rem', fontSize: '0.9rem', color: '#6b7280' }}>
                  {(
                    (metrics.accuracy_comparison.pipeline_b_correct /
                      metrics.accuracy_comparison.total_with_ground_truth) *
                    100
                  ).toFixed(1)}
                  % accuracy
                </div>
              </div>
            </div>

            {/* Winner Display */}
            {metrics.accuracy_comparison.pipeline_b_correct >
              metrics.accuracy_comparison.pipeline_a_correct && (
              <div
                style={{
                  marginTop: '1.5rem',
                  padding: '1rem',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  borderRadius: '8px',
                  borderLeft: '4px solid #10b981',
                }}
              >
                <strong>✓ Pipeline B is more accurate</strong> with{' '}
                {metrics.accuracy_comparison.pipeline_b_correct -
                  metrics.accuracy_comparison.pipeline_a_correct}{' '}
                more correct predictions
              </div>
            )}
            {metrics.accuracy_comparison.pipeline_a_correct >
              metrics.accuracy_comparison.pipeline_b_correct && (
              <div
                style={{
                  marginTop: '1.5rem',
                  padding: '1rem',
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  borderRadius: '8px',
                  borderLeft: '4px solid #3b82f6',
                }}
              >
                <strong>✓ Pipeline A is more accurate</strong> with{' '}
                {metrics.accuracy_comparison.pipeline_a_correct -
                  metrics.accuracy_comparison.pipeline_b_correct}{' '}
                more correct predictions
              </div>
            )}
            {metrics.accuracy_comparison.pipeline_a_correct ===
              metrics.accuracy_comparison.pipeline_b_correct && (
              <div
                style={{
                  marginTop: '1.5rem',
                  padding: '1rem',
                  backgroundColor: 'rgba(107, 114, 128, 0.1)',
                  borderRadius: '8px',
                  borderLeft: '4px solid #6b7280',
                }}
              >
                <strong>= Both pipelines are equally accurate</strong>
              </div>
            )}
          </div>

          {/* Performance Metrics */}
          <div className="card" style={{ marginTop: '2rem' }}>
            <h2 style={{ marginTop: 0 }}>Performance Metrics</h2>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '1.5rem',
                marginTop: '1rem',
              }}
            >
              {/* Average Processing Time */}
              <div>
                <div style={{ fontWeight: '500', marginBottom: '0.5rem' }}>
                  Average Processing Time
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Pipeline A:</span>
                  <strong>{metrics.avg_processing_time.pipeline_a.toFixed(0)}ms</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Pipeline B:</span>
                  <strong>{metrics.avg_processing_time.pipeline_b.toFixed(0)}ms</strong>
                </div>
                <div
                  style={{
                    marginTop: '0.5rem',
                    paddingTop: '0.5rem',
                    borderTop: '1px solid rgba(107, 114, 128, 0.2)',
                  }}
                >
                  <span style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                    {metrics.avg_processing_time.pipeline_b <
                    metrics.avg_processing_time.pipeline_a ? (
                      <span style={{ color: '#10b981' }}>
                        ⚡ Pipeline B is{' '}
                        {(
                          ((metrics.avg_processing_time.pipeline_a -
                            metrics.avg_processing_time.pipeline_b) /
                            metrics.avg_processing_time.pipeline_a) *
                          100
                        ).toFixed(1)}
                        % faster
                      </span>
                    ) : (
                      <span style={{ color: '#ef4444' }}>
                        ⚠ Pipeline B is{' '}
                        {(
                          ((metrics.avg_processing_time.pipeline_b -
                            metrics.avg_processing_time.pipeline_a) /
                            metrics.avg_processing_time.pipeline_a) *
                          100
                        ).toFixed(1)}
                        % slower
                      </span>
                    )}
                  </span>
                </div>
              </div>

              {/* Average Confidence */}
              <div>
                <div style={{ fontWeight: '500', marginBottom: '0.5rem' }}>
                  Average Confidence
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Pipeline A:</span>
                  <strong>{metrics.avg_confidence.pipeline_a.toFixed(1)}%</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Pipeline B:</span>
                  <strong>{metrics.avg_confidence.pipeline_b.toFixed(1)}%</strong>
                </div>
                <div
                  style={{
                    marginTop: '0.5rem',
                    paddingTop: '0.5rem',
                    borderTop: '1px solid rgba(107, 114, 128, 0.2)',
                  }}
                >
                  <span style={{ fontSize: '0.9rem' }}>
                    Difference:{' '}
                    <strong
                      style={{
                        color: getImprovementColor(metrics.avg_confidence_improvement),
                      }}
                    >
                      {getImprovementIcon(metrics.avg_confidence_improvement)}{' '}
                      {Math.abs(metrics.avg_confidence_improvement).toFixed(1)}%
                    </strong>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Data Info */}
          <div
            style={{
              marginTop: '2rem',
              padding: '1rem',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              borderRadius: '8px',
              fontSize: '0.9rem',
              color: '#6b7280',
            }}
          >
            ℹ️ Showing {period === 'daily' ? 'daily' : 'weekly'} metrics
            {period === 'daily' && ` for ${selectedDate}`}. Last updated:{' '}
            {new Date().toLocaleTimeString()}
          </div>
        </>
      )}
    </div>
  )
}
