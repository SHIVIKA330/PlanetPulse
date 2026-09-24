import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { NavBar } from "@/components/NavBar";
import { AIBotAssistant } from "@/components/AIBotAssistant";

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <NavBar />

          <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8">
            {children}
          </main>

          <AIBotAssistant />

          <footer className="border-t border-[var(--border-soft)] mt-auto">
            <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <div className="flex items-center gap-2.5 text-xl font-black select-none tracking-tight mb-3 text-[var(--forest-dark)]">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--lime)] text-white text-base shadow-sm">
                    🌿
                  </span>
                  PlanetPulse
                </div>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed max-w-xs">
                  Track your daily carbon footprint, set weekly targets, and make sustainable choices visible.
                </p>
              </div>
              <div>
                <h3 className="font-bold text-sm mb-3 text-[var(--forest-dark)] uppercase tracking-wider">Quick Links</h3>
                <ul className="space-y-2 text-sm text-[var(--text-muted)]">
                  <li><a href="/" className="hover:text-[var(--lime)] transition-colors">Dashboard</a></li>
                  <li><a href="/history" className="hover:text-[var(--lime)] transition-colors">History</a></li>
                  <li><a href="/log" className="hover:text-[var(--lime)] transition-colors">Log Activity</a></li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold text-sm mb-3 text-[var(--forest-dark)] uppercase tracking-wider">Impact</h3>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed max-w-xs">
                  Every sustainable choice makes a difference. Start tracking today for a greener tomorrow.
                </p>
              </div>
            </div>
            <div className="max-w-6xl mx-auto px-6 pb-6 pt-4 border-t border-[var(--border-soft)] text-center text-xs text-[var(--text-muted)]">
              &copy; {new Date().getFullYear()} PlanetPulse. Built for a greener future.
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
