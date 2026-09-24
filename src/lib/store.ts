export interface Activity {
  id: string;
  type: 'car' | 'bus' | 'flight' | 'electricity' | 'veg_meal' | 'non_veg_meal';
  quantity: number;
  unit: string;
  co2_kg: number;
  outlier: boolean;
  created_at: string; // ISO date
}

export interface WeeklyTarget {
  target_kg: number;
  updated_at: string;
}

export interface CategoryStat {
  type: Activity['type'];
  label: string;
  total_kg: number;
  count: number;
  percentage: number;
}

export interface Stats {
  total_co2_kg: number;
  weekly_co2_kg: number;
  weekly_target_kg: number;
  exceeded: boolean;
  categories: CategoryStat[];
  activity_count: number;
  week_start: string;
  week_end: string;
}

export interface DashboardData {
  stats: Stats;
  recent_activities: Activity[];
  weekly_target: WeeklyTarget;
}

export interface ActivityFilters {
  type?: Activity['type'];
  start_date?: string;
  end_date?: string;
}

// CO2 emission factors (fixed by competition spec)
export const EMISSION_FACTORS: Record<Activity['type'], { factor: number; unit: string; label: string }> = {
  car: { factor: 0.20, unit: 'km', label: 'Car Travel' },
  bus: { factor: 0.08, unit: 'km', label: 'Bus Travel' },
  flight: { factor: 0.25, unit: 'km', label: 'Flight' },
  electricity: { factor: 0.80, unit: 'kWh', label: 'Electricity' },
  veg_meal: { factor: 0.50, unit: 'meals', label: 'Vegetarian Meal' },
  non_veg_meal: { factor: 2.00, unit: 'meals', label: 'Non-Veg Meal' },
};

// Outlier thresholds: quantities above these are flagged (≈ 3 std deviations above reasonable daily max)
const OUTLIER_THRESHOLDS: Record<Activity['type'], number> = {
  car: 1000,       // km
  bus: 500,         // km
  flight: 20000,    // km
  electricity: 500, // kWh
  veg_meal: 20,     // meals
  non_veg_meal: 20, // meals
};

// ---------------------------------------------------------------------------
// In-memory store
// ---------------------------------------------------------------------------

let activities: Activity[] = [];
let weeklyTarget: WeeklyTarget = {
  target_kg: 100, // sensible default
  updated_at: new Date().toISOString(),
};

let nextIdCounter = 1;

function generateId(): string {
  return `act_${Date.now()}_${nextIdCounter++}`;
}

// ---------------------------------------------------------------------------
// Core helpers
// ---------------------------------------------------------------------------

/** Calculate CO2 in kg for a given activity type and quantity. */
export function calculateCO2(type: Activity['type'], quantity: number): number {
  const factor = EMISSION_FACTORS[type];
  if (!factor) {
    throw new Error(`Unknown activity type: ${type}`);
  }
  return Math.round(quantity * factor.factor * 1000) / 1000; // 3 decimal places
}

/** Return activities whose created_at falls within [startDate, endDate]. */
export function getActivitiesInWindow(startDate: Date, endDate: Date): Activity[] {
  const startMs = startDate.getTime();
  const endMs = endDate.getTime();
  return activities.filter((a) => {
    const ts = new Date(a.created_at).getTime();
    return ts >= startMs && ts <= endMs;
  });
}

// ---------------------------------------------------------------------------
// Store API
// ---------------------------------------------------------------------------

/**
 * Add a new activity. Validates input, calculates CO2, detects outliers.
 * Returns the created Activity.
 */
export function addActivity(
  type: Activity['type'],
  quantity: number,
): Activity {
  // Validate type
  if (!EMISSION_FACTORS[type]) {
    throw new Error(`Invalid activity type: "${type}". Must be one of: ${Object.keys(EMISSION_FACTORS).join(', ')}`);
  }

  // Validate quantity
  if (typeof quantity !== 'number' || !isFinite(quantity) || quantity <= 0) {
    throw new Error('Quantity must be a positive number.');
  }

  const co2_kg = calculateCO2(type, quantity);
  const outlier = quantity > OUTLIER_THRESHOLDS[type];

  const activity: Activity = {
    id: generateId(),
    type,
    quantity,
    unit: EMISSION_FACTORS[type].unit,
    co2_kg,
    outlier,
    created_at: new Date().toISOString(),
  };

  activities.push(activity);
  return activity;
}

