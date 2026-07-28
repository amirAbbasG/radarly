import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { ToolDetail } from '@/features/tool-detail/tool-detail'
import {
  TOOLS,
  getRelatedTools,
  getToolBySlug,
  getToolDetail,
  toolSlug,
} from '@/lib/tools-data'

export function generateStaticParams() {
  return TOOLS.map((tool) => ({ slug: toolSlug(tool.name) }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const tool = getToolBySlug(slug)
  if (!tool) return { title: 'Tool not found · Radarly' }
  return {
    title: `${tool.name} · Radarly`,
    description: tool.hook,
  }
}

export default async function ToolPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const tool = getToolBySlug(slug)
  if (!tool) notFound()

  const detail = getToolDetail(tool)
  const related = getRelatedTools(tool)
  const rank = TOOLS.findIndex((t) => t.name === tool.name) + 1

  return (
    <div className="min-h-screen bg-background">
      <Navbar showLinks={false} />
      <main>
        <ToolDetail tool={tool} detail={detail} related={related} rank={rank} />
      </main>
      <Footer />
    </div>
  )
}
