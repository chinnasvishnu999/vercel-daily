import type { ReactNode } from "react";

// Article text from the API uses a small subset of inline Markdown:
// [links](https://…), **bold**, *italic* and `code`. We turn it into React
// elements (never raw HTML), so any HTML inside the text stays plain text,
// and only http(s) links are rendered, which blocks `javascript:` URLs.

const TOKEN =
  /`([^`]+)`|\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*|\*([^*\s][^*]*)\*/g;

function isSafeUrl(url: string) {
  return /^https?:\/\//i.test(url);
}

export function renderInline(text: string, keyPrefix = "i"): ReactNode[] {
  const nodes: ReactNode[] = [];
  let last = 0;
  let index = 0;

  for (const match of text.matchAll(TOKEN)) {
    const [whole, code, linkText, href, bold, italic] = match;
    const start = match.index ?? 0;
    if (start > last) nodes.push(text.slice(last, start));
    const key = `${keyPrefix}-${index++}`;

    if (code !== undefined) {
      nodes.push(
        <code
          key={key}
          className="rounded bg-surface px-1.5 py-0.5 font-mono text-[0.9em]"
        >
          {code}
        </code>,
      );
    } else if (linkText !== undefined && href !== undefined) {
      nodes.push(
        isSafeUrl(href) ? (
          <a
            key={key}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent underline decoration-accent/40 underline-offset-2 hover:decoration-accent"
          >
            {renderInline(linkText, key)}
          </a>
        ) : (
          linkText
        ),
      );
    } else if (bold !== undefined) {
      nodes.push(
        <strong key={key} className="font-semibold">
          {renderInline(bold, key)}
        </strong>,
      );
    } else if (italic !== undefined) {
      nodes.push(<em key={key}>{renderInline(italic, key)}</em>);
    } else {
      nodes.push(whole);
    }
    last = start + whole.length;
  }

  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

/** Plain-text version (for excerpts in cards and meta descriptions). */
export function stripInline(text: string): string {
  return text.replace(TOKEN, (_whole, code, linkText, _href, bold, italic) => {
    return code ?? linkText ?? bold ?? italic ?? "";
  });
}
