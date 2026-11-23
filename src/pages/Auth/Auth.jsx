// Authentication pages (login / register) — modern studio layout
import React, { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@appFirebase/firebase'
import ThemeToggle from '@components/ThemeToggle'
import './Auth.css'

const AuthField = ({ icon: Icon, label, type = 'text', showToggle, showPassword, onTogglePassword, ...props }) => {
  const [isFocused, setIsFocused] = useState(false)

  return (
    <label
      className={[
        'auth-field',
        isFocused ? 'border-[#1e4636]' : 'border-[#ddd6cb]',
      ].join(' ')}
    >
      <span className="auth-field-label">
        {React.createElement(Icon, { size: 14 })}
        {label}
      </span>
      <span className="auth-field-control">
        <input
          {...props}
          type={showToggle ? (showPassword ? 'text' : 'password') : type}
          onFocus={(event) => {
            setIsFocused(true)
            props.onFocus?.(event)
          }}
          onBlur={(event) => {
            setIsFocused(false)
            props.onBlur?.(event)
          }}
          className="auth-field-input"
        />
        {showToggle ? (
          <button
            type="button"
            className="auth-password-toggle"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            onClick={onTogglePassword}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        ) : null}
      </span>
    </label>
  )
}

function Mark({ dark }) {
  return (
    <span
      className={[
        'grid size-9 place-items-center rounded-md border',
        dark ? 'border-white/15 bg-white/10 text-[#f3efe7]' : 'border-[#ddd6cb] bg-[#fbf9f5] text-[#1e4636]',
      ].join(' ')}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M4 16V8l8-4 8 4v8l-8 4-8-4Z" />
        <path d="M12 20V12" />
        <path d="M4 8l8 4 8-4" />
      </svg>
    </span>
  )
}

const AuthShell = ({ title, subtitle, children, isRegister }) => {
  const location = useLocation()

  return (
    <motion.div
      className="auth-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.45 }}
    >
      <aside className="auth-story-panel">
        <Link to="/" className="auth-brand auth-brand-light">
          <Mark dark />
          <span>ROOMETRY</span>
        </Link>
        <div className="auth-story-copy">
          <p className="auth-eyebrow">From plan to presence</p>
          <h1>
            Draw the room once. Walk it the same afternoon.
          </h1>
          <ul>
            <li>Snapped walls, real metres, no sketch guesswork.</li>
            <li>Furniture stays on the same coordinates in 3D.</li>
            <li>Projects save to your account across devices.</li>
          </ul>
        </div>
        <p className="auth-story-footer">A studio for floor plans, not a moodboard.</p>
      </aside>

      <main className="auth-main">
        <div className="auth-theme-toggle">
          <ThemeToggle />
        </div>

        <motion.div
          className="auth-card"
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.08, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="auth-card-eyebrow">
            {isRegister ? 'New studio' : 'Welcome back'}
          </p>
          <h2>{title}</h2>
          <p className="auth-card-subtitle">{subtitle}</p>

          <div className="auth-card-form">{children}</div>

          <p className="auth-switch">
            {isRegister ? (
              <>
                Already have a studio?{' '}
                <Link to="/login" state={location.state}>
                  Sign in
                </Link>
              </>
            ) : (
              <>
                New here?{' '}
                <Link to="/register" state={location.state}>
                  Create a studio
                </Link>
              </>
            )}
          </p>
        </motion.div>
      </main>
    </motion.div>
  )
}

export const Login = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleLogin = async (event) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      await signInWithEmailAndPassword(auth, email, password)
      const destination = location.state?.from && location.state.from !== '/login'
        ? location.state.from
        : '/dashboard'
      navigate(destination, { replace: true })
    } catch (loginError) {
      setError(loginError.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleGuestMode = () => {
    window.localStorage.setItem('roometry_guest_mode', 'true')
    const destination = location.state?.from && location.state.from !== '/login'
      ? location.state.from
      : '/dashboard'
    navigate(destination, { replace: true })
  }

  return (
    <AuthShell title="Return to the plan." subtitle="Sign in and continue shaping your spaces.">
      <form onSubmit={handleLogin} className="space-y-3" noValidate>
        <AnimatePresence>
          {error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="rounded-md border border-[#8c3a32]/30 bg-[#f6e8e6] px-3 py-2 text-sm text-[#8c3a32]"
              role="alert"
            >
              {error}
            </motion.div>
          ) : null}
        </AnimatePresence>

        <AuthField
          icon={Mail}
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          required
        />

        <AuthField
          icon={Lock}
          label="Password"
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          showToggle
          showPassword={showPassword}
          onTogglePassword={() => setShowPassword((v) => !v)}
          required
        />

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-[#1e4636] px-4 text-sm font-medium text-[#f3efe7] transition-transform active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {submitting ? 'Signing in…' : 'Sign in'}
          <ArrowRight size={16} />
        </button>

        <div className="relative py-1 text-center text-[10px] uppercase tracking-[0.2em] text-[#6e675f]">
          <span className="relative z-10 bg-[#f3efe7] px-2">or</span>
          <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-[#ddd6cb]" />
        </div>

        <button
          type="button"
          onClick={handleGuestMode}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md border border-[#ddd6cb] bg-[#fbf9f5] px-4 text-sm font-medium text-[#6e675f] transition-colors hover:border-[#1e4636] hover:text-[#161410]"
        >
          Continue as guest
        </button>
      </form>
    </AuthShell>
  )
}

export const Register = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleRegister = async (event) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      await createUserWithEmailAndPassword(auth, email, password)
      const destination = location.state?.from && location.state.from !== '/login'
        ? location.state.from
        : '/dashboard'
      navigate(destination, { replace: true })
    } catch (registerError) {
      setError(registerError.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleGuestMode = () => {
    window.localStorage.setItem('roometry_guest_mode', 'true')
    const destination = location.state?.from && location.state.from !== '/login'
      ? location.state.from
      : '/dashboard'
    navigate(destination, { replace: true })
  }

  return (
    <AuthShell
      title="Open your first plan."
      subtitle="Register to save projects across devices."
      isRegister
    >
      <form onSubmit={handleRegister} className="space-y-3" noValidate>
        <AnimatePresence>
          {error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="rounded-md border border-[#8c3a32]/30 bg-[#f6e8e6] px-3 py-2 text-sm text-[#8c3a32]"
              role="alert"
            >
              {error}
            </motion.div>
          ) : null}
        </AnimatePresence>

        <AuthField
          icon={Mail}
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          required
        />

        <AuthField
          icon={Lock}
          label="Password"
          type="password"
          placeholder="At least 6 characters"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="new-password"
          minLength={6}
          showToggle
          showPassword={showPassword}
          onTogglePassword={() => setShowPassword((v) => !v)}
          required
        />

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-[#1e4636] px-4 text-sm font-medium text-[#f3efe7] transition-transform active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {submitting ? 'Creating account…' : 'Create account'}
          <ArrowRight size={16} />
        </button>

        <div className="relative py-1 text-center text-[10px] uppercase tracking-[0.2em] text-[#6e675f]">
          <span className="relative z-10 bg-[#f3efe7] px-2">or</span>
          <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-[#ddd6cb]" />
        </div>

        <button
          type="button"
          onClick={handleGuestMode}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md border border-[#ddd6cb] bg-[#fbf9f5] px-4 text-sm font-medium text-[#6e675f] transition-colors hover:border-[#1e4636] hover:text-[#161410]"
        >
          Continue as guest
        </button>
      </form>
    </AuthShell>
  )
}