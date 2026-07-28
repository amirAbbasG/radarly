'use client'

import { AnimatedThemeToggler } from '@/components/ui/animated-theme-toggler'

export function ThemeToggle({ className }: { className?: string }) {


  return (
    <AnimatedThemeToggler
      className={className}
      // theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
      // onThemeChange={setTheme}
      variant="circle"
      // duration={800}
    />
  )
}
