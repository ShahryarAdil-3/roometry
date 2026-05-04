import React from 'react'
import { Moon, Sun } from 'lucide-react'
import useTheme from '../context/useTheme'

export default function ThemeToggle({ variant = 'glass' }) {
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
      <span>{isLight ? 'Dark' : 'Light'}</span>
    </button>
  )
}
