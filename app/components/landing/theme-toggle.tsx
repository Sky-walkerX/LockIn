"use client";

import { useTheme } from "next-themes";
import { SunMoon } from "lucide-react";
import s from "./landing.module.css";

// Light or dark paper. The app keeps the choice in its account menu; visitors
// get this one button.
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <button
      type="button"
      className={s.toggle}
      aria-label="Switch between light and dark paper"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <SunMoon className={s.icon} aria-hidden />
    </button>
  );
}
