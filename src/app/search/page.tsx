import type { Metadata } from "next";
import { Suspense } from "react";
import {
  ArticleCard,
  ArticleCardSkeleton,
  ArticleGrid,
} from "@/components/article-card";
import { SearchForm } from "@/components/search-form";
import {
  getArticles,
  getCategories,
  getRecentArticles,
} from "@/lib/api/articles";

export const metadata: Metadata = {
  title: "Search",
  description: "Search Vercel Daily articles by keyword and category.",
  alternates: { canonical: "/search" },
  openGraph: {
    title: "Search | Vercel Daily",
    description: "Search Vercel Daily articles by keyword and category.",
    url: "/search",
  },
};

const MAX_RESULTS = 5;
const DEFAULT_COUNT = 6;
const MAX_QUERY_LENGTH = 100;

export default function SearchPage({ searchParams }: PageProps<"/search">) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="font-bold text-3xl tracking-tight sm:text-4xl">Search</h1>
      <p className="mt-2 text-muted">
        Find articles by keyword, or narrow them down by category.
      </p>
      {/* searchParams are request-time data, so this part streams in */}
      <Suspense fallback={<SearchSkeleton />}>
        <Search searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Search({
  searchParams,
}: {
  searchParams: PageProps<"/search">["searchParams"];
}) {
  const [params, categories] = await Promise.all([
    searchParams,
    getCategories(),
  ]);

  // Normalise and validate URL input before it reaches the API.
  const q = firstValue(params.q).trim().slice(0, MAX_QUERY_LENGTH);
  const requested = firstValue(params.category);
  const category = categories.some((c) => c.slug === requested)
    ? requested
    : "";

  return (
    <SearchForm
      categories={categories}
      initialQuery={q}
      initialCategory={category}
    >
      <SearchResults query={q} category={category} />
    </SearchForm>
  );
}

async function SearchResults({
  query,
  category,
}: {
  query: string;
  category: string;
}) {
  // Default state: no search yet, show the latest articles.
  if (!query && !category) {
    const recent = await getRecentArticles(DEFAULT_COUNT);
    return (
      <section aria-labelledby="results-heading">
        <h2 id="results-heading" className="mb-6 font-semibold text-xl">
          Latest articles
        </h2>
        <ArticleGrid>
          {recent.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </ArticleGrid>
      </section>
    );
  }

  const results = await getArticles({
    search: query || undefined,
    category: category || undefined,
    limit: MAX_RESULTS,
  });

  if (results.length === 0) {
    return (
      <div className="rounded-2xl border border-border border-dashed px-6 py-16 text-center">
        <h2 className="font-semibold text-xl">No articles found</h2>
        <p className="mx-auto mt-2 max-w-md text-muted">
          {query ? (
            <>
              Nothing matched “<span className="text-foreground">{query}</span>”
              {category ? " in this category" : ""}.
            </>
          ) : (
            "There are no articles in this category yet."
          )}{" "}
          Try different keywords or another category.
        </p>
      </div>
    );
  }

  return (
    <section aria-labelledby="results-heading">
      <h2 id="results-heading" className="mb-6 font-semibold text-xl">
        {results.length} {results.length === 1 ? "result" : "results"}
        {query ? (
          <>
            {" "}
            for “<span className="text-accent">{query}</span>”
          </>
        ) : null}
      </h2>
      <ArticleGrid>
        {results.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </ArticleGrid>
    </section>
  );
}

function firstValue(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

function SearchSkeleton() {
  return (
    <div className="mt-8" aria-hidden="true">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row">
        <div className="h-11 flex-1 animate-pulse rounded-full bg-surface" />
        <div className="h-11 w-full animate-pulse rounded-full bg-surface sm:w-48" />
      </div>
      <ArticleGrid>
        {Array.from({ length: DEFAULT_COUNT }, (_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static placeholders
          <ArticleCardSkeleton key={i} />
        ))}
      </ArticleGrid>
    </div>
  );
}
