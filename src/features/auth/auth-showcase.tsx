"use client"

import { motion } from "motion/react"
import { Activity, Bookmark, Radar, TrendingUp } from "lucide-react"
import { RadarMark } from "@/components/common/logo"

const STATS = [
  { label: "Tools tracked", value: "4,200+" },
  { label: "Sources scanned", value: "6" },
  { label: "Refresh cadence", value: "Daily" },
]

const PERKS = [
  {
    icon: Bookmark,
    title: "Save & organize",
    copy: "Bookmark tools into collections and pick up right where you left off.",
  },
  {
    icon: TrendingUp,
    title: "Momentum alerts",
    copy: "Get pinged the moment a tool in your space starts breaking out.",
  },
  {
    icon: Activity,
    title: "Personalized radar",
    copy: "A feed tuned to the categories and stacks you actually care about.",
  },
]

const RINGS = [220, 340, 460]

export function AuthShowcase() {
  return (
    <div className="relative hidden overflow-hidden rounded-3xl bg-card ring-1 ring-foreground/10 lg:flex lg:flex-col">
      {/* Radar backdrop */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.5]">
        {RINGS.map((size, i) => (
          <motion.span
            key={size}
            className="absolute rounded-full border border-secondary/25"
            style={{ width: size, height: size }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: [0.15, 0.4, 0.15], scale: 1 }}
            transition={{
              duration: 4,
              delay: i * 0.5,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
        ))}
        <motion.span
          className="absolute h-[460px] w-[460px] rounded-full"
          style={{
            background:
              "conic-gradient(from 0deg, transparent 0deg, transparent 300deg, var(--secondary) 355deg, transparent 360deg)",
            maskImage: "radial-gradient(circle, #000 62%, transparent 63%)",
            WebkitMaskImage: "radial-gradient(circle, #000 62%, transparent 63%)",
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
        />
      </div>

      <div className="relative flex flex-1 flex-col justify-between p-10 xl:p-12">
        <div className="flex items-center gap-2">
          <RadarMark className="h-7 w-7 text-secondary" />
          <span className="font-heading text-xl font-bold tracking-tight text-foreground">Radarly</span>
        </div>

        <div className="flex flex-col gap-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            className="flex flex-col gap-4"
          >
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
              <Radar className="h-3.5 w-3.5 text-secondary" />
              Signal, not noise
            </span>
            <h2 className="max-w-md font-heading text-3xl leading-tight font-bold tracking-tight text-balance text-foreground xl:text-4xl">
              The AI tools that are actually taking off.
            </h2>
            <p className="max-w-md leading-relaxed text-muted-foreground">
              An agent scans Product Hunt, GitHub, Hacker News and Reddit every day, scores real momentum, and surfaces what matters in under 10 seconds.
            </p>
          </motion.div>

          <ul className="flex flex-col gap-4">
            {PERKS.map((perk, i) => (
              <motion.li
                key={perk.title}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.45, delay: 0.2 + i * 0.1, ease: [0.23, 1, 0.32, 1] }}
                className="flex items-start gap-3"
              >
                <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary/12 text-secondary ring-1 ring-secondary/20">
                  <perk.icon className="h-4 w-4" />
                </span>
                <div className="flex flex-col gap-0.5">
                  <p className="text-sm font-semibold text-foreground">{perk.title}</p>
                  <p className="text-sm leading-relaxed text-muted-foreground">{perk.copy}</p>
                </div>
              </motion.li>
            ))}
          </ul>
        </div>

        <motion.dl
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5, ease: [0.23, 1, 0.32, 1] }}
          className="grid grid-cols-3 gap-4 border-t border-border pt-6"
        >
          {STATS.map((stat) => (
            <div key={stat.label} className="flex flex-col gap-1">
              <dt className="sr-only">{stat.label}</dt>
              <dd className="font-heading text-2xl font-bold text-foreground">{stat.value}</dd>
              <span aria-hidden className="text-xs text-muted-foreground">
                {stat.label}
              </span>
            </div>
          ))}
        </motion.dl>
      </div>
    </div>
  )
}
