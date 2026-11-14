import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import {
  ArticleAccess,
  ArticleBodySkeleton,
} from "@/components/article-access";
import {
  TrendingArticles,
  TrendingSkeleton,
} from "@/components/trending-articles";
import { getArticle, getArticles } from "@/lib/api/articles";
import { formatDate, humanizeSlug } from "@/lib/format";
import { renderInline, stripInline } from "@/lib/inline-markdown";

// Prerender every article at build time; new slugs render on first request.
export async function generateStaticParams() {
  const articles = await getArticles({ limit: 50 });
  return articles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/articles/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) return { title: "Article not found" };

  const url = `/articles/${article.slug}`;
  const description = stripInline(article.excerpt);
  return {
    title: article.title,
    description,
    authors: [{ name: article.author.name }],
    keywords: article.tags,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title: article.title,
      description,
      publishedTime: article.publishedAt,
      authors: [article.author.name],
      section: humanizeSlug(article.category),
      tags: article.tags,
      images: [{ url: article.image, alt: article.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description,
      images: [article.image],
    },
  };
}

export default async function ArticlePage({
  params,
}: PageProps<"/articles/[slug]">) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) notFound();

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <article className="mx-auto max-w-3xl pt-10 sm:pt-14">
        {/* Article header: part of the static, cached shell */}
        <header className="flex flex-col gap-4">
          <p className="font-medium text-accent text-sm uppercase tracking-wider">
            {humanizeSlug(article.category)}
          </p>
          <h1 className="text-balance font-bold text-3xl tracking-tight sm:text-4xl lg:text-5xl">
            {article.title}
          </h1>
          <p className="text-lg text-muted">{renderInline(article.excerpt)}</p>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-muted text-sm">
            <span>
              By{" "}
              <span className="font-medium text-foreground">
                {article.author.name}
              </span>
            </span>
            <span aria-hidden="true">·</span>
            <time dateTime={article.publishedAt}>
              {formatDate(article.publishedAt)}
            </time>
          </div>
        </header>

        <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-2xl border border-border bg-surface">
          <Image
            src={article.image}
            alt={article.title}
            fill
            preload
            sizes="(min-width: 816px) 768px, 100vw"
            className="object-cover"
          />
        </div>

        {/* Full body or paywall: decided per request from the subscription */}
        <div className="mt-10">
          <Suspense fallback={<ArticleBodySkeleton />}>
            <ArticleAccess slug={article.slug} />
          </Suspense>
        </div>
      </article>

      <section
        aria-labelledby="trending-heading"
        className="mx-auto mt-16 max-w-6xl border-border border-t pt-10"
      >
        <h2
          id="trending-heading"
          className="mb-6 font-bold text-2xl tracking-tight"
        >
          Trending now
        </h2>
        <Suspense fallback={<TrendingSkeleton />}>
          <TrendingArticles excludeId={article.id} />
        </Suspense>
      </section>
    </div>
  );
}
