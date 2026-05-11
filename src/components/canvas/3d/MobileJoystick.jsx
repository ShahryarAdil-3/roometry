// Touch joystick for first-person movement.
import { useRef } from 'react'

export default function MobileJoystick({ moveRef }) {
  const stickRef = useRef(null)
  const centerRef = useRef({ x: 0, y: 0 })
  const activePointerRef = useRef(null)

  const updateFromPointer = (event) => {
    const center = centerRef.current
    const dx = event.clientX - center.x
    const dy = event.clientY - center.y
    const maxDistance = 48
    const length = Math.hypot(dx, dy) || 1
    const clamped = Math.min(maxDistance, length)
    const nextX = (dx / length) * clamped
    const nextY = (dy / length) * clamped

    if (stickRef.current) {
      stickRef.current.style.transform = `translate(${nextX}px, ${nextY}px)`
    }

    moveRef.current = {
      x: nextX / maxDistance,
      y: nextY / maxDistance,
    }
  }

  return (
    <div
      className="mobile-joystick"
      onPointerDown={(event) => {
        activePointerRef.current = event.pointerId
        event.currentTarget.setPointerCapture(event.pointerId)
        const bounds = event.currentTarget.getBoundingClientRect()
        centerRef.current = {
          x: bounds.left + bounds.width / 2,
          y: bounds.top + bounds.height / 2,
        }
        updateFromPointer(event)
      }}
      onPointerMove={(event) => {
        if (activePointerRef.current !== event.pointerId) {
          return
        }
        updateFromPointer(event)
      }}
      onPointerUp={(event) => {
        if (activePointerRef.current !== event.pointerId) {
          return
        }

        activePointerRef.current = null
        moveRef.current = { x: 0, y: 0 }
        if (stickRef.current) {
          stickRef.current.style.transform = 'translate(0px, 0px)'
        }
      }}
    >
      <div className="mobile-joystick-base" />
      <div ref={stickRef} className="mobile-joystick-stick" />
    </div>
  )
}
