"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
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
import type { ResourceType } from "@/app/generated/prisma";

export function NewResource({ subjectId }: { subjectId: string }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<ResourceType>("LINK");
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const create = useCreateResource();

  const reset = () => {
    setType("LINK");
    setUrl("");
    setTitle("");
    setNote("");
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
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note (optional)"
            rows={2}
          />
          <button
            type="submit"
            disabled={create.isPending || !url.trim() || !title.trim()}
            className="lk-btn px-3 py-2 text-[10.5px] disabled:opacity-50"
          >
            {create.isPending ? "Saving…" : "Save resource"}
          </button>
        </form>
      </PopoverContent>
    </Popover>
  );
}
