// Sidebar metric chip.
import { ControlIcon } from '@components/ui/ControlIcons'

export default function MetricChip({ icon, label, value }) {
  return (
    <div className="metric-chip">
      <span className="icon-badge metric-icon">
        <ControlIcon name={icon} size={13} />
      </span>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
      </div>
    </div>
  )
}
