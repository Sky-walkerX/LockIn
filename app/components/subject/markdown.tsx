"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeHighlight from "rehype-highlight";
import "katex/dist/katex.min.css";
import { Check, Copy } from "lucide-react";
import { codeText } from "@/lib/notes/code-text";
import { guardDollars } from "@/lib/notes/math";
import { CITE_PREFIX } from "@/lib/chat/citations";

// Renders milestone/task/subtask notes. Links open in a new tab; GFM enables
// tables, task lists, strikethrough. `rehype-highlight` adds `hljs-*` classes
// to fenced code blocks (```cpp, ```py, …) — colors are themed per-mode in
// `.lk-prose` / `.hljs` (globals.css). Styling lives in globals.css.
// Images (`![alt](url)`) lazy-load and click opens the full-size original —
// unless the image is itself wrapped in a markdown link, which wins.
// Code blocks get a copy button; the text comes from the rendered tree, so it
// is exactly what the block shows.
// `highlight={false}` skips syntax highlighting: language detection runs on
// every fenced block and gets slow over a whole extracted book.
// `cite` draws Ask's page citations: links to `#cite-<page>`, which
// `linkCitations` writes, become whatever it returns.
export function Markdown({
  children,
  highlight = true,
  cite,
}: {
  children: string;
  highlight?: boolean;
  cite?: (page: number) => React.ReactNode;
}) {
  return (
    <div className="lk-prose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        // KaTeX before highlighting, so a formula is typeset rather than
        // mistaken for a code block to colour. `throwOnError: false` shows a
        // malformed formula as red source instead of breaking the note.
        rehypePlugins={
          highlight
            ? [[rehypeKatex, { throwOnError: false }], [rehypeHighlight, { detect: true }]]
            : [[rehypeKatex, { throwOnError: false }]]
        }
        components={{
          a: ({ node, ...props }) => {
            void node;
            if (cite && props.href?.startsWith(CITE_PREFIX)) return cite(Number(props.href.slice(CITE_PREFIX.length)));
            return <a {...props} target="_blank" rel="noopener noreferrer" />;
          },
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
        {guardDollars(children)}
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
