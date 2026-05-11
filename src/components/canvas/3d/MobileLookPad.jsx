// Touch look pad for first-person camera movement.
import { useRef } from 'react'

export default function MobileLookPad({ lookRef }) {
  const activePointerRef = useRef(null)
  const lastPointRef = useRef({ x: 0, y: 0 })

  return (
    <div
      className="mobile-look-pad"
      onPointerDown={(event) => {
        activePointerRef.current = event.pointerId
        lastPointRef.current = {
          x: event.clientX,
          y: event.clientY,
        }
        event.currentTarget.setPointerCapture(event.pointerId)
      }}
      onPointerMove={(event) => {
        if (activePointerRef.current !== event.pointerId) {
          return
        }

        const dx = event.clientX - lastPointRef.current.x
        const dy = event.clientY - lastPointRef.current.y
        lookRef.current.x += dx
        lookRef.current.y += dy

        lastPointRef.current = {
          x: event.clientX,
          y: event.clientY,
        }
      }}
      onPointerUp={(event) => {
        if (activePointerRef.current === event.pointerId) {
          activePointerRef.current = null
        }
      }}
    >
      <span>Swipe to look</span>
    </div>
  )
}
