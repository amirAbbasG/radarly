import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CategoryExperience } from "@/features/category/category-experience";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { getCategoryProfiles, getCategoryTools } from "@/lib/data";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const profiles = await getCategoryProfiles();
  const category = profiles.find(c => c.id === slug);
  if (!category) return {};

  const url = `https://radarly.app/categories/${category.id}`;

  return {
    title: `${category.label} AI Tools — Radarly`,
    description: category.description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: `${category.label} AI Tools — Radarly`,
      description: category.description,
      type: "website",
      url,
      siteName: "Radarly",
    },
    twitter: {
      card: "summary_large_image",
      title: `${category.label} AI Tools — Radarly`,
      description: category.description,
    },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const profiles = await getCategoryProfiles();
  const category = profiles.find(c => c.id === slug);
  if (!category) notFound();

  const tools = await getCategoryTools(category.toolCategory);
  const relatedProfiles = profiles.filter(c => c.id !== slug).slice(0, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${category.label} AI Tools`,
    description: category.description,
    url: `https://radarly.app/categories/${category.id}`,
    numberOfItems: tools.length,
    itemListElement: tools.slice(0, 10).map((tool, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "SoftwareApplication",
        name: tool.name,
        description: tool.hook,
        url: `https://radarly.app/tools/${tool.slug}`,
      },
    })),
  };

  return (
    <main className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />
      <CategoryExperience
        category={category}
        tools={tools}
        relatedCategories={relatedProfiles}
      />
      <Footer />
    </main>
  );
}