/**
 * Get activities, optionally filtered by type and/or date range.
 * Returns newest-first.
 */
export function getActivities(filters?: ActivityFilters): Activity[] {
  let result = [...activities];

  if (filters?.type) {
    result = result.filter((a) => a.type === filters.type);
  }

  if (filters?.start_date) {
    const startMs = new Date(filters.start_date).getTime();
    result = result.filter((a) => new Date(a.created_at).getTime() >= startMs);
  }

  if (filters?.end_date) {
    const endMs = new Date(filters.end_date).getTime();
    result = result.filter((a) => new Date(a.created_at).getTime() <= endMs);
  }

  // Return newest first
  return result.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

/** Get a single activity by ID, or undefined if not found. */
export function getActivityById(id: string): Activity | undefined {
  return activities.find((a) => a.id === id);
}

/** Delete an activity by ID. Returns true if found and deleted, false otherwise. */
export function deleteActivity(id: string): boolean {
  const index = activities.findIndex((a) => a.id === id);
  if (index === -1) return false;
  activities.splice(index, 1);
  return true;
}

/** Set the weekly CO2 target in kg. */
export function setWeeklyTarget(target_kg: number): WeeklyTarget {
  if (typeof target_kg !== 'number' || !isFinite(target_kg) || target_kg <= 0) {
    throw new Error('Weekly target must be a positive number.');
  }
  weeklyTarget = {
    target_kg,
    updated_at: new Date().toISOString(),
  };
  return weeklyTarget;
}

/** Get the current weekly target. */
export function getWeeklyTarget(): WeeklyTarget {
  return { ...weeklyTarget };
}

/** Get dashboard statistics. */
export function getStats(): Stats {
  const allTimeTotal = activities.reduce((sum, a) => sum + a.co2_kg, 0);

  // Strict Monday -> Sunday calendar week (DP3)
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  const weekStart = new Date(now);
  weekStart.setDate(diff);
  weekStart.setHours(0, 0, 0, 0);
  
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const weekActivities = getActivitiesInWindow(weekStart, weekEnd);
  const weeklyTotal = weekActivities.reduce((sum, a) => sum + a.co2_kg, 0);

  // Per-category breakdown (for the current week, as requested by dashboard)
  const categoryMap = new Map<Activity['type'], { total_kg: number; count: number }>();
  for (const a of weekActivities) {
    const existing = categoryMap.get(a.type) ?? { total_kg: 0, count: 0 };
    existing.total_kg += a.co2_kg;
    existing.count += 1;
    categoryMap.set(a.type, existing);
  }

  const categories: CategoryStat[] = [];
  for (const [type, data] of categoryMap.entries()) {
    categories.push({
      type,
      label: EMISSION_FACTORS[type].label,
      total_kg: Math.round(data.total_kg * 1000) / 1000,
      count: data.count,
      percentage: weeklyTotal > 0
        ? Math.round((data.total_kg / weeklyTotal) * 10000) / 100
        : 0,
    });
  }

  // Sort categories by total_kg descending
  categories.sort((a, b) => b.total_kg - a.total_kg);

  return {
    total_co2_kg: Math.round(allTimeTotal * 1000) / 1000,
    weekly_co2_kg: Math.round(weeklyTotal * 1000) / 1000,
    weekly_target_kg: weeklyTarget.target_kg,
    exceeded: weeklyTotal > weeklyTarget.target_kg,
    categories,
    activity_count: activities.length,
    week_start: weekStart.toISOString(),
    week_end: weekEnd.toISOString(),
  };
}

/** Get everything the dashboard needs in a single call. */
export function getDashboardData(): DashboardData {
  const stats = getStats();
  const recent_activities = getActivities().slice(0, 10); // latest 10

  return {
    stats,
    recent_activities,
    weekly_target: getWeeklyTarget(),
  };
}
