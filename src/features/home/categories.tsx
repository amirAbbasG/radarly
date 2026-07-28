'use client'

import Link from 'next/link'
import { motion } from 'motion/react'
import {
  Code2,
  PenLine,
  Palette,
  Zap,
  BarChart3,
  Megaphone,
  ImageIcon,
  Video,
} from 'lucide-react'
import { Reveal, RevealStagger, itemVariants } from '@/components/common/reveal'

const CATS = [
  { name: 'Code & Development', slug: 'code-development', count: 342, icon: Code2, color: 'text-primary bg-primary/10' },
  { name: 'Writing & Content', slug: 'writing-content', count: 287, icon: PenLine, color: 'text-secondary bg-secondary/10' },
  { name: 'Design & Creative', slug: 'design-creative', count: 198, icon: Palette, color: 'text-accent bg-accent/10' },
  { name: 'Productivity', slug: 'productivity', count: 256, icon: Zap, color: 'text-warning bg-warning/10' },
  { name: 'Data & Analytics', slug: 'data-analytics', count: 174, icon: BarChart3, color: 'text-success bg-success/10' },
  { name: 'Marketing & SEO', slug: 'marketing-seo', count: 213, icon: Megaphone, color: 'text-primary bg-primary/10' },
  { name: 'Image Generation', slug: 'image-generation', count: 167, icon: ImageIcon, color: 'text-accent bg-accent/10' },
  { name: 'Video & Audio', slug: 'video-audio', count: 143, icon: Video, color: 'text-secondary bg-secondary/10' },
]

export function Categories() {
  return (
    <section id="categories" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-10">
      <Reveal className="mb-12 text-center">
        <h2 className="font-heading text-3xl font-bold tracking-tight text-balance sm:text-4xl">
          Explore by category
        </h2>
        <p className="mt-3 text-muted-foreground">
          Find the right AI tools for your workflow.
        </p>
      </Reveal>

      <RevealStagger className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {CATS.map((c) => {
          const Icon = c.icon
          return (
            <motion.div key={c.name} variants={itemVariants} whileHover={{ y: -4 }}>
              <Link
                href={`/categories/${c.slug}`}
                className="group flex h-full flex-col gap-4 rounded-2xl border border-border bg-card p-5 transition-colors hover:border-secondary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
              >
                <div
                  className={
                    'flex size-11 items-center justify-center rounded-xl ' + c.color
                  }
                >
                  <Icon className="size-5" aria-hidden="true" />
                </div>
                <div>
                  <div className="font-heading text-sm font-semibold leading-tight text-foreground">
                    {c.name}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {c.count} tools
                  </div>
                </div>
              </Link>
            </motion.div>
          )
        })}
      </RevealStagger>
    </section>
  )
}
