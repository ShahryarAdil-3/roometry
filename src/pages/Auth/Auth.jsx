// Authentication pages (login/register).
import React, { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Lock, Mail, UserMinus } from 'lucide-react'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@appFirebase/firebase'
import ThemeToggle from '@components/ThemeToggle'
import './Auth.css'

const infoItems = [
  'Studio-grade dark UI with fluid transitions',
  'Project continuity from floor plan to 3D',
  'Optimized for focus, speed, and clarity',
]

const fieldMotion = {
  rest: {
    borderColor: '#e8e0d6',
    boxShadow: '0 0 0 0 transparent',
    y: 0,
  },
  active: {
    borderColor: '#c07a45',
    boxShadow: '0 0 0 0 transparent',
    y: 0,
  },
}

const AuthField = ({ icon, label, ...props }) => {
  const [isFocused, setIsFocused] = useState(false)
  const Icon = icon

  return (
    <motion.label
      variants={fieldMotion}
      initial="rest"
      animate={isFocused ? 'active' : 'rest'}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className="surface-glass-soft flex items-center gap-3 rounded-lg border px-4 py-3"
    >
      <Icon size={18} className="text-[#8a7260]" />
      <div className="min-w-0 flex-1">
        <span className="mb-1 block text-[10px] font-medium uppercase tracking-[0.14em] text-[#c4b09a]">{label}</span>
        <input
          {...props}
          onFocus={(event) => {
            setIsFocused(true)
            props.onFocus?.(event)
          }}
          onBlur={(event) => {
            setIsFocused(false)
            props.onBlur?.(event)
          }}
          className="w-full bg-transparent text-sm text-[#3a2e24] placeholder:text-[#a8937e] focus:outline-none"
        />
      </div>
    </motion.label>
  )
}

const AuthShell = ({ title, subtitle, children, isRegister }) => {
  return (
    <div className="page-shell relative min-h-screen overflow-hidden">
      <div className="premium-grid-bg pointer-events-none absolute inset-0 opacity-[0.2]" />

      <div className="absolute right-5 top-5 z-20">
        <ThemeToggle />
      </div>

      <div className="relative z-10 mx-auto grid min-h-screen w-full max-w-6xl items-center gap-6 px-5 py-8 md:px-10 lg:grid-cols-[1fr_440px] lg:py-10">
        <motion.section
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="surface-glass hidden h-full p-8 lg:flex lg:flex-col lg:justify-between"
        >
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-[#c4b09a]">Roometry Platform</p>
            <h1 className="mt-4 max-w-md text-4xl font-medium leading-tight text-[#3a2e24]">
              A focused workspace for serious interior planning.
            </h1>
            <p className="mt-4 max-w-md text-base leading-relaxed text-[#8a7260]">
              Keep creative momentum high with an interface that feels intentional, responsive, and premium at every step.
            </p>
          </div>

          <div className="space-y-3">
            {infoItems.map((item) => (
              <div key={item} className="surface-glass-soft px-4 py-3 text-sm text-[#8a7260]">
                {item}
              </div>
            ))}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, x: 28 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="surface-glass p-6 sm:p-8"
        >
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#c4b09a]">Secure Access</p>
            <h2 className="mt-2 text-3xl font-medium text-[#3a2e24]">{title}</h2>
            <p className="mt-2 text-sm text-[#8a7260]">{subtitle}</p>
          </div>

          <div className="mt-7">{children}</div>

          <p className="mt-6 text-center text-sm text-[#8a7260]">
            {isRegister ? (
              <>
                Already have an account?{' '}
                <Link to="/login" className="font-medium text-[#c07a45] transition hover:text-[#a8632e]">
                  Sign in
                </Link>
              </>
            ) : (
              <>
                New here?{' '}
                <Link to="/register" className="font-medium text-[#c07a45] transition hover:text-[#a8632e]">
                  Create an account
                </Link>
              </>
            )}
          </p>
        </motion.section>
      </div>
    </div>
  )
}

export const Login = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleLogin = async (event) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      await signInWithEmailAndPassword(auth, email, password)
      navigate('/dashboard')
    } catch (loginError) {
      setError(loginError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell title="Welcome back" subtitle="Log in and continue shaping your spaces.">
      <form onSubmit={handleLogin} className="space-y-4">
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="rounded-lg border border-[#e4c4c4] bg-[#f9eded] px-4 py-3 text-sm text-[#7a3c3c]"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <AuthField
          icon={Mail}
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />

        <AuthField
          icon={Lock}
          label="Password"
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#c07a45] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#a8632e] disabled:cursor-not-allowed disabled:opacity-75"
        >
          {submitting ? 'Signing in...' : 'Sign in'}
          <ArrowRight size={16} />
        </button>
      </form>
    </AuthShell>
  )
}

export const Register = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleRegister = async (event) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      await createUserWithEmailAndPassword(auth, email, password)
      navigate('/dashboard')
    } catch (registerError) {
      setError(registerError.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleGuestMode = () => {
    window.localStorage.setItem('roometry_guest_mode', 'true')
    navigate('/app')
  }

  return (
    <AuthShell title="Create your workspace" subtitle="Register to save projects across devices." isRegister>
      <form onSubmit={handleRegister} className="space-y-4">
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="rounded-lg border border-[#e4c4c4] bg-[#f9eded] px-4 py-3 text-sm text-[#7a3c3c]"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <AuthField
          icon={Mail}
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />

        <AuthField
          icon={Lock}
          label="Password"
          type="password"
          placeholder="At least 6 characters"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          minLength={6}
          required
        />

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#c07a45] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#a8632e] disabled:cursor-not-allowed disabled:opacity-75"
        >
          {submitting ? 'Creating account...' : 'Create account'}
          <ArrowRight size={16} />
        </button>

        <div className="relative py-1 text-center text-[10px] uppercase tracking-[0.2em] text-[#c4b09a]">
          <span className="relative z-10 bg-transparent px-2">or</span>
          <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-[#ede6dc]" />
        </div>

        <button
          type="button"
          onClick={handleGuestMode}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#e8e0d6] bg-[#ffffff] px-4 py-3 text-sm font-medium text-[#8a7260] transition hover:bg-[#faf0e8] hover:text-[#6b4f35]"
        >
          <UserMinus size={16} />
          Continue as guest
        </button>
      </form>
    </AuthShell>
  )
}
