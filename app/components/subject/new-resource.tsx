"use client";

import { useRef, useState } from "react";
import { Plus, Upload } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { useCreateResource } from "@/hooks/useResources";
import { api } from "@/lib/fetcher";
import type { ResourceType } from "@/app/generated/prisma";

/**
 * Uploads a local PDF straight to Supabase Storage via a signed URL, then
 * returns the public URL to store on the resource. `/api/resources/upload-url`
 * never sees the file body — see that route's doc comment for why a signed
 * URL exists at all (Vercel's 4.5MB request-body cap, which a 30-page PDF
 * blows past immediately).
 */
async function uploadPdf(file: File): Promise<string> {
  const { uploadUrl, publicUrl } = await api.post<{ uploadUrl: string; publicUrl: string }>(
    "/api/resources/upload-url",
    { contentType: file.type, size: file.size },
  );
  const put = await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
  if (!put.ok) throw new Error(`Upload failed (${put.status})`);
  return publicUrl;
}

export function NewResource({ subjectId }: { subjectId: string }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<ResourceType>("LINK");
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const create = useCreateResource();

  const reset = () => {
    setType("LINK");
    setUrl("");
    setTitle("");
    setNote("");
    setUploadError(null);
  };

  const pickFile = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const publicUrl = await uploadPdf(file);
      setUrl(publicUrl);
      if (!title.trim()) setTitle(file.name.replace(/\.pdf$/i, ""));
    } catch {
      setUploadError("Upload failed. You can paste a link instead.");
    } finally {
      setUploading(false);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !title.trim()) return;
    create.mutate(
      { subjectId, type, url: url.trim(), title: title.trim(), note: note.trim() || undefined },
      {
        onSuccess: () => {
          reset();
          setOpen(false);
        },
      },
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className="lk-btn flex items-center gap-1.5 px-2.5 py-1.5 text-[10px]">
          <Plus size={13} /> Add resource
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <form onSubmit={submit} className="flex flex-col gap-3">
          <div className="lk-sec">New resource</div>
          <Select value={type} onValueChange={(v) => setType(v as ResourceType)}>
            <SelectTrigger size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="LINK">Link</SelectItem>
              <SelectItem value="AI_CHAT">AI chat</SelectItem>
              <SelectItem value="PDF">PDF</SelectItem>
              <SelectItem value="BOOK">Book</SelectItem>
            </SelectContent>
          </Select>
          <Input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://…"
          />
          {type === "PDF" && (
            <div className="flex items-center gap-2">
              <input
                ref={fileInput}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => void pickFile(e.target.files?.[0])}
              />
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                disabled={uploading}
                className="lk-btn flex items-center gap-1.5 px-2 py-1 text-[10px] disabled:opacity-50"
              >
                <Upload size={11} /> {uploading ? "Uploading…" : "or upload a PDF"}
              </button>
              {uploadError && <span className="text-[10px] text-destructive">{uploadError}</span>}
            </div>
          )}
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note (optional)"
            rows={2}
          />
          <button
            type="submit"
            disabled={create.isPending || uploading || !url.trim() || !title.trim()}
            className="lk-btn px-3 py-2 text-[10.5px] disabled:opacity-50"
          >
            {create.isPending ? "Saving…" : "Save resource"}
          </button>
        </form>
      </PopoverContent>
    </Popover>
  );
}
