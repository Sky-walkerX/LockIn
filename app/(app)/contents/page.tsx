import { NotebookHome } from "@/app/components/home/notebook-home";

// The notebook's contents. A signed-in visit to `/` is rewritten here (see
// next.config.ts), so the address stays `/`.
export default function ContentsPage() {
  return <NotebookHome />;
}
