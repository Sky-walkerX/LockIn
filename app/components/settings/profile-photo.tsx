"use client";

import type React from "react";
import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Camera, Trash2 } from "lucide-react";
import { Avatar } from "@/app/components/account/avatar";
import { useAccount, type Account } from "@/hooks/useAccount";
import { queryKeys } from "@/lib/query-keys";

const SIDE = 256;

/**
 * The middle square of a picture, at 256px: what's stored as the photo. Done
 * here so a 12MB phone photo arrives as a few kilobytes. WebP where the
 * browser can write it, PNG where it can't (Safari).
 */
async function squared(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = SIDE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("This browser can't prepare the photo");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, SIDE, SIDE);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("This browser can't prepare the photo"))), "image/webp", 0.88),
  );
}

async function send(method: "PUT" | "DELETE", body?: FormData): Promise<{ image: string | null }> {
  const res = await fetch("/api/account/photo", { method, body, credentials: "include" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "That didn't work. Try again.");
  return data;
}

// Settings' account card: the avatar, large, beside whatever names the account
// (`children`), with buttons to choose a photo or take it away.
export function ProfilePhoto({ name, children }: { name: string; children: React.ReactNode }) {
  const { data: account } = useAccount();
  const queryClient = useQueryClient();
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const settle = ({ image }: { image: string | null }) => {
    setError(null);
    queryClient.setQueryData<Account>(queryKeys.account, (a) => (a ? { ...a, image } : a));
  };
  const upload = useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      const photo = await squared(file);
      form.append("file", new File([photo], `photo.${photo.type === "image/webp" ? "webp" : "png"}`, { type: photo.type }));
      return send("PUT", form);
    },
    onSuccess: settle,
    onError: (e: Error) => setError(e.message),
  });
  const remove = useMutation({ mutationFn: () => send("DELETE"), onSuccess: settle, onError: (e: Error) => setError(e.message) });
  const busy = upload.isPending || remove.isPending;

  return (
    <div className="flex min-w-0 items-center gap-4">
      <button
        type="button"
        onClick={() => input.current?.click()}
        disabled={busy}
        className="group relative shrink-0 rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-60"
        aria-label={account?.image ? "Change your photo" : "Add a photo"}
      >
        <Avatar name={name} image={account?.image} size={56} />
        <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/45 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
          <Camera size={18} />
        </span>
      </button>
      <div className="flex min-w-0 flex-col items-start gap-1">
        {children}
        <div className="mt-1 flex items-center gap-3">
          <button
            type="button"
            onClick={() => input.current?.click()}
            disabled={busy}
            className="lk-print text-2xs uppercase tracking-wide text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline disabled:opacity-50"
          >
            {upload.isPending ? "Uploading…" : account?.image ? "Change photo" : "Add a photo"}
          </button>
          {account?.image && (
            <button
              type="button"
              onClick={() => remove.mutate()}
              disabled={busy}
              className="lk-print flex items-center gap-1 text-2xs uppercase tracking-wide text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline disabled:opacity-50"
            >
              <Trash2 size={12} /> Remove
            </button>
          )}
        </div>
        {error && <p className="lk-print text-2xs text-destructive">{error}</p>}
      </div>
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) upload.mutate(file);
        }}
      />
    </div>
  );
}
