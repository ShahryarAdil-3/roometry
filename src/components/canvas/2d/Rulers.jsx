// Rulers for horizontal and vertical axes.

export default function Rulers({ xTicks, zTicks }) {
  return (
    <>
      <div className="floor-map-ruler floor-map-ruler-x" aria-hidden="true">
        {xTicks.map((tick) => (
          <span key={`x-${tick.value}`} style={{ left: `${tick.left}px` }}>
            <i />
            <strong>{tick.value}m</strong>
          </span>
        ))}
      </div>

      <div className="floor-map-ruler floor-map-ruler-z" aria-hidden="true">
        {zTicks.map((tick) => (
          <span key={`z-${tick.value}`} style={{ top: `${tick.top}px` }}>
            <i />
            <strong>{tick.value}m</strong>
          </span>
        ))}
      </div>
    </>
  )
}
