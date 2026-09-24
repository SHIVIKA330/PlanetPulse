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
  { value: "veg_meal", label: "🥗 Veg Meal", unit: "meals / servings" },
  { value: "non_veg_meal", label: "🍖 Non-Veg Meal", unit: "meals / servings" },
] as const;

const CHART_COLORS = [
  "#10B981", // Emerald
  "#3B82F6", // Blue
  "#F59E0B", // Amber
  "#8B5CF6", // Violet
  "#EC4899", // Pink
  "#06B6D4", // Cyan
];

const CATEGORY_ICONS: Record<string, string> = {
  car: "🚗",
  bus: "🚌",
  flight: "✈️",
  electricity: "⚡",
  veg_meal: "🥗",
  non_veg_meal: "🍖",
  Transportation: "🚗",
  Energy: "⚡",
  Food: "🍽️",
};

function formatCo2(value: number): string {
  return value >= 1000
    ? `${(value / 1000).toFixed(2)}t`
    : `${value.toFixed(2)} kg`;
}

function formatDateRange(startIso?: string, endIso?: string) {
  if (!startIso || !endIso) return "";
  const opts: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' };
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
  variant = "cream",
}: {
  label: string;
  children: React.ReactNode;
  variant?: "cream" | "forest";
}) {
  const isForest = variant === "forest";
  return (
    <section className={`rounded-[32px] p-8 shadow-sm flex flex-col gap-2 relative overflow-hidden transition-all ${
      isForest 
        ? "bg-[var(--forest-dark)] text-white" 
        : "bg-[var(--bg-cream)] text-[var(--text-main)]"
    }`}>
      {/* Decorative top-left icon circle for flavor */}
      <div className={`absolute -top-4 -left-4 w-20 h-20 rounded-full opacity-20 pointer-events-none ${isForest ? "bg-[var(--surface)]" : "bg-[var(--lime)]"}`} />
      
      <span className={`text-sm font-bold uppercase tracking-wider relative z-10 ${
        isForest ? "text-white/80" : "text-[var(--text-muted)]"
      }`}>
        {label}
      </span>
      <div className="relative z-10">
        {children}
      </div>
    </section>
  );
}

