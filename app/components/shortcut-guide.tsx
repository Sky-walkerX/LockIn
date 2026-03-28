"use client"

import { X, Keyboard } from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { SHORTCUTS } from "@/hooks/use-keyboard-shortcuts"

interface ShortcutGuideProps {
  isOpen: boolean
  onClose: () => void
}

export default function ShortcutGuide({ isOpen, onClose }: ShortcutGuideProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[110] bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-[var(--primarybg)] dark:bg-[var(--primarybgdark)] border border-[var(--secondarybg)] rounded-xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-[var(--secondarybg)]">
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-[var(--accent1bg)]" />
            <h2 className="text-lg font-semibold text-[var(--accent2bg)] dark:text-[var(--accent2bgdark)]">
              Keyboard Shortcuts
            </h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-[var(--mutedbg)] hover:text-[var(--accent2bg)]"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-5 space-y-3">
          {SHORTCUTS.map((shortcut) => (
            <div
              key={shortcut.key}
              className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-[var(--secondarybg)] dark:hover:bg-[var(--secondarybgdark)] transition-colors"
            >
              <span className="text-sm text-[var(--accent2bg)] dark:text-[var(--accent2bgdark)]">
                {shortcut.description}
              </span>
              <kbd className="px-2.5 py-1 rounded-md bg-[var(--secondarybg)] dark:bg-[var(--secondarybgdark)] text-xs font-mono font-semibold text-[var(--accent1bg)] border border-[var(--mutedbg)]/20 min-w-[32px] text-center">
                {shortcut.key.toUpperCase()}
              </kbd>
            </div>
          ))}
        </div>

        <div className="p-5 border-t border-[var(--secondarybg)]">
          <p className="text-xs text-[var(--mutedbg)] dark:text-[var(--mutedbgdark)] text-center">
            Shortcuts are disabled when typing in input fields
          </p>
        </div>
      </div>
    </div>
  )
}
