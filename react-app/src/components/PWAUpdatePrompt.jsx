import { useEffect, useState } from 'react'

export default function PWAUpdatePrompt() {
  const [showPrompt, setShowPrompt] = useState(false)
  const [updateAvailable, setUpdateAvailable] = useState(false)

  useEffect(() => {
    // Check for service worker updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        setUpdateAvailable(true)
        setShowPrompt(true)
      })

      // Check for updates periodically
      const checkForUpdates = async () => {
        try {
          const registration = await navigator.serviceWorker.getRegistration()
          if (registration) {
            await registration.update()
          }
        } catch (e) {
          console.log('SW update check failed', e)
        }
      }

      // Check every 5 minutes
      const interval = setInterval(checkForUpdates, 5 * 60 * 1000)
      
      return () => clearInterval(interval)
    }
  }, [])

  const handleUpdate = () => {
    // Reload to get the new service worker
    window.location.reload()
  }

  const handleDismiss = () => {
    setShowPrompt(false)
  }

  if (!showPrompt) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      padding: '16px 24px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
      zIndex: 10000,
      maxWidth: '400px',
      width: '90%',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    }}>
      <div style={{ fontWeight: 600, fontSize: '1rem' }}>
        🎉 Update Available
      </div>
      <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
        A new version of the app is available. Reload to get the latest features.
      </div>
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
        <button
          className="btn btn-secondary"
          onClick={handleDismiss}
          style={{ fontSize: '0.85rem', padding: '8px 16px' }}
        >
          Later
        </button>
        <button
          className="btn btn-primary"
          onClick={handleUpdate}
          style={{ fontSize: '0.85rem', padding: '8px 16px' }}
        >
          Reload
        </button>
      </div>
    </div>
  )
}
