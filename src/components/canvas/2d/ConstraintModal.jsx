// Modal shown when planner actions are blocked.

export default function ConstraintModal({ message, onDismiss }) {
  if (!message) {
    return null
  }

  return (
    <div className="planner-modal-overlay" role="dialog" aria-modal="true">
      <div className="planner-modal-card">
        <h3>Action blocked</h3>
        <p>{message}</p>
        <div className="planner-modal-actions">
          <button type="button" onClick={onDismiss}>
            OK
          </button>
        </div>
      </div>
    </div>
  )
}
