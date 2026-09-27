"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

// A panel that slides in from the left edge. Used for the spine on phones,
// where there is no room to keep it docked.
export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;
export const SheetTitle = DialogPrimitive.Title;

export function SheetContent({
  className,
  children,
  label,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & { label: string }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/35 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
      <DialogPrimitive.Content
        aria-describedby={undefined}
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[min(86vw,300px)] flex-col shadow-xl outline-none",
          "data-[state=open]:animate-in data-[state=open]:slide-in-from-left data-[state=open]:duration-300",
          "data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left data-[state=closed]:duration-200",
          className,
        )}
        {...props}
      >
        <DialogPrimitive.Title className="sr-only">{label}</DialogPrimitive.Title>
        {children}
        <DialogPrimitive.Close
          // Outside the panel, on the scrim: inside, it would sit on the cover label.
          className="absolute -right-11 top-3 rounded-sm p-1.5 text-white opacity-80 transition-opacity hover:opacity-100"
          aria-label="Close"
        >
          <X size={16} />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
