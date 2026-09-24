"use client";

import { useCallback, useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

/* ---------- Types ---------- */

interface CategoryBreakdown {
  category: string;
  totalCo2: number;
}

interface RecentActivity {
  id: string;
  type: string;
  quantity: number;
  unit: string;
  co2: number;
  date: string;
  outlier?: boolean;
}

interface Stats {
  totalCo2: number;
  weeklyCo2: number;
  weeklyTarget: number;
  categoryBreakdown: CategoryBreakdown[];
  recentActivities: RecentActivity[];
  weekStart?: string;
  weekEnd?: string;
  largestContributor?: string;
}

/* ---------- Helpers ---------- */

const ACTIVITY_OPTIONS = [
  { value: "car", label: "🚗 Car", unit: "km" },
  { value: "bus", label: "🚌 Bus", unit: "km" },
  { value: "flight", label: "✈️ Flight", unit: "km" },
  { value: "electricity", label: "⚡ Electricity", unit: "kWh" },
  { value: "veg_meal", label: "🥗 Veg Meal", unit: "meals" },
  { value: "non_veg_meal", label: "🍖 Non-Veg Meal", unit: "meals" },
] as const;

const CHART_COLORS = [
  "#059669",
  "#10B981",
  "#34D399",
  "#6EE7B7",
  "#A7F3D0",
  "#D1FAE5",
];

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

function formatDateRange(startIso?: string, endIso?: string) {
  if (!startIso || !endIso) return "";
  const opts: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' };
  const s = new Date(startIso).toLocaleDateString(undefined, opts);
  const e = new Date(endIso).toLocaleDateString(undefined, opts);
  return `${s} – ${e}`;
}

function getUnitForType(type: string): string {
  return ACTIVITY_OPTIONS.find((o) => o.value === type)?.unit ?? "";
}

/* ---------- Components ---------- */

function StatCard({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm border border-[var(--border)] flex flex-col gap-1">
      <span className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
        {label}
      </span>
      {children}
    </section>
  );
}

function BudgetBar({
  current,
  target,
  largestContributor,
}: {
  current: number;
  target: number;
  largestContributor?: string;
}) {
  const pct = target > 0 ? (current / target) * 100 : 0;
  const clamped = Math.min(pct, 100);
  const exceeded = current > target;
  const overAmount = exceeded ? current - target : 0;
  const remaining = exceeded ? 0 : target - current;

  let barColor = "bg-emerald-500";
  if (pct >= 100) barColor = "bg-red-500";
  else if (pct >= 70) barColor = "bg-amber-500";

  return (
    <div className="space-y-3">
      {/* Bar */}
      <div className="relative h-4 rounded-full bg-gray-100 overflow-hidden">
        <div
          className={`absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out ${barColor}`}
          style={{ width: `${clamped}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-[var(--text-muted)]">
          {formatCo2(current)} / {formatCo2(target)} ({Math.round(pct)}%)
        </span>
        <span className="font-medium">
          {exceeded
            ? `Over by ${formatCo2(overAmount)}`
            : `${formatCo2(remaining)} remaining`}
        </span>
      </div>

      {/* DP1 – The Nudge */}
      {exceeded && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 flex items-start gap-3">
          <span className="text-2xl shrink-0" aria-hidden="true">
            🌱
          </span>
          <div>
            <p className="font-semibold text-amber-800">
              Weekly target exceeded
            </p>
            <p className="text-sm text-amber-700 mt-1">
              You&apos;ve recorded {formatCo2(current)} against your {formatCo2(target)} target.
              You are {formatCo2(overAmount)} above your target.
              {largestContributor && ` Your largest contributing category this week is ${largestContributor}.`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Dashboard Page ---------- */

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Inline target editor
  const [editingTarget, setEditingTarget] = useState(false);
  const [targetDraft, setTargetDraft] = useState("");
  const [savingTarget, setSavingTarget] = useState(false);

  // Quick log state
  const [qlType, setQlType] = useState("car");
  const [qlQty, setQlQty] = useState("");
  const [qlSubmitting, setQlSubmitting] = useState(false);
  const [qlSuccess, setQlSuccess] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/stats?dashboard=true");
      if (!res.ok) throw new Error("Failed to load stats");
      const data = await res.json();
      
      const mappedStats: Stats = {
        totalCo2: data.stats.total_co2_kg,
        weeklyCo2: data.stats.weekly_co2_kg,
        weeklyTarget: data.stats.weekly_target_kg,
        categoryBreakdown: data.stats.categories.map((c: any) => ({
          category: c.type,
          totalCo2: c.total_kg
        })),
        recentActivities: data.recent_activities.map((a: any) => ({
          id: a.id,
          type: a.type,
          quantity: a.quantity,
          unit: a.unit,
          co2: a.co2_kg,
          date: a.created_at,
          outlier: a.outlier
        })),
        weekStart: data.stats.week_start,
        weekEnd: data.stats.week_end,
      };

      if (mappedStats.categoryBreakdown.length > 0) {
        // categoryBreakdown is already sorted descending by the backend
        const largest = mappedStats.categoryBreakdown[0];
        const lbl = ACTIVITY_OPTIONS.find((o) => o.value === largest.category)?.label;
        if (lbl) mappedStats.largestContributor = lbl.replace(/[^\w\s-]/g, '').trim();
      }
      
      setStats(mappedStats);
      setTargetDraft(String(mappedStats.weeklyTarget));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  /* -- Save weekly target -- */
  async function handleSaveTarget() {
    const val = parseFloat(targetDraft);
    if (isNaN(val) || val <= 0) return;
    try {
      setSavingTarget(true);
      const res = await fetch("/api/target", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target_kg: val }),
      });
      if (!res.ok) throw new Error("Save failed");
      setEditingTarget(false);
      await fetchStats();
    } catch {
      /* keep editor open */
    } finally {
      setSavingTarget(false);
    }
  }

  /* -- Quick log -- */
  async function handleQuickLog(e: React.FormEvent) {
    e.preventDefault();
    const qty = parseFloat(qlQty);
    if (isNaN(qty) || qty <= 0) return;
    try {
      setQlSubmitting(true);
      const res = await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: qlType, quantity: qty }),
      });
      if (!res.ok) throw new Error("Log failed");
      setQlQty("");
      setQlSuccess(true);
      setTimeout(() => setQlSuccess(false), 2500);
      await fetchStats();
    } catch {
      /* noop */
    } finally {
      setQlSubmitting(false);
    }
  }

  /* -- Loading / Error -- */
  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-32">
        <p className="text-red-600 font-medium">{error ?? "No data"}</p>
        <button
          onClick={fetchStats}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ---------- Hero Stats ---------- */}
      <section aria-label="Key metrics">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Total CO₂ */}
          <StatCard label="Total CO₂ (all time)">
            <p className="text-3xl font-bold text-[var(--accent-dark)]">
              {formatCo2(stats.totalCo2)}
            </p>
            <span className="text-xs text-[var(--text-muted)]">CO₂e</span>
          </StatCard>

          {/* This week */}
          <StatCard label="This week">
            <p className="text-3xl font-bold text-[var(--accent)]">
              {formatCo2(stats.weeklyCo2)}
            </p>
            <div className="mt-2">
              {/* Circular gauge */}
              <svg
                viewBox="0 0 36 36"
                className="w-14 h-14"
                aria-label={`${Math.round(
                  (stats.weeklyCo2 / stats.weeklyTarget) * 100
                )}% of weekly target`}
              >
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#E5E7EB"
                  strokeWidth="3"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke={
                    stats.weeklyCo2 / stats.weeklyTarget >= 1
                      ? "#EF4444"
                      : stats.weeklyCo2 / stats.weeklyTarget >= 0.7
                      ? "#F59E0B"
                      : "#059669"
                  }
                  strokeWidth="3"
                  strokeDasharray={`${Math.min(
                    (stats.weeklyCo2 / stats.weeklyTarget) * 100,
                    100
                  )}, 100`}
                  strokeLinecap="round"
                />
                <text
                  x="18"
                  y="20.35"
                  className="fill-[var(--text)]"
                  fontSize="8"
                  textAnchor="middle"
                  fontWeight="bold"
                >
                  {Math.round((stats.weeklyCo2 / stats.weeklyTarget) * 100)}%
                </text>
              </svg>
            </div>
          </StatCard>

          {/* Weekly target */}
          <StatCard label="Weekly Target">
            {editingTarget ? (
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="number"
                  min={1}
                  step="any"
                  value={targetDraft}
                  onChange={(e) => setTargetDraft(e.target.value)}
                  className="w-24 rounded-lg border border-[var(--border)] px-2 py-1 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  aria-label="Weekly target in kg CO₂e"
                />
                <span className="text-sm text-[var(--text-muted)]">kg</span>
                <button
                  onClick={handleSaveTarget}
                  disabled={savingTarget}
                  className="rounded-lg bg-emerald-600 px-3 py-1 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                >
                  {savingTarget ? "…" : "Save"}
                </button>
                <button
                  onClick={() => {
                    setEditingTarget(false);
                    setTargetDraft(String(stats.weeklyTarget));
                  }}
                  className="text-sm text-[var(--text-muted)] hover:text-[var(--text)]"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-[var(--text)]">
                  {formatCo2(stats.weeklyTarget)}
                </p>
                <button
                  onClick={() => setEditingTarget(true)}
                  className="text-xs text-emerald-600 hover:text-emerald-800 font-medium transition-colors"
                  aria-label="Edit weekly target"
                >
                  ✏️ Edit
                </button>
              </div>
            )}
          </StatCard>
        </div>
      </section>

      {/* ---------- Weekly Budget Gauge ---------- */}
      <section aria-label="Weekly budget progress">
        <div className="flex justify-between items-baseline mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Weekly Budget
          </h2>
          <span className="text-sm text-[var(--text-muted)] font-medium">
            {formatDateRange(stats.weekStart, stats.weekEnd)}
          </span>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-[var(--border)]">
          <BudgetBar current={stats.weeklyCo2} target={stats.weeklyTarget} largestContributor={stats.largestContributor} />
        </div>
      </section>

      {/* ---------- Category Breakdown ---------- */}
      <section aria-label="Category breakdown">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-3">
          CO₂ by Category
        </h2>
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-[var(--border)]">
          {stats.categoryBreakdown.length === 0 ? (
            <p className="text-center text-[var(--text-muted)] py-8">
              No activities logged yet. Start logging to see your breakdown!
            </p>
          ) : (
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-full md:w-1/2 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.categoryBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="totalCo2"
                      nameKey="category"
                    >
                      {stats.categoryBreakdown.map((_, idx) => (
                        <Cell
                          key={idx}
                          fill={CHART_COLORS[idx % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any) => [
                        `${Number(value).toFixed(1)} kg`,
                        "CO₂e",
                      ]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <ul className="w-full md:w-1/2 space-y-2">
                {stats.categoryBreakdown.map((cat, idx) => (
                  <li
                    key={cat.category}
                    className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block w-3 h-3 rounded-full"
                        style={{
                          backgroundColor:
                            CHART_COLORS[idx % CHART_COLORS.length],
                        }}
                      />
                      <span className="text-sm capitalize">
                        {CATEGORY_ICONS[cat.category] ?? "📦"}{" "}
                        {cat.category.replace("_", " ")}
                      </span>
                    </div>
                    <span className="text-sm font-semibold">
                      {formatCo2(cat.totalCo2)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      {/* ---------- Quick Log ---------- */}
      <section aria-label="Quick log">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-3">
          Quick Log
        </h2>
        <form
          onSubmit={handleQuickLog}
          className="rounded-2xl bg-white p-5 shadow-sm border border-[var(--border)] flex flex-col sm:flex-row items-end gap-3"
        >
          <div className="flex-1 w-full">
            <label
              htmlFor="ql-type"
              className="block text-xs font-medium text-[var(--text-muted)] mb-1"
            >
              Activity
            </label>
            <select
              id="ql-type"
              value={qlType}
              onChange={(e) => setQlType(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              {ACTIVITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full sm:w-40">
            <label
              htmlFor="ql-qty"
              className="block text-xs font-medium text-[var(--text-muted)] mb-1"
            >
              Quantity ({getUnitForType(qlType)})
            </label>
            <input
              id="ql-qty"
              type="number"
              min={0}
              step="any"
              required
              value={qlQty}
              onChange={(e) => setQlQty(e.target.value)}
              placeholder="e.g. 15"
              className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>

          <button
            type="submit"
            disabled={qlSubmitting}
            className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors whitespace-nowrap"
          >
            {qlSubmitting ? "Logging…" : "Log Activity"}
          </button>

          {qlSuccess && (
            <span className="text-emerald-600 text-sm font-medium animate-pulse">
              ✓ Logged!
            </span>
          )}
        </form>
      </section>

      {/* ---------- Recent Activity ---------- */}
      <section aria-label="Recent activity">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-3">
          Recent Activity
        </h2>
        <div className="rounded-2xl bg-white shadow-sm border border-[var(--border)] divide-y divide-[var(--border)]">
          {stats.recentActivities.length === 0 ? (
            <p className="text-center text-[var(--text-muted)] py-8">
              No activities yet — use Quick Log above or visit the Log page!
            </p>
          ) : (
            stats.recentActivities.map((act) => (
              <div
                key={act.id}
                className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl" aria-hidden="true">
                    {CATEGORY_ICONS[act.type] ?? "📦"}
                  </span>
                  <div>
                    <p className="text-sm font-medium capitalize">
                      {act.type.replace("_", " ")}
                      {act.outlier && (
                        <span className="ml-2 inline-block rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 uppercase">
                          Outlier / Batch Entry
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {act.quantity} {act.unit} ·{" "}
                      {new Date(act.date).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-[var(--accent-dark)]">
                  {formatCo2(act.co2)}
                </span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
