"use client";

import { Link2, MessageSquare, FileText, BookOpen, Trash2, ExternalLink, Sparkles, Loader2, AlertCircle } from "lucide-react";
import { useDeleteResource, useIngestResource, type ResourceRow } from "@/hooks/useResources";
import type { ResourceType } from "@/app/generated/prisma";

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

  return (
    <div className="group flex items-start gap-3 rounded-md px-2 py-2 transition-colors hover:bg-muted/60">
      <Icon size={16} className="mt-0.5 flex-none text-muted-foreground" />

      <div className="min-w-0 flex-1">
        <a
          href={resource.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-sm font-medium hover:underline"
        >
          <span className="truncate">{resource.title}</span>
          <ExternalLink size={11} className="flex-none text-muted-foreground" />
        </a>
        <div className="lk-mono mt-0.5 flex items-center gap-2 text-[10px] text-muted-foreground">
          <span className="lk-tag">{LABEL[resource.type]}</span>
          <span className="truncate">{host(resource.url)}</span>
          {resource.ingestState === "READY" && (
            <span className="flex items-center gap-1" title={resource.pageCount ? `${resource.pageCount} pages, indexed for Ask` : "Indexed for Ask"}>
              <Sparkles size={10} /> indexed
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
          title={resource.ingestState === "FAILED" ? "Retry text extraction" : "Extract text for Ask to search"}
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
