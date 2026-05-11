// Modal to confirm room deletion.

export default function ConfirmDeleteModal({ roomId, onCancel, onConfirm }) {
  if (!roomId) {
    return null
  }

  return (
    <div className="planner-modal-overlay" role="dialog" aria-modal="true">
      <div className="planner-modal-card">
        <h3>Delete room?</h3>
        <p>Removing this room will also remove all furniture assigned to it.</p>
        <div className="planner-modal-actions">
          <button type="button" className="secondary" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" onClick={() => onConfirm(roomId)}>
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}
