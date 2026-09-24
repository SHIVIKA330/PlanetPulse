"use client";

import { useState } from "react";

/* ---------- Constants ---------- */

const ACTIVITIES = [
  { value: "car", label: "Car", icon: "🚗", unit: "km", factor: 0.20 },
  { value: "bus", label: "Bus", icon: "🚌", unit: "km", factor: 0.08 },
  { value: "flight", label: "Flight", icon: "✈️", unit: "km", factor: 0.25 },
  {
    value: "electricity",
    label: "Electricity",
    icon: "⚡",
    unit: "kWh",
    factor: 0.80,
  },
  {
    value: "veg_meal",
    label: "Veg Meal",
    icon: "🥗",
    unit: "meals / servings",
    factor: 0.5,
  },
  {
    value: "non_veg_meal",
    label: "Non-Veg Meal",
    icon: "🍖",
    unit: "meals / servings",
    factor: 2.0,
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
                  className={`flex flex-col items-center gap-2 rounded-[24px] border-2 p-5 transition-all
                    ${
                      isActive
                        ? "border-[var(--lime)] bg-[var(--insight-bg)] shadow-sm scale-105"
                        : "border-[var(--border-soft)] bg-[var(--surface)] hover:border-[var(--lime)] hover:bg-[var(--bg-cream)]"
                    }`}
                  aria-pressed={isActive}
                >
                  <span className="text-3xl">{act.icon}</span>
                  <span
                    className={`text-sm font-bold tracking-tight ${
                      isActive
                        ? "text-[var(--insight-text)]"
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
            className="block text-xs font-bold uppercase tracking-wider text-[var(--forest-dark)] mb-2"
          >
            {activity.value === 'car' || activity.value === 'bus' || activity.value === 'flight' 
              ? 'Quantity (km)' 
              : activity.value === 'electricity' 
              ? 'Quantity (kWh)' 
              : 'Quantity (meals / servings)'}
          </label>
          <div className="flex items-center gap-3">
            <input
              id="quantity"
              data-testid="quantity-input"
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
              className="flex-1 rounded-full border border-[var(--border-soft)] bg-[var(--surface)] px-5 py-4 text-lg focus:outline-none focus:ring-2 focus:ring-[var(--lime)] transition-shadow shadow-sm"
            />
            <span className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-widest min-w-[3rem]">
              {activity.unit}
            </span>
          </div>
        </div>

        {/* ---------- Live CO₂ Preview ---------- */}
        {qty > 0 && (
          <div className="rounded-[24px] bg-[var(--insight-bg)] border border-[var(--insight-border)] p-5 flex items-center justify-between shadow-sm" data-testid="live-preview">
            <span className="text-sm font-bold text-[var(--insight-text)]">
              Estimated CO₂
            </span>
            <span className="text-2xl font-black text-[var(--insight-text)]">
              {previewCo2 >= 1000
                ? `${(previewCo2 / 1000).toFixed(2)} t`
                : `${previewCo2.toFixed(2)} kg`}{" "}
              <span className="text-sm font-bold">CO₂e</span>
            </span>
          </div>
        )}

        {/* ---------- DP2 — Absurd Input Confirmation ---------- */}
        {showAbsurdConfirm && (
          <div className="rounded-[24px] bg-[var(--warning)]/10 border border-[var(--warning)]/30 p-5 space-y-3" data-testid="absurd-warning">
            <p className="text-[var(--warning)] font-bold">
              ⚠️ {
                (selected === "car" || selected === "bus") && qty >= 500000
                  ? "500,000 km is over 12× around the Earth. Did you mean 500?"
                  : (selected === "car" || selected === "bus") && qty > 40000
                  ? `${qty.toLocaleString()} km is further than the circumference of the Earth!`
                  : selected === "flight" && qty > 300000
                  ? "That distance is almost to the Moon! Did you mean a smaller value?"
                  : (selected.includes("meal")) && qty >= 1000
                  ? `${qty.toLocaleString()} meals is enough to feed a village! Did you mean a smaller value?`
                  : "That quantity appears unusually high."
              }
            </p>
            <p className="text-sm text-[var(--text-main)] opacity-80 font-medium">
              Please check the value before logging this activity. Is <strong>{qty}</strong> {activity.unit} correct?
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                data-testid="confirm-absurd"
                onClick={() => doSubmit(true)}
                disabled={submitting}
                className="rounded-full bg-[var(--warning)] px-5 py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50 transition-colors shadow-sm"
              >
                {submitting ? "Logging…" : "Yes, log it anyway"}
              </button>
              <button
                type="button"
                onClick={() => setShowAbsurdConfirm(false)}
                className="rounded-full border border-[var(--warning)] px-5 py-2.5 text-sm font-bold text-[var(--warning)] hover:bg-[var(--warning)]/10 transition-colors"
              >
                Edit value
              </button>
            </div>
          </div>
        )}

        {/* ---------- Submit ---------- */}
        {!showAbsurdConfirm && (
          <button
            type="submit"
            data-testid="submit-activity"
            disabled={submitting || qty <= 0}
            className="w-full rounded-full bg-[var(--lime)] py-4 text-[15px] font-bold text-white hover:bg-[var(--lime-hover)] disabled:opacity-40 transition-colors shadow-sm"
          >
            {submitting ? "Logging…" : "Log Activity"}
          </button>
        )}

        {/* ---------- Error ---------- */}
        {error && (
          <p className="text-sm text-[var(--danger)] font-bold text-center">
            {error}
          </p>
        )}

        {/* ---------- Success Toast ---------- */}
        {success && (
          <div className="rounded-[24px] bg-[var(--insight-bg)] border border-[var(--insight-border)] p-5 text-center space-y-2 shadow-sm">
            <p className="text-[var(--insight-text)] font-bold">
              ✅ Activity logged successfully!
            </p>
            <button
              type="button"
              onClick={() => {
                setSuccess(false);
                setQuantity("");
              }}
              className="text-sm font-bold text-[var(--forest)] hover:text-[var(--lime)] underline"
            >
              Log another activity
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
