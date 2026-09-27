import { cn } from "@/lib/utils";

// A placeholder block in the shape of content that hasn't loaded yet.
export function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return <div aria-hidden className={cn("animate-pulse rounded-sm bg-muted", className)} {...props} />;
}
