import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PlanetPulse — Carbon Footprint Tracker",
  description:
    "Track your daily carbon footprint, set weekly targets, and make sustainable choices visible.",
};

const navLinks = [
  { href: "/", label: "Dashboard" },
  { href: "/log", label: "Log Activity" },
  { href: "/history", label: "History" },
] as const;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="sticky top-0 z-50 border-b bg-white/90 backdrop-blur-sm border-[var(--border)]">
          <nav className="max-w-5xl mx-auto w-full px-4 h-14 flex items-center justify-between">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-1.5 text-lg font-bold text-[var(--accent-dark)] select-none"
            >
              <span className="text-xl" aria-hidden="true">
                🌿
              </span>
              PlanetPulse
            </Link>

            {/* Nav links */}
            <ul className="flex items-center gap-1 sm:gap-2">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="rounded-lg px-3 py-1.5 text-sm font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--accent-dark)] hover:bg-[var(--accent-light)]/50"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </header>

        <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