function BudgetBar({
  current,
  target,
  largestContributor,
  weekStart,
}: {
  current: number;
  target: number;
  largestContributor?: string;
  weekStart?: string;
}) {
  const pct = target > 0 ? (current / target) * 100 : 0;
  const clamped = Math.min(pct, 100);
  const exceeded = current > target;
  const overAmount = exceeded ? current - target : 0;
  const remaining = exceeded ? 0 : target - current;

  let barColor = "bg-emerald-500";
  if (pct >= 100) barColor = "bg-red-500";
  else if (pct >= 70) barColor = "bg-amber-500";

  // DP3 - Pace marker
  let paceMsg = "";
  if (weekStart) {
    const start = new Date(weekStart);
    const now = new Date();
    // Use UTC for day diff to avoid timezone shifts
    const diffMs = now.getTime() - start.getTime();
    let daysElapsed = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
    if (daysElapsed < 1) daysElapsed = 1;
    if (daysElapsed > 7) daysElapsed = 7;
    const timePct = (daysElapsed / 7) * 100;
    
    if (pct > timePct && !exceeded) paceMsg = `Ahead of pace (${Math.round(timePct)}% of week gone)`;
    else if (!exceeded) paceMsg = `On track (${Math.round(timePct)}% of week gone)`;
  }

  return (
    <div className="space-y-3">
      {/* Bar */}
      <div className="relative h-4 rounded-full bg-gray-100 overflow-hidden">
        <div
          className={`absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out ${barColor}`}
          style={{ width: `${clamped}%` }}
        />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-sm gap-1">
        <span className="text-[var(--text-muted)]">
          {formatCo2(current)} / {formatCo2(target)} ({Math.round(pct)}% used)
          {paceMsg && <span className="ml-2 px-2 py-0.5 rounded bg-gray-100 text-gray-600 text-xs font-medium">{paceMsg}</span>}
        </span>
        <span className="font-medium text-right">
          {exceeded
            ? `Over by ${formatCo2(overAmount)}`
            : `${formatCo2(remaining)} remaining`}
        </span>
      </div>

      {/* DP1 – The Nudge (80% early warning & Exceeded state) */}
      {exceeded ? (
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
            <p className="text-sm font-medium text-amber-800 mt-2">
              Tip: Swapping 2 non-veg meals for veg saves 3 kg of CO₂. Small changes add up!
            </p>
          </div>
        </div>
      ) : pct >= 80 ? (
        <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 flex items-start gap-3">
          <span className="text-2xl shrink-0" aria-hidden="true">
            💡
          </span>
          <div>
            <p className="font-semibold text-blue-800">
              Approaching your weekly target
            </p>
            <p className="text-sm text-blue-700 mt-1">
              You&apos;ve used {Math.round(pct)}% of your budget. 
              {largestContributor && ` Mind your ${largestContributor} usage to stay on track.`}
            </p>
          </div>
        </div>
      ) : null}
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
      
      const grouped: Record<string, number> = { Transportation: 0, Energy: 0, Food: 0 };
      for (const c of data.stats.categories) {
        if (['car', 'bus', 'flight'].includes(c.type)) grouped.Transportation += c.total_kg;
        else if (['electricity'].includes(c.type)) grouped.Energy += c.total_kg;
        else if (['veg_meal', 'non_veg_meal'].includes(c.type)) grouped.Food += c.total_kg;
      }
      const catArray = Object.entries(grouped)
        .filter(([_, val]) => val > 0)
        .map(([name, val]) => ({ category: name, totalCo2: val }))
        .sort((a, b) => b.totalCo2 - a.totalCo2);

      const mappedStats: Stats = {
        totalCo2: data.stats.total_co2_kg,
        weeklyCo2: data.stats.weekly_co2_kg,
        weeklyTarget: data.stats.weekly_target_kg,
        categoryBreakdown: catArray,
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
        mappedStats.largestContributor = mappedStats.categoryBreakdown[0].category;
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total */}
          <StatCard label="Total CO₂ (all time)" variant="cream">
            <p className="text-4xl font-black text-[var(--forest-dark)] mt-2 tracking-tight">
              {formatCo2(stats.totalCo2)}
            </p>
            <span className="text-sm font-medium text-[var(--text-muted)] mt-1 inline-block">CO₂e</span>
          </StatCard>

          {/* This week */}
          <StatCard label="This week" variant="forest">
            <p className="text-4xl font-black text-white mt-2 tracking-tight">
              {formatCo2(stats.weeklyCo2)}
            </p>
            <div className="mt-4 flex items-center justify-between">
              {/* Circular gauge */}
              <div className="relative">
                <svg
                  viewBox="0 0 36 36"
                  className="w-16 h-16 drop-shadow-md"
                  aria-label={`${Math.round(
                    (stats.weeklyCo2 / stats.weeklyTarget) * 100
                  )}% of weekly target`}
                >
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth="4"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="var(--lime)"
                    strokeWidth="4"
                    strokeDasharray={`${Math.min(
                      (stats.weeklyCo2 / stats.weeklyTarget) * 100,
                      100
                    )}, 100`}
                    className="transition-all duration-1000 ease-out"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center font-bold text-xs text-white">
                  {Math.round((stats.weeklyCo2 / stats.weeklyTarget) * 100)}%
                </div>
              </div>
            </div>
          </StatCard>

          {/* Weekly target */}
          <StatCard label="Weekly Target" variant="cream">
            {editingTarget ? (
              <div className="flex flex-col gap-3 mt-2">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    step="any"
                    value={targetDraft}
                    onChange={(e) => setTargetDraft(e.target.value)}
                    className="w-24 rounded-xl border border-[var(--border-soft)] bg-[var(--surface)] px-3 py-2 text-lg font-bold text-[var(--forest-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--lime)]"
                    aria-label="Weekly target in kg CO₂e"
                  />
                  <span className="text-sm font-medium text-[var(--text-muted)]">kg</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveTarget}
                    disabled={savingTarget}
                    className="flex-1 rounded-full bg-[var(--lime)] px-3 py-1.5 text-sm font-bold text-white hover:bg-[var(--lime-hover)] disabled:opacity-50 transition-colors shadow-sm"
                  >
                    {savingTarget ? "…" : "Save"}
                  </button>
                  <button
                    onClick={() => {
                      setEditingTarget(false);
                      setTargetDraft(String(stats.weeklyTarget));
                    }}
                    className="flex-1 rounded-full bg-[var(--surface)] px-3 py-1.5 text-sm font-bold text-[var(--text-muted)] hover:text-[var(--forest)] hover:bg-gray-50 border border-[var(--border-soft)] transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-2">
                <p className="text-4xl font-black text-[var(--forest-dark)] tracking-tight">
                  {formatCo2(stats.weeklyTarget)}
                </p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-sm font-medium text-[var(--text-muted)]">kg CO₂e</span>
                  <button
                    onClick={() => setEditingTarget(true)}
                    className="rounded-full bg-[var(--surface)] border border-[var(--border-soft)] px-4 py-1.5 text-sm font-bold text-[var(--forest)] hover:bg-[var(--lime)] hover:text-white hover:border-[var(--lime)] transition-colors shadow-sm"
                  >
                    ✏️ Edit
                  </button>
                </div>
              </div>
            )}
          </StatCard>
        </div>
      </section>

      {/* ---------- Weekly Budget Gauge ---------- */}
      <section aria-label="Weekly budget progress" className="mt-12">
        <div className="flex justify-between items-baseline mb-4 px-2">
          <h2 className="text-lg font-bold text-[var(--forest-dark)] tracking-tight">
            Weekly Budget
          </h2>
          <span className="text-sm text-[var(--text-muted)] font-medium bg-[var(--bg-cream)] px-3 py-1 rounded-full">
            {formatDateRange(stats.weekStart, stats.weekEnd)}
          </span>
        </div>
        <div className="rounded-[32px] bg-[var(--bg-cream)] p-8 shadow-sm">
          <BudgetBar current={stats.weeklyCo2} target={stats.weeklyTarget} largestContributor={stats.largestContributor} weekStart={stats.weekStart} />
        </div>
      </section>

      {/* ---------- Category Breakdown ---------- */}
      <section aria-label="Category breakdown" className="mt-12">
        <h2 className="text-lg font-bold text-[var(--forest-dark)] mb-4 px-2 tracking-tight">
          CO₂ by Category
        </h2>
        <div className="rounded-[32px] bg-[var(--surface)] p-8 shadow-sm border border-[var(--border-soft)]">
          {stats.categoryBreakdown.length === 0 ? (
            <p className="text-center text-[var(--text-muted)] py-8">
              No activities logged this week. Start by recording your first activity.
            </p>
          ) : (
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-full md:w-1/3 h-64">
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
                        `${Number(value).toFixed(2)} kg`,
                        "CO₂e",
                      ]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="w-full md:w-2/3 flex flex-col gap-4">
                {stats.largestContributor && stats.weeklyCo2 > 0 && (
                  <div className="rounded-2xl bg-[var(--insight-bg)] border border-[var(--insight-border)] p-5">
                    <p className="text-sm text-[var(--insight-text)]">
                      <span className="font-black text-lg block mb-1">💡 Insight</span>
                      {stats.largestContributor} is{" "}
                      <strong>{Math.round((stats.categoryBreakdown[0].totalCo2 / stats.weeklyCo2) * 100)}%</strong> of your footprint this week.
                    </p>
                  </div>
                )}
                <ul className="space-y-2">
                  {stats.categoryBreakdown.map((cat, idx) => (
                    <li
                      key={cat.category}
                      className="flex items-center justify-between rounded-xl px-4 py-3 hover:bg-[var(--bg-cream)] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="inline-block w-4 h-4 rounded-full shadow-sm"
                          style={{
                          backgroundColor:
                            CHART_COLORS[idx % CHART_COLORS.length],
                        }}
                      />
                      <span className="text-sm font-bold text-[var(--forest-dark)]">
                        {CATEGORY_ICONS[cat.category] ?? "📦"}{" "}
                        {cat.category.replace("_", " ")}
                      </span>
                    </div>
                    <span className="text-sm font-black text-[var(--forest-dark)]">
                      {formatCo2(cat.totalCo2)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          )}
        </div>
      </section>

      {/* ---------- Quick Log ---------- */}
      <section aria-label="Quick log" className="mt-12">
        <h2 className="text-lg font-bold text-[var(--forest-dark)] mb-4 px-2 tracking-tight">
          Quick Log
        </h2>
        <form
          onSubmit={handleQuickLog}
          className="rounded-[32px] bg-[var(--bg-cream)] p-8 shadow-sm flex flex-col sm:flex-row items-end gap-4"
        >
          <div className="flex-1 w-full">
            <label
              htmlFor="ql-type"
              className="block text-xs font-bold text-[var(--text-muted)] mb-2 uppercase tracking-wider"
            >
              Activity
            </label>
            <select
              id="ql-type"
              value={qlType}
              onChange={(e) => setQlType(e.target.value)}
              className="w-full rounded-full border border-[var(--border-soft)] bg-[var(--surface)] px-5 py-3 text-[15px] font-medium focus:outline-none focus:ring-2 focus:ring-[var(--lime)] shadow-sm"
            >
              {ACTIVITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full sm:w-48">
            <label
              htmlFor="ql-qty"
              className="block text-xs font-bold text-[var(--text-muted)] mb-2 uppercase tracking-wider"
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
              className="w-full rounded-full border border-[var(--border-soft)] bg-[var(--surface)] px-5 py-3 text-[15px] font-medium focus:outline-none focus:ring-2 focus:ring-[var(--lime)] shadow-sm"
            />
          </div>

          <button
            type="submit"
            disabled={qlSubmitting}
            className="rounded-full bg-[var(--lime)] px-8 py-3 text-[15px] font-bold text-white hover:bg-[var(--lime-hover)] disabled:opacity-50 transition-colors whitespace-nowrap shadow-sm"
          >
            {qlSubmitting ? "Logging…" : "Log Activity"}
          </button>

          {qlSuccess && (
            <span className="text-[var(--lime)] text-sm font-bold animate-pulse absolute">
              ✓ Logged!
            </span>
          )}
        </form>
      </section>

      {/* ---------- Recent Activity ---------- */}
      <section aria-label="Recent activity" className="mt-12">
        <h2 className="text-lg font-bold text-[var(--forest-dark)] mb-4 px-2 tracking-tight">
          Recent Activity
        </h2>
        <div className="rounded-[32px] bg-[var(--surface)] shadow-sm border border-[var(--border-soft)] divide-y divide-[var(--border-soft)] overflow-hidden">
          {stats.recentActivities.length === 0 ? (
            <p className="text-center text-[var(--text-muted)] py-8 font-medium">
              No activities yet — use Quick Log above or visit the Log page!
            </p>
          ) : (
            stats.recentActivities.map((act) => (
              <div
                key={act.id}
                className="flex items-center justify-between px-6 py-4 hover:bg-[var(--bg-cream)] transition-colors"
              >
                <div className="flex items-center gap-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--bg-cream)] text-lg shadow-sm" aria-hidden="true">
                    {CATEGORY_ICONS[act.type] ?? "📦"}
                  </span>
                  <div>
                    <p className="text-sm font-bold text-[var(--forest-dark)]">
                      {ACTIVITY_OPTIONS.find(o => o.value === act.type)?.label || act.type}
                      {act.outlier && (
                        <span className="ml-2 inline-block rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 uppercase">
                          Outlier / Batch Entry
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-[var(--text-muted)] font-medium mt-0.5">
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
                <span className="text-sm font-black text-[var(--forest-dark)]">
                  {formatCo2(act.co2)}
                </span>
              </div>
            ))
          )}
        </div>
      </section>

      {/* ---------- Admin Tools ---------- */}
      <section aria-label="Developer tools" className="pt-8 border-t border-[var(--border)] mt-8 flex justify-center gap-6 text-sm">
        <button
          data-testid="load-sample-data"
          onClick={async () => {
            const reqs = [
              { type: 'car', quantity: 25 },
              { type: 'electricity', quantity: 15 },
              { type: 'non_veg_meal', quantity: 3 },
            ];
            for (const r of reqs) {
              await fetch('/api/activities', {
                method: 'POST',
                body: JSON.stringify(r),
                headers: { 'Content-Type': 'application/json' },
              });
            }
            fetchStats();
          }}
          className="text-[var(--text-muted)] hover:text-emerald-600 font-medium transition-colors"
        >
          Load Sample Data
        </button>
      </section>
    </div>
  );
}
