"use client";

import { useState } from "react";

/* ---------- Constants ---------- */

const ACTIVITIES = [
  { value: "car", label: "Car", icon: "🚗", unit: "km", factor: 0.21 },
  { value: "bus", label: "Bus", icon: "🚌", unit: "km", factor: 0.089 },
  { value: "flight", label: "Flight", icon: "✈️", unit: "km", factor: 0.255 },
  {
    value: "electricity",
    label: "Electricity",
    icon: "⚡",
    unit: "kWh",
    factor: 0.475,
  },
  {
    value: "veg_meal",
    label: "Veg Meal",
    icon: "🥗",
    unit: "meals",
    factor: 0.5,
  },
  {
    value: "non_veg_meal",
    label: "Non-Veg Meal",
    icon: "🍖",
    unit: "meals",
    factor: 3.0,
  },
] as const;

/** Thresholds above which the input is considered absurd / worth confirming */
const ABSURD_THRESHOLDS: Record<string, number> = {
  car: 1000,
  bus: 1000,
  flight: 20000,
  electricity: 5000,
  veg_meal: 50,
  non_veg_meal: 50,
};

/* ---------- Page ---------- */

export default function LogPage() {
  const [selected, setSelected] = useState("car");
  const [quantity, setQuantity] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Absurd-input confirmation flow (DP2)
  const [showAbsurdConfirm, setShowAbsurdConfirm] = useState(false);

  const activity = ACTIVITIES.find((a) => a.value === selected)!;
  const qty = parseFloat(quantity) || 0;
  const previewCo2 = qty * activity.factor;
  const isAbsurd =
    qty > 0 && ABSURD_THRESHOLDS[selected] !== undefined
      ? qty > ABSURD_THRESHOLDS[selected]
      : false;

  /* -- Submit logic -- */
  async function doSubmit(flagOutlier: boolean) {
    try {
      setSubmitting(true);
      setError(null);
      const res = await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: selected,
          quantity: qty,
          ...(flagOutlier ? { outlier: true } : {}),
        }),
      });
      if (!res.ok) throw new Error("Failed to log activity");
      setQuantity("");
      setShowAbsurdConfirm(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSubmitting(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (qty <= 0) return;

    if (isAbsurd && !showAbsurdConfirm) {
      setShowAbsurdConfirm(true);
      return;
    }

    doSubmit(showAbsurdConfirm);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Title */}
      <header>
        <h1 className="text-2xl font-bold text-[var(--text)]">Log Activity</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Choose an activity type, enter the quantity, and log your carbon
          footprint.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* ---------- Activity Selector ---------- */}
        <fieldset>
          <legend className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-3">
            Activity Type
          </legend>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {ACTIVITIES.map((act) => {
              const isActive = selected === act.value;
              return (
                <button
                  key={act.value}
                  type="button"
                  onClick={() => {
                    setSelected(act.value);
                    setShowAbsurdConfirm(false);
                  }}
                  className={`flex flex-col items-center gap-1.5 rounded-2xl border-2 p-4 transition-all
                    ${
                      isActive
                        ? "border-emerald-600 bg-emerald-50 shadow-sm"
                        : "border-[var(--border)] bg-white hover:border-emerald-300 hover:bg-emerald-50/40"
                    }`}
                  aria-pressed={isActive}
                >
                  <span className="text-3xl">{act.icon}</span>
                  <span
                    className={`text-sm font-medium ${
                      isActive
                        ? "text-emerald-800"
                        : "text-[var(--text-muted)]"
                    }`}
                  >
                    {act.label}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

        {/* ---------- Quantity ---------- */}
        <div>
          <label
            htmlFor="quantity"
            className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2"
          >
            Quantity ({activity.unit})
          </label>
          <div className="flex items-center gap-3">
            <input
              id="quantity"
              type="number"
              min={0}
              step="any"
              required
              value={quantity}
              onChange={(e) => {
                setQuantity(e.target.value);
                setShowAbsurdConfirm(false);
              }}
              placeholder={`Enter ${activity.unit}`}
              className="flex-1 rounded-xl border border-[var(--border)] px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-shadow"
            />
            <span className="text-sm text-[var(--text-muted)] font-medium min-w-[3rem]">
              {activity.unit}
            </span>
          </div>
        </div>

        {/* ---------- Live CO₂ Preview ---------- */}
        {qty > 0 && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 flex items-center justify-between">
            <span className="text-sm font-medium text-emerald-800">
              Estimated CO₂
            </span>
            <span className="text-2xl font-bold text-emerald-700">
              {previewCo2 >= 1000
                ? `${(previewCo2 / 1000).toFixed(2)} t`
                : `${previewCo2.toFixed(2)} kg`}{" "}
              <span className="text-sm font-normal">CO₂e</span>
            </span>
          </div>
        )}

        {/* ---------- DP2 — Absurd Input Confirmation ---------- */}
        {showAbsurdConfirm && (
          <div className="rounded-xl bg-amber-50 border border-amber-300 p-4 space-y-3">
            <p className="text-amber-800 font-semibold">
              🤔 That&apos;s a very long trip!
            </p>
            <p className="text-sm text-amber-700">
              Did you mean <strong>{qty}</strong> {activity.unit}, or is this a
              batch / fleet entry?
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => doSubmit(true)}
                disabled={submitting}
                className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50 transition-colors"
              >
                {submitting ? "Logging…" : "Confirm (tag as outlier)"}
              </button>
              <button
                type="button"
                onClick={() => setShowAbsurdConfirm(false)}
                className="rounded-lg border border-amber-300 px-4 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100 transition-colors"
              >
                Edit
              </button>
            </div>
          </div>
        )}

        {/* ---------- Submit ---------- */}
        {!showAbsurdConfirm && (
          <button
            type="submit"
            disabled={submitting || qty <= 0}
            className="w-full rounded-xl bg-emerald-600 py-3 text-base font-semibold text-white hover:bg-emerald-700 disabled:opacity-40 transition-colors"
          >
            {submitting ? "Logging…" : "Log Activity"}
          </button>
        )}

        {/* ---------- Error ---------- */}
        {error && (
          <p className="text-sm text-red-600 font-medium text-center">
            {error}
          </p>
        )}

        {/* ---------- Success Toast ---------- */}
        {success && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-300 p-4 text-center space-y-2">
            <p className="text-emerald-800 font-semibold">
              ✅ Activity logged successfully!
            </p>
            <button
              type="button"
              onClick={() => {
                setSuccess(false);
                setQuantity("");
              }}
              className="text-sm font-medium text-emerald-600 hover:text-emerald-800 underline"
            >
              Log another activity
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
