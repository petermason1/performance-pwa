import { useState, useEffect } from 'react'
import { getAllSongs, getAllSetLists } from '../utils/db'
import { logger } from '../utils/logger'

export default function OfflineQueueIndicator() {
  const [pendingCount, setPendingCount] = useState(0)
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const checkPendingSyncs = async () => {
      try {
        const songs = await getAllSongs()
        const setLists = await getAllSetLists()
        
        const pendingSongs = songs.filter(s => s._pendingSync)
        const pendingSetLists = setLists.filter(sl => sl._pendingSync)
        
        setPendingCount(pendingSongs.length + pendingSetLists.length)
      } catch (error) {
        logger.error('Error checking pending syncs:', error)
      }
    }

    checkPendingSyncs()
    
    // Check periodically
    const interval = setInterval(checkPendingSyncs, 5000)
    
    // Check when coming back online
    const handleOnline = () => {
      setIsOnline(true)
      checkPendingSyncs()
    }
    
    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      clearInterval(interval)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (pendingCount === 0 && isOnline) {
    return null
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 bg-[var(--color-bg-secondary)] border border-[var(--color-glass-border)] rounded-lg px-4 py-2 shadow-lg backdrop-blur-xl"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '0.875rem'
      }}
    >
      {!isOnline ? (
        <>
          <span className="text-yellow-500" aria-hidden="true">⚠️</span>
          <span className="text-[var(--color-text-primary)]">
            Offline - changes will sync when connection restored
          </span>
        </>
      ) : pendingCount > 0 ? (
        <>
          <span className="text-blue-500 animate-pulse" aria-hidden="true">⏳</span>
          <span className="text-[var(--color-text-primary)]">
            Syncing {pendingCount} {pendingCount === 1 ? 'item' : 'items'}...
          </span>
        </>
      ) : null}
    </div>
  )
}

