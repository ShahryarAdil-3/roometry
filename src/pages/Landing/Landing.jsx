import React, { useState, useEffect, useRef } from 'react'
import { motion, useScroll, useTransform, useMotionValue, useSpring } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight, Cuboid, Map, Wand2, Sparkles, Users, LayoutDashboard, MousePointer2 } from 'lucide-react'
import ThemeToggle from '@components/ThemeToggle'
import './Landing.css'

// Floating particles for background
const FloatingParticles = () => {
  const particles = Array.from({ length: 20 })

  return (
    <div className="particles-container">
      {particles.map((_, i) => (
        <motion.div
          key={i}
          className="particle"
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0.2, 0.4, 0.2],
            scale: [0.5, 1, 0.5],
            x: [0, Math.random() * 200 - 100, 0],
            y: [0, Math.random() * 200 - 100, 0]
          }}
          transition={{
            duration: 4 + Math.random() * 4,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            delay: `${Math.random() * 2}s`
          }}
        />
      ))}
    </div>
  )
}

// Animated 3D preview card
const PreviewCard = ({ title, description, icon: Icon, delay = 0 }) => {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ scale: 1.02, y: -5 }}
      className="preview-card"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <div className="preview-card-glow" />
      <div className="preview-card-content">
        <motion.div
          className="preview-card-icon"
          animate={{
            rotate: isHovered ? [0, 5, -5, 0] : 0,
            scale: isHovered ? 1.1 : 1
          }}
          transition={{ duration: 0.3 }}
        >
          <Icon size={28} />
        </motion.div>
        <h3 className="preview-card-title">{title}</h3>
        <p className="preview-card-description">{description}</p>
        <motion.div
          className="preview-card-arrow"
          animate={{ x: isHovered ? 5 : 0 }}
        >
          <ArrowRight size={18} />
        </motion.div>
      </div>
    </motion.div>
  )
}

// Feature section with scroll animations
const FeatureSection = ({ children, title, subtitle }) => {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.8 }}
      className="feature-section"
    >
      <div className="feature-header">
        <motion.p
          className="feature-subtitle"
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
        >
          {subtitle}
        </motion.p>
        <motion.h2
          className="feature-title"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          {title}
        </motion.h2>
      </div>
      {children}
    </motion.section>
  )
}

// Interactive feature card
const FeatureCard = ({ icon: Icon, title, description, index, delay = 0 }) => {
  const cardRef = useRef(null)
  const [isHovered, setIsHovered] = useState(false)

  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const springX = useSpring(mouseX, { stiffness: 500, damping: 50 })
  const springY = useSpring(mouseY, { stiffness: 500, damping: 50 })

  const handleMouseMove = (e) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const width = rect.width
    const height = rect.height
    const mouseXVal = e.clientX - rect.left - width / 2
    const mouseYVal = e.clientY - rect.top - height / 2
    mouseX.set(mouseXVal / width)
    mouseY.set(mouseYVal / height)
  }

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, delay: delay + index * 0.1 }}
      whileHover={{ scale: 1.03 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onMouseMove={handleMouseMove}
      className="feature-card"
      style={{
        transform: isHovered ?
          `translate(${springX.get() * 20}px, ${springY.get() * 20}px) scale(1.03)` :
          'translate(0, 0) scale(1)'
      }}
    >
      <motion.div
        className="feature-card-icon-wrapper"
        animate={{
          background: isHovered ? 'linear-gradient(135deg, #c07a45 0%, #a8632e 100%)' : 'linear-gradient(135deg, #fdf0e6 0%, #fde8d4 100%)',
          color: isHovered ? '#ffffff' : '#c07a45'
        }}
        transition={{ duration: 0.3 }}
      >
        <Icon size={24} />
      </motion.div>
      <div className="feature-card-content">
        <h3 className="feature-card-title">{title}</h3>
        <p className="feature-card-description">{description}</p>
      </div>
    </motion.div>
  )
}

