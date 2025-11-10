import { useState } from 'react'
import { useSupabase } from '../../context/SupabaseContext'

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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-glass-border)] rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <h2 className="text-2xl font-bold mb-4 text-[var(--color-text-primary)]">
          {mode === 'login' ? '🔐 Log In' : '🎸 Sign Up'}
        </h2>

        {successMessage && (
          <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                Display Name
              </label>
              <input
                type="text"
                placeholder="Your name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-glass-border)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)]/50 focus:outline-none focus:border-[var(--color-accent-cyan)] transition-colors"
                required
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
              Email
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-glass-border)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)]/50 focus:outline-none focus:border-[var(--color-accent-cyan)] transition-colors"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-glass-border)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)]/50 focus:outline-none focus:border-[var(--color-accent-cyan)] transition-colors"
              required
              minLength={6}
            />
          </div>

          {error && (
            <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-3 bg-[var(--color-accent-cyan)] text-black rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
          >
            {loading ? '⏳ Loading...' : mode === 'login' ? 'Log In' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-4 text-center text-sm">
          {mode === 'login' ? (
            <>
              Don't have an account?{' '}
              <button
                onClick={() => {
                  setMode('signup')
                  setError(null)
                  setSuccessMessage(null)
                }}
                className="text-[var(--color-accent-cyan)] hover:underline font-semibold"
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                onClick={() => {
                  setMode('login')
                  setError(null)
                  setSuccessMessage(null)
                }}
                className="text-[var(--color-accent-cyan)] hover:underline font-semibold"
              >
                Log in
              </button>
            </>
          )}
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
        >
          Continue offline →
        </button>
      </div>
    </div>
  )
}

