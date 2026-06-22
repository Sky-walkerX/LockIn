"use client";

import type { Resource } from "@/app/generated/prisma";
import { ResourceItem } from "./resource-item";
import { NewResource } from "./new-resource";

export function ResourceSection({
  subjectId,
  resources,
}: {
  subjectId: string;
  resources: Resource[];
}) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="lk-sec">resources · {resources.length}</div>
        <NewResource subjectId={subjectId} />
      </div>

      {resources.length === 0 ? (
        <div className="lk-card p-5 text-center">
          <p className="text-sm text-muted-foreground">
            No resources yet. Save links, AI chats, PDFs &amp; books here.
          </p>
        </div>
      ) : (
        <div className="lk-card flex flex-col gap-0.5 p-2">
          {resources.map((r) => (
            <ResourceItem key={r.id} resource={r} />
          ))}
        </div>
      )}
    </section>
  );
}
