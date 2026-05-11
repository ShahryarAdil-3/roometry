// Landing page layout.
import React from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight, Cuboid, Map, Wand2 } from 'lucide-react'
import ThemeToggle from '@components/ThemeToggle'
import './Landing.css'

const modules = [
  {
    title: 'Precision 2D Planning',
    body: 'Draft room shells with clean snapping, exact dimensions, and immediate visual feedback. Iterate layouts quickly without losing structural precision.',
    badge: '2D Core',
    icon: Map,
    direction: 'left',
    points: ['Grid-first measurements', 'Live wall alignment', 'Fast concept iteration'],
  },
  {
    title: 'Smart Spatial Layering',
    body: 'Add furniture, openings, and design accents as modular layers. Keep everything organized while preserving motion-friendly performance.',
    badge: 'Layout Engine',
    icon: Cuboid,
    direction: 'right',
    points: ['Component-based scene blocks', 'Visual hierarchy controls', 'Editable design presets'],
  },
  {
    title: 'Immersive 3D Reveal',
    body: 'Transform your floor plan into a smooth 3D experience in one tap. Validate proportions, flow, and atmosphere before committing to real-world changes.',
    badge: '3D Visualization',
    icon: Wand2,
    direction: 'left',
    points: ['Instant scene conversion', 'Interactive walkthrough view', 'Presentation-ready visuals'],
  },
]

const flow = [
  {
    title: 'Draft In 2D',
    detail: 'Sketch core walls and circulation with measurable constraints.',
    icon: Map,
  },
  {
    title: 'Layer Objects',
    detail: 'Place furniture and openings to shape how the room behaves.',
    icon: Cuboid,
  },
  {
    title: 'Visualize In 3D',
    detail: 'Switch to immersive mode to review scale, light, and composition.',
    icon: Wand2,
  },
]

const heroVariants = {
  hidden: { opacity: 0, y: 34 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.9,
      ease: [0.22, 1, 0.36, 1],
    },
  },
}

