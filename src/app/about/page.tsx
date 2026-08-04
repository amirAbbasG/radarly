import type { Metadata } from "next";
import { AboutPage } from "@/features/about/about-page";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { ScrollProgress } from "@/components/layout/scroll-progress";

export const metadata: Metadata = {
  title: "About Radarly — The Signal Behind the AI Radar",
  description:
    "Learn how Radarly tracks, scores, and ranks emerging AI tools using transparent momentum signals from across the builder ecosystem.",
  alternates: {
    canonical: "https://radarly.app/about",
  },
  openGraph: {
    title: "About Radarly — The Signal Behind the AI Radar",
    description:
      "How Radarly separates genuine AI momentum from launch-day noise.",
    type: "website",
  },
};

export default function AboutRoute() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "How does Radarly rank AI tools?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Radarly uses an AI agent that scans Product Hunt, GitHub, Hacker News, and Reddit daily. It scores real momentum based on discussion volume, velocity of mentions, community engagement, and retention signals. Tools are ranked by a composite momentum score out of 100.",
        },
      },
      {
        "@type": "Question",
        name: "How often is the data updated?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Radarly scans its four source platforms every 24 hours. Momentum scores, rankings, and trending status are refreshed daily so you always see what's actually taking off right now.",
        },
      },
      {
        "@type": "Question",
        name: "Can I submit my own AI tool to Radarly?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. Radarly accepts tool submissions from builders and founders. Submit your tool through the Submit page and the editorial team will review it for inclusion in the next scan cycle.",
        },
      },
      {
        "@type": "Question",
        name: "What sources does Radarly track?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Radarly tracks four primary sources: Product Hunt launches, GitHub repository activity, Hacker News discussions, and Reddit communities. Each source contributes different signals to the overall momentum score.",
        },
      },
    ],
  };

  return (
    <>
      <ScrollProgress />
      <Navbar />
      <AboutPage />
      <Footer />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
