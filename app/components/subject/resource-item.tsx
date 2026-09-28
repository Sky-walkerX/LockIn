"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Link2, MessageSquare, FileText, BookOpen, Trash2, ExternalLink, Sparkles, Loader2, AlertCircle } from "lucide-react";
import { useDeleteResource, useIngestResource, type ResourceRow } from "@/hooks/useResources";
import type { ResourceType } from "@/app/generated/prisma/browser";

// Only these types point at something worth extracting text from: AI_CHAT is
// a link to a conversation, not a document, so "extract text" would have
// nothing to extract.
const EXTRACTABLE: ResourceType[] = ["LINK", "PDF", "BOOK"];

const ICON: Record<ResourceType, typeof Link2> = {
  LINK: Link2,
  AI_CHAT: MessageSquare,
  PDF: FileText,
  BOOK: BookOpen,
};

const LABEL: Record<ResourceType, string> = {
  LINK: "link",
  AI_CHAT: "ai chat",
  PDF: "pdf",
  BOOK: "book",
};

function host(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function ResourceItem({ resource }: { resource: ResourceRow }) {
  const del = useDeleteResource();
  const ingest = useIngestResource();
  const Icon = ICON[resource.type];
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // Keep the tab (and anything else) in the URL, so closing the reader lands
  // back where it was opened from.
  const readHref = () => {
    const next = new URLSearchParams(searchParams);
    next.set("read", resource.id);
    next.delete("q");
    return `${pathname}?${next}`;
  };
  // Readable in the app once text is extracted; a PDF always is, in its original form.
  const readable = resource.ingestState === "READY" || resource.type === "PDF";

  return (
    <div className="group flex items-start gap-3 rounded-md px-2 py-2 transition-colors hover:bg-muted/60">
      <Icon size={16} className="mt-0.5 flex-none text-muted-foreground" />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          {readable ? (
            <button
              type="button"
              onClick={() => router.push(readHref(), { scroll: false })}
              className="truncate text-left text-sm font-medium hover:underline"
              title="Read in LockIn"
            >
              {resource.title}
            </button>
          ) : (
            <a href={resource.url} target="_blank" rel="noopener noreferrer" className="truncate text-sm font-medium hover:underline">
              {resource.title}
            </a>
          )}
          <a
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-none text-muted-foreground hover:text-foreground"
            title="Open original in a new tab"
          >
            <ExternalLink size={11} />
          </a>
        </div>
        <div className="lk-print mt-0.5 flex items-center gap-2 text-2xs text-muted-foreground">
          <span className="lk-tag">{LABEL[resource.type]}</span>
          <span className="truncate">{host(resource.url)}</span>
          {resource.ingestState === "READY" && (
            <span className="flex items-center gap-1" title={resource.pageCount ? `${resource.pageCount} pages of text extracted` : "Text extracted"}>
              <Sparkles size={10} /> text
            </span>
          )}
          {resource.ingestState === "FAILED" && (
            <span className="flex items-center gap-1 text-destructive" title={resource.ingestError ?? "Extraction failed"}>
              <AlertCircle size={10} /> failed
            </span>
          )}
        </div>
        {resource.note && <p className="mt-1 text-xs text-muted-foreground">{resource.note}</p>}
      </div>

      {EXTRACTABLE.includes(resource.type) && resource.ingestState !== "READY" && (
        <button
          type="button"
          onClick={() => ingest.mutate(resource.id)}
          disabled={ingest.isPending}
          className="lk-iconbtn opacity-0 transition-opacity group-hover:opacity-100 disabled:opacity-100"
          title={resource.ingestState === "FAILED" ? "Retry text extraction" : "Extract the text to read and search it"}
        >
          {ingest.isPending ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
        </button>
      )}

      <button
        type="button"
        onClick={() => del.mutate(resource.id)}
        disabled={del.isPending}
        className="lk-iconbtn opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
        title="Delete resource"
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}
