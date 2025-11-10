import { useState, useEffect } from 'react'
import { useBand } from '../../hooks/useBand'

export default function BandModal({ onClose, initialMode = 'select' }) {
  const { bands, currentBand, createBand, switchBand, inviteMember, getBandMembers } = useBand()
  const [mode, setMode] = useState(initialMode) // 'select', 'create', 'invite', 'members'
  
  // Update mode when initialMode changes (e.g., when clicking invite button)
  useEffect(() => {
    setMode(initialMode)
  }, [initialMode])
  const [bandName, setBandName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const handleCreateBand = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const result = await createBand(bandName)
    
    if (result.success) {
      setSuccess(`✅ Band "${bandName}" created!`)
      setBandName('')
      setTimeout(() => {
        onClose()
      }, 1500)
    } else {
      setError(result.error)
    }
    
    setLoading(false)
  }

  const handleInviteMember = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!currentBand) {
      setError('No band selected')
      setLoading(false)
      return
    }

    const result = await inviteMember(currentBand.id, inviteEmail)
    
    if (result.success) {
      setSuccess(`✅ ${inviteEmail} has been added to ${currentBand.name}! They can now see all songs and setlists.`)
      setInviteEmail('')
      setTimeout(() => setSuccess(null), 5000)
    } else {
      setError(result.error || 'Failed to invite member. Make sure they have an account.')
    }
    
    setLoading(false)
  }

  const loadMembers = async (bandId) => {
    setLoading(true)
    const result = await getBandMembers(bandId)
    if (result.success) {
      setMembers(result.members)
    }
    setLoading(false)
  }

  const renderSelectMode = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
        Your Bands
      </h3>

      {bands.length === 0 ? (
        <div className="text-center py-8 text-[var(--color-text-secondary)]">
          <p className="mb-4">You're not in any bands yet.</p>
          <button
            onClick={() => setMode('create')}
            className="px-6 py-3 bg-[var(--color-accent-cyan)] text-black rounded-lg font-semibold hover:opacity-90 transition-all"
          >
            Create Your First Band
          </button>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {bands.map(band => (
              <button
                key={band.id}
                onClick={() => {
                  switchBand(band)
                  onClose()
                }}
                className={`w-full px-4 py-3 rounded-lg text-left transition-all ${
                  currentBand?.id === band.id
                    ? 'bg-[var(--color-accent-cyan)]/20 border-2 border-[var(--color-accent-cyan)]'
                    : 'bg-[var(--color-bg-tertiary)] border border-[var(--color-glass-border)] hover:border-[var(--color-accent-cyan)]'
                }`}
              >
                <div className="font-semibold text-[var(--color-text-primary)]">
                  {band.name}
                </div>
                {currentBand?.id === band.id && (
                  <div className="text-xs text-[var(--color-accent-cyan)] mt-1">
                    ✓ Current band
                  </div>
                )}
              </button>
            ))}
          </div>

          <div className="flex gap-2 pt-4 border-t border-[var(--color-glass-border)]">
            <button
              onClick={() => setMode('create')}
              className="flex-1 px-4 py-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-glass-border)] rounded-lg font-semibold text-[var(--color-text-primary)] hover:border-[var(--color-accent-cyan)] transition-all"
            >
              + New Band
            </button>
            {currentBand && (
              <>
                <button
                  onClick={() => setMode('invite')}
                  className="flex-1 px-4 py-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-glass-border)] rounded-lg font-semibold text-[var(--color-text-primary)] hover:border-[var(--color-accent-purple)] transition-all"
                >
                  Invite Member
                </button>
                <button
                  onClick={() => {
                    setMode('members')
                    loadMembers(currentBand.id)
                  }}
                  className="flex-1 px-4 py-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-glass-border)] rounded-lg font-semibold text-[var(--color-text-primary)] hover:border-[var(--color-accent-purple)] transition-all"
                >
                  View Members
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  )

  const renderCreateMode = () => (
    <div className="space-y-4">
      <button
        onClick={() => setMode('select')}
        className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
      >
        ← Back
      </button>

      <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
        Create New Band
      </h3>

      <form onSubmit={handleCreateBand} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
            Band Name
          </label>
          <input
            type="text"
            placeholder="The Rockers"
            value={bandName}
            onChange={(e) => setBandName(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-glass-border)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)]/50 focus:outline-none focus:border-[var(--color-accent-cyan)] transition-colors"
            required
          />
        </div>

        {error && (
          <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded-lg p-3">
            {error}
          </div>
        )}

        {success && (
          <div className="text-green-400 text-sm bg-green-500/10 border border-green-500/30 rounded-lg p-3">
            {success}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-3 bg-[var(--color-accent-cyan)] text-black rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 transition-all"
        >
          {loading ? '⏳ Creating...' : 'Create Band'}
        </button>
      </form>
    </div>
  )

  const renderInviteMode = () => (
    <div className="space-y-4">
      <button
        onClick={() => setMode('select')}
        className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
      >
        ← Back
      </button>

      <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
        Invite to {currentBand?.name}
      </h3>

      <form onSubmit={handleInviteMember} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
            Member Email
          </label>
          <input
            type="email"
            placeholder="bandmate@example.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-glass-border)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)]/50 focus:outline-none focus:border-[var(--color-accent-purple)] transition-colors"
            required
          />
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">
            Enter their email address. They must have signed up already.
          </p>
        </div>

        {error && (
          <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded-lg p-3">
            {error}
          </div>
        )}

        {success && (
          <div className="text-green-400 text-sm bg-green-500/10 border border-green-500/30 rounded-lg p-3">
            {success}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-3 bg-[var(--color-accent-purple)] text-white rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 transition-all"
        >
          {loading ? '⏳ Inviting...' : 'Send Invite'}
        </button>
      </form>
    </div>
  )

  const renderMembersMode = () => (
    <div className="space-y-4">
      <button
        onClick={() => setMode('select')}
        className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
      >
        ← Back
      </button>

      <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
        {currentBand?.name} Members
      </h3>

      {loading ? (
        <div className="text-center py-8 text-[var(--color-text-secondary)]">
          Loading members...
        </div>
      ) : (
        <div className="space-y-2">
          {members.map(member => (
            <div
              key={member.id}
              className="px-4 py-3 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-glass-border)]"
            >
              <div className="font-semibold text-[var(--color-text-primary)]">
                {member.users.display_name || member.users.email}
              </div>
              <div className="text-sm text-[var(--color-text-secondary)] flex items-center gap-2 mt-1">
                <span>{member.role}</span>
                {member.users.instrument && (
                  <>
                    <span>•</span>
                    <span>{member.users.instrument}</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-glass-border)] rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">
            🎸 Band Management
          </h2>
          <button
            onClick={onClose}
            className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] text-2xl"
          >
            ×
          </button>
        </div>

        {mode === 'select' && renderSelectMode()}
        {mode === 'create' && renderCreateMode()}
        {mode === 'invite' && renderInviteMode()}
        {mode === 'members' && renderMembersMode()}
      </div>
    </div>
  )
}

