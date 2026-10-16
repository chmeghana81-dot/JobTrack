import { useCallback, useEffect, useState } from 'react'
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

const emptyForm = () => ({
  company: '',
  role: '',
  location: '',
  job_url: '',
  source: '',
  description: '',
})

export default function SavedJobs() {
  const navigate = useNavigate()
  const [jobs, setJobs] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingJob, setEditingJob] = useState(null)
  const [editForm, setEditForm] = useState(emptyForm)

  const loadJobs = useCallback(async () => {
    setError('')

    try {
      const response = await apiFetch('/api/saved-jobs/')

      if (response.status === 401) {
        clearTokens()
        navigate('/login')
        return
      }

      if (!response.ok) {
        throw new Error(`Could not load saved jobs (${response.status}).`)
      }

      const data = await response.json()
      setJobs(Array.isArray(data) ? data : data.results || [])
    } catch (err) {
      setError(
        err.message === 'Failed to fetch'
          ? 'Cannot connect to Django. Make sure the backend is running.'
          : err.message
      )
    } finally {
      setLoading(false)
    }
  }, [navigate])

  useEffect(() => {
    loadJobs()
  }, [loadJobs])

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  function updateEditField(event) {
    const { name, value } = event.target
    setEditForm((current) => ({ ...current, [name]: value }))
  }

  async function saveJob(event) {
    event.preventDefault()
    setError('')
    setMessage('')
    setSaving(true)

    const payload = {
      company: form.company.trim(),
      role: form.role.trim(),
      location: form.location.trim(),
      source: form.source.trim(),
      job_url: form.job_url.trim(),
      description: form.description.trim(),
    }

    try {
      const response = await apiFetch('/api/saved-jobs/', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      if (response.status === 401) {
        clearTokens()
        navigate('/login')
        return
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(extractErrorMessage(data, 'Could not save this job.'))
      }

      setJobs((previous) => [data, ...previous])
      setForm(emptyForm())
      setMessage(`Saved opportunity for ${data.company} added!`)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  function openEdit(job) {
    setEditingJob(job)
    setEditForm({
      company: job.company || '',
      role: job.role || '',
      location: job.location || '',
      job_url: job.job_url || '',
      source: job.source || '',
      description: job.description || '',
    })
    setShowEditModal(true)
    setError('')
    setMessage('')
  }

  function closeEdit() {
    if (saving) return
    setShowEditModal(false)
    setEditingJob(null)
  }

  async function handleEditSubmit(event) {
    event.preventDefault()
    if (!editingJob) return

    setSaving(true)
    setError('')
    setMessage('')

    const payload = {
      company: editForm.company.trim(),
      role: editForm.role.trim(),
      location: editForm.location.trim(),
      source: editForm.source.trim(),
      job_url: editForm.job_url.trim(),
      description: editForm.description.trim(),
    }

    try {
      const response = await apiFetch(`/api/saved-jobs/${editingJob.id}/`, {
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
        throw new Error(extractErrorMessage(data, 'Could not update this saved job.'))
      }

      setJobs((current) =>
        current.map((j) => (j.id === editingJob.id ? data : j))
      )
      setMessage(`Saved job for ${data.company} updated successfully.`)
      closeEdit()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function deleteJob(id, company) {
    if (!window.confirm(`Delete the saved job for ${company || 'this position'}?`)) return

    setError('')
    setMessage('')

    try {
      const response = await apiFetch(`/api/saved-jobs/${id}/`, {
        method: 'DELETE',
      })

      if (response.status === 401) {
        clearTokens()
        navigate('/login')
        return
      }

      if (!response.ok) throw new Error('Could not delete this job.')

      setJobs((previous) => previous.filter((job) => job.id !== id))
      setMessage('Saved job deleted successfully.')
    } catch (err) {
      setError(err.message)
    }
  }

  // Convert saved job into an active job application
  async function handleConvertToApplication(job) {
    const confirmed = window.confirm(
      `Create an active application for ${job.role} at ${job.company}?`
    )
    if (!confirmed) return

    setError('')
    setMessage('')

    const payload = {
      company: job.company,
      role: job.role,
      location: job.location,
      job_url: job.job_url,
      status: 'Applied',
      applied_date: new Date().toLocaleDateString('en-CA'),
      notes: `Saved job listing. ${job.description || ''}`.trim(),
    }

    try {
      const response = await apiFetch('/api/jobs/', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      if (response.status === 401) {
        clearTokens()
        navigate('/login')
        return
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(extractErrorMessage(data, 'Failed to create application.'))
      }

      setMessage(
        `Application created for ${job.company}! You can track it under Applications.`
      )
    } catch (err) {
      setError(err.message)
    }
  }

  const handleLogout = () => {
    clearTokens()
    navigate('/login')
  }

  const filteredJobs = jobs.filter((job) =>
    `${job.company} ${job.role} ${job.location} ${job.source}`
      .toLowerCase()
      .includes(search.toLowerCase())
  )

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
      <main className="workspace-main" id="saved-jobs-main">
        <header className="workspace-header">
          <div>
            <p className="workspace-eyebrow">CAREER WORKSPACE</p>
            <h1>Saved Jobs</h1>
            <p className="workspace-subtitle">
              Save interesting opportunities and convert them to active applications when ready.
            </p>
          </div>
          <button
            type="button"
            className="workspace-secondary"
            onClick={loadJobs}
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </header>

        {error && (
          <div className="jobtrack-message jobtrack-error" role="alert">
            <span>{error}</span>
            <button type="button" onClick={() => setError('')}>Dismiss</button>
          </div>
        )}

        {message && (
          <div className="jobtrack-message jobtrack-success" role="status">
            <span>{message}</span>
            <button type="button" onClick={() => setMessage('')}>Dismiss</button>
          </div>
        )}

        {/* Add Saved Job Form */}
        <section className="jobtrack-form-card">
          <h2>Save an Opportunity</h2>
          <p>Bookmark a job listing to review, research, or apply to later.</p>

          <form onSubmit={saveJob}>
            <div className="jobtrack-form-grid">
              <label>
                Company *
                <input
                  name="company"
                  value={form.company}
                  onChange={updateField}
                  required
                  maxLength={150}
                  placeholder="e.g. Acme Corp, Microsoft"
                />
              </label>

              <label>
                Job title *
                <input
                  name="role"
                  value={form.role}
                  onChange={updateField}
                  required
                  maxLength={150}
                  placeholder="e.g. Python Developer"
                />
              </label>

              <label>
                Location
                <input
                  name="location"
                  value={form.location}
                  onChange={updateField}
                  maxLength={150}
                  placeholder="e.g. Hyderabad / Remote"
                />
              </label>

              <label>
                Source / Platform
                <input
                  name="source"
                  value={form.source}
                  onChange={updateField}
                  maxLength={100}
                  placeholder="e.g. LinkedIn, Naukri, Company site"
                />
              </label>

              <label>
                Job Link URL
                <input
                  name="job_url"
                  type="url"
                  value={form.job_url}
                  onChange={updateField}
                  placeholder="https://..."
                />
              </label>

              <label className="jobtrack-notes-field">
                Description / Notes
                <textarea
                  name="description"
                  value={form.description}
                  onChange={updateField}
                  rows={3}
                  placeholder="Skills, key requirements, salary range, or reminders"
                />
              </label>
            </div>

            <button
              className="workspace-primary"
              type="submit"
              disabled={saving}
            >
              {saving ? 'Saving...' : '+ Save Job'}
            </button>
          </form>
        </section>

        {/* Saved Jobs List */}
        <section className="application-list">
          <div className="list-heading">
            <div>
              <h2>Your Saved Opportunities</h2>
              <p>{jobs.length} bookmarked position(s)</p>
            </div>
          </div>

          <div className="jobtrack-filters">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search company, role, location..."
              aria-label="Search saved jobs"
            />
          </div>

          {loading ? (
            <div className="jobtrack-empty-state">
              <div className="placeholder-icon">★</div>
              <h3>Loading saved jobs...</h3>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="jobtrack-empty-state">
              <div className="placeholder-icon" aria-hidden="true">★</div>
              <h3>
                {jobs.length === 0
                  ? 'No saved jobs yet'
                  : 'No matching saved jobs'}
              </h3>
              <p>
                {jobs.length === 0
                  ? 'Add your first opportunity above to keep it in your workspace.'
                  : 'Try adjusting your search criteria.'}
              </p>
            </div>
          ) : (
            <div className="jobtrack-table-wrap">
              <table className="jobtrack-table">
                <thead>
                  <tr>
                    <th>Company / Role</th>
                    <th>Location</th>
                    <th>Source</th>
                    <th>Job Link</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredJobs.map((job) => (
                    <tr key={job.id}>
                      <td>
                        <strong>{job.company}</strong>
                        <span className="jobtrack-role">{job.role}</span>
                        {job.description && (
                          <small style={{ color: '#8e91ac', display: 'block', marginTop: '4px' }}>
                            {job.description}
                          </small>
                        )}
                      </td>
                      <td>{job.location || '—'}</td>
                      <td>{job.source || '—'}</td>
                      <td>
                        {job.job_url ? (
                          <a
                            href={job.job_url}
                            target="_blank"
                            rel="noreferrer"
                            className="jobtrack-url"
                          >
                            Open listing ↗
                          </a>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td>
                        <div className="jobtrack-row-actions">
                          <button
                            type="button"
                            className="workspace-primary"
                            style={{ padding: '6px 10px', fontSize: '11px' }}
                            title="Convert to active application"
                            onClick={() => handleConvertToApplication(job)}
                          >
                            + Apply
                          </button>
                          <button
                            type="button"
                            className="jobtrack-edit"
                            style={{ padding: '6px 10px', fontSize: '11px' }}
                            onClick={() => openEdit(job)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="jobtrack-delete"
                            style={{ padding: '6px 10px', fontSize: '11px' }}
                            onClick={() => deleteJob(job.id, job.company)}
                          >
                            ✕
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <footer className="workspace-footer">
          JobTrack <span>·</span> Stay organized. Keep growing.
        </footer>
      </main>

      {/* Edit Saved Job Modal */}
      {showEditModal && editingJob && (
        <div
          className="jobtrack-modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeEdit()
          }}
        >
          <div
            className="jobtrack-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-job-title"
          >
            <div className="jobtrack-form-heading">
              <div>
                <h2 id="edit-job-title">Edit Saved Job — {editingJob.company}</h2>
                <p>Update information for this saved opportunity.</p>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={closeEdit}
                disabled={saving}
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div className="jobtrack-form-grid">
                <label>
                  Company name *
                  <input
                    name="company"
                    value={editForm.company}
                    onChange={updateEditField}
                    required
                    maxLength={150}
                  />
                </label>

                <label>
                  Job title *
                  <input
                    name="role"
                    value={editForm.role}
                    onChange={updateEditField}
                    required
                    maxLength={150}
                  />
                </label>

                <label>
                  Location
                  <input
                    name="location"
                    value={editForm.location}
                    onChange={updateEditField}
                    maxLength={150}
                  />
                </label>

                <label>
                  Source / Platform
                  <input
                    name="source"
                    value={editForm.source}
                    onChange={updateEditField}
                    maxLength={100}
                  />
                </label>

                <label>
                  Job Link URL
                  <input
                    name="job_url"
                    type="url"
                    value={editForm.job_url}
                    onChange={updateEditField}
                  />
                </label>

                <label className="jobtrack-notes-field">
                  Description / Notes
                  <textarea
                    name="description"
                    value={editForm.description}
                    onChange={updateEditField}
                    rows={4}
                  />
                </label>
              </div>

              <div className="jobtrack-form-actions">
                <button
                  type="button"
                  className="workspace-secondary"
                  onClick={closeEdit}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="workspace-primary"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
