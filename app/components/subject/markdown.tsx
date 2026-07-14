"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

// Renders milestone/task/subtask notes. Links open in a new tab; GFM enables
// tables, task lists, strikethrough. `rehype-highlight` adds `hljs-*` classes
// to fenced code blocks (```cpp, ```py, …) — colors are themed per-mode in
// `.lk-prose` / `.hljs` (globals.css). Styling lives in globals.css.
// Images (`![alt](url)`) lazy-load and click opens the full-size original —
// unless the image is itself wrapped in a markdown link, which wins.
export function Markdown({ children }: { children: string }) {
  return (
    <div className="lk-prose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeHighlight, { detect: true }]]}
        components={{
          a: ({ ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" />,
          img: ({ src, alt, ...props }) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              {...props}
              src={typeof src === "string" ? src : undefined}
              alt={alt ?? ""}
              loading="lazy"
              decoding="async"
              onClick={(e) => {
                if (e.currentTarget.closest("a") || typeof src !== "string") return;
                window.open(src, "_blank", "noopener,noreferrer");
              }}
            />
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
