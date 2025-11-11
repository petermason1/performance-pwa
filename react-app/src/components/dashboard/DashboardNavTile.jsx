import './DashboardNavTile.css'

export default function DashboardNavTile({
  icon,
  title,
  description,
  stats,
  actionLabel = 'Open',
  active = false,
  onClick
}) {
  return (
    <button
      type="button"
      className={`dashboard-nav-tile ${active ? 'is-active' : ''}`}
      onClick={onClick}
      aria-pressed={active}
    >
      <div className="dashboard-nav-icon" aria-hidden="true">{icon}</div>
      <div className="dashboard-nav-content">
        <div className="dashboard-nav-header">
          <h3>{title}</h3>
          {stats && (
            <span className="dashboard-nav-stats">{stats}</span>
          )}
        </div>
        <p className="dashboard-nav-description">{description}</p>
      </div>
      <span className="dashboard-nav-action">
        {actionLabel}
      </span>
    </button>
  )
}

