"use client";

import { useState, useRef, useEffect } from "react";

interface Notification {
  id: string;
  icon: string;
  message: string;
  time: string;
  read: boolean;
}

function generateNotifications(): Notification[] {
  return [
    {
      id: "n1",
      icon: "🎯",
      message: "Weekly Target: 45% budget used so far",
      time: "Just now",
      read: false,
    },
    {
      id: "n2",
      icon: "⚠️",
      message: "Approaching weekly limit — consider lighter transport",
      time: "2h ago",
      read: false,
    },
    {
      id: "n3",
      icon: "🌱",
      message: "Tip: Replacing 1 non-veg meal saves 1.50 kg CO₂",
      time: "5h ago",
      read: false,
    },
    {
      id: "n4",
      icon: "🏆",
      message: "Great job! Your footprint is 12% lower than last week",
      time: "1d ago",
      read: true,
    },
    {
      id: "n5",
      icon: "💡",
      message: "Switching to bus saves 60% CO₂ vs driving",
      time: "2d ago",
      read: true,
    },
  ];
}

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(generateNotifications);
  const panelRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) {
      document.addEventListener("keydown", handleKey);
      return () => document.removeEventListener("keydown", handleKey);
    }
  }, [open]);

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function markRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-9 w-9 items-center justify-center rounded-full bg-[var(--surface)] border border-[var(--border-soft)] text-[var(--text-muted)] hover:text-[var(--forest)] hover:border-[var(--lime)] transition-all duration-200 shadow-sm"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        aria-expanded={open}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>

        {/* Badge */}
        {unreadCount > 0 && (
          <span className="badge-pulse absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[var(--danger)] text-[10px] font-bold text-white px-1 shadow-sm">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div
          className="animate-slide-down absolute right-0 top-full mt-2 w-[340px] max-h-[420px] rounded-2xl glass overflow-hidden z-[100] flex flex-col"
          role="dialog"
          aria-label="Notification center"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-soft)]">
            <h3 className="text-sm font-bold text-[var(--forest-dark)]">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs font-semibold text-[var(--lime)] hover:text-[var(--lime-hover)] transition-colors"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* List */}
          <div className="overflow-y-auto flex-1">
            {notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => markRead(n.id)}
                className={`w-full text-left flex items-start gap-3 px-4 py-3 transition-colors hover:bg-[var(--bg-cream)] border-b border-[var(--border-soft)] last:border-b-0 ${
                  !n.read ? "bg-[var(--insight-bg)]" : ""
                }`}
              >
                <span className="text-lg shrink-0 mt-0.5">{n.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className={`text-[13px] leading-snug ${!n.read ? "font-semibold text-[var(--forest-dark)]" : "text-[var(--text-main)]"}`}>
                    {n.message}
                  </p>
                  <p className="text-[11px] text-[var(--text-muted)] mt-1">{n.time}</p>
                </div>
                {!n.read && (
                  <span className="mt-1.5 h-2 w-2 rounded-full bg-[var(--lime)] shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
