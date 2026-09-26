"use client";

import { useState } from "react";
import { Share2, Copy, Check, Globe } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover";
import {
  shareUrl,
  useCreateShare,
  useRevokeShare,
  useShare,
  type ShareTarget,
} from "@/hooks/useShare";

const LABEL: Record<ShareTarget["type"], string> = {
  SUBJECT: "subject",
  MILESTONE: "milestone",
  TASK: "task",
  SUBTASK: "item",
};

/**
 * Share affordance for any of the four shareable records.
 *
 * The share is only looked up once the popover opens — a subject page can show
 * a hundred of these, and eagerly asking the server about each one would cost a
 * hundred requests to render a row of icons nobody clicked.
 */
export function ShareButton({
  target,
  size = 13,
  className = "lk-iconbtn",
}: {
  target: ShareTarget;
  size?: number;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data: share, isLoading } = useShare(target, open);
  const create = useCreateShare();
  const revoke = useRevokeShare();

  const url = share ? shareUrl(share.token) : "";
  const busy = create.isPending || revoke.isPending;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard access can be denied (insecure origin, permission). The input
      // below is selectable, so the link is still obtainable by hand.
      setCopied(false);
    }
  };

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setCopied(false);
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          className={className}
          title={`Share ${LABEL[target.type]}`}
          aria-label={`Share ${LABEL[target.type]}`}
        >
          <Share2 size={size} />
        </button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80">
        <div className="flex flex-col gap-3">
          <div className="lk-sec">Share {LABEL[target.type]}</div>

          {isLoading ? (
            <p className="lk-mono text-[11px] text-muted-foreground">loading…</p>
          ) : share ? (
            <>
              <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                <Globe size={13} className="mt-0.5 flex-none" />
                <span>Anyone with this link can view it — no sign-in needed. They can&apos;t edit anything.</span>
              </p>

              <div className="flex gap-1.5">
                <input
                  readOnly
                  value={url}
                  onFocus={(e) => e.currentTarget.select()}
                  className="lk-mono min-w-0 flex-1 rounded-md border border-border bg-muted/40 px-2 py-1.5 text-[11px]"
                  aria-label="Share link"
                />
                <button
                  type="button"
                  onClick={copy}
                  className="lk-iconbtn flex-none"
                  title="Copy link"
                  aria-label="Copy link"
                >
                  {copied ? <Check size={14} className="text-ok" /> : <Copy size={14} />}
                </button>
              </div>

              <button
                type="button"
                onClick={() => revoke.mutate(target)}
                disabled={busy}
                className="lk-btn px-3 py-2 text-[10.5px] disabled:opacity-50"
              >
                {revoke.isPending ? "Revoking…" : "Stop sharing"}
              </button>
            </>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">
                Create a public link to this {LABEL[target.type]} and everything inside it. Viewers
                don&apos;t need an account, and can only read.
              </p>
              <button
                type="button"
                onClick={() => create.mutate(target)}
                disabled={busy}
                className="lk-btn px-3 py-2 text-[10.5px] disabled:opacity-50"
              >
                {create.isPending ? "Creating…" : "Create view link"}
              </button>
              {create.isError && (
                <p className="text-xs text-destructive">{(create.error as Error).message}</p>
              )}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
