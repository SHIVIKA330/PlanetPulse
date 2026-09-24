"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="w-[52px] h-[28px] rounded-full bg-[var(--border-soft)]" aria-hidden="true" />;
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="theme-track relative inline-flex h-[28px] w-[52px] items-center rounded-full px-[3px] shadow-inner focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lime)]"
      style={{ backgroundColor: isDark ? "var(--surface-elevated)" : "var(--bg-cream)" }}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      role="switch"
      aria-checked={isDark}
    >
      {/* Track icons */}
      <span className="absolute left-[7px] text-[11px] select-none pointer-events-none" aria-hidden="true">☀️</span>
      <span className="absolute right-[7px] text-[11px] select-none pointer-events-none" aria-hidden="true">🌙</span>

      {/* Knob */}
      <span
        className="theme-knob relative z-10 flex h-[22px] w-[22px] items-center justify-center rounded-full bg-white shadow-md"
        style={{ transform: isDark ? "translateX(24px)" : "translateX(0)" }}
      >
        <span className="text-[12px] select-none" aria-hidden="true">
          {isDark ? "🌙" : "☀️"}
        </span>
      </span>
    </button>
  );
}
