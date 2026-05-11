// Draw-in-progress selection rectangle.

export default function DraftRect({ draftRect }) {
  return (
    <div
      className="draft-rect"
      style={{
        left: `${Math.min(draftRect.start.x, draftRect.current.x) - draftRect.rect.left}px`,
        top: `${Math.min(draftRect.start.y, draftRect.current.y) - draftRect.rect.top}px`,
        width: `${Math.abs(draftRect.current.x - draftRect.start.x)}px`,
        height: `${Math.abs(draftRect.current.y - draftRect.start.y)}px`,
      }}
    />
  )
}
