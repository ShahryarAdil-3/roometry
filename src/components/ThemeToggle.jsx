import React from 'react'
import { Moon, Sun } from 'lucide-react'
import useTheme from '../context/useTheme'

export default function ThemeToggle({ variant = 'glass', showLabel = true }) {
  const { theme, toggleTheme } = useTheme()
  const isLight = theme === 'light'
  const Icon = isLight ? Moon : Sun

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`theme-toggle ${variant}`}
      aria-label={isLight ? 'Switch to dark theme' : 'Switch to light theme'}
    >
      <Icon size={16} />
      {showLabel ? <span>{isLight ? 'Dark' : 'Light'}</span> : null}
    </button>
  )
}
