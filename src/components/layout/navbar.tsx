'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Menu, Search, X } from 'lucide-react'
import { AccountMenu } from '@/components/layout/account-menu'
import { Logo } from '@/components/common/logo'
import { ThemeToggle } from '@/components/common/theme-toggle'
import { SearchDialog } from '@/components/layout/search-dialog'

const LINKS = [
  { label: 'Trending', href: '/#trending' },
  { label: 'How it works', href: '/#how' },
  { label: 'Categories', href: '/#categories' },
  { label: 'Submit a tool', href: '/submit' },
]

export function Navbar({ showLinks = true }: { showLinks?: boolean }) {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const typing =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !typing)) {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <>
      <header
        className={
          'fixed inset-x-0 top-0 z-50 transition-all duration-300 ' +
          (scrolled
            ? 'border-b border-border/70 bg-background/70 backdrop-blur-xl'
            : 'border-b border-transparent bg-transparent')
        }
      >
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-10">
          <Logo />

          {showLinks && (
            <ul className="hidden items-center gap-8 md:flex">
              {LINKS.map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    className="group relative text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {l.label}
                    <span className="absolute -bottom-1 left-0 h-px w-0 bg-secondary transition-all duration-300 group-hover:w-full" />
                  </a>
                </li>
              ))}
            </ul>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="hidden items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground transition-colors hover:border-secondary hover:text-foreground sm:flex"
            >
              <Search className="h-3.5 w-3.5 opacity-70" />
              <span>Search tools</span>
              <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">
                /
              </kbd>
            </button>
            <ThemeToggle />
            <AccountMenu />
            <button
              type="button"
              aria-label="Search tools"
              onClick={() => setSearchOpen(true)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground sm:hidden"
            >
              <Search className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Open menu"
              onClick={() => setOpen(true)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground md:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </nav>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', ease: [0.23, 1, 0.32, 1], duration: 0.35 }}
            className="fixed inset-0 z-[60] flex flex-col bg-background px-5 md:hidden"
          >
            <div className="flex h-16 items-center justify-between">
              <Logo />
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex flex-1 flex-col gap-1 py-6">
              <button
                type="button"
                onClick={() => {
                  setOpen(false)
                  setSearchOpen(true)
                }}
                className="flex items-center gap-3 rounded-lg px-3 py-3 text-lg font-medium text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
              >
                <Search className="h-5 w-5" />
                Search tools
              </button>
              {showLinks && LINKS.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-3 text-lg font-medium text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
                >
                  {l.label}
                </a>
              ))}
            </nav>
            <div className="pb-8">
              <AccountMenu mobile onNavigate={() => setOpen(false)} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  )
}
