import Image from "next/image";
import type { ContentBlock } from "@/lib/api/schemas";
import { renderInline } from "@/lib/inline-markdown";

/** Renders the API's structured content blocks as semantic HTML. */
export function ArticleBody({ blocks }: { blocks: ContentBlock[] }) {
  return (
    <div className="flex flex-col gap-5 text-lg leading-8">
      {blocks.map((block, index) => {
        // Blocks have no ids and never reorder, so the index is a stable key.
        const key = `${block.type}-${index}`;
        switch (block.type) {
          case "paragraph":
            return <p key={key}>{renderInline(block.text, key)}</p>;
          case "heading":
            return block.level === 2 ? (
              <h2 key={key} className="mt-6 font-bold text-2xl tracking-tight">
                {block.text}
              </h2>
            ) : (
              <h3
                key={key}
                className="mt-4 font-semibold text-xl tracking-tight"
              >
                {block.text}
              </h3>
            );
          case "blockquote":
            return (
              <blockquote
                key={key}
                className="border-accent border-l-4 pl-5 text-muted italic"
              >
                {renderInline(block.text, key)}
              </blockquote>
            );
          case "unordered-list":
            return (
              <ul key={key} className="list-disc space-y-2 pl-6">
                {block.items.map((item) => (
                  <li key={item}>{renderInline(item, key)}</li>
                ))}
              </ul>
            );
          case "ordered-list":
            return (
              <ol key={key} className="list-decimal space-y-2 pl-6">
                {block.items.map((item) => (
                  <li key={item}>{renderInline(item, key)}</li>
                ))}
              </ol>
            );
          case "image":
            // The API currently returns image blocks with an empty src; skip
            // them instead of rendering a broken image.
            if (!block.src) return null;
            return (
              <figure key={key} className="my-2">
                <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-surface">
                  <Image
                    src={block.src}
                    alt={block.alt}
                    fill
                    sizes="(min-width: 816px) 768px, 100vw"
                    className="object-cover"
                    unoptimized
                  />
                </div>
                {block.caption && (
                  <figcaption className="mt-2 text-center text-muted text-sm">
                    {block.caption}
                  </figcaption>
                )}
              </figure>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
