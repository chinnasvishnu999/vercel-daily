import { describe, expect, it } from "vitest";
import { ArticleSchema, ContentBlockSchema } from "@/lib/api/schemas";
import { formatDate, humanizeSlug } from "@/lib/format";

describe("formatDate", () => {
  it("formats in UTC regardless of the server time zone", () => {
    // Midnight UTC would be the previous day in US time zones.
    expect(formatDate("2025-09-25T00:00:00.000Z")).toBe("Sep 25, 2025");
  });
});

describe("humanizeSlug", () => {
  it("turns category slugs into labels", () => {
    expect(humanizeSlug("company-news")).toBe("Company News");
    expect(humanizeSlug("changelog")).toBe("Changelog");
  });
});

const article = {
  id: "a1",
  title: "  Leading spaces are trimmed ",
  slug: "a1",
  excerpt: "Excerpt",
  content: [{ type: "paragraph", text: "Hello" }],
  category: "engineering",
  author: { name: "Ada", avatar: "" },
  image: "https://example.com/a.png",
  publishedAt: "2025-01-01T00:00:00Z",
  featured: true,
  tags: ["x"],
};

describe("API schemas", () => {
  it("validates and normalises an article", () => {
    const parsed = ArticleSchema.parse(article);
    expect(parsed.title).toBe("Leading spaces are trimmed");
  });

  it("rejects malformed API data instead of passing it to the UI", () => {
    expect(() =>
      ArticleSchema.parse({ ...article, image: "not a url" }),
    ).toThrow();
    expect(() =>
      ArticleSchema.parse({ ...article, featured: "yes" }),
    ).toThrow();
  });

  it("accepts every documented content block type", () => {
    for (const block of [
      { type: "paragraph", text: "p" },
      { type: "heading", level: 2, text: "h" },
      { type: "blockquote", text: "q" },
      { type: "unordered-list", items: ["a"] },
      { type: "ordered-list", items: ["a"] },
      { type: "image", src: "", alt: "a", caption: "c" },
    ]) {
      expect(ContentBlockSchema.safeParse(block).success).toBe(true);
    }
    expect(
      ContentBlockSchema.safeParse({ type: "heading", level: 4, text: "h" })
        .success,
    ).toBe(false);
  });
});
