import { useCallback, useEffect, useMemo, useState } from 'react'
import ThemeContext from './ThemeContext'

const THEME_STORAGE_KEY = 'roometry-theme'

const getInitialTheme = () => {
  if (typeof window === 'undefined') {
    return 'dark'
  }

  const saved = window.localStorage.getItem(THEME_STORAGE_KEY)
  if (saved === 'light' || saved === 'dark') {
    return saved
  }

  return 'dark'
}

export default function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme)

  useEffect(() => {
    if (typeof document === 'undefined') {
      return
    }

    document.documentElement.dataset.theme = theme
    document.documentElement.style.colorScheme = theme
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'))
  }, [])

  const value = useMemo(() => ({ theme, setTheme, toggleTheme }), [theme, toggleTheme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
