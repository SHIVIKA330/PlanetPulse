"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  // Prevent hydration mismatch
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="w-10 h-10" aria-hidden="true" />;

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--bg-cream)] text-xl transition-colors hover:bg-[var(--border-soft)] shadow-sm"
      aria-label="Toggle Dark Mode"
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
}