function Landing() {
  return (
    <div className="page-shell relative min-h-screen overflow-x-clip">
      <div className="premium-grid-bg pointer-events-none absolute inset-0 opacity-[0.2]" />

      <header className="relative z-20 mx-auto flex w-full max-w-7xl items-center justify-between px-5 pt-6 md:px-10">
        <Link to="/" className="flex items-center gap-3 text-[16px] font-medium tracking-[0.16em] text-[#3a2e24]">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#e8e0d6] bg-[#ffffff] text-[#c07a45]">
            <Cuboid size={16} />
          </span>
          ROOMETRY
        </Link>

        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle />
          <Link
            to="/login"
            className="rounded-lg border border-[#e8e0d6] bg-[#ffffff] px-4 py-2 text-sm font-medium text-[#8a7260] transition hover:bg-[#faf0e8] hover:text-[#6b4f35]"
          >
            Sign in
          </Link>
          <Link
            to="/register"
            className="rounded-lg bg-[#c07a45] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#a8632e]"
          >
            Get started
          </Link>
        </div>

        <div className="md:hidden">
          <ThemeToggle />
        </div>
      </header>

      <section className="relative z-10 mx-auto flex min-h-[calc(100vh-90px)] w-full max-w-7xl items-center px-5 pb-12 pt-12 md:px-10 md:pt-16">
        <div className="surface-glass relative w-full overflow-hidden px-6 py-12 md:px-10 md:py-14">

          <motion.div
            initial="hidden"
            animate="visible"
            variants={heroVariants}
            className="relative max-w-4xl"
          >
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#e8e0d6] bg-[#fdf0e6] px-4 py-2 text-[10px] font-medium uppercase tracking-[0.2em] text-[#c07a45]">
              Premium Floor Intelligence
            </p>

            <h1 className="text-4xl font-medium leading-[1.05] text-[#3a2e24] sm:text-5xl md:text-6xl lg:text-7xl">
              Design in 2D.
              <br />
              <span className="text-[#c07a45]">
                Experience it in 3D.
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-relaxed text-[#8a7260] sm:text-lg">
              Roometry turns planning into a cinematic workflow. Build a floor plan with structure, then transition
              seamlessly into an immersive 3D space with one fluid interaction.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-lg bg-[#c07a45] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#a8632e]"
              >
                Launch Workspace
                <ArrowRight size={16} />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-lg border border-[#e8e0d6] bg-[#ffffff] px-5 py-3 text-sm font-medium text-[#8a7260] transition hover:bg-[#faf0e8] hover:text-[#6b4f35]"
              >
                Open Dashboard
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="mt-10 grid gap-3 sm:grid-cols-3"
          >
            {['Smooth 2D grid controls', 'One-click 3D transition', 'Collaborative-ready project flow'].map((item) => (
              <div key={item} className="surface-glass-soft px-4 py-3 text-sm text-[#8a7260]">
                {item}
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      <section id="features" className="relative z-10 mx-auto w-full max-w-7xl px-5 py-16 md:px-10 md:py-24">
        <div className="mb-12 max-w-3xl">
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#c4b09a]">Feature Modules</p>
          <h2 className="mt-3 text-3xl font-medium text-[#3a2e24] sm:text-4xl md:text-5xl">
            Crafted motion blocks that guide users naturally through your product.
          </h2>
        </div>

        <div className="space-y-7">
          {modules.map((item) => {
            const Icon = item.icon

            return (
              <motion.article
                key={item.title}
                initial={{ opacity: 0, x: item.direction === 'left' ? -70 : 70 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.32 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="surface-glass overflow-hidden p-6 md:p-8"
              >
                <div className="grid gap-6 md:grid-cols-[1fr_250px] md:items-start">
                  <div>
                    <span className="inline-flex rounded-full border border-[#e8e0d6] bg-[#fdf0e6] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-[#c07a45]">
                      {item.badge}
                    </span>
                    <h3 className="mt-4 text-2xl font-medium text-[#3a2e24] md:text-3xl">{item.title}</h3>
                    <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#8a7260] md:text-base">{item.body}</p>

                    <div className="mt-5 flex flex-wrap gap-2">
                      {item.points.map((point) => (
                        <span
                          key={point}
                          className="rounded-full border border-[#e8ddd0] bg-[#faf5f0] px-3 py-1 text-xs text-[#8a7260]"
                        >
                          {point}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="surface-glass-soft flex h-full min-h-44 flex-col items-center justify-center gap-3 px-6 py-8 text-center">
                    <span className="flex h-14 w-14 items-center justify-center rounded-lg border border-[#e8e0d6] bg-[#fdf0e6] text-[#c07a45]">
                      <Icon size={24} />
                    </span>
                    <p className="text-sm text-[#8a7260]">Purpose-built module motion with subtle glass depth.</p>
                  </div>
                </div>
              </motion.article>
            )
          })}
        </div>
      </section>

      <section className="relative z-10 mx-auto w-full max-w-7xl px-5 pb-20 md:px-10 md:pb-28">
        <div className="surface-glass p-6 md:p-8">
          <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#c4b09a]">2D To 3D Transition</p>
              <h2 className="mt-2 text-3xl font-medium text-[#3a2e24] md:text-4xl">A clear visual journey, step by step.</h2>
            </div>
            <Link
              to="/register"
              className="rounded-lg border border-[#e8e0d6] bg-[#fdf0e6] px-4 py-2 text-sm font-medium text-[#c07a45] transition hover:bg-[#fde8d4]"
            >
              Try the flow now
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {flow.map((step, index) => {
              const Icon = step.icon

              return (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ duration: 0.52, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
                  className="surface-glass-soft p-5"
                >
                    <span className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg border border-[#e8e0d6] bg-[#fdf0e6] text-[#c07a45]">
                    <Icon size={20} />
                  </span>
                    <h3 className="text-lg font-medium text-[#3a2e24]">{step.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#8a7260]">{step.detail}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>
    </div>
  )
}

export default Landing
