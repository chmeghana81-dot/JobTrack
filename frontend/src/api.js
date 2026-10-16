// API Client for JobTrack
// Handles base URL configuration, JWT header attachment, and automatic token refresh.

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

export function getAccessToken() {
  return sessionStorage.getItem('jobtrack_access')
}

export function getRefreshToken() {
  return sessionStorage.getItem('jobtrack_refresh')
}

export function setTokens(access, refresh) {
  if (access) sessionStorage.setItem('jobtrack_access', access)
  if (refresh) sessionStorage.setItem('jobtrack_refresh', refresh)
}

export function clearTokens() {
  sessionStorage.removeItem('jobtrack_access')
  sessionStorage.removeItem('jobtrack_refresh')
  sessionStorage.removeItem('jobtrack_user')
}

export function getStoredUser() {
  try {
    const raw = sessionStorage.getItem('jobtrack_user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setStoredUser(user) {
  if (user) {
    sessionStorage.setItem('jobtrack_user', JSON.stringify(user))
  } else {
    sessionStorage.removeItem('jobtrack_user')
  }
}

export function getStoredTheme() {
  return localStorage.getItem('jobtrack_theme') || 'dark'
}

export function setStoredTheme(theme) {
  localStorage.setItem('jobtrack_theme', theme)
  if (theme === 'light') {
    document.documentElement.classList.add('light-theme')
  } else {
    document.documentElement.classList.remove('light-theme')
  }
}

export function initTheme() {
  const theme = getStoredTheme()
  if (theme === 'light') {
    document.documentElement.classList.add('light-theme')
  } else {
    document.documentElement.classList.remove('light-theme')
  }
  return theme
}

export function isAuthenticated() {
  return Boolean(getAccessToken())
}

// Attempts to refresh the JWT access token using the stored refresh token.
export async function refreshAccessToken() {
  const refresh = getRefreshToken()
  if (!refresh) {
    clearTokens()
    return null
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    })

    if (!response.ok) {
      clearTokens()
      return null
    }

    const data = await response.json()
    if (data.access) {
      sessionStorage.setItem('jobtrack_access', data.access)
      return data.access
    }

    clearTokens()
    return null
  } catch {
    clearTokens()
    return null
  }
}

// Wrapper around fetch that adds auth headers and automatically retries with refreshed token on 401.
export async function apiFetch(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }

  const token = getAccessToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  let response = await fetch(url, { ...options, headers })

  // If unauthorized and we have a refresh token, try refreshing and retry request once
  if (response.status === 401 && getRefreshToken()) {
    const newAccess = await refreshAccessToken()
    if (newAccess) {
      headers['Authorization'] = `Bearer ${newAccess}`
      response = await fetch(url, { ...options, headers })
    }
  }

  return response
}

// Helper to extract user-friendly error messages from DRF response data
export function extractErrorMessage(data, defaultMsg = 'Something went wrong.') {
  if (!data) return defaultMsg
  if (typeof data === 'string') return data
  if (typeof data.detail === 'string') return data.detail

  return (
    Object.entries(data)
      .map(([field, messages]) => {
        const value = Array.isArray(messages) ? messages.join(', ') : String(messages)
        return `${field}: ${value}`
      })
      .join(' | ') || defaultMsg
  )
}

