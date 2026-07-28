'use client'

import { motion, useScroll, useSpring } from 'motion/react'

export function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  const progress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    mass: 0.4,
  })

  return (
    <motion.div
      style={{ scaleX: progress }}
      className="fixed inset-x-0 top-0 z-[55] h-0.5 origin-left bg-secondary"
      aria-hidden="true"
    />
  )
}
