import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { ToolDetail } from "@/features/tool-detail/tool-detail";
import {
  getToolBySlug,
  getRelatedTools,
  getAllTools,
  getToolReviews,
} from "@/lib/data";
import { getToolDetail } from "@/lib/tools-data";
import { getToolInteractionState } from "@/app/actions/tool-interactions";
import { auth } from "@/lib/auth";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tool = await getToolBySlug(slug);
  if (!tool) return { title: "Tool not found - Radarly" };

  const url = `https://radarly.app/tools/${tool.slug}`;

  return {
    title: `${tool.name} — Trending AI Tool | Radarly`,
    description: tool.hook,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: `${tool.name} — Trending AI Tool | Radarly`,
      description: tool.hook,
      type: "website",
      url,
      siteName: "Radarly",
    },
    twitter: {
      card: "summary_large_image",
      title: `${tool.name} — Trending AI Tool | Radarly`,
      description: tool.hook,
    },
  };
}

export default async function ToolPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tool = await getToolBySlug(slug);
  if (!tool) notFound();

  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;

  const [detail, related, allTools, interactionState, reviews] =
    await Promise.all([
      Promise.resolve(getToolDetail(tool)),
      getRelatedTools(tool, 3),
      getAllTools(),
      getToolInteractionState(slug),
      getToolReviews(slug, userId),
    ]);

  const rank = allTools.findIndex(t => t.name === tool.name) + 1;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: tool.name,
    description: tool.hook,
    url: tool.website,
    applicationCategory: "AI Tool",
    offers: {
      "@type": "Offer",
      price: detail.pricing === "Free" ? "0" : undefined,
      priceCurrency: "USD",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: tool.score,
      ratingCount: interactionState.voteCount + 1,
      bestRating: 100,
    },
  };

  return (
    <div className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar showLinks={false} />
      <main>
        <ToolDetail
          tool={tool}
          detail={detail}
          related={related}
          rank={rank}
          interactionState={interactionState}
          reviews={reviews}
          isAuthenticated={Boolean(userId)}
        />
      </main>
      <Footer />
    </div>
  );
}
