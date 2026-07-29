import { Navbar } from "@/components/layout/navbar";
import { Hero } from "@/features/home/hero";
import { TrustStrip } from "@/features/home/trust-strip";
import { ToolOfWeek } from "@/features/home/tool-of-week";
import { TrendingFeed } from "@/features/home/trending-feed";
import { HowItWorks } from "@/features/home/how-it-works";
import { Categories } from "@/features/home/categories";
import { Newsletter } from "@/features/home/newsletter";
import { Footer } from "@/components/layout/footer";
import { ScrollProgress } from "@/components/layout/scroll-progress";
import { getAllTools, getToolOfWeek, getCategoryProfiles } from "@/lib/data";
import { CATEGORIES } from "@/lib/tools-data";

export default async function Page() {
  const [allTools, toolOfWeek, categoryProfiles] = await Promise.all([
    getAllTools(),
    getToolOfWeek(),
    getCategoryProfiles(),
  ]);

  return (
    <>
      <ScrollProgress />
      <Navbar />
      <main>
        <Hero toolCount={allTools.length} />
        <TrustStrip />
        <ToolOfWeek tool={toolOfWeek} />
        <TrendingFeed tools={allTools} categories={CATEGORIES} />
        <HowItWorks />
        <Categories categoryProfiles={categoryProfiles} />
        <Newsletter />
      </main>
      <Footer />
    </>
  );
}
