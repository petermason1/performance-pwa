import { useEffect, useState } from 'react'

export default function ErrorToast({ message, variant = 'error', duration = 5000, onClose }) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        setTimeout(() => onClose?.(), 300) // Wait for fade out
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [duration, onClose])

  const variantStyles = {
    error: {
      background: 'rgba(239, 68, 68, 0.95)',
      borderColor: '#ef4444',
      icon: '❌'
    },
    warning: {
      background: 'rgba(245, 158, 11, 0.95)',
      borderColor: '#f59e0b',
      icon: '⚠️'
    },
    success: {
      background: 'rgba(34, 197, 94, 0.95)',
      borderColor: '#22c55e',
      icon: '✅'
    },
    info: {
      background: 'rgba(59, 130, 246, 0.95)',
      borderColor: '#3b82f6',
      icon: 'ℹ️'
    }
  }

  const style = variantStyles[variant] || variantStyles.error

  if (!isVisible) return null

  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 10000,
        padding: '16px 20px',
        background: style.background,
        border: `2px solid ${style.borderColor}`,
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        color: 'white',
        fontSize: '0.95rem',
        fontWeight: 500,
        maxWidth: '400px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        animation: 'slideIn 0.3s ease-out',
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.3s ease-out'
      }}
    >
      <span style={{ fontSize: '1.2rem' }}>{style.icon}</span>
      <span style={{ flex: 1 }}>{message}</span>
      <button
        onClick={() => {
          setIsVisible(false)
          setTimeout(() => onClose?.(), 300)
        }}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'white',
          fontSize: '1.2rem',
          cursor: 'pointer',
          padding: '4px 8px',
          borderRadius: '4px',
          lineHeight: 1
        }}
        aria-label="Close notification"
      >
        ×
      </button>
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}

