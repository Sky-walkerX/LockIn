"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Search as SearchIcon, X } from "lucide-react";
import { isChromeless } from "@/lib/chrome";
import { useSearch } from "@/hooks/useSearch";
import { parseTerms } from "@/lib/search/query";
import { splitMatches } from "@/lib/search/text";
import { useSemanticSearch } from "@/hooks/useSemanticSearch";

const FALLBACK = "#8b8f9e";

// ── Context ────────────────────────────────────────────────────────────────
const SearchContext = createContext<{ open: () => void }>({ open: () => {} });
export const useSearchPalette = () => useContext(SearchContext);

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { status } = useSession();
  // Signed out there is nothing to search, and on chromeless pages (a shared
  // plan, say) ⌘P should still print.
  const hidden = isChromeless(pathname) || status !== "authenticated";
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => {
    if (!hidden) setIsOpen(true);
  }, [hidden]);

  // Global ⌘P / Ctrl+P toggle.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (hidden || !(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== "p") return;
      e.preventDefault();
      setIsOpen((v) => !v);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hidden]);

  return (
    <SearchContext.Provider value={{ open }}>
      {children}
      {isOpen && !hidden && <SearchPanel onClose={() => setIsOpen(false)} />}
    </SearchContext.Provider>
  );
}

// ── Panel ──────────────────────────────────────────────────────────────────
// One list for the arrow keys: keyword matches first, then what's related by
// meaning that the keywords didn't already find.
type Row = { kind: string; id: string; title: string; snippet: string | null; isCompleted: boolean; color: string | null; path: string[]; href: string };

function SearchPanel({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Query after a pause in typing, not on every keystroke.
  useEffect(() => {
    const t = window.setTimeout(() => setQ(input), 150);
    return () => window.clearTimeout(t);
  }, [input]);

  const { data, isFetching, isError } = useSearch(q);
  const semantic = useSemanticSearch(input);
  const tooShort = q.trim().length < 2;
  const hits: Row[] = tooShort ? [] : (data ?? []);
  const seen = new Set(hits.map((h) => h.id));
  const related: Row[] =
    semantic.active && semantic.state.status === "ready"
      ? (semantic.results.data ?? []).filter((h) => !seen.has(h.id)).map((h) => ({ ...h, isCompleted: false }))
      : [];
  const rows = [...hits, ...related];
  const terms = parseTerms(q);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // A new result set starts from the top.
  useEffect(() => {
    setActive(0);
  }, [data]);

  // Keep the highlighted row in view while arrowing through a long list.
  useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const go = (row: Row) => {
    onClose();
    router.push(row.href);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, rows.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && rows[active]) {
      e.preventDefault();
      go(rows[active]);
    }
  };

  const message = (text: string) => (
    <p className="lk-mono px-3 py-6 text-center text-[12px] text-muted-foreground">{text}</p>
  );

  const renderRow = (row: Row, i: number, highlightTerms: string[]) => (
    <button
      key={`${row.kind}-${row.id}`}
      id={`lk-hit-${i}`}
      data-index={i}
      type="button"
      role="option"
      aria-selected={i === active}
      onMouseMove={() => setActive(i)}
      onClick={() => go(row)}
      className={`lk-subject flex w-full items-start gap-3 rounded-md px-2.5 py-2 text-left ${i === active ? "bg-muted" : ""}`}
      style={{ "--c": row.color ?? FALLBACK } as React.CSSProperties}
    >
      <span className="lk-swatch mt-1.5 flex-none" />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className={`truncate text-sm ${row.isCompleted ? "text-muted-foreground" : ""}`}>
            <Highlight text={row.title} terms={highlightTerms} />
          </span>
          <span className="lk-tag flex-none">{row.kind}</span>
        </span>
        {row.path.length > 0 && (
          <span className="lk-mono block truncate text-[10.5px] uppercase tracking-wide text-muted-foreground">
            {row.path.join(" › ")}
          </span>
        )}
        {row.snippet && (
          <span className="lk-mono mt-1 line-clamp-2 block text-[11.5px] text-muted-foreground">
            <Highlight text={row.snippet} terms={highlightTerms} />
          </span>
        )}
      </span>
    </button>
  );

  const searching = isFetching || semantic.results.isFetching;
  const st = semantic.state;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center bg-black/40 px-4 backdrop-blur-sm"
      onMouseDown={onClose}
    >
      <div
        role="dialog"
        aria-label="Search"
        className="lk-card mt-[12vh] w-full max-w-xl overflow-hidden p-0"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
          <SearchIcon size={14} className="flex-none text-muted-foreground" />
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search titles, notes, code and resources…"
            role="combobox"
            aria-expanded={rows.length > 0}
            aria-controls="lk-search-results"
            aria-activedescendant={rows[active] ? `lk-hit-${active}` : undefined}
            className="lk-mono min-w-0 flex-1 bg-transparent py-1 text-[13px] outline-none placeholder:text-muted-foreground"
          />
          <span className="lk-mono hidden text-[10px] uppercase tracking-wide text-muted-foreground sm:inline">
            ⌘P
          </span>
          <button type="button" onClick={onClose} className="lk-iconbtn" title="Close (Esc)">
            <X size={14} />
          </button>
        </div>

        <div ref={listRef} id="lk-search-results" role="listbox" className="max-h-[60vh] overflow-y-auto p-1.5">
          {tooShort
            ? message("Type at least two characters.")
            : isError
              ? message("Search failed. Try again.")
              : rows.length === 0 && !(semantic.active && st.status !== "ready")
                ? message(searching ? "Searching…" : `Nothing matches "${q.trim()}".`)
                : hits.map((row, i) => renderRow(row, i, terms))}

          {!tooShort && semantic.active && (
            <>
              {(related.length > 0 || st.status !== "ready") && (
                <div className="lk-sec mt-2 px-2.5 pb-1">related by meaning</div>
              )}
              {related.map((row, i) => renderRow(row, hits.length + i, []))}
              {st.status === "needs-load" && (
                <button
                  type="button"
                  onClick={semantic.load}
                  className="lk-mono w-full rounded-md px-2.5 py-2 text-left text-[11.5px] text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  Search by meaning too — loads the embedding model (about 130 MB, once)
                </button>
              )}
              {st.status === "loading" && (
                <p className="lk-mono px-2.5 py-2 text-[11.5px] text-muted-foreground">
                  Loading the model… {Math.round(st.progress * 100)}%
                </p>
              )}
              {st.status === "ready" && semantic.unindexed > 0 && (
                <p className="lk-mono px-2.5 py-1.5 text-[10.5px] text-muted-foreground">
                  {semantic.unindexed} item{semantic.unindexed === 1 ? " isn't" : "s aren't"} indexed yet — they&apos;re
                  indexed while Ask (⌘J) is open.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Matched text is underlined in the subject's color rather than painted with
// <mark>'s default yellow, which clashes with both themes.
function Highlight({ text, terms }: { text: string; terms: string[] }) {
  return (
    <>
      {splitMatches(text, terms).map((s, i) =>
        s.match ? (
          <mark
            key={i}
            className="bg-transparent font-bold text-foreground underline decoration-(--c) decoration-2 underline-offset-2"
          >
            {s.text}
          </mark>
        ) : (
          <span key={i}>{s.text}</span>
        ),
      )}
    </>
  );
}
