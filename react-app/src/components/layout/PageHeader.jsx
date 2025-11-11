import './PageHeader.css'

function PageHeader({ title = '⏱️ Smart Metronome', subtitle, actions, status = 'All systems synced' }) {
  return (
    <header className="page-header">
      <div className="page-header-main">
        <div className="page-header-text">
          {subtitle && (
            <span className="page-header-subtitle">{subtitle}</span>
          )}
          <h1 className="page-header-title">{title}</h1>
        </div>

        {status && (
          <div className="page-header-status" role="status" aria-live="polite">
            {status}
          </div>
        )}
      </div>

      {actions && (
        <div className="page-header-actions">
          {actions}
        </div>
      )}
    </header>
  )
}

export default PageHeader

