import { useEffect, useState } from 'react'

export default function PWAUpdatePrompt() {
  const [showPrompt, setShowPrompt] = useState(false)
  const [updateAvailable, setUpdateAvailable] = useState(false)

  useEffect(() => {
    // Check for service worker updates
    if ('serviceWorker' in navigator) {
      let registration = null
      
      // Listen for waiting service worker (update ready)
      const handleWaiting = () => {
        setUpdateAvailable(true)
        setShowPrompt(true)
      }

      // Check for updates periodically
      const checkForUpdates = async () => {
        try {
          registration = await navigator.serviceWorker.getRegistration()
          if (registration) {
            // Listen for waiting service worker
            if (registration.waiting) {
              handleWaiting()
            }
            
            // Check for updates
            await registration.update()
            
            // Also listen for updates
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    // New service worker installed and ready
                    handleWaiting()
                  }
                })
              }
            })
          }
        } catch (e) {
          console.log('SW update check failed', e)
        }
      }

      // Check immediately on mount (after a short delay to ensure SW is ready)
      setTimeout(() => {
        checkForUpdates()
      }, 1000)
      
      // Check every 30 seconds (more frequent)
      const interval = setInterval(checkForUpdates, 30 * 1000)
      
      // Also check when app becomes visible (user switches back to tab)
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
          checkForUpdates()
        }
      })
      
      return () => {
        clearInterval(interval)
        if (registration) {
          registration.removeEventListener('updatefound', () => {})
        }
      }
    }
  }, [])

  const handleUpdate = async () => {
    // Skip waiting and activate the new service worker, then reload
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration()
      if (registration && registration.waiting) {
        // Send message to skip waiting
        registration.waiting.postMessage({ type: 'SKIP_WAITING' })
      }
    }
    // Reload to get the new service worker
    window.location.reload()
  }

  const handleDismiss = () => {
    setShowPrompt(false)
  }

  const handleManualCheck = async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration()
        if (registration) {
          await registration.update()
          // Force check after update
          setTimeout(() => {
            if (registration.waiting) {
              setUpdateAvailable(true)
              setShowPrompt(true)
            } else {
              alert('✅ App is up to date!')
            }
          }, 500)
        } else {
          alert('Service worker not registered. Try refreshing the page.')
        }
      } catch (e) {
        console.error('Manual update check failed:', e)
        alert('Could not check for updates. Try refreshing the page.')
      }
    }
  }

  // Show update prompt when available, and always show a manual check button
  return (
    <>
      {showPrompt && (
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
      )}
      
      {/* Always-visible manual check button (small, bottom right) */}
      {'serviceWorker' in navigator && (
        <button 
          title="Check for updates"
          className="pwa-update-button"
          onClick={handleManualCheck}
        >
          🔄
        </button>
      )}
    </>
  )
}
