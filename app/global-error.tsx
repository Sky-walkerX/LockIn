"use client";

// Shown when the root layout itself throws. It replaces that layout, so it
// brings its own <html> and none of the app's styles or fonts: the colours
// are the notebook's paper and ink, written out, in the OS colour scheme.
export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>
        <title>Something went wrong</title>
        <style>{`
          .lk-ge { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px; text-align: center; font-family: system-ui, sans-serif; background: #ffffff; color: #1b2a2f; }
          .lk-ge h1 { margin: 0; font-size: 22px; }
          .lk-ge p { margin: 8px 0 0; max-width: 24rem; opacity: 0.75; }
          .lk-ge button { margin-top: 24px; padding: 8px 14px; border: 0; border-radius: 6px; background: #24453b; color: #f7f5ee; font: inherit; font-size: 13px; cursor: pointer; }
          .lk-ge small { margin-top: 24px; opacity: 0.6; }
          @media (prefers-color-scheme: dark) { .lk-ge { background: #111a1b; color: #e2ebe8; } }
        `}</style>
        <main className="lk-ge">
          <h1>The notebook couldn&apos;t be opened</h1>
          <p>Your notes are as you left them. Trying again usually clears it.</p>
          <button type="button" onClick={() => retry()}>
            Try again
          </button>
          {error.digest && <small>Reference {error.digest}</small>}
        </main>
      </body>
    </html>
  );
}
