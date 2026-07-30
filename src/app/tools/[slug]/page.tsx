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
  return {
    title: `${tool.name} - Radarly`,
    description: tool.hook,
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

  return (
    <div className="min-h-screen bg-background">
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
