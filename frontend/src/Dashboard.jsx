import { useCallback, useEffect, useMemo, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  apiFetch,
  clearTokens,
  extractErrorMessage,
  getStoredTheme,
  getStoredUser,
  setStoredTheme,
  setStoredUser,
} from './api.js'
import './App.css'
import './Styles/Pages.css'

const STATUSES = ['Applied', 'Assessment', 'Interview', 'Offer', 'Rejected']

const statusColors = {
  Applied: '#3b82f6',
  Assessment: '#f59e0b',
  Interview: '#8b5cf6',
  Offer: '#10b981',
  Rejected: '#ef4444',
}

export default function Dashboard() {
  const navigate = useNavigate()

  const [jobs, setJobs] = useState([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [updatingId, setUpdatingId] = useState(null)
  const [exporting, setExporting] = useState(false)
  const [currentUser, setCurrentUser] = useState(getStoredUser())
  const [theme, setTheme] = useState(getStoredTheme())


  const loadJobs = useCallback(async () => {
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
        throw new Error(extractErrorMessage(data, 'Unable to load applications.'))
      }

      const records = Array.isArray(data) ? data : data.results || []

      setJobs(
        records.map((item) => ({
          id: item.id,
          company: item.company || '',
          role: item.role || '',
          location: item.location || 'Not specified',
          salary: item.salary || '',
          status: item.status || 'Applied',
          date: item.applied_date || '',
          job_url: item.job_url || '',
          interview_date: item.interview_date || null,
          interview_round: item.interview_round || '',
          interview_link: item.interview_link || '',
          created_at: item.created_at || '',
        }))
      )
    } catch (err) {
      setError(
        err.message === 'Failed to fetch'
          ? 'Cannot connect to Django. Make sure the backend is running on port 8000.'
          : err.message
      )
    } finally {
      setLoading(false)
    }

    // Load active user profile details
    try {
      const userRes = await apiFetch('/api/auth/profile/')
      if (userRes.ok) {
        const userData = await userRes.json()
        setCurrentUser(userData)
        setStoredUser(userData)
        if (userData.profile?.theme_preference) {
          setTheme(userData.profile.theme_preference)
          setStoredTheme(userData.profile.theme_preference)
        }
      }
    } catch {
      // Non-fatal if offline
    }
  }, [navigate])

  function handleThemeToggle() {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
    setStoredTheme(nextTheme)
    apiFetch('/api/auth/profile/', {
      method: 'PATCH',
      body: JSON.stringify({ theme_preference: nextTheme }),
    }).catch(() => {})
  }


  useEffect(() => {
    loadJobs()
  }, [loadJobs])

  const filteredJobs = useMemo(() => {
    const term = search.trim().toLowerCase()

    return jobs.filter((job) => {
      const matchesSearch =
        !term ||
        job.company.toLowerCase().includes(term) ||
        job.role.toLowerCase().includes(term) ||
        job.location.toLowerCase().includes(term)

      const matchesStatus = filter === 'All' || job.status === filter

      return matchesSearch && matchesStatus
    })
  }, [jobs, search, filter])

  const counts = useMemo(() => {
    const total = jobs.length
    const applied = jobs.filter((j) => j.status === 'Applied').length
    const assessment = jobs.filter((j) => j.status === 'Assessment').length
    const interview = jobs.filter((j) => j.status === 'Interview').length
    const offer = jobs.filter((j) => j.status === 'Offer').length
    const rejected = jobs.filter((j) => j.status === 'Rejected').length
    const inProgress = applied + assessment + interview
    const successRate = total > 0 ? Math.round((offer / total) * 100) : 0

    return { total, applied, assessment, interview, offer, rejected, inProgress, successRate }
  }, [jobs])

  // Recent applications sorted by applied date
  const recentApplications = useMemo(() => {
    return [...jobs]
      .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
      .slice(0, 5)
  }, [jobs])

  // Upcoming interviews
  const upcomingInterviews = useMemo(() => {
    return jobs
      .filter((j) => j.status === 'Interview' || j.interview_date)
      .slice(0, 3)
  }, [jobs])

  async function updateStatus(id, status) {
    const previousJobs = jobs
    setUpdatingId(id)
    setError('')
    setSuccess('')

    setJobs((current) =>
      current.map((job) => (job.id === id ? { ...job, status } : job))
    )

    try {
      const response = await apiFetch(`/api/jobs/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })

      if (response.status === 401) {
        clearTokens()
        navigate('/login')
        return
      }

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(extractErrorMessage(data, 'Could not update status.'))
      }

      setSuccess('Application status updated.')
    } catch (err) {
      setJobs(previousJobs)
      setError(err.message)
    } finally {
      setUpdatingId(null)
    }
  }

  async function deleteJob(job) {
    const confirmed = window.confirm(
      `Delete the application for ${job.company}? This cannot be undone.`
    )
    if (!confirmed) return

    setError('')
    setSuccess('')

    try {
      const response = await apiFetch(`/api/jobs/${job.id}/`, {
        method: 'DELETE',
      })

      if (response.status === 401) {
        clearTokens()
        navigate('/login')
        return
      }

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(extractErrorMessage(data, 'Could not delete application.'))
      }

      setJobs((current) => current.filter((item) => item.id !== job.id))
      setSuccess(`Application for ${job.company} deleted.`)
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleExportCSV() {
    setExporting(true)
    setError('')
    try {
      const response = await apiFetch('/api/jobs/export-csv/')
      if (!response.ok) throw new Error('Failed to export CSV.')
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'job_applications.csv'
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      setSuccess('Applications exported successfully.')
    } catch (err) {
      setError(err.message)
    } finally {
      setExporting(false)
    }
  }

  const handleLogout = () => {
    clearTokens()
    navigate('/login')
  }

  return (
    <div className="app">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <h2 className="brand">
          JobTrack<span>.</span>
        </h2>

        <p className="side-label">WORKSPACE</p>

        <nav>
          <NavLink
            to="/"
            end
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            ▦ Dashboard
          </NavLink>
          <NavLink
            to="/applications"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            ▤ Applications
          </NavLink>
          <NavLink
            to="/interviews"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            ▣ Interviews
          </NavLink>
          <NavLink
            to="/analytics"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            ▥ Analytics
          </NavLink>
          <NavLink
            to="/saved-jobs"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            ★ Saved Jobs
          </NavLink>
          <NavLink
            to="/profile"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            ⚙ Profile & Settings
          </NavLink>
        </nav>

        <div className="sidebar-bottom">
          <div className="avatar">
            {(currentUser?.first_name || currentUser?.username || 'U').charAt(0).toUpperCase()}
          </div>
          <div>
            <strong>
              {currentUser?.first_name
                ? `${currentUser.first_name} ${currentUser.last_name || ''}`.trim()
                : currentUser?.username || 'Job Seeker'}
            </strong>
            <p>{currentUser?.profile?.headline || 'Job Seeker'}</p>
          </div>
          <button
            type="button"
            aria-label="Sign out"
            title="Sign out"
            onClick={handleLogout}
          >
            ↗
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content" id="dashboard">
        <header className="topbar">
          <div>
            <p className="eyebrow">CAREER COMMAND CENTER</p>
            <h1>Job Dashboard</h1>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              type="button"
              className="nav-theme-btn"
              onClick={handleThemeToggle}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
            </button>
            <button
              type="button"
              className="csv-export-btn"
              onClick={handleExportCSV}
              disabled={exporting || jobs.length === 0}
            >
              {exporting ? 'Exporting...' : '📥 Export CSV'}
            </button>
            <button
              type="button"
              className="primary-button"
              onClick={() => navigate('/applications')}
            >
              + Add Application
            </button>
          </div>
        </header>

        {/* Welcome Banner */}
        <section className="welcome">
          <div>
            <p className="welcome-label">YOUR NEXT CAREER CHAPTER</p>
            <h2>
              Welcome back, {currentUser?.first_name || currentUser?.username || 'Candidate'}!
            </h2>
            <p>
              {jobs.length === 0 ? (
                <span>Your workspace is fresh and ready. Add your first job application below to begin tracking!</span>
              ) : (
                <span>
                  You have <strong>{counts.inProgress} active application(s)</strong> in
                  progress across your pipeline. Stay focused and keep growing.
                </span>
              )}
            </p>
          </div>
          <div className="welcome-icon" aria-hidden="true">✦</div>
        </section>

        {/* Feedback Messages */}
        {error && (
          <div className="dashboard-message dashboard-error" role="alert">
            <span>{error}</span>
            <button type="button" onClick={() => setError('')}>Dismiss</button>
          </div>
        )}

        {success && (
          <div className="dashboard-message dashboard-success" role="status">
            <span>{success}</span>
            <button type="button" onClick={() => setSuccess('')}>Dismiss</button>
          </div>
        )}

        {/* Metric Cards Grid */}
        <section className="stats-grid">
          {[
            ['Total Applications', counts.total, '▤'],
            ['In Progress', counts.inProgress, '↗'],
            ['Interviews', counts.interview, '▣'],
            ['Offers Received', counts.offer, '★'],
            ['Success Rate', `${counts.successRate}%`, '✓'],
          ].map(([label, value, icon]) => (
            <article className="stat-card" key={label}>
              <div className="stat-icon" aria-hidden="true">{icon}</div>
              <p>{label}</p>
              <h2>{loading ? '—' : value}</h2>
            </article>
          ))}
        </section>

        {/* Status Distribution & Recent Activity Split Grid */}
        <div className="dashboard-split-grid">
          {/* Status Distribution Breakdown */}
          <div className="dashboard-widget-card">
            <h3 className="widget-title">Pipeline Distribution</h3>
            <p className="widget-subtitle">
              Visual breakdown of your applications by recruitment stage.
            </p>

            <div className="status-bars-container">
              {STATUSES.map((status) => {
                const count = jobs.filter((j) => j.status === status).length
                const pct = counts.total > 0 ? Math.round((count / counts.total) * 100) : 0
                const color = statusColors[status]

                return (
                  <div className="status-bar-row" key={status}>
                    <div className="status-bar-header">
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            backgroundColor: color,
                            display: 'inline-block',
                          }}
                        />
                        {status}
                      </span>
                      <span>
                        <strong>{count}</strong> ({pct}%)
                      </span>
                    </div>
                    <div className="status-bar-track" role="progressbar" aria-valuenow={pct} aria-valuemin="0" aria-valuemax="100">
                      <div
                        className="status-bar-fill"
                        style={{ width: `${pct}%`, backgroundColor: color }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className="workspace-secondary"
                style={{ width: '100%' }}
                onClick={() => navigate('/applications?view=kanban')}
              >
                ◫ Open Kanban Board
              </button>
            </div>
          </div>

          {/* Activity / Upcoming Section */}
          <div className="dashboard-widget-card">
            <h3 className="widget-title">Upcoming & Recent Activity</h3>
            <p className="widget-subtitle">Latest updates across your job pipeline.</p>

            {upcomingInterviews.length > 0 && (
              <div style={{ marginBottom: '18px' }}>
                <p style={{ fontSize: '12px', fontWeight: '700', color: '#6c61dc', marginBottom: '8px' }}>
                  UPCOMING INTERVIEWS
                </p>
                {upcomingInterviews.map((job) => (
                  <div
                    key={job.id}
                    style={{
                      background: '#f6f7fd',
                      border: '1px solid #e7e9f6',
                      borderRadius: '10px',
                      padding: '10px 12px',
                      marginBottom: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong>{job.company}</strong>
                      <span className="jobtrack-status status-interview" style={{ fontSize: '11px', padding: '2px 8px' }}>
                        {job.interview_round || 'Interview'}
                      </span>
                    </div>
                    <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#666a84' }}>
                      {job.role} · {job.interview_date ? new Date(job.interview_date).toLocaleDateString() : job.date}
                    </p>
                    {job.interview_link && (
                      <a
                        href={job.interview_link}
                        target="_blank"
                        rel="noreferrer"
                        style={{ fontSize: '12px', color: '#10b981', display: 'inline-block', marginTop: '4px', fontWeight: '600' }}
                      >
                        Join Meeting ↗
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="activity-timeline">
              <p style={{ fontSize: '12px', fontWeight: '700', color: '#888ba6', margin: '0 0 4px' }}>
                RECENT APPLICATIONS
              </p>
              {recentApplications.length === 0 ? (
                <p style={{ fontSize: '13px', color: '#9ea2b5', fontStyle: 'italic' }}>
                  No application activity recorded yet.
                </p>
              ) : (
                recentApplications.map((job) => (
                  <div className="activity-item" key={job.id}>
                    <div className="activity-dot" />
                    <div className="activity-content">
                      Applied for <strong>{job.role}</strong> at{' '}
                      <strong>{job.company}</strong>
                      <span className="activity-time">{job.date || 'Recently'}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Applications Management Panel */}
        <section className="applications-panel" id="applications">
          <div className="panel-heading">
            <div>
              <h2>Tracked Applications</h2>
              <p>Manage, filter, and update your active submissions.</p>
            </div>
            <span className="job-count">
              {loading ? 'Loading...' : `${filteredJobs.length} applications`}
            </span>
          </div>

          <div className="toolbar">
            <input
              type="search"
              placeholder="Search company, role or location..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Search applications"
            />

            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              aria-label="Filter applications by status"
            >
              {['All', ...STATUSES].map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>

            <button type="button" className="primary-button" onClick={loadJobs}>
              Refresh
            </button>
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>COMPANY & ROLE</th>
                  <th>LOCATION</th>
                  <th>DATE APPLIED</th>
                  <th>STATUS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="empty-state">
                      Loading applications from Django...
                    </td>
                  </tr>
                ) : (
                  filteredJobs.map((job) => (
                    <tr key={job.id}>
                      <td>
                        <strong>{job.company}</strong>
                        <p className="role-text">{job.role}</p>
                        {job.job_url && (
                          <a href={job.job_url} target="_blank" rel="noreferrer">
                            View job ↗
                          </a>
                        )}
                      </td>
                      <td>{job.location}</td>
                      <td>{job.date || '—'}</td>
                      <td>
                        <select
                          className={`status-select status-${job.status.toLowerCase()}`}
                          value={job.status}
                          disabled={updatingId === job.id}
                          onChange={(event) => updateStatus(job.id, event.target.value)}
                          aria-label={`Status for ${job.company}`}
                        >
                          {STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <button
                          className="delete-button"
                          onClick={() => deleteJob(job)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}

                {!loading && filteredJobs.length === 0 && (
                  <tr>
                    <td colSpan="5" className="empty-state">
                      {error
                        ? 'Applications could not be loaded. Check the backend connection.'
                        : 'No applications found. Add one from the Applications page.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <footer>JobTrack · Stay organized. Keep growing.</footer>
      </main>
    </div>
  )
}
