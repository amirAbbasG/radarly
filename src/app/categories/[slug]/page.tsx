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
  return {
    title: `${category.label} tools — Radarly`,
    description: category.description,
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

  return (
    <main className="min-h-screen bg-background">
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
