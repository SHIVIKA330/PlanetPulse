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

const CATEGORY_COLORS: Record<string, string> = {
  Transportation: "#3B82F6",
  Energy: "#F59E0B",
  Food: "#10B981",
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

/* ---------- Sub-Components ---------- */

function MetricCard({
  label,
  children,
  className = "",
  gradient = false,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
  gradient?: boolean;
}) {
  return (
    <div
      className={`relative rounded-2xl p-6 overflow-hidden transition-all duration-300 hover:shadow-[var(--shadow-card-hover)] ${
        gradient
          ? "text-white"
          : "bg-[var(--surface)] border border-[var(--border-soft)]"
      } ${className}`}
      style={{
        boxShadow: "var(--shadow-card)",
        ...(gradient ? { background: "var(--gradient-forest)" } : {}),
      }}
    >
      {/* Subtle decorative glow */}
      {gradient && (
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-[var(--lime)] opacity-[0.08] blur-2xl pointer-events-none" />
      )}
      <span
        className={`text-[11px] font-bold uppercase tracking-widest ${
          gradient ? "text-white/60" : "text-[var(--text-muted)]"
        }`}
      >
        {label}
      </span>
      <div className="relative z-10 mt-2">{children}</div>
    </div>
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

  let barGradient = "linear-gradient(90deg, #10B981 0%, #6BB536 100%)";
  let statusBadge = { text: "Within Target", color: "bg-emerald-500/10 text-emerald-600 border-emerald-200" };
  if (pct >= 100) {
    barGradient = "linear-gradient(90deg, #EF4444 0%, #DC2626 100%)";
    statusBadge = { text: "Target Exceeded", color: "bg-red-500/10 text-red-600 border-red-200" };
  } else if (pct >= 70) {
    barGradient = "linear-gradient(90deg, #F59E0B 0%, #EAB308 100%)";
    statusBadge = { text: "Approaching Limit", color: "bg-amber-500/10 text-amber-600 border-amber-200" };
  }

  // DP3 - Pace marker
  let paceMsg = "";
  if (weekStart) {
    const start = new Date(weekStart);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    let daysElapsed = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
    if (daysElapsed < 1) daysElapsed = 1;
    if (daysElapsed > 7) daysElapsed = 7;
    const timePct = (daysElapsed / 7) * 100;

    if (pct > timePct && !exceeded) paceMsg = `Ahead of pace (${Math.round(timePct)}% of week gone)`;
    else if (!exceeded) paceMsg = `On track (${Math.round(timePct)}% of week gone)`;
  }

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-[var(--forest-dark)]">
            {formatCo2(current)} / {formatCo2(target)}
          </span>
          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${statusBadge.color}`}>
            {statusBadge.text}
          </span>
        </div>
        <span className="text-sm font-bold text-[var(--text-muted)]">{Math.round(pct)}%</span>
      </div>

      {/* Progress bar */}
      <div className="relative h-3 rounded-full bg-[var(--bg-cream)] overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${clamped}%`, background: barGradient }}
        />
        {/* Glow effect on bar tip */}
        <div
          className="absolute inset-y-0 h-full rounded-full opacity-40 blur-sm transition-all duration-1000"
          style={{ width: `${clamped}%`, background: barGradient }}
        />
      </div>

      {/* Bottom info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-sm gap-2">
        <span className="text-[var(--text-muted)]">
          {exceeded
            ? `Over by ${formatCo2(overAmount)}`
            : `${formatCo2(remaining)} remaining`}
          {paceMsg && (
            <span className="ml-2 px-2 py-0.5 rounded-full bg-[var(--bg-cream)] text-[var(--text-muted)] text-xs font-medium border border-[var(--border-soft)]">
              {paceMsg}
            </span>
          )}
        </span>
      </div>

      {/* DP1 – The Nudge (80% early warning & Exceeded state) */}
      {exceeded ? (
        <div className="rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 p-4 flex items-start gap-3 animate-fade-in-up">
          <span className="text-2xl shrink-0 animate-float" aria-hidden="true">
            🌱
          </span>
          <div>
            <p className="font-semibold text-red-700 dark:text-red-400">
              Weekly target exceeded
            </p>
            <p className="text-sm text-red-600 dark:text-red-400/80 mt-1">
              You&apos;ve recorded {formatCo2(current)} against your {formatCo2(target)} target.
              You are {formatCo2(overAmount)} above your target.
              {largestContributor && ` Your largest contributing category this week is ${largestContributor}.`}
            </p>
            <p className="text-sm font-medium text-red-700 dark:text-red-400 mt-2">
              Tip: Swapping 2 non-veg meals for veg saves 3 kg of CO₂. Small changes add up!
            </p>
          </div>
        </div>
      ) : pct >= 80 ? (
        <div className="rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-4 flex items-start gap-3 animate-fade-in-up">
          <span className="text-2xl shrink-0" aria-hidden="true">
            💡
          </span>
          <div>
            <p className="font-semibold text-amber-700 dark:text-amber-400">
              Approaching your weekly target
            </p>
            <p className="text-sm text-amber-600 dark:text-amber-400/80 mt-1">
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
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-[var(--border-soft)] border-t-[var(--lime)]" />
          <span className="text-sm text-[var(--text-muted)] font-medium">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-32">
        <p className="text-red-600 font-medium">{error ?? "No data"}</p>
        <button
          onClick={fetchStats}
          className="rounded-full bg-[var(--lime)] px-6 py-2.5 text-sm font-bold text-white hover:bg-[var(--lime-hover)] transition-colors shadow-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  const weeklyPct = stats.weeklyTarget > 0 ? (stats.weeklyCo2 / stats.weeklyTarget) * 100 : 0;

  return (
    <div className="space-y-8">
      {/* ============ HERO METRICS ROW ============ */}
      <section aria-label="Key metrics" className="stagger-children">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* --- Total Footprint --- */}
          <MetricCard label="Total Footprint" className="animate-fade-in-up">
            <p className="text-3xl font-black text-[var(--forest-dark)] tracking-tight mt-1 animate-count-up">
              {formatCo2(stats.totalCo2)}
            </p>
            <div className="flex items-center gap-2 mt-3">
              <span className="text-xs font-medium text-[var(--text-muted)]">CO₂e all-time</span>
              {stats.totalCo2 > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--insight-bg)] px-2 py-0.5 text-[10px] font-semibold text-[var(--insight-text)]">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                    <polyline points="22 17 13.5 8.5 8.5 13.5 2 7" />
                  </svg>
                  {stats.recentActivities.length} entries
                </span>
              )}
            </div>
          </MetricCard>

          {/* --- This Week (Gradient) --- */}
          <MetricCard label="This Week" gradient className="animate-fade-in-up">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-3xl font-black tracking-tight mt-1 animate-count-up">
                  {formatCo2(stats.weeklyCo2)}
                </p>
                <span className="text-xs font-medium text-white/50 mt-1 block">
                  {formatDateRange(stats.weekStart, stats.weekEnd)}
                </span>
              </div>

              {/* Circular gauge */}
              <div className="relative shrink-0">
                <svg
                  viewBox="0 0 36 36"
                  className="w-16 h-16 drop-shadow-md"
                  aria-label={`${Math.round(weeklyPct)}% of weekly target`}
                >
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="rgba(255,255,255,0.12)"
                    strokeWidth="3.5"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="var(--lime)"
                    strokeWidth="3.5"
                    strokeDasharray={`${Math.min(weeklyPct, 100)}, 100`}
                    className="transition-all duration-1000 ease-out"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center font-bold text-xs text-white">
                  {Math.round(weeklyPct)}%
                </div>
              </div>
            </div>
          </MetricCard>

          {/* --- Weekly Target & Budget --- */}
          <MetricCard label="Weekly Target" className="animate-fade-in-up">
            {editingTarget ? (
              <div className="flex flex-col gap-3 mt-1">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    step="any"
                    value={targetDraft}
                    onChange={(e) => setTargetDraft(e.target.value)}
                    className="w-24 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-cream)] px-3 py-2 text-lg font-bold text-[var(--forest-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--lime)]"
                    aria-label="Weekly target in kg CO₂e"
                  />
                  <span className="text-xs font-medium text-[var(--text-muted)]">kg CO₂e</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveTarget}
                    disabled={savingTarget}
                    className="flex-1 rounded-full py-2 text-sm font-bold text-white disabled:opacity-50 transition-all shadow-sm"
                    style={{ background: "var(--gradient-primary)" }}
                  >
                    {savingTarget ? "…" : "Save"}
                  </button>
                  <button
                    onClick={() => {
                      setEditingTarget(false);
                      setTargetDraft(String(stats.weeklyTarget));
                    }}
                    className="flex-1 rounded-full bg-[var(--bg-cream)] py-2 text-sm font-bold text-[var(--text-muted)] hover:text-[var(--forest)] border border-[var(--border-soft)] transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-1">
                <p className="text-3xl font-black text-[var(--forest-dark)] tracking-tight animate-count-up">
                  {formatCo2(stats.weeklyTarget)}
                </p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs font-medium text-[var(--text-muted)]">kg CO₂e / week</span>
                  <button
                    onClick={() => setEditingTarget(true)}
                    className="rounded-full bg-[var(--bg-cream)] border border-[var(--border-soft)] px-3 py-1 text-xs font-bold text-[var(--forest)] hover:bg-[var(--lime)] hover:text-white hover:border-[var(--lime)] transition-all shadow-sm"
                  >
                    ✏️ Edit
                  </button>
                </div>
              </div>
            )}
          </MetricCard>
        </div>
      </section>

      {/* ============ CATEGORY QUICK CHIPS ============ */}
      {stats.categoryBreakdown.length > 0 && (
        <section aria-label="Category breakdown chips" className="animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
          <div className="flex flex-wrap gap-3">
            {stats.categoryBreakdown.map((cat) => (
              <div
                key={cat.category}
                className="flex items-center gap-2.5 rounded-2xl bg-[var(--surface)] border border-[var(--border-soft)] px-4 py-3 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02]"
                style={{ boxShadow: "var(--shadow-card)" }}
              >
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-lg"
                  style={{ backgroundColor: `${CATEGORY_COLORS[cat.category] ?? "#6B7F6B"}15` }}
                >
                  {CATEGORY_ICONS[cat.category] ?? "📦"}
                </span>
                <div>
                  <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">{cat.category}</p>
                  <p className="text-sm font-black text-[var(--forest-dark)]">{formatCo2(cat.totalCo2)}</p>
                </div>
                {stats.weeklyCo2 > 0 && (
                  <span
                    className="ml-1 rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                    style={{ backgroundColor: CATEGORY_COLORS[cat.category] ?? "#6B7F6B" }}
                  >
                    {Math.round((cat.totalCo2 / stats.weeklyCo2) * 100)}%
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ============ WEEKLY BUDGET GAUGE ============ */}
      <section aria-label="Weekly budget progress" className="animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
        <div className="flex justify-between items-baseline mb-3 px-1">
          <h2 className="text-base font-bold text-[var(--forest-dark)] tracking-tight">
            Weekly Budget
          </h2>
          <span className="text-xs text-[var(--text-muted)] font-medium bg-[var(--bg-cream)] px-3 py-1 rounded-full border border-[var(--border-soft)]">
            {formatDateRange(stats.weekStart, stats.weekEnd)}
          </span>
        </div>
        <div
          className="rounded-2xl bg-[var(--surface)] border border-[var(--border-soft)] p-6"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <BudgetBar current={stats.weeklyCo2} target={stats.weeklyTarget} largestContributor={stats.largestContributor} weekStart={stats.weekStart} />
        </div>
      </section>

      {/* ============ CATEGORY BREAKDOWN CHART ============ */}
      <section aria-label="Category breakdown" className="animate-fade-in-up" style={{ animationDelay: "0.25s" }}>
        <h2 className="text-base font-bold text-[var(--forest-dark)] mb-3 px-1 tracking-tight">
          CO₂ by Category
        </h2>
        <div
          className="rounded-2xl bg-[var(--surface)] border border-[var(--border-soft)] p-6"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          {stats.categoryBreakdown.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-4xl block mb-3" aria-hidden="true">🍃</span>
              <p className="text-[var(--text-muted)] font-medium">
                No activities logged this week. Start by recording your first activity.
              </p>
            </div>
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
                      contentStyle={{
                        borderRadius: "12px",
                        border: "1px solid var(--border-soft)",
                        background: "var(--surface)",
                        boxShadow: "var(--shadow-elevated)",
                        fontSize: "13px",
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="w-full md:w-2/3 flex flex-col gap-4">
                {stats.largestContributor && stats.weeklyCo2 > 0 && (
                  <div className="rounded-xl bg-[var(--insight-bg)] border border-[var(--insight-border)] p-4">
                    <p className="text-sm text-[var(--insight-text)]">
                      <span className="font-black text-base block mb-1">💡 Insight</span>
                      {stats.largestContributor} is{" "}
                      <strong>{Math.round((stats.categoryBreakdown[0].totalCo2 / stats.weeklyCo2) * 100)}%</strong> of your footprint this week.
                    </p>
                  </div>
                )}
                <ul className="space-y-1">
                  {stats.categoryBreakdown.map((cat, idx) => (
                    <li
                      key={cat.category}
                      className="flex items-center justify-between rounded-xl px-4 py-3 hover:bg-[var(--bg-cream)] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="inline-block w-3 h-3 rounded-full shadow-sm"
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

      {/* ============ QUICK LOG ============ */}
      <section aria-label="Quick log" className="animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
        <h2 className="text-base font-bold text-[var(--forest-dark)] mb-3 px-1 tracking-tight">
          Quick Log
        </h2>
        <form
          onSubmit={handleQuickLog}
          className="rounded-2xl bg-[var(--surface)] border border-[var(--border-soft)] p-6 flex flex-col sm:flex-row items-end gap-4 relative"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <div className="flex-1 w-full">
            <label
              htmlFor="ql-type"
              className="block text-[11px] font-bold text-[var(--text-muted)] mb-2 uppercase tracking-widest"
            >
              Activity
            </label>
            <select
              id="ql-type"
              value={qlType}
              onChange={(e) => setQlType(e.target.value)}
              className="w-full rounded-xl border border-[var(--border-soft)] bg-[var(--bg-cream)] px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--lime)] transition-shadow"
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
              className="block text-[11px] font-bold text-[var(--text-muted)] mb-2 uppercase tracking-widest"
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
              className="w-full rounded-xl border border-[var(--border-soft)] bg-[var(--bg-cream)] px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--lime)] transition-shadow"
            />
          </div>

          <button
            type="submit"
            disabled={qlSubmitting}
            className="rounded-xl px-6 py-3 text-sm font-bold text-white disabled:opacity-50 transition-all whitespace-nowrap shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: "var(--gradient-primary)" }}
          >
            {qlSubmitting ? "Logging…" : "Log Activity"}
          </button>

          {qlSuccess && (
            <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 text-[var(--lime)] text-sm font-bold animate-fade-in-up">
              ✓ Logged!
            </span>
          )}
        </form>
      </section>

      {/* ============ RECENT ACTIVITY ============ */}
      <section aria-label="Recent activity" className="animate-fade-in-up" style={{ animationDelay: "0.35s" }}>
        <h2 className="text-base font-bold text-[var(--forest-dark)] mb-3 px-1 tracking-tight">
          Recent Activity
        </h2>
        <div
          className="rounded-2xl bg-[var(--surface)] border border-[var(--border-soft)] overflow-hidden"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          {stats.recentActivities.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-4xl block mb-3" aria-hidden="true">📝</span>
              <p className="text-[var(--text-muted)] font-medium">
                No activities yet — use Quick Log above or visit the Log page!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border-soft)]">
              {stats.recentActivities.map((act) => (
                <div
                  key={act.id}
                  className="flex items-center justify-between px-5 py-4 hover:bg-[var(--bg-cream)] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-10 w-10 items-center justify-center rounded-xl text-lg"
                      style={{ backgroundColor: "var(--bg-cream)" }}
                      aria-hidden="true"
                    >
                      {CATEGORY_ICONS[act.type] ?? "📦"}
                    </span>
                    <div>
                      <p className="text-sm font-bold text-[var(--forest-dark)]">
                        {ACTIVITY_OPTIONS.find(o => o.value === act.type)?.label || act.type}
                        {act.outlier && (
                          <span className="ml-2 inline-block rounded-full bg-amber-100 dark:bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-400 uppercase">
                            Outlier
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
                  <span className="text-sm font-black text-[var(--forest-dark)] bg-[var(--bg-cream)] rounded-full px-3 py-1">
                    {formatCo2(act.co2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ============ ADMIN TOOLS ============ */}
      <section aria-label="Developer tools" className="pt-6 border-t border-[var(--border-soft)] mt-4 flex justify-center gap-6 text-sm">
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
          className="text-[var(--text-muted)] hover:text-[var(--lime)] font-medium transition-colors"
        >
          Load Sample Data
        </button>
      </section>
    </div>
  );
}
