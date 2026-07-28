import type { Metadata } from 'next'
import { Footer } from '@/components/layout/footer'
import { Navbar } from '@/components/layout/navbar'
import { ScrollProgress } from '@/components/layout/scroll-progress'
import { SubmitToolExperience } from '@/features/submit/submit-tool-experience'

export const metadata: Metadata = {
  title: 'Submit an AI Tool — Radarly',
  description: 'Nominate an AI product for independent review by the Radarly editorial radar.',
}

export default function SubmitPage() {
  return (
    <>
      <ScrollProgress />
      <Navbar />
      <main>
        <SubmitToolExperience />
      </main>
      <Footer />
    </>
  )
}
