
import { Routes, Route, Link, Navigate } from 'react-router-dom'
import { isAuthenticated } from './api.js'
import Dashboard from './Dashboard.jsx'
import Applications from './pages/Applications.jsx'
import Interviews from './pages/Interviews.jsx'
import Analytics from './pages/Analytics.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import SavedJobs from './pages/SavedJobs.jsx'
import LandingPage from './pages/LandingPage.jsx'
import Profile from './pages/Profile.jsx'

function ProtectedRoute({ children }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />
  }
  return children
}

function NotFound() {
  return (
    <div style={{ padding: '48px 32px', fontFamily: 'Inter, system-ui, sans-serif', textAlign: 'center' }}>
      <h1 style={{ fontSize: '32px', marginBottom: '12px' }}>Page not found</h1>
      <p style={{ color: '#666', marginBottom: '24px' }}>The page you requested does not exist.</p>
      <Link to="/" style={{ color: '#6c61dc', fontWeight: 600 }}>Return to Home</Link>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      {/* Public Landing Page */}
      <Route path="/" element={<LandingPage />} />

      {/* Public Auth Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected Workspace Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/applications"
        element={
          <ProtectedRoute>
            <Applications />
          </ProtectedRoute>
        }
      />
      <Route
        path="/interviews"
        element={
          <ProtectedRoute>
            <Interviews />
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytics"
        element={
          <ProtectedRoute>
            <Analytics />
          </ProtectedRoute>
        }
      />
      <Route
        path="/saved-jobs"
        element={
          <ProtectedRoute>
            <SavedJobs />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />

      {/* 404 Handler */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

