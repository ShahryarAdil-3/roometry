import React from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'

import Landing from './pages/Landing'
import { Login, Register } from './pages/Auth'
import Dashboard from './pages/Dashboard'
import Editor from './pages/Editor'
import ThemeProvider from './context/ThemeProvider'

const PageTransition = ({ children }) => {
  return (
    <motion.main
      initial={{ opacity: 0, y: 18, scale: 0.99, filter: 'blur(2px)' }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: -14, scale: 0.995, filter: 'blur(2px)' }}
      transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
      className="min-h-screen w-full overflow-hidden"
    >
      {children}
    </motion.main>
  )
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
        <Route path="/app" element={<PageTransition><Editor /></PageTransition>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  )
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