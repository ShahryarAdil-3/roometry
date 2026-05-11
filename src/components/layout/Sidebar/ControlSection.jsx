// Collapsible controls section.
import { ControlIcon } from '@components/ui/ControlIcons'

export default function ControlSection({ title, icon, defaultOpen = false, hint, children }) {
  return (
    <details className="control-section" open={defaultOpen}>
      <summary>
        <span className="icon-label">
          <span className="icon-badge">
            <ControlIcon name={icon} size={14} />
          </span>
          <span>{title}</span>
        </span>
      </summary>
      <div className="control-section-body">
        {hint ? <p className="control-hint">{hint}</p> : null}
        {children}
      </div>
    </details>
  )
}
