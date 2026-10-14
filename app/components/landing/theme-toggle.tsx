"use client";

import { clickPoint, useThemeSwitch } from "@/app/components/theme/use-theme-switch";
import { SunMoon } from "lucide-react";
import s from "./landing.module.css";

// Light or dark paper. The app keeps the choice in its account menu; visitors
// get this one button.
export function ThemeToggle() {
  const { resolvedTheme, switchTheme } = useThemeSwitch();
  return (
    <button
      type="button"
      className={s.toggle}
      aria-label="Switch between light and dark paper"
      onClick={(e) => switchTheme(resolvedTheme === "dark" ? "light" : "dark", clickPoint(e))}
    >
      <SunMoon className={s.icon} aria-hidden />
    </button>
  );
}
