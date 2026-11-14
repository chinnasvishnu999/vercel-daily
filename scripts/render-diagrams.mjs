// Renders docs/architecture/*.mmd to light and dark SVGs for the README.
// Usage: pnpm diagrams   (uses the Playwright Chromium installed for E2E)
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "@playwright/test";

const dir = path.join(import.meta.dirname, "..", "docs", "architecture");
const MERMAID =
  "https://cdn.jsdelivr.net/npm/mermaid@11.4.1/dist/mermaid.min.js";
const themes = {
  light: { theme: "default", background: "#ffffff" },
  dark: { theme: "dark", background: "#0d1117" },
};

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent("<!doctype html><body></body>");
await page.addScriptTag({ url: MERMAID });

for (const file of (await readdir(dir)).filter((f) => f.endsWith(".mmd"))) {
  const source = await readFile(path.join(dir, file), "utf8");
  for (const [name, { theme, background }] of Object.entries(themes)) {
    const svg = await page.evaluate(
      async ([code, theme, id]) => {
        // Plain SVG text (no HTML labels) so the image renders anywhere.
        window.mermaid.initialize({
          startOnLoad: false,
          theme,
          htmlLabels: false,
          flowchart: { htmlLabels: false },
        });
        return (await window.mermaid.render(id, code)).svg;
      },
      [source, theme, `d-${name}`],
    );
    // Give the image an intrinsic size (Mermaid emits width="100%", which an
    // <img> can't size), and an explicit background so it stays readable
    // when opened on its own.
    const [x, y, w, h] = svg
      .match(/viewBox="([^"]+)"/)[1]
      .split(" ")
      .map(Number);
    const [width, height] = [Math.ceil(w), Math.ceil(h)];
    const out = svg
      .replace(/ style="max-width:[^"]*"/, "")
      .replace(/ width="100%"/, ` width="${width}" height="${height}"`)
      .replace(
        /<svg([^>]*)>/,
        `<svg$1><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${background}"/>`,
      );
    const target = path.join(dir, file.replace(/\.mmd$/, `-${name}.svg`));
    await writeFile(target, out);
    console.log("wrote", path.relative(process.cwd(), target));
  }
}
await browser.close();