// Hero section with animated background
const HeroSection = () => {
  const { scrollY } = useScroll()
  const yPos = useTransform(scrollY, [0, 500], [0, -100])

  return (
    <section className="hero-section" style={{ y: yPos }}>
      <FloatingParticles />
      <div className="hero-gradient-overlay" />
      <motion.div
        className="hero-content"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.div
          className="hero-badge"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Sparkles size={14} />
          <span>Next-Gen Interior Design</span>
        </motion.div>

        <motion.h1
          className="hero-title"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
        >
          Design Spaces
          <br />
          <motion.span
            className="hero-title-gradient"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            That Feel Real
          </motion.span>
        </motion.h1>

        <motion.p
          className="hero-description"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.7 }}
        >
          Roometry bridges the gap between 2D planning and 3D experience.
          Create precise floor plans, then step into your design with accurate scale and dimensions.
        </motion.p>

        <motion.div
          className="hero-buttons"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.7 }}
        >
          <Link to="/register" className="hero-button-primary">
            <span>Start Designing</span>
            <ArrowRight size={16} />
          </Link>
          <Link to="/dashboard" className="hero-button-secondary">
            <LayoutDashboard size={16} />
            <span>My Projects</span>
          </Link>
        </motion.div>

        <motion.div
          className="hero-features"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.7 }}
        >
          {['Real-world scale', 'Interactive 3D', 'Collaborative'].map((feature, i) => (
            <motion.div
              key={feature}
              className="hero-feature-item"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 + i * 0.1 }}
            >
              <Sparkles size={12} />
              <span>{feature}</span>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      <motion.div
        className="hero-visual"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.9 }}
      >
        <div className="hero-visual-card">
          <div className="hero-visual-icon">
            <Cuboid size={32} />
          </div>
          <div className="hero-visual-content">
            <h3>3D Visualization</h3>
            <p>Step into your design</p>
          </div>
        </div>
      </motion.div>
    </section>
  )
}

// Stats section
const StatsSection = () => {
  const stats = [
    { number: '10K+', label: 'Designs Created' },
    { number: '5K+', label: 'Active Users' },
    { number: '100%', label: 'Real Scale' },
    { number: '24/7', label: 'Access' }
  ]

  return (
    <section className="stats-section">
      <motion.div
        className="stats-grid"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            className="stat-item"
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.6 }}
          >
            <motion.div
              className="stat-number"
              initial={{ scale: 0.5 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.6, type: 'spring', stiffness: 500 }}
            >
              {stat.number}
            </motion.div>
            <p className="stat-label">{stat.label}</p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}

// Workflow section
const WorkflowSection = () => {
  const workflowSteps = [
    {
      step: '01',
      title: 'Plan in 2D',
      description: 'Create precise floor plans with exact measurements and snapping tools',
      icon: Map
    },
    {
      step: '02',
      title: 'Add Furniture',
      description: 'Place realistic 3D furniture with accurate dimensions and materials',
      icon: Cuboid
    },
    {
      step: '03',
      title: 'Experience in 3D',
      description: 'Walk through your design with immersive first-person view',
      icon: Wand2
    },
    {
      step: '04',
      title: 'Share & Collaborate',
      description: 'Invite others to view and collaborate on your designs',
      icon: Users
    }
  ]

  return (
    <FeatureSection
      title="Simple, Powerful Workflow"
      subtitle="From concept to reality"
    >
      <motion.div
        className="workflow-grid"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        {workflowSteps.map((step, i) => {
          const Icon = step.icon
          return (
            <motion.div
              key={step.step}
              className="workflow-step"
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.6 }}
            >
              <div className="workflow-step-number">{step.step}</div>
              <div className="workflow-step-icon">
                <Icon size={24} />
              </div>
              <h3 className="workflow-step-title">{step.title}</h3>
              <p className="workflow-step-description">{step.description}</p>
              {i < workflowSteps.length - 1 && (
                <motion.div
                  className="workflow-connector"
                  initial={{ width: 0 }}
                  whileInView={{ width: '100%' }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
                />
              )}
            </motion.div>
          )
        })}
      </motion.div>
    </FeatureSection>
  )
}

// Testimonials section
const TestimonialsSection = () => {
  const testimonials = [
    {
      quote: "Roometry transformed how I design spaces. The real-world scale is incredible!",
      author: "Sarah, Interior Designer",
      avatar: 'S'
    },
    {
      quote: "Finally a tool that makes 2D planning and 3D visualization seamless.",
      author: "Michael, Architect",
      avatar: 'M'
    },
    {
      quote: "My clients love the immersive walkthroughs. It's like being in the space before it's built.",
      author: "Emma, Design Studio",
      avatar: 'E'
    }
  ]

  return (
    <section className="testimonials-section">
      <FeatureSection
        title="Loved by Designers"
        subtitle="What our users say"
      >
        <motion.div
          className="testimonials-grid"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          {testimonials.map((testimonial, i) => (
            <motion.div
              key={i}
              className="testimonial-card"
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.6 }}
            >
              <div className="testimonial-avatar">
                {testimonial.avatar}
              </div>
              <blockquote className="testimonial-quote">
                "{testimonial.quote}"
              </blockquote>
              <cite className="testimonial-author">{testimonial.author}</cite>
            </motion.div>
          ))}
        </motion.div>
      </FeatureSection>
    </section>
  )
}

