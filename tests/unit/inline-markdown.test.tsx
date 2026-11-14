import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { renderInline, stripInline } from "@/lib/inline-markdown";

const html = (text: string) => renderToStaticMarkup(renderInline(text));

describe("renderInline", () => {
  it("renders links, bold, italic and code as elements", () => {
    const out = html(
      "See [the docs](https://vercel.com/docs), **bold**, *em* and `code`.",
    );
    expect(out).toContain('<a href="https://vercel.com/docs" target="_blank"');
    expect(out).toContain('rel="noopener noreferrer"');
    expect(out).toContain(">bold</strong>");
    expect(out).toContain("<em>em</em>");
    expect(out).toContain(">code</code>");
  });

  it("supports formatting inside link text", () => {
    expect(html("[**Vercel** Domains](https://vercel.com)")).toMatch(
      /<a [^>]+><strong[^>]*>Vercel<\/strong> Domains<\/a>/,
    );
  });

  it("never renders unsafe URLs as links", () => {
    const out = html("[click me](javascript:alert(1))");
    expect(out).not.toContain("<a");
    expect(out).not.toContain("javascript:");
  });

  it("escapes HTML instead of injecting it", () => {
    const out = html('<img src=x onerror="alert(1)"> and `<script>`');
    expect(out).not.toContain("<img");
    expect(out).not.toContain("<script>");
    expect(out).toContain("&lt;img");
  });

  it("leaves plain text untouched", () => {
    expect(html("Just text, 2 * 3 = 6")).toBe("Just text, 2 * 3 = 6");
  });
});

describe("stripInline", () => {
  it("removes syntax but keeps the readable text", () => {
    expect(
      stripInline(
        "Try [Vercel Domains](https://vercel.com/domains) **now** with `vercel`",
      ),
    ).toBe("Try Vercel Domains now with vercel");
  });
});
