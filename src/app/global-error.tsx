"use client";

// Last-resort boundary for errors thrown in the root layout itself. It
// replaces the whole document, so it renders its own <html> and <body>.
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          fontFamily: "system-ui, sans-serif",
          background: "#0a0a0a",
          color: "#ededed",
        }}
      >
        <main style={{ textAlign: "center", padding: 24 }}>
          <h1 style={{ fontSize: 28, margin: "0 0 8px" }}>
            Vercel Daily is temporarily unavailable
          </h1>
          <p style={{ color: "#a1a1a1", margin: "0 0 20px" }}>
            Something went wrong on our side. Please try again.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              padding: "10px 20px",
              borderRadius: 999,
              border: 0,
              background: "#ededed",
              color: "#0a0a0a",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
