import { useState } from 'react'
import { useSupabase } from '../../context/SupabaseContext'
import './LoginModal.css'

export default function LoginModal({ onClose }) {
  const { signIn, signUp, isOnline } = useSupabase()
  const [mode, setMode] = useState('login') // 'login' or 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)
    setLoading(true)

    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password)
        if (error) throw error
        onClose()
      } else {
        const { error } = await signUp(email, password, displayName)
        if (error) throw error
        setSuccessMessage('✅ Check your email for verification link!')
        setMode('login')
        setEmail('')
        setPassword('')
        setDisplayName('')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!isOnline) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
        <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-glass-border)] rounded-2xl p-6 w-full max-w-md">
          <h2 className="text-2xl font-bold mb-4">Offline Mode</h2>
          <p className="text-[var(--color-text-secondary)] mb-4">
            Supabase is not configured. The app will work in offline-only mode using local storage.
          </p>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-[var(--color-accent-cyan)] text-black rounded-lg font-semibold hover:opacity-90"
          >
            Continue Offline
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="login-modal-overlay" onClick={onClose}>
      <div className="login-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="login-modal-header">
          <h2 className="login-modal-title">
            <span aria-hidden="true">{mode === 'login' ? '🔐' : '🎸'}</span>
            {mode === 'login' ? 'Log In' : 'Sign Up'}
          </h2>
          <button
            onClick={onClose}
            className="login-modal-close"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {successMessage && (
          <div className="login-modal-alert login-modal-alert--success">
            <span aria-hidden="true">✅</span>
            {successMessage}
          </div>
        )}

        {error && (
          <div className="login-modal-alert login-modal-alert--error">
            <span aria-hidden="true">⚠️</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-modal-form">
          {mode === 'signup' && (
            <div className="login-modal-field">
              <label htmlFor="displayName" className="login-modal-label">
                Display Name
              </label>
              <input
                id="displayName"
                type="text"
                placeholder="Your name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="login-modal-input"
                required
              />
            </div>
          )}
          
          <div className="login-modal-field">
            <label htmlFor="email" className="login-modal-label">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="login-modal-input"
              required
              autoComplete="email"
            />
          </div>
          
          <div className="login-modal-field">
            <label htmlFor="password" className="login-modal-label">
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="login-modal-input"
              required
              minLength={6}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="login-modal-submit"
          >
            {loading ? '⏳ Loading...' : mode === 'login' ? 'Log In' : 'Sign Up'}
          </button>
        </form>

        <div className="login-modal-footer">
          <div className="login-modal-toggle">
            {mode === 'login' ? (
              <>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup')
                    setError(null)
                    setSuccessMessage(null)
                  }}
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login')
                    setError(null)
                    setSuccessMessage(null)
                  }}
                >
                  Log in
                </button>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="login-modal-offline"
          >
            Continue offline →
          </button>
        </div>
      </div>
    </div>
  )
}