// Final CTA section
const FinalCTA = () => {
  return (
    <section className="final-cta">
      <motion.div
        className="final-cta-content"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <motion.h2
          className="final-cta-title"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
        >
          Ready to Design?
        </motion.h2>
        <motion.p
          className="final-cta-description"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          Start creating beautiful, accurate interior designs today.
        </motion.p>
        <motion.div
          className="final-cta-buttons"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
        >
          <Link to="/register" className="final-cta-button-primary">
            <span>Get Started Free</span>
            <ArrowRight size={16} />
          </Link>
          <Link to="/dashboard" className="final-cta-button-secondary">
            <MousePointer2 size={16} />
            <span>Try Demo</span>
          </Link>
        </motion.div>
      </motion.div>
    </section>
  )
}

// Main Landing component
function Landing() {
  return (
    <div className="landing-shell">
      {/* Header */}
      <motion.header
        className="landing-header"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <Link to="/" className="landing-logo">
          <span className="landing-logo-icon">
            <Cuboid size={20} />
          </span>
          <span className="landing-logo-text">ROOMETRY</span>
        </Link>

        <div className="landing-nav">
          <ThemeToggle />
          <Link to="/login" className="landing-nav-link">
            Sign In
          </Link>
          <Link to="/register" className="landing-nav-button">
            Get Started
          </Link>
        </div>
      </motion.header>

      {/* Hero Section */}
      <HeroSection />

      {/* Stats Section */}
      <StatsSection />

      {/* Preview Cards */}
      <section className="preview-section">
        <div className="preview-container">
          <PreviewCard
            title="2D Floor Planner"
            description="Precision planning with grid snapping and exact measurements"
            icon={Map}
            delay={0}
          />
          <PreviewCard
            title="3D Visualizer"
            description="Immersive walkthroughs with real-world scale and lighting"
            icon={Wand2}
            delay={0.1}
          />
          <PreviewCard
            title="Furniture Library"
            description="Hundreds of realistic 3D models with accurate dimensions"
            icon={Cuboid}
            delay={0.2}
          />
        </div>
      </section>

      {/* Features Section */}
      <FeatureSection
        title="Powerful Features"
        subtitle="Everything you need"
      >
        <div className="features-grid">
          <FeatureCard
            icon={Map}
            title="Precise 2D Planning"
            description="Create floor plans with exact dimensions, grid snapping, and smart alignment tools"
            index={0}
          />
          <FeatureCard
            icon={Cuboid}
            title="Realistic 3D Models"
            description="High-quality furniture with accurate real-world dimensions and materials"
            index={1}
          />
          <FeatureCard
            icon={Wand2}
            title="Immersive 3D View"
            description="Walk through your design with first-person controls and realistic lighting"
            index={2}
          />
          <FeatureCard
            icon={Users}
            title="Collaboration"
            description="Share designs with clients and team members for feedback and approval"
            index={3}
          />
          <FeatureCard
            icon={LayoutDashboard}
            title="Project Management"
            description="Organize all your designs in one place with easy access and version control"
            index={4}
          />
          <FeatureCard
            icon={Sparkles}
            title="Design Export"
            description="Export high-quality images, videos, and 3D models for presentations"
            index={5}
          />
        </div>
      </FeatureSection>

      {/* Workflow Section */}
      <WorkflowSection />

      {/* Testimonials Section */}
      <TestimonialsSection />

      {/* Final CTA */}
      <FinalCTA />

      {/* Footer */}
      <motion.footer
        className="landing-footer"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <div className="landing-footer-content">
          <Link to="/" className="landing-footer-logo">
            <Cuboid size={20} />
            <span>ROOMETRY</span>
          </Link>
          <p className="landing-footer-text">
            Design beautiful spaces with precision and creativity.
          </p>
          <div className="landing-footer-links">
            <Link to="/" className="landing-footer-link">Home</Link>
            <Link to="/dashboard" className="landing-footer-link">Dashboard</Link>
            <Link to="/login" className="landing-footer-link">Sign In</Link>
            <Link to="/register" className="landing-footer-link">Sign Up</Link>
          </div>
        </div>
        <div className="landing-footer-bottom">
          <p>© {new Date().getFullYear()} Roometry. All rights reserved.</p>
        </div>
      </motion.footer>
    </div>
  )
}

export default Landing