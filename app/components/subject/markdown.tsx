"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Renders milestone notes. Links open in a new tab; GFM enables tables,
// task lists, strikethrough. Styling lives in `.lk-prose` (globals.css).
export function Markdown({ children }: { children: string }) {
  return (
    <div className="lk-prose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" />,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
