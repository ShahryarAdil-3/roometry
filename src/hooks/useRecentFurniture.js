// Persist and manage recent furniture templates.
import { useEffect, useState } from 'react'

const RECENT_FURNITURE_KEY = 'roometry-recent-furniture'

const loadStoredFurniture = () => {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const stored = JSON.parse(window.localStorage.getItem(RECENT_FURNITURE_KEY) ?? '[]')
    return Array.isArray(stored) ? stored : []
  } catch {
    return []
  }
}

export default function useRecentFurniture() {
  const [recentFurniture, setRecentFurniture] = useState(loadStoredFurniture)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem(RECENT_FURNITURE_KEY, JSON.stringify(recentFurniture))
  }, [recentFurniture])

  const addRecentFurniture = (template) => {
    setRecentFurniture((current) => {
      const next = [template, ...current.filter((item) => item.type !== template.type)]
      return next.slice(0, 6)
    })
  }

  return { recentFurniture, addRecentFurniture, setRecentFurniture }
}
