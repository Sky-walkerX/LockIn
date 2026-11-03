"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useQueryRouter } from "@/hooks/useQueryRouter";
import { useChatPanel } from "@/app/components/chat/chat-provider";

// The panel brings the markdown renderer, KaTeX and highlight.js; it loads in
// the browser, as the floating one does.
const ChatPanel = dynamic(() => import("@/app/components/chat/chat-panel").then((m) => m.ChatPanel), { ssr: false });

// The open conversation lives in the URL (?c=<id>), so the floating panel can
// hand one over, and a reload or a link lands back in it.
export function AskView() {
  // useSearchParams on a static route needs a boundary to render around.
  return (
    <Suspense>
      <Ask />
    </Suspense>
  );
}

function Ask() {
  const searchParams = useSearchParams();
  const router = useQueryRouter();
  const { seed } = useChatPanel();
  const conversationId = searchParams.get("c");
  return (
    <ChatPanel
      variant="page"
      isOpen
      seed={seed}
      conversationId={conversationId}
      onConversationChange={(id) => router.replace(id ? `/ask?c=${id}` : "/ask")}
    />
  );
}
