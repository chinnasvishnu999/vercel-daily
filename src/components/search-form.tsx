"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import type { Category } from "@/lib/api/schemas";

const MIN_QUERY_LENGTH = 3;
const DEBOUNCE_MS = 300;

type Props = {
  categories: Category[];
  initialQuery: string;
  initialCategory: string;
  /** Server-rendered results for the current URL */
  children: React.ReactNode;
};

/**
 * Search input + category filter. The URL is the single source of truth:
 * every search updates ?q=&category=, and the server renders the results, so
 * refreshing or sharing the URL shows the same results.
 */
export function SearchForm({
  categories,
  initialQuery,
  initialCategory,
  children,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const inputId = useId();
  const categoryId = useId();

  // The query and URL of the last navigation this form started. Comparing
  // against these (not the rendered URL) keeps fast typing race-free.
  const committedQuery = useRef(initialQuery);
  const lastTarget = useRef(searchUrl(initialQuery, initialCategory));

  function navigate(nextQuery: string, nextCategory: string) {
    const target = searchUrl(nextQuery, nextCategory);
    if (target === lastTarget.current) return;

    committedQuery.current = nextQuery;
    lastTarget.current = target;
    startTransition(() => {
      router.replace(target as Route, { scroll: false });
    });
  }

  // Debounced auto-search: only after 3+ characters; every keystroke resets
  // the timer. Clearing the input clears the search right away.
  // biome-ignore lint/correctness/useExhaustiveDependencies: runs on typing only
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed === committedQuery.current) return;

    if (trimmed === "") {
      navigate("", category);
      return;
    }
    if (trimmed.length < MIN_QUERY_LENGTH) return;

    const timer = setTimeout(() => navigate(trimmed, category), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  // Back/forward changes the URL outside this form: mirror it in the inputs.
  // (Only popstate, so our own in-flight navigations can never overwrite
  // what the user is typing.)
  useEffect(() => {
    function onPopState() {
      const params = new URLSearchParams(window.location.search);
      const urlQuery = params.get("q") ?? "";
      const urlCategory = params.get("category") ?? "";
      committedQuery.current = urlQuery;
      lastTarget.current = searchUrl(urlQuery, urlCategory);
      setQuery(urlQuery);
      setCategory(urlCategory);
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Explicit submit searches immediately, regardless of the debounce.
    navigate(query.trim(), category);
  }

  function onCategoryChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const next = event.target.value;
    setCategory(next);
    const trimmed = query.trim();
    // Keep a partial (1-2 char) query out of the URL, like the debounce does.
    navigate(
      trimmed.length >= MIN_QUERY_LENGTH ? trimmed : committedQuery.current,
      next,
    );
  }

  return (
    <div className="mt-8">
      <search>
        <form
          onSubmit={onSubmit}
          className="mb-8 flex flex-col gap-3 sm:flex-row"
        >
          <div className="relative flex-1">
            <label htmlFor={inputId} className="sr-only">
              Search articles
            </label>
            <SearchIcon />
            <input
              id={inputId}
              type="search"
              name="q"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search articles…"
              autoComplete="off"
              maxLength={100}
              className="h-11 w-full rounded-full border border-border bg-background pr-10 pl-10 outline-none transition-colors placeholder:text-muted focus:border-foreground"
            />
            {isPending && <Spinner />}
          </div>

          <label htmlFor={categoryId} className="sr-only">
            Category
          </label>
          <select
            id={categoryId}
            name="category"
            value={category}
            onChange={onCategoryChange}
            className="h-11 rounded-full border border-border bg-background px-4 outline-none focus:border-foreground sm:w-48"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="h-11 rounded-full bg-foreground px-6 font-medium text-background transition-opacity hover:opacity-90"
          >
            Search
          </button>
        </form>
      </search>

      <p aria-live="polite" className="sr-only">
        {isPending ? "Searching…" : ""}
      </p>

      {query.trim().length > 0 && query.trim().length < MIN_QUERY_LENGTH && (
        <p className="-mt-5 mb-6 text-muted text-sm">
          Type at least {MIN_QUERY_LENGTH} characters, or press Enter to search.
        </p>
      )}

      {/* Previous results stay visible (dimmed) while new ones load */}
      <div
        aria-busy={isPending}
        className={`transition-opacity ${isPending ? "pointer-events-none opacity-50" : ""}`}
      >
        {children}
      </div>
    </div>
  );
}

function searchUrl(query: string, category: string) {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (category) params.set("category", category);
  return params.size ? `/search?${params}` : "/search";
}

function SearchIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-4 size-4 text-muted"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function Spinner() {
  return (
    <span
      aria-hidden="true"
      className="-translate-y-1/2 absolute top-1/2 right-4 size-4 animate-spin rounded-full border-2 border-muted border-t-transparent"
    />
  );
}
