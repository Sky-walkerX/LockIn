"use client";

import { useState } from "react";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Input } from "@/app/components/ui/input";
import { normalizeFocusPrefs, type FocusPrefs } from "@/lib/focus/cycle";
import { useFocus } from "./focus-provider";

const LENGTHS: { key: "focusMin" | "shortBreakMin" | "longBreakMin" | "longEvery"; label: string; unit: string }[] = [
  { key: "focusMin", label: "Focus", unit: "min" },
  { key: "shortBreakMin", label: "Short break", unit: "min" },
  { key: "longBreakMin", label: "Long break", unit: "min" },
  { key: "longEvery", label: "Long break every", unit: "sessions" },
];

/** Timer lengths and alerts. Used on the settings page and behind the timer's gear. */
export function FocusSettings() {
  const { prefs, setPrefs } = useFocus();
  const [notice, setNotice] = useState<string | null>(null);
  const update = (patch: Partial<FocusPrefs>) => setPrefs(normalizeFocusPrefs({ ...prefs, ...patch }));

  const toggleNotify = async (on: boolean) => {
    setNotice(null);
    if (!on) return update({ notify: false });
    if (typeof Notification === "undefined") return setNotice("This browser doesn't support notifications.");
    const permission = Notification.permission === "default" ? await Notification.requestPermission() : Notification.permission;
    if (permission === "granted") update({ notify: true });
    else setNotice("Notifications are blocked for this site in your browser settings.");
  };

  const toggles: { key: "autoStartNext" | "sound"; label: string; hint: string }[] = [
    { key: "autoStartNext", label: "Start the next phase automatically", hint: "breaks and focus run back to back" },
    { key: "sound", label: "Chime when a phase ends", hint: "" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {LENGTHS.map(({ key, label, unit }) => (
          <label key={key} className="lk-mono flex flex-col gap-1 text-[10px] uppercase tracking-wide text-muted-foreground">
            {label}
            <div className="flex items-center gap-1.5">
              <NumberField value={prefs[key]} onCommit={(n) => update({ [key]: n })} />
              <span className="normal-case tracking-normal">{unit}</span>
            </div>
          </label>
        ))}
      </div>

      <div className="flex flex-col gap-2.5">
        {toggles.map(({ key, label, hint }) => (
          <label key={key} className="flex items-center gap-2.5 text-sm">
            <Checkbox checked={prefs[key]} onCheckedChange={(v) => update({ [key]: v === true })} className="lk-check" />
            {label}
            {hint && <span className="lk-mono text-[10.5px] text-muted-foreground">{hint}</span>}
          </label>
        ))}
        <label className="flex items-center gap-2.5 text-sm">
          <Checkbox checked={prefs.notify} onCheckedChange={(v) => toggleNotify(v === true)} className="lk-check" />
          Notify me when a phase ends
          <span className="lk-mono text-[10.5px] text-muted-foreground">even in another tab</span>
        </label>
        {notice && <p className="lk-mono text-[11px] text-destructive">{notice}</p>}
      </div>
    </div>
  );
}

// Edits a draft and commits on blur or Enter, so clearing the field to type a
// new number doesn't snap back to the old one mid-edit.
function NumberField({ value, onCommit }: { value: number; onCommit: (n: number) => void }) {
  const [draft, setDraft] = useState<string | null>(null);
  const commit = () => {
    if (draft !== null && draft.trim() !== "" && Number.isFinite(Number(draft))) onCommit(Number(draft));
    setDraft(null);
  };
  return (
    <Input
      type="number"
      min={1}
      value={draft ?? String(value)}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === "Enter" && commit()}
      className="h-8 w-20"
    />
  );
}
