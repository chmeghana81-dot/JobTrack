
import { useCallback, useEffect, useMemo, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { apiFetch, clearTokens, extractErrorMessage, getStoredUser } from '../api.js'
import '../Styles/Pages.css'

const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: '▦' },
  { label: 'Applications', path: '/applications', icon: '▤' },
  { label: 'Interviews', path: '/interviews', icon: '▣' },
  { label: 'Analytics', path: '/analytics', icon: '▥' },
  { label: 'Saved Jobs', path: '/saved-jobs', icon: '★' },
  { label: 'Profile & Settings', path: '/profile', icon: '⚙' },
]

const statusItems = [
  { label: 'Applied', color: '#7c6cf0' },
  { label: 'Assessment', color: '#e6a23c' },
  { label: 'Interview', color: '#8b65d6' },
  { label: 'Offer', color: '#24a47b' },
  { label: 'Rejected', color: '#e36d7a' },
]

export default function Analytics() {
  const navigate = useNavigate()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadJobs = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const response = await apiFetch('/api/jobs/')

      if (response.status === 401) {
        clearTokens()
        navigate('/login')
        return
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(extractErrorMessage(data, `Unable to load analytics (${response.status}).`))
      }

      const records = Array.isArray(data) ? data : data.results

      setJobs(Array.isArray(records) ? records : [])
    } catch (err) {
      setJobs([])
      setError(
        err.message === 'Failed to fetch'
          ? 'Cannot connect to Django. Make sure the backend is running on port 8000.'
          : err.message || 'Unable to connect to the server.'
      )
    } finally {
      setLoading(false)
    }
  }, [navigate])

  useEffect(() => {
    loadJobs()
  }, [loadJobs])

  const counts = useMemo(() => {
    return statusItems.map((item) => ({
      ...item,
      count: jobs.filter(
        (job) => job.status?.toLowerCase() === item.label.toLowerCase()
      ).length,
    }))
  }, [jobs])

  const totalApplications = jobs.length

  const totalInterviews =
    counts.find((item) => item.label === 'Interview')?.count ?? 0

  const totalOffers =
    counts.find((item) => item.label === 'Offer')?.count ?? 0

  const successRate =
    totalApplications > 0
      ? Math.round((totalOffers / totalApplications) * 100)
      : 0

  const handleLogout = () => {
    clearTokens()
    navigate('/login')
  }

  return (
    <div className="workspace">
      <aside className="workspace-sidebar">
        <NavLink to="/dashboard" className="workspace-brand">
          JobTrack<span>.</span>
        </NavLink>

        <p className="workspace-label">WORKSPACE</p>

        <nav className="workspace-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `workspace-link ${isActive ? 'selected' : ''}`
              }
            >
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="workspace-profile">
          <div className="workspace-avatar">
            {(getStoredUser()?.first_name || getStoredUser()?.username || 'U').charAt(0).toUpperCase()}
          </div>
          <div>
            <strong>
              {getStoredUser()?.first_name
                ? `${getStoredUser().first_name} ${getStoredUser().last_name || ''}`.trim()
                : getStoredUser()?.username || 'Job Seeker'}
            </strong>
            <p>{getStoredUser()?.profile?.headline || 'Job Seeker'}</p>
          </div>
          <button
            type="button"
            className="signout-btn"
            onClick={handleLogout}
            aria-label="Sign out"
            title="Sign out"
          >
            ↗
          </button>
        </div>
      </aside>

      <main className="workspace-main">
        <header className="workspace-header">
          <div>
            <p className="workspace-eyebrow">CAREER INSIGHTS</p>
            <h1>Job Search Analytics</h1>
            <p className="workspace-subtitle">
              Understand your job-search progress and application outcomes.
            </p>
          </div>

          <button
            type="button"
            className="workspace-primary"
            onClick={loadJobs}
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </header>

        <section className="application-banner">
          <div>
            <span className="banner-tag">YOUR PROGRESS AT A GLANCE</span>
            <h2>Small steps lead to big opportunities.</h2>
            <p>
              Track your applications and monitor your job-search outcomes
              using your saved application data.
            </p>
          </div>
          <div className="banner-symbol" aria-hidden="true">↗</div>
        </section>

        {error && (
          <div className="jobtrack-message jobtrack-error" role="alert">
            <span>{error}</span>
            <button type="button" onClick={loadJobs}>Retry</button>
          </div>
        )}

        <section className="application-summary">
          <article className="summary-card">
            <span className="summary-icon" aria-hidden="true">▤</span>
            <p>Total applications</p>
            <h2>{loading ? '—' : totalApplications}</h2>
            <span className="summary-note">Applications tracked</span>
          </article>

          <article className="summary-card">
            <span className="summary-icon" aria-hidden="true">◎</span>
            <p>Interview progress</p>
            <h2>{loading ? '—' : totalInterviews}</h2>
            <span className="summary-note">At interview stage</span>
          </article>

          <article className="summary-card">
            <span className="summary-icon" aria-hidden="true">★</span>
            <p>Application success</p>
            <h2>{loading ? '—' : `${successRate}%`}</h2>
            <span className="summary-note">Offers / total applications</span>
          </article>
        </section>

        <section className="application-list">
          <div className="list-heading">
            <div>
              <h2>Status overview</h2>
              <p>Compare the current status of your applications.</p>
            </div>

            <span className="live-label">
              <span className="live-dot"></span>
              Live application data
            </span>
          </div>

          {loading ? (
            <div className="application-placeholder">
              <p>Loading your analytics...</p>
            </div>
          ) : !error ? (
            <div className="analytics-status-list">
              {counts.map((item) => {
                const percentage =
                  totalApplications > 0
                    ? (item.count / totalApplications) * 100
                    : 0

                return (
                  <div className="analytics-status-row" key={item.label}>
                    <div className="analytics-status-heading">
                      <span>
                        <span
                          className="analytics-status-dot"
                          style={{ backgroundColor: item.color }}
                        />
                        {item.label}
                      </span>
                      <strong>{item.count}</strong>
                    </div>

                    <div
                      className="analytics-track"
                      role="progressbar"
                      aria-label={`${item.label} applications`}
                      aria-valuemin={0}
                      aria-valuemax={totalApplications}
                      aria-valuenow={item.count}
                    >
                      <div
                        className="analytics-fill"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: item.color,
                        }}
                      />
                    </div>
                    <p className="jobtrack-result-count">
                      {percentage.toFixed(0)}% of all applications
                    </p>
                  </div>
                )
              })}
            </div>
          ) : null}
        </section>

        <section className="application-list analytics-insights">
          <div className="list-heading">
            <div>
              <h2>Application outcomes</h2>
              <p>A quick summary of your current progress.</p>
            </div>
          </div>

          <div className="analytics-insight-grid">
            <article>
              <span className="summary-icon" aria-hidden="true">✓</span>
              <h3>{loading ? '—' : `${totalOffers} offers`}</h3>
              <p>Applications marked as Offer.</p>
            </article>

            <article>
              <span className="summary-icon" aria-hidden="true">↗</span>
              <h3>{loading ? '—' : `${successRate}% success rate`}</h3>
              <p>Offer count divided by total applications.</p>
            </article>
          </div>
        </section>

        <footer className="workspace-footer">
          JobTrack <span>·</span> Stay organized. Keep growing.
        </footer>
      </main>
    </div>
  )
}
