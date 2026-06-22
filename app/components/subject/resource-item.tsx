"use client";

import { Link2, MessageSquare, FileText, BookOpen, Trash2, ExternalLink } from "lucide-react";
import { useDeleteResource } from "@/hooks/useResources";
import type { Resource, ResourceType } from "@/app/generated/prisma";

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

export function ResourceItem({ resource }: { resource: Resource }) {
  const del = useDeleteResource();
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
        </div>
        {resource.note && <p className="mt-1 text-xs text-muted-foreground">{resource.note}</p>}
      </div>

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
