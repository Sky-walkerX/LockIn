"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { Check, Copy } from "lucide-react";
import { codeText } from "@/lib/notes/code-text";

// Renders milestone/task/subtask notes. Links open in a new tab; GFM enables
// tables, task lists, strikethrough. `rehype-highlight` adds `hljs-*` classes
// to fenced code blocks (```cpp, ```py, …) — colors are themed per-mode in
// `.lk-prose` / `.hljs` (globals.css). Styling lives in globals.css.
// Images (`![alt](url)`) lazy-load and click opens the full-size original —
// unless the image is itself wrapped in a markdown link, which wins.
// Code blocks get a copy button; the text comes from the rendered tree, so it
// is exactly what the block shows.
export function Markdown({ children }: { children: string }) {
  return (
    <div className="lk-prose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeHighlight, { detect: true }]]}
        components={{
          a: ({ ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" />,
          // The button sits beside the <pre>, not in it, so it stays in the
          // corner while a long line scrolls sideways.
          pre: ({ node, children, ...props }) => (
            <div className="lk-code">
              <pre {...props}>{children}</pre>
              <CopyButton text={codeText(node)} />
            </div>
          ),
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

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard access can be denied (insecure origin, permission). The code
      // is still selectable by hand.
    }
  };

  const label = copied ? "Copied" : "Copy code";
  return (
    <button
      type="button"
      onClick={copy}
      className="lk-iconbtn lk-copy"
      title={label}
      aria-label={label}
      data-copied={copied || undefined}
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
    </button>
  );
}
