import './DashboardStatusCard.css'

const TONE_CLASS = {
  success: 'tone-success',
  warning: 'tone-warning',
  muted: 'tone-muted'
}

export default function DashboardStatusCard({
  title,
  value,
  meta,
  tone = 'muted',
  actionLabel,
  onClick
}) {
  return (
    <div className={`dashboard-status-card ${TONE_CLASS[tone] || TONE_CLASS.muted}`}>
      <div className="dashboard-status-metric">
        <span className="dashboard-status-value">{value}</span>
        <span className="dashboard-status-title">{title}</span>
      </div>
      <p className="dashboard-status-meta">{meta}</p>
      {actionLabel && onClick && (
        <button
          type="button"
          className="dashboard-status-button"
          onClick={onClick}
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}

