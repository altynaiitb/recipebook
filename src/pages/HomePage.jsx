import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { useRecipes } from '../context/RecipeContext'
import { useFavorites } from '../context/FavoritesContext'
import WindowSize from '../components/WindowSize'

/* Counts up from 0 to `value` when it enters the viewport */
function AnimatedNumber({ value }) {
  const [display, setDisplay] = useState(0)
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })

  useEffect(() => {
    if (!inView) return
    const end = parseFloat(value) || 0
    if (end === 0) { setDisplay(0); return }
    const duration = 900
    const steps = 40
    const inc = end / steps
    let cur = 0
    const timer = setInterval(() => {
      cur += inc
      if (cur >= end) { setDisplay(end); clearInterval(timer) }
      else setDisplay(parseFloat(cur.toFixed(1)))
    }, duration / steps)
    return () => clearInterval(timer)
  }, [inView, value])

  return <span ref={ref}>{display}</span>
}

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.13 } },
}

const fadeUp = {
  hidden:  { opacity: 0, y: 30, scale: 0.96 },
  visible: { opacity: 1, y: 0,  scale: 1, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
}

const slideLeft = {
  hidden:  { opacity: 0, x: -30 },
  visible: { opacity: 1, x: 0,  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
}

const slideRight = {
  hidden:  { opacity: 0, x: 30 },
  visible: { opacity: 1, x: 0,  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
}

function Section({ children, delay = 0 }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={stagger}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  )
}

export default function HomePage() {
  const { stats, isLoading } = useRecipes()
  const { favoritesCount }   = useFavorites()

  return (
    <div className="page home-page">

      {/* ── Hero ── */}
      <motion.div
        className="home-hero"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.div className="hero-content" variants={stagger} initial="hidden" animate="visible">
          <motion.h1 className="hero-title" variants={slideLeft}>
            Welcome to{' '}
            <span className="highlight shimmer-text">Recipe Book</span>
          </motion.h1>
          <motion.p className="hero-subtitle" variants={slideLeft}>
            Your personal collection of delicious recipes.
            Add, organize, and find your favorite meals in one place.
          </motion.p>
          <motion.div className="hero-actions" variants={fadeUp}>
            <motion.div whileHover={{ scale: 1.06, y: -2 }} whileTap={{ scale: 0.96 }}>
              <Link to="/recipes" className="btn primary hero-btn">Browse Recipes →</Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.06, y: -2 }} whileTap={{ scale: 0.96 }}>
              <Link to="/ai-chef" className="btn hero-ai-btn">✨ Ask AI Chef</Link>
            </motion.div>
          </motion.div>
        </motion.div>

        <motion.div
          className="hero-visual"
          variants={slideRight}
          initial="hidden"
          animate="visible"
        >
          <motion.div
            className="hero-emoji"
            animate={{ y: [0, -14, 0], rotate: [0, 4, -4, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            👨‍🍳
          </motion.div>
          <div className="hero-orbs">
            <motion.span className="orb orb-1"
              animate={{ y: [-6, 8, -6], rotate: [0, 180, 360] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            >🍅</motion.span>
            <motion.span className="orb orb-2"
              animate={{ y: [5, -8, 5], rotate: [0, -180, -360] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
            >🌿</motion.span>
            <motion.span className="orb orb-3"
              animate={{ y: [-4, 10, -4] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            >⭐</motion.span>
          </div>
        </motion.div>
      </motion.div>

      {/* ── Stats ── */}
      <Section delay={0.1}>
        <motion.div className="home-stats" variants={fadeUp}>
          <h2>Your Collection</h2>
          {isLoading ? (
            <div className="loading">
              <div className="spinner" aria-hidden />
              <div className="loading-text">Loading stats…</div>
            </div>
          ) : (
            <motion.div className="stats-grid" variants={stagger}>
              {[
                { icon: '📖', value: stats.total,        label: 'Total Recipes', cls: '' },
                { icon: '❤️', value: favoritesCount,     label: 'Favorites',     cls: 'favorite' },
                { icon: '⭐', value: stats.averageRating, label: 'Avg. Rating',   cls: '' },
              ].map(({ icon, value, label, cls }) => (
                <motion.div
                  key={label}
                  className={`stat-card ${cls}`}
                  variants={fadeUp}
                  whileHover={{ y: -6, scale: 1.04, transition: { duration: 0.22 } }}
                >
                  <motion.div
                    className="stat-icon"
                    animate={{ rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3 }}
                  >
                    {icon}
                  </motion.div>
                  <div className="stat-value">
                    <AnimatedNumber value={value} />
                  </div>
                  <div className="stat-label">{label}</div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </motion.div>
      </Section>

      {/* ── Categories ── */}
      <Section delay={0.15}>
        <motion.div className="home-categories" variants={fadeUp}>
          <h2>By Category</h2>
          {!isLoading && (
            <motion.div className="category-grid" variants={stagger}>
              {[
                { cls: 'breakfast', icon: '🥞', name: 'Breakfast', count: stats.byCategory.breakfast },
                { cls: 'lunch',     icon: '🥗', name: 'Lunch',     count: stats.byCategory.lunch },
                { cls: 'dinner',    icon: '🍝', name: 'Dinner',    count: stats.byCategory.dinner },
              ].map(({ cls, icon, name, count }) => (
                <motion.div
                  key={name}
                  className={`category-card ${cls}`}
                  variants={fadeUp}
                  whileHover={{ y: -8, scale: 1.05, transition: { duration: 0.22 } }}
                  whileTap={{ scale: 0.97 }}
                >
                  <motion.span
                    className="category-icon"
                    animate={{ rotate: [0, -8, 8, 0] }}
                    transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 + Math.random() * 2 }}
                  >
                    {icon}
                  </motion.span>
                  <span className="category-name">{name}</span>
                  <motion.span
                    className="category-count"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400, delay: 0.4 }}
                  >
                    {count}
                  </motion.span>
                </motion.div>
              ))}
            </motion.div>
          )}
        </motion.div>
      </Section>

      {/* ── AI Promo ── */}
      <Section delay={0.2}>
        <motion.div
          className="ai-promo-card"
          variants={fadeUp}
          whileHover={{ scale: 1.02, y: -3 }}
        >
          <motion.div
            className="ai-promo-icon"
            animate={{ rotate: [0, -10, 10, 0], y: [0, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            🤖
          </motion.div>
          <div className="ai-promo-text">
            <h3>New: AI Chef Assistant</h3>
            <p>Tell our AI what ingredients you have and get a personalized recipe instantly!</p>
          </div>
          <motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}>
            <Link to="/ai-chef" className="btn primary">Try Now ✨</Link>
          </motion.div>
        </motion.div>
      </Section>

      <div className="home-device">
        <h3>Device Info</h3>
        <WindowSize />
      </div>
    </div>
  )
}
