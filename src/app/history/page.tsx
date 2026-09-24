"use client";

import { useCallback, useEffect, useState } from "react";

/* ---------- Types ---------- */

interface Activity {
  id: string;
  type: string;
  quantity: number;
  unit: string;
  co2: number;
  date: string;
  outlier?: boolean;
}

/* ---------- Constants ---------- */

const CATEGORIES = [
  { value: "", label: "All" },
  { value: "car", label: "🚗 Car" },
  { value: "bus", label: "🚌 Bus" },
  { value: "flight", label: "✈️ Flight" },
  { value: "electricity", label: "⚡ Electricity" },
  { value: "veg_meal", label: "🥗 Veg Meal" },
  { value: "non_veg_meal", label: "🍖 Non-Veg Meal" },
] as const;

const CATEGORY_ICONS: Record<string, string> = {
  car: "🚗",
  bus: "🚌",
  flight: "✈️",
  electricity: "⚡",
  veg_meal: "🥗",
  non_veg_meal: "🍖",
};

function formatCo2(value: number): string {
  return value >= 1000
    ? `${(value / 1000).toFixed(1)}t`
    : `${value.toFixed(1)} kg`;
}

/* ---------- Page ---------- */

export default function HistoryPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [category, setCategory] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Delete confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteInProgress, setDeleteInProgress] = useState(false);

  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (category) params.set("type", category);
      if (startDate) params.set("start_date", startDate);
      if (endDate) params.set("end_date", endDate);
      const qs = params.toString();
      const res = await fetch(`/api/activities${qs ? `?${qs}` : ""}`);
      if (!res.ok) throw new Error("Failed to load activities");
      const data = await res.json();

      const activitiesArray = Array.isArray(data?.activities)
        ? data.activities
        : Array.isArray(data) ? data : [];

      const mappedData: Activity[] = activitiesArray.map((a: any) => ({
        id: a.id,
        type: a.type,
        quantity: a.quantity,
        unit: a.unit,
        co2: a.co2_kg,
        date: a.created_at,
        outlier: a.outlier
      }));
      setActivities(mappedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [category, startDate, endDate]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  /* -- Delete -- */
  async function handleDelete(id: string) {
    try {
      setDeleteInProgress(true);
      const res = await fetch(`/api/activities/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setDeletingId(null);
      await fetchActivities();
    } catch {
      /* keep confirm open */
    } finally {
      setDeleteInProgress(false);
    }
  }

  function clearFilters() {
    setCategory("");
    setStartDate("");
    setEndDate("");
  }

  const hasFilters = category || startDate || endDate;

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Title */}
      <header>
        <h1 className="text-2xl font-black text-[var(--forest-dark)] tracking-tight">History</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Browse and filter all your logged activities.
        </p>
      </header>

      {/* ---------- Filter Bar ---------- */}
      <section
        aria-label="Filters"
        className="rounded-2xl bg-[var(--surface)] p-5 border border-[var(--border-soft)] space-y-4"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        {/* Category pills */}
        <div>
          <span className="block text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">
            Category
          </span>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => {
              const active = category === cat.value;
              return (
                <button
                  key={cat.value}
                  onClick={() => setCategory(cat.value)}
                  className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition-all duration-200
                    ${
                      active
                        ? "text-white shadow-sm"
                        : "bg-[var(--bg-cream)] text-[var(--text-muted)] hover:bg-[var(--insight-bg)] hover:text-[var(--forest)]"
                    }`}
                  style={active ? { background: "var(--gradient-primary)" } : {}}
                  aria-pressed={active}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Date range */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3">
          <div>
            <label
              htmlFor="start-date"
              className="block text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-1"
            >
              From
            </label>
            <input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-cream)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--lime)] transition-shadow"
            />
          </div>
          <div>
            <label
              htmlFor="end-date"
              className="block text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-1"
            >
              To
            </label>
            <input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-cream)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--lime)] transition-shadow"
            />
          </div>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="rounded-xl border border-[var(--border-soft)] px-4 py-2 text-sm font-semibold text-[var(--text-muted)] hover:bg-[var(--bg-cream)] hover:text-[var(--forest)] transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>
      </section>

      {/* ---------- Activity List ---------- */}
      <section aria-label="Activity list">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-[var(--border-soft)] border-t-[var(--lime)]" />
              <span className="text-sm text-[var(--text-muted)] font-medium">Loading activities...</span>
            </div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-4 py-16">
            <p className="text-red-600 font-medium">{error}</p>
            <button
              onClick={fetchActivities}
              className="rounded-full px-6 py-2.5 text-sm font-bold text-white transition-colors shadow-sm"
              style={{ background: "var(--gradient-primary)" }}
            >
              Retry
            </button>
          </div>
        ) : !Array.isArray(activities) || activities.length === 0 ? (
          /* -- Empty state -- */
          <div
            className="rounded-2xl bg-[var(--surface)] border border-[var(--border-soft)] flex flex-col items-center justify-center py-16 px-4 text-center"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <span className="text-5xl mb-4 animate-float" aria-hidden="true">
              🍃
            </span>
            <p className="text-lg font-bold text-[var(--forest-dark)]">
              No activities found
            </p>
            <p className="text-sm text-[var(--text-muted)] mt-1 max-w-sm">
              {hasFilters
                ? "Try adjusting your filters or clearing them to see all activities."
                : "Start logging activities to see them here!"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {activities.map((act) => (
              <div
                key={act.id}
                className="rounded-2xl bg-[var(--surface)] border border-[var(--border-soft)] p-4 flex items-center justify-between gap-4 hover:shadow-md transition-all duration-200"
                style={{ boxShadow: "var(--shadow-card)" }}
              >
                {/* Left: icon + info */}
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-xl text-xl shrink-0"
                    style={{ backgroundColor: "var(--bg-cream)" }}
                    aria-hidden="true"
                  >
                    {CATEGORY_ICONS[act.type] ?? "📦"}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold capitalize truncate text-[var(--forest-dark)]">
                      {act.type.replace("_", " ")}
                      {act.outlier && (
                        <span className="ml-2 inline-block rounded-full bg-amber-100 dark:bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-400 uppercase">
                          Outlier
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {act.quantity} {act.unit} ·{" "}
                      {new Date(act.date).toLocaleDateString(undefined, {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>

                {/* Right: CO2 + delete */}
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm font-black text-[var(--forest-dark)] bg-[var(--bg-cream)] rounded-full px-3 py-1">
                    {formatCo2(act.co2)}
                  </span>

                  {deletingId === act.id ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDelete(act.id)}
                        disabled={deleteInProgress}
                        className="rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50 transition-colors shadow-sm"
                      >
                        {deleteInProgress ? "…" : "Confirm"}
                      </button>
                      <button
                        onClick={() => setDeletingId(null)}
                        className="text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--forest-dark)] transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeletingId(act.id)}
                      className="rounded-xl p-2 text-[var(--text-muted)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                      aria-label={`Delete ${act.type.replace("_", " ")} activity`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
