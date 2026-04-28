import React from 'react'
import { motion } from 'framer-motion'

const variants = {
  initial: { opacity: 0, y: 18 },
  in:      { opacity: 1, y: 0 },
  out:     { opacity: 0, y: -12 },
}

const transition = { duration: 0.28, ease: [0.22, 1, 0.36, 1] }

export default function AnimatedPage({ children }) {
  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={variants}
      transition={transition}
    >
      {children}
    </motion.div>
  )
}
