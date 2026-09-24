import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <header className="sticky top-0 z-50 bg-[var(--bg-cream)]">
            <nav className="max-w-6xl mx-auto w-full px-6 h-20 flex items-center justify-between">
              {/* Logo */}
              <Link
                href="/"
                className="flex items-center gap-2 text-2xl font-black text-[var(--forest-dark)] select-none tracking-tight"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--lime)] text-white text-xl shadow-sm" aria-hidden="true">
                  🍃
                </span>
                PlanetPulse
              </Link>

              {/* Nav links */}
              <ul className="flex items-center gap-6">
                {navLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-[15px] font-bold text-[var(--forest)] transition-colors hover:text-[var(--lime)]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
                <li className="flex items-center gap-3 ml-2">
                  <ThemeToggle />
                  <Link href="/log" className="rounded-full bg-[var(--lime)] px-6 py-2.5 text-[15px] font-bold text-white transition-colors hover:bg-[var(--lime-hover)] shadow-sm">
                    Log Now
                  </Link>
                </li>
              </ul>
            </nav>
          </header>

          <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-10">
            {children}
          </main>
          
          <footer className="bg-[var(--forest)] py-12 mt-auto">
            <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 text-[var(--text-main)]">
              <div>
                <div className="flex items-center gap-2 text-2xl font-black select-none tracking-tight mb-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--lime)] text-white text-xl">
                    🍃
                  </span>
                  PlanetPulse
                </div>
                <p className="text-sm opacity-80 leading-relaxed max-w-xs">
                  Track your daily carbon footprint, set weekly targets, and make sustainable choices visible.
                </p>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-4 text-[var(--lime)]">Quick Links</h3>
                <ul className="space-y-2 opacity-90 text-sm">
                  <li><Link href="/">Dashboard</Link></li>
                  <li><Link href="/history">History</Link></li>
                  <li><Link href="/log">Log Activity</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-4 text-[var(--lime)]">Impact</h3>
                <p className="text-sm opacity-80 leading-relaxed max-w-xs">
                  Every sustainable choice makes a difference. Start tracking today for a greener tomorrow.
                </p>
              </div>
            </div>
            <div className="max-w-6xl mx-auto px-6 mt-12 pt-8 border-t border-white/10 text-center text-xs opacity-60">
              &copy; {new Date().getFullYear()} PlanetPulse. All Rights Reserved.
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
