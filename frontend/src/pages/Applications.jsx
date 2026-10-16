import { useCallback, useEffect, useMemo, useState } from 'react'
import { NavLink, useNavigate, useSearchParams } from 'react-router-dom'
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

const statusOptions = [
  'Applied',
  'Assessment',
  'Interview',
  'Offer',
  'Rejected',
]

const emptyForm = () => ({
  company: '',
  role: '',
  location: '',
  job_url: '',
  salary: '',
  status: 'Applied',
  applied_date: new Date().toLocaleDateString('en-CA'),
  notes: '',
  interview_date: '',
  interview_round: '',
  interview_link: '',
  interview_notes: '',
})

export default function Applications() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // View mode: 'table' or 'kanban'
  const viewMode = searchParams.get('view') === 'kanban' ? 'kanban' : 'table'

  // Filtering, Sorting & Pagination
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [sortBy, setSortBy] = useState('newest')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)

  // Drag and drop state for Kanban
  const [draggingCardId, setDraggingCardId] = useState(null)
  const [dragOverCol, setDragOverCol] = useState(null)

  const closeModal = useCallback(() => {
    if (saving) return
    setShowModal(false)
    setEditingId(null)
    setForm(emptyForm())
  }, [saving])

  const loadApplications = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setLoading(true)
      setError('')
    }

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

      setApplications(Array.isArray(data) ? data : data.results || [])
    } catch (err) {
      setError(
        err.message === 'Failed to fetch'
          ? 'Cannot connect to Django. Check backend server.'
          : err.message
      )
    } finally {
      setLoading(false)
    }
  }, [navigate])

  useEffect(() => {
    loadApplications()
  }, [loadApplications])

  // Close modal on Escape key
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape' && showModal && !saving) {
        closeModal()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showModal, saving, closeModal])

  // Filtered & Sorted applications
  const processedApplications = useMemo(() => {
    const term = search.trim().toLowerCase()

    const filtered = applications.filter((item) => {
      const matchesSearch =
        !term ||
        [item.company, item.role, item.location].some((val) =>
          String(val || '').toLowerCase().includes(term)
        )

      const matchesStatus =
        statusFilter === 'All' || item.status === statusFilter

      return matchesSearch && matchesStatus
    })

    // Sorting
    return filtered.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.applied_date || 0) - new Date(a.applied_date || 0)
      }
      if (sortBy === 'oldest') {
        return new Date(a.applied_date || 0) - new Date(b.applied_date || 0)
      }
      if (sortBy === 'company_asc') {
        return (a.company || '').localeCompare(b.company || '')
      }
      if (sortBy === 'company_desc') {
        return (b.company || '').localeCompare(a.company || '')
      }
      if (sortBy === 'role_asc') {
        return (a.role || '').localeCompare(b.role || '')
      }
      return 0
    })
  }, [applications, search, statusFilter, sortBy])

  // Pagination slice for Table view
  const paginatedApplications = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return processedApplications.slice(startIndex, startIndex + itemsPerPage)
  }, [processedApplications, currentPage])

  const totalPages = Math.ceil(processedApplications.length / itemsPerPage) || 1

  // Metrics
  const inProgressCount = useMemo(() => {
    return applications.filter((item) =>
      ['Applied', 'Assessment', 'Interview'].includes(item.status)
    ).length
  }, [applications])

  const offerCount = useMemo(() => {
    return applications.filter((item) => item.status === 'Offer').length
  }, [applications])

  const openAddModal = (presetStatus = 'Applied') => {
    setEditingId(null)
    const newForm = emptyForm()
    newForm.status = presetStatus
    setForm(newForm)
    setError('')
    setSuccess('')
    setShowModal(true)
  }

  const openEditModal = (item) => {
    setEditingId(item.id)
    setForm({
      company: item.company || '',
      role: item.role || '',
      location: item.location || '',
      job_url: item.job_url || '',
      salary: item.salary || '',
      status: item.status || 'Applied',
      applied_date: item.applied_date || new Date().toLocaleDateString('en-CA'),
      notes: item.notes || '',
      interview_date: item.interview_date ? item.interview_date.slice(0, 16) : '',
      interview_round: item.interview_round || '',
      interview_link: item.interview_link || '',
      interview_notes: item.interview_notes || '',
    })
    setError('')
    setSuccess('')
    setShowModal(true)
  }

  const handleFieldChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    const isEditing = editingId !== null
    const url = isEditing ? `/api/jobs/${editingId}/` : '/api/jobs/'

    const payload = {
      company: form.company.trim(),
      role: form.role.trim(),
      location: form.location.trim(),
      job_url: form.job_url.trim(),
      salary: form.salary.trim(),
      status: form.status,
      applied_date: form.applied_date,
      notes: form.notes.trim(),
      interview_date: form.interview_date ? form.interview_date : null,
      interview_round: form.interview_round.trim(),
      interview_link: form.interview_link.trim(),
      interview_notes: form.interview_notes.trim(),
    }

    try {
      const response = await apiFetch(url, {
        method: isEditing ? 'PATCH' : 'POST',
        body: JSON.stringify(payload),
      })

      if (response.status === 401) {
        clearTokens()
        navigate('/login')
        return
      }

      const data = response.status === 204 ? null : await response.json()

      if (!response.ok) {
        throw new Error(extractErrorMessage(data, 'Could not save application.'))
      }

      setShowModal(false)
      setEditingId(null)
      setForm(emptyForm())
      setSuccess(
        isEditing
          ? 'Application updated successfully.'
          : 'Application added successfully.'
      )
      await loadApplications()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (item) => {
    const confirmed = window.confirm(
      `Delete the application for ${item.company}? This cannot be undone.`
    )
    if (!confirmed) return

    setError('')
    setSuccess('')

    try {
      const response = await apiFetch(`/api/jobs/${item.id}/`, {
        method: 'DELETE',
      })

      if (response.status === 401) {
        clearTokens()
        navigate('/login')
        return
      }

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(extractErrorMessage(data, 'Could not delete application.'))
      }

      setApplications((current) =>
        current.filter((application) => application.id !== item.id)
      )
      setSuccess(`Application for ${item.company} deleted.`)
    } catch (err) {
      setError(err.message)
    }
  }

  // Kanban status change (drag/drop or dropdown)
  const handleUpdateStatus = async (id, newStatus) => {
    const previous = applications
    setApplications((current) =>
      current.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
    )
    setError('')
    setSuccess('')

    try {
      const response = await apiFetch(`/api/jobs/${id}/`, {
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
        throw new Error(extractErrorMessage(data, 'Could not update status.'))
      }

      setSuccess(`Status updated to ${newStatus}.`)
    } catch (err) {
      setApplications(previous)
      setError(err.message)
    }
  }

  // CSV Export
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
      setSuccess('CSV file downloaded successfully.')
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

  // Switch view mode helper
  const setView = (mode) => {
    if (mode === 'kanban') {
      setSearchParams({ view: 'kanban' })
    } else {
      setSearchParams({})
    }
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
      <main className="workspace-main" id="applications-main">
        <header className="workspace-header">
          <div>
            <p className="workspace-eyebrow">CAREER MANAGEMENT</p>
            <h1>My Applications</h1>
            <p className="workspace-subtitle">
              Organize your job search, move opportunities through stages, and stay on track.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="csv-export-btn"
              onClick={handleExportCSV}
              disabled={exporting || applications.length === 0}
            >
              {exporting ? 'Exporting...' : '📥 Export CSV'}
            </button>
            <button
              type="button"
              className="workspace-primary"
              onClick={() => openAddModal()}
            >
              + Add Application
            </button>
          </div>
        </header>

        {/* Motivational Banner */}
        <section className="application-banner">
          <div>
            <span className="banner-tag">CAREER ACCELERATOR</span>
            <h2>Track every step of your application journey.</h2>
            <p>
              Switch between the table view and interactive Kanban board to manage recruitment stages seamlessly.
            </p>
          </div>
          <div className="banner-symbol" aria-hidden="true">✦</div>
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

        {/* Summary Metric Cards */}
        <section className="application-summary">
          <article className="summary-card">
            <span className="summary-icon" aria-hidden="true">▤</span>
            <p>Total applications</p>
            <h2>{loading ? '—' : applications.length}</h2>
            <span className="summary-note">Saved in your account</span>
          </article>

          <article className="summary-card">
            <span className="summary-icon" aria-hidden="true">↗</span>
            <p>In progress</p>
            <h2>{loading ? '—' : inProgressCount}</h2>
            <span className="summary-note">Applied, assessment or interview</span>
          </article>

          <article className="summary-card">
            <span className="summary-icon" aria-hidden="true">★</span>
            <p>Offers received</p>
            <h2>{loading ? '—' : offerCount}</h2>
            <span className="summary-note">Keep going!</span>
          </article>
        </section>

        {/* View Switcher, Search, Filter, and Sort Controls */}
        <section className="application-list">
          <div className="view-controls-bar">
            {/* View Mode Toggle */}
            <div className="view-toggle-group" role="tablist">
              <button
                type="button"
                className={`view-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
                onClick={() => setView('table')}
                role="tab"
                aria-selected={viewMode === 'table'}
              >
                ▤ Table View
              </button>
              <button
                type="button"
                className={`view-toggle-btn ${viewMode === 'kanban' ? 'active' : ''}`}
                onClick={() => setView('kanban')}
                role="tab"
                aria-selected={viewMode === 'kanban'}
              >
                ◫ Kanban Board
              </button>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <span className="live-label">
                <span className="live-dot" /> Live DRF API
              </span>
            </div>
          </div>

          {/* Filters Toolbar */}
          <div className="jobtrack-filters">
            <input
              aria-label="Search applications"
              type="search"
              placeholder="Search company, role or location..."
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setCurrentPage(1)
              }}
            />

            <select
              aria-label="Filter by status"
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value)
                setCurrentPage(1)
              }}
            >
              <option value="All">All statuses</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>

            {viewMode === 'table' && (
              <select
                aria-label="Sort applications"
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="company_asc">Company (A-Z)</option>
                <option value="company_desc">Company (Z-A)</option>
                <option value="role_asc">Role (A-Z)</option>
              </select>
            )}

            <button
              type="button"
              className="workspace-secondary"
              onClick={() => loadApplications(true)}
              disabled={loading}
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          {/* Content Rendering: Loading / Empty / Table / Kanban */}
          {loading ? (
            <div className="jobtrack-empty-state">
              <div className="placeholder-icon">▤</div>
              <h3>Loading your applications...</h3>
              <p>Fetching real records from your Django database.</p>
            </div>
          ) : processedApplications.length === 0 ? (
            <div className="jobtrack-empty-state">
              <div className="placeholder-icon" aria-hidden="true">▤</div>
              <h3>
                {applications.length === 0
                  ? 'No applications yet'
                  : 'No matching applications'}
              </h3>
              <p>
                {applications.length === 0
                  ? 'Add your first job application to start tracking your recruitment stages.'
                  : 'Try another search term or reset the status filter.'}
              </p>
              {applications.length === 0 && (
                <button
                  type="button"
                  className="workspace-primary"
                  onClick={() => openAddModal()}
                >
                  + Add your first application
                </button>
              )}
            </div>
          ) : viewMode === 'table' ? (
            /* Table View */
            <>
              <div className="jobtrack-table-wrap">
                <table className="jobtrack-table">
                  <thead>
                    <tr>
                      <th>Company / Role</th>
                      <th>Location</th>
                      <th>Salary</th>
                      <th>Status</th>
                      <th>Applied Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedApplications.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <strong>{item.company}</strong>
                          <span className="jobtrack-role">{item.role}</span>
                          {item.job_url && (
                            <a
                              href={item.job_url}
                              target="_blank"
                              rel="noreferrer"
                              className="jobtrack-url"
                            >
                              View job ↗
                            </a>
                          )}
                        </td>
                        <td>{item.location || '—'}</td>
                        <td>{item.salary || '—'}</td>
                        <td>
                          <span
                            className={`jobtrack-status status-${String(
                              item.status
                            ).toLowerCase()}`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td>{item.applied_date || '—'}</td>
                        <td>
                          <div className="jobtrack-row-actions">
                            <button
                              type="button"
                              className="jobtrack-edit"
                              onClick={() => openEditModal(item)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="jobtrack-delete"
                              onClick={() => handleDelete(item)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              <div className="pagination-bar">
                <span className="pagination-info">
                  Showing {(currentPage - 1) * itemsPerPage + 1}–
                  {Math.min(currentPage * itemsPerPage, processedApplications.length)} of{' '}
                  {processedApplications.length} application(s)
                </span>

                <div className="pagination-controls">
                  <button
                    type="button"
                    className="pagination-btn"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  >
                    ‹ Prev
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      type="button"
                      className={`pagination-btn ${page === currentPage ? 'active' : ''}`}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    type="button"
                    className="pagination-btn"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Next ›
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* Kanban Board View */
            <div className="kanban-board">
              {statusOptions.map((status) => {
                const columnCards = processedApplications.filter(
                  (app) => app.status === status
                )
                const isOver = dragOverCol === status

                return (
                  <div
                    key={status}
                    className={`kanban-col ${isOver ? 'drag-over' : ''}`}
                    onDragOver={(e) => {
                      e.preventDefault()
                      setDragOverCol(status)
                    }}
                    onDragLeave={() => setDragOverCol(null)}
                    onDrop={(e) => {
                      e.preventDefault()
                      setDragOverCol(null)
                      const cardId = Number(e.dataTransfer.getData('text/plain'))
                      if (cardId) {
                        handleUpdateStatus(cardId, status)
                      }
                    }}
                  >
                    <div className="kanban-col-header">
                      <div className="kanban-col-title">
                        <span>{status}</span>
                        <span className={`kanban-badge kanban-badge-${status.toLowerCase()}`}>
                          {columnCards.length}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="modal-close-btn"
                        style={{ width: '26px', height: '26px', fontSize: '13px' }}
                        title={`Add application in ${status}`}
                        onClick={() => openAddModal(status)}
                      >
                        +
                      </button>
                    </div>

                    <div className="kanban-card-list">
                      {columnCards.map((card) => {
                        const isDragging = draggingCardId === card.id

                        return (
                          <div
                            key={card.id}
                            className={`kanban-card ${isDragging ? 'is-dragging' : ''}`}
                            draggable
                            onDragStart={(e) => {
                              setDraggingCardId(card.id)
                              e.dataTransfer.setData('text/plain', String(card.id))
                            }}
                            onDragEnd={() => setDraggingCardId(null)}
                          >
                            <div className="kanban-card-company">{card.company}</div>
                            <div className="kanban-card-role">{card.role}</div>

                            <div className="kanban-card-tags">
                              {card.location && (
                                <span className="kanban-tag">{card.location}</span>
                              )}
                              {card.salary && (
                                <span className="kanban-tag">{card.salary}</span>
                              )}
                              {card.interview_round && (
                                <span className="kanban-tag" style={{ background: '#f0eaff', color: '#6840b3' }}>
                                  {card.interview_round}
                                </span>
                              )}
                            </div>

                            <div className="kanban-card-footer">
                              <span>{card.applied_date || '—'}</span>

                              {/* Mobile / Dropdown Quick Move */}
                              <select
                                className="kanban-move-select"
                                value={card.status}
                                onChange={(e) => handleUpdateStatus(card.id, e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                aria-label="Change stage"
                              >
                                {statusOptions.map((st) => (
                                  <option key={st} value={st}>
                                    Move: {st}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                              <button
                                type="button"
                                className="jobtrack-edit"
                                style={{ padding: '4px 8px', fontSize: '11px', flex: 1 }}
                                onClick={() => openEditModal(card)}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="jobtrack-delete"
                                style={{ padding: '4px 8px', fontSize: '11px' }}
                                onClick={() => handleDelete(card)}
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        )
                      })}

                      {columnCards.length === 0 && (
                        <div className="kanban-empty-col">Drop cards here</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        <footer className="workspace-footer">
          JobTrack <span>·</span> Stay organized. Keep growing.
        </footer>
      </main>

      {/* Responsive Add / Edit Modal */}
      {showModal && (
        <div
          className="jobtrack-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal()
          }}
        >
          <div
            className="jobtrack-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="application-modal-title"
          >
            <div className="jobtrack-form-heading">
              <div>
                <h2 id="application-modal-title">
                  {editingId !== null ? 'Edit Application' : 'Add Application'}
                </h2>
                <p>
                  {editingId !== null
                    ? 'Update your job application and interview details.'
                    : 'Enter the job opportunity details below.'}
                </p>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={closeModal}
                disabled={saving}
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="jobtrack-form-grid">
                <label>
                  Company name *
                  <input
                    name="company"
                    type="text"
                    value={form.company}
                    onChange={handleFieldChange}
                    required
                    maxLength={150}
                    placeholder="e.g. Google, Microsoft, Startup Inc."
                  />
                </label>

                <label>
                  Job role *
                  <input
                    name="role"
                    type="text"
                    value={form.role}
                    onChange={handleFieldChange}
                    required
                    maxLength={150}
                    placeholder="e.g. Frontend Developer"
                  />
                </label>

                <label>
                  Location
                  <input
                    name="location"
                    type="text"
                    value={form.location}
                    onChange={handleFieldChange}
                    maxLength={150}
                    placeholder="e.g. Remote, Bangalore, Hyderabad"
                  />
                </label>

                <label>
                  Job URL
                  <input
                    name="job_url"
                    type="url"
                    value={form.job_url}
                    onChange={handleFieldChange}
                    placeholder="https://..."
                  />
                </label>

                <label>
                  Salary / Compensation
                  <input
                    name="salary"
                    type="text"
                    value={form.salary}
                    onChange={handleFieldChange}
                    maxLength={100}
                    placeholder="e.g. 10 LPA or $80,000"
                  />
                </label>

                <label>
                  Status *
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleFieldChange}
                    required
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Application date *
                  <input
                    name="applied_date"
                    type="date"
                    value={form.applied_date}
                    onChange={handleFieldChange}
                    required
                  />
                </label>

                <label>
                  Interview round (optional)
                  <input
                    name="interview_round"
                    type="text"
                    value={form.interview_round}
                    onChange={handleFieldChange}
                    maxLength={100}
                    placeholder="e.g. Technical Round 1, HR Round"
                  />
                </label>

                <label>
                  Interview date & time (optional)
                  <input
                    name="interview_date"
                    type="datetime-local"
                    value={form.interview_date}
                    onChange={handleFieldChange}
                  />
                </label>

                <label>
                  Meeting link (optional)
                  <input
                    name="interview_link"
                    type="url"
                    value={form.interview_link}
                    onChange={handleFieldChange}
                    placeholder="https://meet.google.com/..."
                  />
                </label>

                <label className="jobtrack-notes-field">
                  Application & Interview notes
                  <textarea
                    name="notes"
                    value={form.notes}
                    onChange={handleFieldChange}
                    rows={3}
                    placeholder="Recruiter contact, preparation notes, follow-up reminders..."
                  />
                </label>
              </div>

              <div className="jobtrack-form-actions">
                <button
                  type="button"
                  className="workspace-secondary"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="workspace-primary"
                  disabled={saving}
                >
                  {saving
                    ? 'Saving...'
                    : editingId !== null
                    ? 'Save Changes'
                    : 'Add Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}