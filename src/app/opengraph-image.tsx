import { ImageResponse } from "next/og";
import { site } from "@/lib/site";

// Default social card for pages without their own image (articles use their
// cover image instead).
export const alt = site.name;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 80,
        background: "#0a0a0a",
        color: "#ededed",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        {/* biome-ignore lint/a11y/noSvgWithoutTitle: rendered into a PNG by next/og, not into the DOM */}
        <svg width="56" height="48" viewBox="0 0 76 65" fill="#ededed">
          <path d="M37.527 0L75.054 65H0L37.527 0Z" />
        </svg>
        <span style={{ fontSize: 44, fontWeight: 700 }}>{site.name}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <span style={{ fontSize: 72, fontWeight: 700, lineHeight: 1.1 }}>
          News and insights from the teams shipping the web
        </span>
        <span style={{ fontSize: 30, color: "#a1a1a1" }}>
          Product updates, engineering deep dives and customer stories.
        </span>
      </div>
    </div>,
    size,
  );
}
