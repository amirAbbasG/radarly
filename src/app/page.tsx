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

export default function Page() {
  return (
    <>
      <ScrollProgress />
      <Navbar />
      <main>
        <Hero />
        <TrustStrip />
        <ToolOfWeek />
        <TrendingFeed />
        <HowItWorks />
        <Categories />
        <Newsletter />
      </main>
      <Footer />
    </>
  );
}
