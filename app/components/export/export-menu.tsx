"use client";

import { Download } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";

// The browser's zone rides along so Markdown dates read in local time.
export const exportUrl = (subjectId: string, format: "md" | "json") =>
  `/api/subjects/${subjectId}/export?format=${format}&tz=${encodeURIComponent(Intl.DateTimeFormat().resolvedOptions().timeZone)}`;

export function ExportMenu({ subjectId, size = 15 }: { subjectId: string; size?: number }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="lk-iconbtn" title="Export">
        <Download size={size} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="lk-mono text-[10px] uppercase tracking-wide text-muted-foreground">
          Download this subject
        </DropdownMenuLabel>
        <DropdownMenuItem asChild>
          <a href={exportUrl(subjectId, "md")} download>
            Markdown <span className="ml-auto text-[11px] text-muted-foreground">readable</span>
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href={exportUrl(subjectId, "json")} download>
            JSON <span className="ml-auto text-[11px] text-muted-foreground">complete</span>
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
