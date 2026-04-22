export function ControlIcon({ name, size = 16, className = '' }) {
  const stroke = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  }

  const renderIcon = () => {
    switch (name) {
      case 'hide':
        return (
          <>
            <rect x="3" y="4" width="18" height="16" rx="2.5" {...stroke} />
            <line x1="9" y1="4" x2="9" y2="20" {...stroke} />
            <polyline points="14,8 10,12 14,16" {...stroke} />
          </>
        )
      case 'show':
        return (
          <>
            <rect x="3" y="4" width="18" height="16" rx="2.5" {...stroke} />
            <line x1="9" y1="4" x2="9" y2="20" {...stroke} />
            <polyline points="10,8 14,12 10,16" {...stroke} />
          </>
        )
      case 'planner':
        return (
          <>
            <rect x="4" y="4" width="7" height="7" rx="1" {...stroke} />
            <rect x="13" y="4" width="7" height="7" rx="1" {...stroke} />
            <rect x="4" y="13" width="7" height="7" rx="1" {...stroke} />
            <rect x="13" y="13" width="7" height="7" rx="1" {...stroke} />
          </>
        )
      case 'visualize':
        return (
          <>
            <path d="M12 3 20 7.5 12 12 4 7.5 12 3Z" {...stroke} />
            <path d="M20 7.5V16.5L12 21V12" {...stroke} />
            <path d="M4 7.5V16.5L12 21" {...stroke} />
          </>
        )
      case 'workspace':
        return (
          <>
            <rect x="3" y="6" width="18" height="12" rx="2" {...stroke} />
            <line x1="7" y1="6" x2="7" y2="10" {...stroke} />
            <line x1="11" y1="6" x2="11" y2="9" {...stroke} />
            <line x1="15" y1="6" x2="15" y2="10" {...stroke} />
            <line x1="19" y1="6" x2="19" y2="9" {...stroke} />
          </>
        )
      case 'rooms':
        return (
          <>
            <path d="M4 10 12 4 20 10" {...stroke} />
            <path d="M6 9.5V20H18V9.5" {...stroke} />
            <rect x="10" y="13" width="4" height="7" {...stroke} />
          </>
        )
      case 'doors':
        return (
          <>
            <path d="M6 4H16V20H6Z" {...stroke} />
            <path d="M16 4 20 6.5V17.5L16 20" {...stroke} />
            <circle cx="13" cy="12" r="0.9" fill="currentColor" />
          </>
        )
      case 'camera':
        return (
          <>
            <path d="M4 8H8L10 6H14L16 8H20V18H4Z" {...stroke} />
            <circle cx="12" cy="13" r="3" {...stroke} />
          </>
        )
      case 'materials':
        return (
          <>
            <circle cx="12" cy="12" r="8" {...stroke} />
            <circle cx="9" cy="9" r="1" fill="currentColor" />
            <circle cx="14.5" cy="8.5" r="1" fill="currentColor" />
            <circle cx="16" cy="13" r="1" fill="currentColor" />
            <path d="M8.5 15.5C9.7 17 11.1 17.8 12.8 18" {...stroke} />
          </>
        )
      case 'furniture':
        return (
          <>
            <path d="M5 11H19V16H5Z" {...stroke} />
            <path d="M7 11V8H17V11" {...stroke} />
            <line x1="7" y1="16" x2="7" y2="20" {...stroke} />
            <line x1="17" y1="16" x2="17" y2="20" {...stroke} />
          </>
        )
      case 'reset':
        return (
          <>
            <path d="M4 12A8 8 0 1 0 7 6" {...stroke} />
            <polyline points="4,4 8,4 8,8" {...stroke} />
          </>
        )
      case 'map':
        return (
          <>
            <path d="M3 6 8.5 4 15.5 6 21 4V18L15.5 20 8.5 18 3 20Z" {...stroke} />
            <line x1="8.5" y1="4" x2="8.5" y2="18" {...stroke} />
            <line x1="15.5" y1="6" x2="15.5" y2="20" {...stroke} />
          </>
        )
      case 'zoom':
        return (
          <>
            <circle cx="10.5" cy="10.5" r="5" {...stroke} />
            <line x1="14.4" y1="14.4" x2="20" y2="20" {...stroke} />
            <line x1="10.5" y1="8" x2="10.5" y2="13" {...stroke} />
            <line x1="8" y1="10.5" x2="13" y2="10.5" {...stroke} />
          </>
        )
      case 'pan':
        return (
          <>
            <line x1="12" y1="3" x2="12" y2="21" {...stroke} />
            <line x1="3" y1="12" x2="21" y2="12" {...stroke} />
            <polyline points="9,6 12,3 15,6" {...stroke} />
            <polyline points="9,18 12,21 15,18" {...stroke} />
            <polyline points="6,9 3,12 6,15" {...stroke} />
            <polyline points="18,9 21,12 18,15" {...stroke} />
          </>
        )
      case 'preview':
        return (
          <>
            <path d="M2.5 12S6.5 6 12 6 21.5 12 21.5 12 17.5 18 12 18 2.5 12 2.5 12Z" {...stroke} />
            <circle cx="12" cy="12" r="2.6" {...stroke} />
          </>
        )
      case 'move':
        return (
          <>
            <polyline points="12,3 9,6 15,6" {...stroke} />
            <polyline points="12,21 9,18 15,18" {...stroke} />
            <polyline points="3,12 6,9 6,15" {...stroke} />
            <polyline points="21,12 18,9 18,15" {...stroke} />
            <line x1="12" y1="3" x2="12" y2="21" {...stroke} />
            <line x1="3" y1="12" x2="21" y2="12" {...stroke} />
          </>
        )
      case 'warning':
        return (
          <>
            <path d="M12 4 21 20H3Z" {...stroke} />
            <line x1="12" y1="9" x2="12" y2="14" {...stroke} />
            <circle cx="12" cy="17" r="1" fill="currentColor" />
          </>
        )
      case 'collapse-top':
        return (
          <>
            <rect x="4" y="4" width="16" height="16" rx="2" {...stroke} />
            <line x1="7" y1="9" x2="17" y2="9" {...stroke} />
            <polyline points="10,13 12,11 14,13" {...stroke} />
          </>
        )
      case 'expand-top':
        return (
          <>
            <rect x="4" y="4" width="16" height="16" rx="2" {...stroke} />
            <line x1="7" y1="9" x2="17" y2="9" {...stroke} />
            <polyline points="10,12 12,14 14,12" {...stroke} />
          </>
        )
      case 'collapse-bottom':
        return (
          <>
            <rect x="4" y="4" width="16" height="16" rx="2" {...stroke} />
            <line x1="7" y1="15" x2="17" y2="15" {...stroke} />
            <polyline points="10,11 12,13 14,11" {...stroke} />
          </>
        )
      case 'expand-bottom':
        return (
          <>
            <rect x="4" y="4" width="16" height="16" rx="2" {...stroke} />
            <line x1="7" y1="15" x2="17" y2="15" {...stroke} />
            <polyline points="10,13 12,11 14,13" {...stroke} />
          </>
        )
      case 'focus-on':
        return (
          <>
            <polyline points="9,4 4,4 4,9" {...stroke} />
            <polyline points="15,4 20,4 20,9" {...stroke} />
            <polyline points="20,15 20,20 15,20" {...stroke} />
            <polyline points="9,20 4,20 4,15" {...stroke} />
          </>
        )
      case 'focus-off':
        return (
          <>
            <polyline points="9,4 4,4 4,9" {...stroke} />
            <polyline points="15,4 20,4 20,9" {...stroke} />
            <polyline points="20,15 20,20 15,20" {...stroke} />
            <polyline points="9,20 4,20 4,15" {...stroke} />
            <line x1="6" y1="6" x2="18" y2="18" {...stroke} />
          </>
        )
      case 'palette':
        return (
          <>
            <path d="M12 4C7.2 4 3.5 7.5 3.5 11.7 3.5 15.9 7.2 20 11.6 20H12.4C14.1 20 15 18.8 15 17.7 15 16.8 14.5 16.1 14.5 15.3 14.5 14.4 15.2 13.8 16.1 13.8H16.6C19.4 13.8 20.5 11.8 20.5 9.9 20.5 6.7 16.9 4 12 4Z" {...stroke} />
            <circle cx="8.5" cy="10" r="1" fill="currentColor" />
            <circle cx="11.5" cy="8.5" r="1" fill="currentColor" />
            <circle cx="15" cy="9.5" r="1" fill="currentColor" />
          </>
        )
      case 'zoom-in':
        return (
          <>
            <circle cx="10.5" cy="10.5" r="5" {...stroke} />
            <line x1="14.4" y1="14.4" x2="20" y2="20" {...stroke} />
            <line x1="10.5" y1="8" x2="10.5" y2="13" {...stroke} />
            <line x1="8" y1="10.5" x2="13" y2="10.5" {...stroke} />
          </>
        )
      case 'zoom-out':
        return (
          <>
            <circle cx="10.5" cy="10.5" r="5" {...stroke} />
            <line x1="14.4" y1="14.4" x2="20" y2="20" {...stroke} />
            <line x1="8" y1="10.5" x2="13" y2="10.5" {...stroke} />
          </>
        )
      case 'theme-minimal':
        return (
          <>
            <circle cx="12" cy="12" r="7" {...stroke} />
            <circle cx="12" cy="12" r="2" fill="currentColor" />
          </>
        )
      case 'theme-futuristic':
        return (
          <>
            <path d="M5 7.5 12 4 19 7.5 19 16.5 12 20 5 16.5Z" {...stroke} />
            <path d="M12 4V20" {...stroke} />
            <path d="M5 7.5 12 12 19 7.5" {...stroke} />
          </>
        )
      case 'theme-cad':
        return (
          <>
            <rect x="4" y="4" width="16" height="16" {...stroke} />
            <line x1="8" y1="4" x2="8" y2="20" {...stroke} />
            <line x1="12" y1="4" x2="12" y2="20" {...stroke} />
            <line x1="16" y1="4" x2="16" y2="20" {...stroke} />
            <line x1="4" y1="8" x2="20" y2="8" {...stroke} />
            <line x1="4" y1="12" x2="20" y2="12" {...stroke} />
            <line x1="4" y1="16" x2="20" y2="16" {...stroke} />
          </>
        )
      default:
        return (
          <>
            <circle cx="12" cy="12" r="8" {...stroke} />
            <line x1="12" y1="8" x2="12" y2="12" {...stroke} />
            <circle cx="12" cy="16" r="1" fill="currentColor" />
          </>
        )
    }
  }

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      role="img"
      aria-hidden="true"
      focusable="false"
    >
      {renderIcon()}
    </svg>
  )
}
