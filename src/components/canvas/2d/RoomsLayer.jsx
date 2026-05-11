// Render rooms and resize handles.

const RESIZE_HANDLES = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw']

export default function RoomsLayer({
  rooms,
  selectedRoomId,
  canvasRect,
  pixelsPerMeter,
  view,
  toScreenFromWorld,
  onSelectRoom,
  onBeginDrag,
  onBeginResize,
}) {
  return rooms.map((room) => {
    if (!canvasRect) {
      return null
    }

    const topLeft = toScreenFromWorld({ x: room.x, z: room.z }, canvasRect, pixelsPerMeter, view)

    return (
      <button
        key={room.id}
        type="button"
        className={`room-rect ${room.id === selectedRoomId ? 'selected' : ''}`}
        style={{
          left: `${topLeft.x}px`,
          top: `${topLeft.y}px`,
          width: `${room.width * pixelsPerMeter * view.zoom}px`,
          height: `${room.depth * pixelsPerMeter * view.zoom}px`,
        }}
        onClick={(event) => {
          event.stopPropagation()
          onSelectRoom(room.id)
        }}
        onPointerDown={(event) => onBeginDrag(event, room)}
        title={`${room.name}: ${room.width.toFixed(1)}m x ${room.depth.toFixed(1)}m`}
      >
        <span>{room.name}</span>
        <small>
          {room.width.toFixed(1)}m x {room.depth.toFixed(1)}m
        </small>

        {room.id === selectedRoomId &&
          RESIZE_HANDLES.map((handle) => (
            <i
              key={`${room.id}-${handle}`}
              className={`resize-handle resize-${handle}`}
              onPointerDown={(event) => onBeginResize(event, room, handle)}
              aria-hidden="true"
            />
          ))}
      </button>
    )
  })
}
