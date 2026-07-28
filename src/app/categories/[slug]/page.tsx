import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CategoryExperience } from "@/features/category/category-experience";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import {
  CATEGORY_PROFILES,
  getCategoryProfile,
  getCategoryTools,
  getRelatedCategories,
} from "@/lib/tools-data";

export function generateStaticParams() {
  return CATEGORY_PROFILES.map(category => ({ slug: category.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategoryProfile(slug);

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
  const category = getCategoryProfile(slug);

  if (!category) notFound();

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <CategoryExperience
        category={category}
        tools={getCategoryTools(category)}
        relatedCategories={getRelatedCategories(category)}
      />
      <Footer />
    </main>
  );
}
