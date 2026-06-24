"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

// Renders milestone notes. Links open in a new tab; GFM enables tables,
// task lists, strikethrough. `rehype-highlight` adds `hljs-*` classes to
// fenced code blocks (```cpp, ```py, …) — colors are themed per-mode in
// `.lk-prose` / `.hljs` (globals.css). Styling lives in globals.css.
export function Markdown({ children }: { children: string }) {
  return (
    <div className="lk-prose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeHighlight, { detect: true }]]}
        components={{
          a: ({ ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" />,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
