"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { ThemeToggle } from "./ThemeToggle";
import { NotificationCenter } from "./NotificationCenter";

const navLinks = [
  { href: "/", label: "Dashboard", icon: "📊" },
  { href: "/log", label: "Log Activity", icon: "✏️" },
  { href: "/history", label: "History", icon: "📋" },
] as const;

export function NavBar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? "glass shadow-md" : "bg-[var(--bg-page)]/80 backdrop-blur-sm"
      }`}
    >
      <nav className="max-w-6xl mx-auto w-full px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* ---- Left: Brand + Status Chip ---- */}
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/"
            className="flex items-center gap-2 text-xl font-black text-[var(--forest-dark)] select-none tracking-tight hover:opacity-80 transition-opacity"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--lime)] text-white text-base shadow-sm">
              🌿
            </span>
            <span className="hidden sm:inline">PlanetPulse</span>
          </Link>

          {/* Eco-status chip */}
          <span className="hidden md:inline-flex items-center gap-1.5 rounded-full bg-[var(--insight-bg)] border border-[var(--insight-border)] px-3 py-1 text-[11px] font-semibold text-[var(--insight-text)] select-none">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
            </span>
            Tracking Live
          </span>
        </div>

        {/* ---- Center: Nav Links (Desktop) ---- */}
        <ul className="hidden md:flex items-center gap-1 rounded-full bg-[var(--bg-cream)] p-1 shadow-inner">
          {navLinks.map((link) => {
            const isActive =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`relative flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-semibold transition-all duration-200 ${
                    isActive
                      ? "bg-[var(--surface)] text-[var(--forest-dark)] shadow-sm"
                      : "text-[var(--text-muted)] hover:text-[var(--forest-dark)]"
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* ---- Right: Utility Tray ---- */}
        <div className="flex items-center gap-2 shrink-0">
          <ThemeToggle />
          <NotificationCenter />

          {/* Quick Log CTA */}
          <Link
            href="/log"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-bold text-white shadow-sm transition-all duration-200 hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: "var(--gradient-primary)" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Quick Log
          </Link>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="md:hidden flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--surface)] border border-[var(--border-soft)] text-[var(--text-muted)] hover:text-[var(--forest)] transition-colors"
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="4" y1="7" x2="20" y2="7" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="17" x2="20" y2="17" />
              </svg>
            )}
          </button>
        </div>
      </nav>

      {/* ---- Mobile Drawer ---- */}
      {mobileOpen && (
        <div className="md:hidden animate-slide-down border-t border-[var(--border-soft)] bg-[var(--surface)]">
          <ul className="flex flex-col p-3 gap-1">
            {navLinks.map((link) => {
              const isActive =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3 text-[14px] font-semibold transition-all ${
                      isActive
                        ? "bg-[var(--insight-bg)] text-[var(--forest-dark)]"
                        : "text-[var(--text-muted)] hover:bg-[var(--bg-cream)] hover:text-[var(--forest-dark)]"
                    }`}
                  >
                    <span className="text-lg">{link.icon}</span>
                    {link.label}
                  </Link>
                </li>
              );
            })}
            <li className="mt-1">
              <Link
                href="/log"
                className="flex items-center justify-center gap-2 rounded-xl py-3 text-[14px] font-bold text-white"
                style={{ background: "var(--gradient-primary)" }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Quick Log
              </Link>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
