import './DashboardQuickAction.css'

export default function DashboardQuickAction({ icon, label, description, onClick }) {
  return (
    <button type="button" className="dashboard-quick-action" onClick={onClick}>
      <span className="dashboard-quick-icon" aria-hidden="true">{icon}</span>
      <div className="dashboard-quick-content">
        <span className="dashboard-quick-label">{label}</span>
        <p className="dashboard-quick-description">{description}</p>
      </div>
      <span className="dashboard-quick-chevron" aria-hidden="true">→</span>
    </button>
  )
}

