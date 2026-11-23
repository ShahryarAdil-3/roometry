import { useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { onAuthStateChanged } from 'firebase/auth'

import { Dashboard, Editor, Landing, Login, Register } from '@pages'
import ThemeProvider from '@context/ThemeProvider'
import { auth } from '@appFirebase/firebase'

const PageTransition = ({ children }) => {
  return (
    <motion.main
      initial={{ opacity: 0, y: 18, scale: 0.99, filter: 'blur(2px)' }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: -14, scale: 0.995, filter: 'blur(2px)' }}
      transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
      className="min-h-screen w-full"
    >
      {children}
    </motion.main>
  )
}

const EditorRoute = () => {
  const location = useLocation()
  const [access, setAccess] = useState(() => {
    if (auth.currentUser) return 'authenticated'
    const isGuest = window.localStorage.getItem('roometry_guest_mode') === 'true'
    return isGuest ? 'guest' : 'pending'
  })

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      if (user) {
        setAccess('authenticated')
        return
      }

      const isGuest = window.localStorage.getItem('roometry_guest_mode') === 'true'
      setAccess(isGuest ? 'guest' : 'unauthenticated')
    })
  }, [])

  if (access === 'pending') {
    return null
  }

  if (access === 'unauthenticated') {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    )
  }

  return <PageTransition><Editor /></PageTransition>
}

const AnimatedRoutes = () => {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Landing /></PageTransition>} />
        <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
        <Route path="/register" element={<PageTransition><Register /></PageTransition>} />
        <Route path="/dashboard" element={<PageTransition><Dashboard /></PageTransition>} />
        <Route path="/projects" element={<Navigate to="/dashboard" replace />} />
        <Route path="/app" element={<EditorRoute />} />
        <Route path="/app/:projectId" element={<EditorRoute />} />
        <Route path="/projects/:projectId" element={<ProjectRouteAlias />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  )
}

const ProjectRouteAlias = () => {
  const { projectId } = useParams()
  return <Navigate to={`/app/${encodeURIComponent(projectId)}`} replace />
}

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AnimatedRoutes />
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App