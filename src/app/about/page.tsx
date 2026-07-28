import type { Metadata } from 'next'
import { AboutPage } from '@/features/about/about-page'
import { Footer } from '@/components/layout/footer'
import { Navbar } from '@/components/layout/navbar'
import { ScrollProgress } from '@/components/layout/scroll-progress'

export const metadata: Metadata = {
  title: 'About Radarly — The Signal Behind the AI Radar',
  description:
    'Learn how Radarly tracks, scores, and ranks emerging AI tools using transparent momentum signals from across the builder ecosystem.',
  openGraph: {
    title: 'About Radarly — The Signal Behind the AI Radar',
    description:
      'How Radarly separates genuine AI momentum from launch-day noise.',
    type: 'website',
  },
}

export default function AboutRoute() {
  return (
    <>
      <ScrollProgress />
      <Navbar />
      <AboutPage />
      <Footer />
    </>
  )
}
