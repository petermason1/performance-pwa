import React from 'react'
import { logger } from '../utils/logger'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    logger.error('ErrorBoundary caught an error:', error, errorInfo)
    this.setState({
      error,
      errorInfo
    })
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div 
          role="alert"
          className="min-h-screen flex items-center justify-center p-4 bg-[var(--color-bg-primary)]"
        >
          <div className="max-w-md w-full bg-[var(--color-bg-secondary)] border border-[var(--color-error)] rounded-xl p-6 shadow-lg">
            <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-4">
              ⚠️ Something went wrong
            </h2>
            <p className="text-[var(--color-text-secondary)] mb-4">
              An error occurred while rendering this component. The app is still functional - try refreshing or navigating to a different view.
            </p>
            {(import.meta.env.DEV || import.meta.env.MODE === 'development') && this.state.error && (
              <details className="mb-4">
                <summary className="cursor-pointer text-sm text-[var(--color-text-secondary)] mb-2">
                  Error details (development only)
                </summary>
                <pre className="text-xs bg-[var(--color-bg-tertiary)] p-3 rounded overflow-auto max-h-40">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
            <div className="flex gap-3">
              <button
                onClick={this.handleReset}
                className="btn btn-primary flex-1"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="btn btn-secondary flex-1"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary

