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

function formatInterviewDate(dateString) {
  if (!dateString) return 'Not scheduled yet'

  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return dateString

  return date.toLocaleString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getTimingBadge(dateString) {
  if (!dateString) return { label: 'Unscheduled', type: 'badge-past' }

  const interviewTime = new Date(dateString).getTime()
  const now = new Date().getTime()
  const oneDay = 24 * 60 * 60 * 1000

  if (Math.abs(interviewTime - now) < oneDay) {
    return { label: 'Today / Soon', type: 'badge-today' }
  }
  if (interviewTime > now) {
    return { label: 'Upcoming', type: 'badge-upcoming' }
  }
  return { label: 'Completed', type: 'badge-past' }
}

export default function Interviews() {
  const navigate = useNavigate()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Tab filter: 'all', 'upcoming', 'past'
  const [activeTab, setActiveTab] = useState('upcoming')
  const [search, setSearch] = useState('')

  // Edit / Schedule Modal state
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [selectedJob, setSelectedJob] = useState(null)
  const [scheduleForm, setScheduleForm] = useState({
    interview_date: '',
    interview_round: '',
    interview_link: '',
    interview_notes: '',
    status: 'Interview',
  })

  const loadJobs = useCallback(async () => {
    try {
      const response = await apiFetch('/api/jobs/')

      if (response.status === 401) {
        clearTokens()
        navigate('/login')
        return
      }

      if (!response.ok) {
        throw new Error(`Unable to load applications (${response.status}).`)
      }

      const data = await response.json()
      const records = Array.isArray(data) ? data : data.results || []
      setJobs(records)
    } catch (err) {
      setError(err.message || 'Unable to connect to the server.')
    } finally {
      setLoading(false)
    }
  }, [navigate])

  useEffect(() => {
    loadJobs()
  }, [loadJobs])

  // All jobs that are either in Interview status or have an interview date scheduled
  const allInterviewJobs = useMemo(() => {
    return jobs.filter(
      (job) => job.status?.toLowerCase() === 'interview' || Boolean(job.interview_date)
    )
  }, [jobs])

  // Filtered by tab and search
  const filteredInterviews = useMemo(() => {
    const now = new Date().getTime()

    return allInterviewJobs.filter((job) => {
      const matchesSearch =
        !search.trim() ||
        job.company.toLowerCase().includes(search.toLowerCase()) ||
        job.role.toLowerCase().includes(search.toLowerCase()) ||
        (job.interview_round || '').toLowerCase().includes(search.toLowerCase())

      if (!matchesSearch) return false

      if (activeTab === 'upcoming') {
        if (!job.interview_date) return job.status === 'Interview'
        return new Date(job.interview_date).getTime() >= now - 24 * 60 * 60 * 1000
      }

      if (activeTab === 'past') {
        if (!job.interview_date) return false
        return new Date(job.interview_date).getTime() < now - 24 * 60 * 60 * 1000
      }

      return true
    })
  }, [allInterviewJobs, activeTab, search])

  const upcomingCount = useMemo(() => {
    const now = new Date().getTime() - 24 * 60 * 60 * 1000
    return allInterviewJobs.filter(
      (j) => !j.interview_date || new Date(j.interview_date).getTime() >= now
    ).length
  }, [allInterviewJobs])

  const offerCount = useMemo(() => {
    return jobs.filter((j) => j.status === 'Offer').length
  }, [jobs])

  const openScheduleModal = (job) => {
    setSelectedJob(job)
    setScheduleForm({
      interview_date: job.interview_date ? job.interview_date.slice(0, 16) : '',
      interview_round: job.interview_round || 'Technical Round 1',
      interview_link: job.interview_link || '',
      interview_notes: job.interview_notes || job.notes || '',
      status: job.status || 'Interview',
    })
    setShowScheduleModal(true)
    setError('')
    setSuccess('')
  }

  const closeScheduleModal = () => {
    if (saving) return
    setShowScheduleModal(false)
    setSelectedJob(null)
  }

  const handleScheduleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedJob) return

    setSaving(true)
    setError('')
    setSuccess('')

    const payload = {
      interview_date: scheduleForm.interview_date || null,
      interview_round: scheduleForm.interview_round.trim(),
      interview_link: scheduleForm.interview_link.trim(),
      interview_notes: scheduleForm.interview_notes.trim(),
      status: scheduleForm.status,
    }

    try {
      const response = await apiFetch(`/api/jobs/${selectedJob.id}/`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      })

      if (response.status === 401) {
        clearTokens()
        navigate('/login')
        return
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(extractErrorMessage(data, 'Could not save interview details.'))
      }

      setJobs((current) =>
        current.map((j) => (j.id === selectedJob.id ? { ...j, ...payload } : j))
      )
      setSuccess(`Interview details updated for ${selectedJob.company}.`)
      closeScheduleModal()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleQuickStatusChange = async (jobId, newStatus) => {
    try {
      const response = await apiFetch(`/api/jobs/${jobId}/`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.status === 401) {
        clearTokens()
        navigate('/login')
        return
      }

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(extractErrorMessage(data, 'Failed to update status.'))
      }

      setJobs((current) =>
        current.map((j) => (j.id === jobId ? { ...j, status: newStatus } : j))
      )
      setSuccess(`Application status moved to ${newStatus}.`)
    } catch (err) {
      setError(err.message)
    }
  }

  const handleLogout = () => {
    clearTokens()
    navigate('/login')
  }

  return (
    <div className="workspace">
      {/* Sidebar Navigation */}
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

      {/* Main Content Area */}
      <main className="workspace-main" id="interviews-main">
        <header className="workspace-header">
          <div>
            <p className="workspace-eyebrow">CAREER MANAGEMENT</p>
            <h1>Interview Command Center</h1>
            <p className="workspace-subtitle">
              Schedule rounds, store meeting links, keep interview notes, and stay interview-ready.
            </p>
          </div>

          <button
            type="button"
            className="workspace-primary"
            onClick={() => navigate('/applications')}
          >
            + View All Applications
          </button>
        </header>

        {/* Motivational Banner */}
        <section className="application-banner">
          <div>
            <span className="banner-tag">STAY PREPARED</span>
            <h2>Walk into every interview with clarity and confidence.</h2>
            <p>
              Keep your meeting links, preparation notes, and scheduled rounds organized in one place.
            </p>
          </div>
          <div className="banner-symbol" aria-hidden="true">▣</div>
        </section>

        {/* Notification Feedback Messages */}
        {error && (
          <div className="jobtrack-message jobtrack-error" role="alert">
            <span>{error}</span>
            <button type="button" onClick={() => setError('')}>Dismiss</button>
          </div>
        )}

        {success && (
          <div className="jobtrack-message jobtrack-success" role="status">
            <span>{success}</span>
            <button type="button" onClick={() => setSuccess('')}>Dismiss</button>
          </div>
        )}

        {/* Metric Cards */}
        <section className="application-summary">
          <article className="summary-card">
            <span className="summary-icon" aria-hidden="true">▣</span>
            <p>Interview-stage applications</p>
            <h2>{loading ? '—' : allInterviewJobs.length}</h2>
            <span className="summary-note">Active opportunities</span>
          </article>

          <article className="summary-card">
            <span className="summary-icon" aria-hidden="true">↗</span>
            <p>Upcoming scheduled rounds</p>
            <h2>{loading ? '—' : upcomingCount}</h2>
            <span className="summary-note">Ready to attend</span>
          </article>

          <article className="summary-card">
            <span className="summary-icon" aria-hidden="true">★</span>
            <p>Offers received</p>
            <h2>{loading ? '—' : offerCount}</h2>
            <span className="summary-note">Applications marked Offer</span>
          </article>
        </section>

        {/* Interview Tab Navigation & Search */}
        <section className="application-list">
          <div className="interview-tabs-nav" role="tablist">
            <button
              type="button"
              className={`interview-tab-btn ${activeTab === 'upcoming' ? 'active' : ''}`}
              onClick={() => setActiveTab('upcoming')}
              role="tab"
            >
              Upcoming ({upcomingCount})
            </button>
            <button
              type="button"
              className={`interview-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
              role="tab"
            >
              All Interviews ({allInterviewJobs.length})
            </button>
            <button
              type="button"
              className={`interview-tab-btn ${activeTab === 'past' ? 'active' : ''}`}
              onClick={() => setActiveTab('past')}
              role="tab"
            >
              Past / Completed
            </button>
          </div>

          <div className="jobtrack-filters">
            <input
              type="search"
              placeholder="Search company, role, or round name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search interviews"
            />
            <button
              type="button"
              className="workspace-secondary"
              onClick={loadJobs}
              disabled={loading}
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          {/* Cards Grid */}
          {loading ? (
            <div className="jobtrack-empty-state">
              <div className="placeholder-icon">▣</div>
              <h3>Loading your interview schedule...</h3>
            </div>
          ) : filteredInterviews.length === 0 ? (
            <div className="jobtrack-empty-state">
              <div className="placeholder-icon" aria-hidden="true">▣</div>
              <h3>
                {allInterviewJobs.length === 0
                  ? 'No interview-stage applications yet'
                  : 'No interviews match your search'}
              </h3>
              <p>
                {allInterviewJobs.length === 0
                  ? 'When an application reaches the Interview stage, it will appear here with scheduling options.'
                  : 'Try selecting another tab or clearing your search filter.'}
              </p>
              {allInterviewJobs.length === 0 && (
                <button
                  type="button"
                  className="workspace-primary"
                  onClick={() => navigate('/applications')}
                >
                  View My Applications
                </button>
              )}
            </div>
          ) : (
            <div className="interview-grid">
              {filteredInterviews.map((job) => {
                const badge = getTimingBadge(job.interview_date)

                return (
                  <article className="interview-card" key={job.id}>
                    <div className="interview-card-header">
                      <div>
                        <h3>{job.company}</h3>
                        <p>{job.role}</p>
                      </div>
                      <span className={`interview-timing-badge ${badge.type}`}>
                        {badge.label}
                      </span>
                    </div>

                    <div className="interview-meta-row">
                      <span aria-hidden="true">📅</span>
                      <span>{formatInterviewDate(job.interview_date)}</span>
                    </div>

                    <div className="interview-meta-row">
                      <span aria-hidden="true">🎯</span>
                      <span>
                        <strong>Round:</strong> {job.interview_round || 'Round not specified'}
                      </span>
                    </div>

                    {job.location && (
                      <div className="interview-meta-row">
                        <span aria-hidden="true">📍</span>
                        <span>{job.location}</span>
                      </div>
                    )}

                    {job.interview_notes && (
                      <div className="interview-notes-box">
                        <strong>Prep notes:</strong>
                        <p style={{ margin: '4px 0 0' }}>{job.interview_notes}</p>
                      </div>
                    )}

                    <div className="interview-card-actions">
                      {job.interview_link ? (
                        <a
                          href={job.interview_link}
                          target="_blank"
                          rel="noreferrer"
                          className="join-meeting-btn"
                        >
                          Join Meeting ↗
                        </a>
                      ) : null}

                      <button
                        type="button"
                        className="workspace-secondary"
                        style={{ fontSize: '12px', padding: '7px 12px' }}
                        onClick={() => openScheduleModal(job)}
                      >
                        {job.interview_date ? 'Reschedule / Notes' : 'Schedule Round'}
                      </button>

                      <select
                        className="kanban-move-select"
                        style={{ marginLeft: 'auto' }}
                        value={job.status}
                        onChange={(e) => handleQuickStatusChange(job.id, e.target.value)}
                        aria-label="Update application stage"
                      >
                        <option value="Interview">Stage: Interview</option>
                        <option value="Offer">Move to Offer ★</option>
                        <option value="Rejected">Move to Rejected</option>
                        <option value="Applied">Move to Applied</option>
                        <option value="Assessment">Move to Assessment</option>
                      </select>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>

        <footer className="workspace-footer">
          JobTrack <span>·</span> Stay organized. Keep growing.
        </footer>
      </main>

      {/* Schedule / Edit Interview Modal */}
      {showScheduleModal && selectedJob && (
        <div
          className="jobtrack-modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeScheduleModal()
          }}
        >
          <div
            className="jobtrack-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="interview-modal-title"
          >
            <div className="jobtrack-form-heading">
              <div>
                <h2 id="interview-modal-title">
                  Schedule Interview — {selectedJob.company}
                </h2>
                <p>Set interview timing, video meeting link, and preparation notes.</p>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={closeScheduleModal}
                disabled={saving}
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleScheduleSubmit}>
              <div className="jobtrack-form-grid">
                <label>
                  Interview round name *
                  <input
                    name="interview_round"
                    value={scheduleForm.interview_round}
                    onChange={(e) =>
                      setScheduleForm({ ...scheduleForm, interview_round: e.target.value })
                    }
                    required
                    placeholder="e.g. Technical Round 1, System Design, HR"
                  />
                </label>

                <label>
                  Interview date & time *
                  <input
                    type="datetime-local"
                    name="interview_date"
                    value={scheduleForm.interview_date}
                    onChange={(e) =>
                      setScheduleForm({ ...scheduleForm, interview_date: e.target.value })
                    }
                    required
                  />
                </label>

                <label>
                  Meeting link URL
                  <input
                    type="url"
                    name="interview_link"
                    value={scheduleForm.interview_link}
                    onChange={(e) =>
                      setScheduleForm({ ...scheduleForm, interview_link: e.target.value })
                    }
                    placeholder="https://meet.google.com/... or Zoom link"
                  />
                </label>

                <label>
                  Current status
                  <select
                    name="status"
                    value={scheduleForm.status}
                    onChange={(e) =>
                      setScheduleForm({ ...scheduleForm, status: e.target.value })
                    }
                  >
                    <option value="Interview">Interview</option>
                    <option value="Offer">Offer</option>
                    <option value="Assessment">Assessment</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Applied">Applied</option>
                  </select>
                </label>

                <label className="jobtrack-notes-field">
                  Preparation & interview notes
                  <textarea
                    name="interview_notes"
                    value={scheduleForm.interview_notes}
                    onChange={(e) =>
                      setScheduleForm({ ...scheduleForm, interview_notes: e.target.value })
                    }
                    rows={4}
                    placeholder="Key questions to ask, topics to revise, interviewer name, follow-up notes..."
                  />
                </label>
              </div>

              <div className="jobtrack-form-actions">
                <button
                  type="button"
                  className="workspace-secondary"
                  onClick={closeScheduleModal}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="workspace-primary"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Interview Details'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
