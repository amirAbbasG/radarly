"use client";

// import { useTheme } from 'next-themes'
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";

export function ThemeToggle({ className }: { className?: string }) {
  // const { resolvedTheme, setTheme } = useTheme()

  return (
    <AnimatedThemeToggler
      className={className}
      // theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
      // onThemeChange={setTheme}
    />
  );
}
