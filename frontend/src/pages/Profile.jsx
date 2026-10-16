import { useCallback, useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  apiFetch,
  clearTokens,
  extractErrorMessage,
  getStoredTheme,
  setStoredTheme,
  setStoredUser,
} from '../api.js'
import '../Styles/Pages.css'

const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: '▦' },
  { label: 'Applications', path: '/applications', icon: '▤' },
  { label: 'Interviews', path: '/interviews', icon: '▣' },
  { label: 'Analytics', path: '/analytics', icon: '▥' },
  { label: 'Saved Jobs', path: '/saved-jobs', icon: '★' },
  { label: 'Profile & Settings', path: '/profile', icon: '⚙' },
]

export default function Profile() {
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState('profile') // 'profile', 'appearance', 'security', 'account'
  const [loading, setLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [theme, setTheme] = useState(getStoredTheme())
  const [showOldPassword, setShowOldPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)

  // User Profile Form
  const [profileForm, setProfileForm] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    headline: '',
    target_role: '',
    target_salary: '',
    preferred_location: '',
  })

  // Password Form
  const [passwordForm, setPasswordForm] = useState({
    old_password: '',
    new_password: '',
    confirm_new_password: '',
  })

  const loadProfile = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await apiFetch('/api/auth/profile/')
      if (response.status === 401) {
        clearTokens()
        navigate('/login')
        return
      }

      const data = await response.json()
      if (!response.ok) {
        throw new Error(extractErrorMessage(data, 'Unable to load profile.'))
      }

      setProfileForm({
        username: data.username || '',
        email: data.email || '',
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        headline: data.profile?.headline || '',
        target_role: data.profile?.target_role || '',
        target_salary: data.profile?.target_salary || '',
        preferred_location: data.profile?.preferred_location || '',
      })

      if (data.profile?.theme_preference) {
        setTheme(data.profile.theme_preference)
        setStoredTheme(data.profile.theme_preference)
      }
      setStoredUser(data)
    } catch (err) {
      setError(
        err.message === 'Failed to fetch'
          ? 'Cannot connect to backend server on port 8000.'
          : err.message
      )
    } finally {
      setLoading(false)
    }
  }, [navigate])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  async function handleSaveProfile(e) {
    e.preventDefault()
    setSavingProfile(true)
    setError('')
    setSuccess('')

    try {
      const response = await apiFetch('/api/auth/profile/', {
        method: 'PATCH',
        body: JSON.stringify({
          first_name: profileForm.first_name.trim(),
          last_name: profileForm.last_name.trim(),
          email: profileForm.email.trim(),
          headline: profileForm.headline.trim(),
          target_role: profileForm.target_role.trim(),
          target_salary: profileForm.target_salary.trim(),
          preferred_location: profileForm.preferred_location.trim(),
          theme_preference: theme,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(extractErrorMessage(data, 'Could not save profile.'))
      }

      setStoredUser(data)
      setSuccess('Profile details updated successfully.')
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingProfile(false)
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault()
    if (passwordForm.new_password !== passwordForm.confirm_new_password) {
      setError('New passwords do not match.')
      return
    }

    if (passwordForm.new_password.length < 8) {
      setError('New password must be at least 8 characters long.')
      return
    }

    setSavingPassword(true)
    setError('')
    setSuccess('')

    try {
      const response = await apiFetch('/api/auth/change-password/', {
        method: 'POST',
        body: JSON.stringify({
          old_password: passwordForm.old_password,
          new_password: passwordForm.new_password,
          confirm_new_password: passwordForm.confirm_new_password,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(extractErrorMessage(data, 'Could not change password.'))
      }

      setPasswordForm({
        old_password: '',
        new_password: '',
        confirm_new_password: '',
      })
      setSuccess('Security credentials updated. Password changed successfully.')
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingPassword(false)
    }
  }

  function handleThemeChange(selectedTheme) {
    setTheme(selectedTheme)
    setStoredTheme(selectedTheme)
    setSuccess(`Theme switched to ${selectedTheme === 'dark' ? 'Dark Mode' : 'Light Mode'}.`)
    // Persist in background
    apiFetch('/api/auth/profile/', {
      method: 'PATCH',
      body: JSON.stringify({ theme_preference: selectedTheme }),
    }).catch(() => {})
  }

  const handleLogout = () => {
    clearTokens()
    navigate('/login')
  }

  const displayName = profileForm.first_name
    ? `${profileForm.first_name} ${profileForm.last_name}`.trim()
    : profileForm.username || 'Candidate'

  const avatarInitial = displayName.charAt(0).toUpperCase() || 'U'

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
          <div className="workspace-avatar">{avatarInitial}</div>
          <div>
            <strong>{displayName}</strong>
            <p>{profileForm.headline || 'Job Seeker'}</p>
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
      <main className="workspace-main">
        <header className="workspace-header">
          <div>
            <p className="workspace-eyebrow">ACCOUNT & PREFERENCES</p>
            <h1>Profile & Settings</h1>
            <p className="workspace-subtitle">
              Manage your personal information, career target goals, theme appearance, and security credentials.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              className="nav-theme-btn"
              onClick={() => handleThemeChange(theme === 'dark' ? 'light' : 'dark')}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
            </button>
            <button
              type="button"
              className="workspace-primary"
              onClick={loadProfile}
              disabled={loading}
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </header>

        {/* Global Feedback Messages */}
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

        {/* Settings Navigation Tabs */}
        <div className="settings-tabs">
          <button
            type="button"
            className={`settings-tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            👤 Personal Profile
          </button>
          <button
            type="button"
            className={`settings-tab-btn ${activeTab === 'appearance' ? 'active' : ''}`}
            onClick={() => setActiveTab('appearance')}
          >
            🎨 Appearance & Theme
          </button>
          <button
            type="button"
            className={`settings-tab-btn ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            🔒 Security & Password
          </button>
          <button
            type="button"
            className={`settings-tab-btn ${activeTab === 'account' ? 'active' : ''}`}
            onClick={() => setActiveTab('account')}
          >
            ⚙ Account & Session
          </button>
        </div>

        {/* TAB 1: Personal Profile */}
        {activeTab === 'profile' && (
          <div className="profile-grid" style={{ gridTemplateColumns: 'minmax(0, 1fr)' }}>
            <section className="profile-card">
              <div className="profile-card-header" style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                <div
                  className="workspace-avatar"
                  style={{ width: '56px', height: '56px', fontSize: '22px' }}
                >
                  {avatarInitial}
                </div>
                <div>
                  <h2 style={{ fontSize: '20px', margin: 0 }}>{displayName}</h2>
                  <p style={{ margin: '4px 0 0' }}>{profileForm.email || 'No email attached'} · @{profileForm.username}</p>
                </div>
              </div>

              <form onSubmit={handleSaveProfile} className="modal-form">
                <div className="modal-form-row">
                  <div className="modal-form-group">
                    <label htmlFor="prof-first">First Name</label>
                    <input
                      id="prof-first"
                      type="text"
                      value={profileForm.first_name}
                      onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })}
                      placeholder="e.g. Alex"
                    />
                  </div>
                  <div className="modal-form-group">
                    <label htmlFor="prof-last">Last Name</label>
                    <input
                      id="prof-last"
                      type="text"
                      value={profileForm.last_name}
                      onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })}
                      placeholder="e.g. Morgan"
                    />
                  </div>
                </div>

                <div className="modal-form-row">
                  <div className="modal-form-group">
                    <label htmlFor="prof-email">Email Address</label>
                    <input
                      id="prof-email"
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      placeholder="alex@example.com"
                      required
                    />
                  </div>
                  <div className="modal-form-group">
                    <label htmlFor="prof-username">Username (Account Identifier)</label>
                    <input
                      id="prof-username"
                      type="text"
                      value={profileForm.username}
                      disabled
                      style={{ opacity: 0.6, cursor: 'not-allowed' }}
                    />
                  </div>
                </div>

                <div className="modal-form-group">
                  <label htmlFor="prof-headline">Professional Headline</label>
                  <input
                    id="prof-headline"
                    type="text"
                    value={profileForm.headline}
                    onChange={(e) => setProfileForm({ ...profileForm, headline: e.target.value })}
                    placeholder="e.g. Senior Full-Stack Engineer | React & Python"
                  />
                </div>

                <div className="modal-form-row">
                  <div className="modal-form-group">
                    <label htmlFor="prof-target-role">Target Job Role</label>
                    <input
                      id="prof-target-role"
                      type="text"
                      value={profileForm.target_role}
                      onChange={(e) => setProfileForm({ ...profileForm, target_role: e.target.value })}
                      placeholder="e.g. Staff Frontend Architect"
                    />
                  </div>
                  <div className="modal-form-group">
                    <label htmlFor="prof-salary">Target Compensation</label>
                    <input
                      id="prof-salary"
                      type="text"
                      value={profileForm.target_salary}
                      onChange={(e) => setProfileForm({ ...profileForm, target_salary: e.target.value })}
                      placeholder="e.g. $150,000 / 18 LPA"
                    />
                  </div>
                </div>

                <div className="modal-form-group">
                  <label htmlFor="prof-location">Preferred Working Location</label>
                  <input
                    id="prof-location"
                    type="text"
                    value={profileForm.preferred_location}
                    onChange={(e) => setProfileForm({ ...profileForm, preferred_location: e.target.value })}
                    placeholder="e.g. Remote (US/EU) or Hybrid in San Francisco"
                  />
                </div>

                <div style={{ marginTop: '12px', display: 'flex', gap: '12px' }}>
                  <button
                    type="submit"
                    className="modal-submit-btn"
                    disabled={savingProfile}
                  >
                    {savingProfile ? 'Saving Details...' : 'Save Profile Changes'}
                  </button>
                  <button
                    type="button"
                    className="workspace-secondary"
                    onClick={loadProfile}
                    disabled={savingProfile}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}

        {/* TAB 2: Appearance & Theme */}
        {activeTab === 'appearance' && (
          <div className="profile-grid" style={{ gridTemplateColumns: 'minmax(0, 1fr)' }}>
            <section className="profile-card">
              <div className="profile-card-header">
                <h2>Interface Theme & Visual Style</h2>
                <p>Customize the look and feel of your JobTrack dashboard.</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px', marginTop: '16px' }}>
                <div
                  onClick={() => handleThemeChange('dark')}
                  style={{
                    padding: '20px',
                    borderRadius: '12px',
                    background: '#0d1124',
                    border: theme === 'dark' ? '2px solid #7c6cf0' : '1px solid rgba(255, 255, 255, 0.1)',
                    cursor: 'pointer',
                    color: '#fff',
                    boxShadow: theme === 'dark' ? '0 0 20px rgba(124, 108, 240, 0.3)' : 'none',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '20px' }}>🌙</span>
                    {theme === 'dark' && <span style={{ color: '#7c6cf0', fontWeight: 800, fontSize: '13px' }}>Active ✓</span>}
                  </div>
                  <h3 style={{ margin: '0 0 6px', fontSize: '16px' }}>Dark Theme</h3>
                  <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>
                    Deep navy surfaces designed for focused late-night job hunting with minimal eye strain.
                  </p>
                </div>

                <div
                  onClick={() => handleThemeChange('light')}
                  style={{
                    padding: '20px',
                    borderRadius: '12px',
                    background: '#ffffff',
                    border: theme === 'light' ? '2px solid #6352de' : '1px solid #dcdde8',
                    cursor: 'pointer',
                    color: '#181c2f',
                    boxShadow: theme === 'light' ? '0 0 20px rgba(99, 82, 222, 0.25)' : 'none',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '20px' }}>☀️</span>
                    {theme === 'light' && <span style={{ color: '#6352de', fontWeight: 800, fontSize: '13px' }}>Active ✓</span>}
                  </div>
                  <h3 style={{ margin: '0 0 6px', fontSize: '16px' }}>Light Theme</h3>
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                    Clean daylight aesthetic with high-contrast surfaces and crisp typography.
                  </p>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* TAB 3: Security & Password */}
        {activeTab === 'security' && (
          <div className="profile-grid" style={{ gridTemplateColumns: 'minmax(0, 1fr)' }}>
            <section className="profile-card">
              <div className="profile-card-header">
                <h2>Account Credentials & Password Security</h2>
                <p>Change your master login password to keep your pipeline secure.</p>
              </div>

              <form onSubmit={handleChangePassword} className="modal-form" style={{ maxWidth: '540px' }}>
                <div className="modal-form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label htmlFor="sec-old-pass">Current Password</label>
                    <button
                      type="button"
                      onClick={() => setShowOldPassword((v) => !v)}
                      style={{ border: 'none', background: 'transparent', color: 'var(--primary)', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                    >
                      {showOldPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <input
                    id="sec-old-pass"
                    type={showOldPassword ? 'text' : 'password'}
                    value={passwordForm.old_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, old_password: e.target.value })}
                    placeholder="Enter current password"
                    required
                  />
                </div>

                <div className="modal-form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label htmlFor="sec-new-pass">New Password (At least 8 characters)</label>
                    <button
                      type="button"
                      onClick={() => setShowNewPassword((v) => !v)}
                      style={{ border: 'none', background: 'transparent', color: 'var(--primary)', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                    >
                      {showNewPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <input
                    id="sec-new-pass"
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordForm.new_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                    placeholder="Enter strong new password"
                    required
                  />
                </div>

                <div className="modal-form-group">
                  <label htmlFor="sec-confirm-pass">Confirm New Password</label>
                  <input
                    id="sec-confirm-pass"
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordForm.confirm_new_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirm_new_password: e.target.value })}
                    placeholder="Re-enter new password"
                    required
                  />
                </div>

                <div style={{ marginTop: '14px' }}>
                  <button
                    type="submit"
                    className="modal-submit-btn"
                    disabled={savingPassword}
                  >
                    {savingPassword ? 'Updating Security...' : 'Update Password'}
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}

        {/* TAB 4: Account & Session */}
        {activeTab === 'account' && (
          <div className="profile-grid" style={{ gridTemplateColumns: 'minmax(0, 1fr)' }}>
            <section className="profile-card">
              <div className="profile-card-header">
                <h2>Account Information & Session State</h2>
                <p>Manage your active session and view multi-tenant isolation details.</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 16px', background: 'var(--bg-page)', borderRadius: '10px' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Logged in as</span>
                  <strong style={{ color: 'var(--text-main)', fontSize: '13px' }}>{profileForm.username} ({profileForm.email || 'No email'})</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 16px', background: 'var(--bg-page)', borderRadius: '10px' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Data Isolation</span>
                  <span style={{ color: '#10b981', fontWeight: 700, fontSize: '13px' }}>✓ Strictly Isolated by User Token</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 16px', background: 'var(--bg-page)', borderRadius: '10px' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Authentication Protocol</span>
                  <span style={{ color: 'var(--text-main)', fontSize: '13px' }}>JSON Web Token (JWT) with Auto-Refresh</span>
                </div>
              </div>

              <div>
                <button
                  type="button"
                  onClick={handleLogout}
                  style={{
                    padding: '12px 22px',
                    borderRadius: '9px',
                    border: '1px solid #ef4444',
                    background: 'rgba(239, 68, 68, 0.1)',
                    color: '#ef4444',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  🚪 Sign Out of JobTrack
                </button>
              </div>
            </section>
          </div>
        )}

        <footer className="workspace-footer">
          JobTrack <span>·</span> Built for career excellence. Strict multi-tenant isolation guaranteed.
        </footer>
      </main>
    </div>
  )
}
