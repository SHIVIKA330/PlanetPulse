import { EMISSION_FACTORS, Stats, Activity } from "./store";

export interface AIActionPayload {
  type: "ADD_ACTIVITY" | "SET_TARGET";
  activityType?: Activity["type"];
  quantity?: number;
  unit?: string;
  target_kg?: number;
  label?: string;
}

export interface AIResponse {
  markdown: string;
  action?: AIActionPayload;
  suggestions?: string[];
}

/**
  Parse natural language intent to extract quick activity log commands.
 */
export function parseIntentForActivity(text: string): AIActionPayload | null {
  const lower = text.toLowerCase();

  // Pattern matching for logging activities
  // e.g. "log 30 km car", "drove 50 km", "car 25km", "took bus for 15 km"
  const numMatch = lower.match(/\b(\d+(?:\.\d+)?)\s*(km|kwh|meals?|meal)?\b/i);
  const qty = numMatch ? parseFloat(numMatch[1]) : null;

  if (qty && qty > 0) {
    if (lower.includes("car") || lower.includes("drove") || lower.includes("drive")) {
      return {
        type: "ADD_ACTIVITY",
        activityType: "car",
        quantity: qty,
        unit: "km",
        label: `Log ${qty} km Car Travel`,
      };
    }
    if (lower.includes("bus") || lower.includes("transit") || lower.includes("shuttle")) {
      return {
        type: "ADD_ACTIVITY",
        activityType: "bus",
        quantity: qty,
        unit: "km",
        label: `Log ${qty} km Bus Ride`,
      };
    }
    if (lower.includes("flight") || lower.includes("plane") || lower.includes("flew") || lower.includes("fly")) {
      return {
        type: "ADD_ACTIVITY",
        activityType: "flight",
        quantity: qty,
        unit: "km",
        label: `Log ${qty} km Flight`,
      };
    }
    if (lower.includes("electricity") || lower.includes("power") || lower.includes("kwh") || lower.includes("energy")) {
      return {
        type: "ADD_ACTIVITY",
        activityType: "electricity",
        quantity: qty,
        unit: "kWh",
        label: `Log ${qty} kWh Electricity`,
      };
    }
    if (lower.includes("veg") || lower.includes("vegetarian") || lower.includes("plant")) {
      return {
        type: "ADD_ACTIVITY",
        activityType: "veg_meal",
        quantity: qty,
        unit: "meals",
        label: `Log ${qty} Vegetarian Meal(s)`,
      };
    }
    if (lower.includes("meat") || lower.includes("non-veg") || lower.includes("non veg") || lower.includes("chicken") || lower.includes("beef") || lower.includes("pork")) {
      return {
        type: "ADD_ACTIVITY",
        activityType: "non_veg_meal",
        quantity: qty,
        unit: "meals",
        label: `Log ${qty} Non-Veg Meal(s)`,
      };
    }
  }

  // Target setting intent: e.g., "set target to 80 kg", "target 75"
  const targetMatch = lower.match(/(?:set|change|update)?\s*target\s*(?:to|=)?\s*(\d+(?:\.\d+)?)/i);
  if (targetMatch && parseFloat(targetMatch[1]) > 0) {
    const targetVal = parseFloat(targetMatch[1]);
    return {
      type: "SET_TARGET",
      target_kg: targetVal,
      label: `Set Weekly Target to ${targetVal} kg CO₂`,
    };
  }

  return null;
}

/**
 * Generate intelligent Eco AI Bot assistant responses based on prompt and user stats.
 */
export function generateEcoResponse(userMessage: string, stats?: Stats | null): AIResponse {
  const query = userMessage.trim().toLowerCase();
  const action = parseIntentForActivity(query);

  // Default default stats if null
  const totalCo2 = stats?.total_co2_kg ?? 0;
  const weeklyCo2 = stats?.weekly_co2_kg ?? 0;
  const weeklyTarget = stats?.weekly_target_kg ?? 100;
  const isExceeded = stats?.exceeded ?? false;
  const topCategory = stats?.categories && stats.categories.length > 0 ? stats.categories[0] : null;

  // 1. Actionable Intent (Log or Target)
  if (action) {
    if (action.type === "ADD_ACTIVITY" && action.activityType && action.quantity) {
      const factorObj = EMISSION_FACTORS[action.activityType];
      const co2 = Math.round(action.quantity * factorObj.factor * 100) / 100;
      return {
        markdown: `I detected a log request! 🌿\n\n**Details:**\n- **Activity**: ${factorObj.label}\n- **Amount**: ${action.quantity} ${action.unit}\n- **Est. CO₂**: **\`${co2} kg CO₂\`** (factor: \`${factorObj.factor} kg/${action.unit}\`)\n\nClick the button below to log this directly to your PlanetPulse record!`,
        action,
        suggestions: [
          "📊 Analyze my updated footprint",
          "💡 How can I offset this trip?",
          "✏️ Log 15 km bus trip",
        ],
      };
    }
    if (action.type === "SET_TARGET" && action.target_kg) {
      return {
        markdown: `I can update your weekly CO₂ allowance target to **\`${action.target_kg} kg CO₂\`**.\n\nSetting a realistic budget helps you track progress against weekly thresholds. Click below to confirm!`,
        action,
        suggestions: ["📊 View current weekly status", "💡 Tips to stay under budget"],
      };
    }
  }

  // 2. Footprint Audit / Analysis
  if (query.includes("analyze") || query.includes("audit") || query.includes("footprint") || query.includes("summary") || query.includes("how am i doing")) {
    const percentageUsed = Math.min(100, Math.round((weeklyCo2 / (weeklyTarget || 1)) * 100));
    let statusText = "🟢 **Great Job!** You are well within your budget.";
    if (isExceeded) {
      statusText = "🚨 **Warning:** You have exceeded your weekly target!";
    } else if (percentageUsed > 80) {
      statusText = "⚠️ **Caution:** You are close to your weekly target threshold.";
    }

    let breakdownText = "No activities logged this week yet.";
    if (stats?.categories && stats.categories.length > 0) {
      breakdownText = stats.categories
        .map((c) => `- **${c.label}**: ${c.total_kg} kg CO₂ (${c.percentage}%)`)
        .join("\n");
    }

    return {
      markdown: `### 📊 Real-Time Footprint Analysis\n\n${statusText}\n\n- **Weekly Output**: **\`${weeklyCo2} kg CO₂\`** / **\`${weeklyTarget} kg\`** target (${percentageUsed}% used)\n- **All-Time Cumulative**: **\`${totalCo2} kg CO₂\`**\n- **Logged Items**: ${stats?.activity_count ?? 0} activities\n\n#### 📈 Category Breakdown\n${breakdownText}\n\n${
        topCategory
          ? `💡 **Primary Driver**: Your biggest impact area is **${topCategory.label}** (${topCategory.total_kg} kg CO₂). Reducing this by 20% would save ~${(topCategory.total_kg * 0.2).toFixed(1)} kg CO₂ per week!`
          : "Try logging an activity to unlock personalized optimization insights."
      }`,
      suggestions: [
        "💡 How to reduce " + (topCategory ? topCategory.label : "emissions"),
        "🚗 Compare car vs bus",
        "🎯 Adjust weekly target",
      ],
    };
  }

  // 3. Food / Diet reduction tips
  if (query.includes("food") || query.includes("meal") || query.includes("eat") || query.includes("veg") || query.includes("diet")) {
    return {
      markdown: `### 🥗 Dietary Carbon Insights\n\nIn PlanetPulse, food emissions are calculated as:\n- **Vegetarian Meal**: \`0.50 kg CO₂ / meal\`\n- **Non-Vegetarian Meal**: \`2.00 kg CO₂ / meal\` *(4x higher!)*\n\n#### 🌿 3 High-Impact Swaps:\n1. **Meatless Mondays**: Replacing 3 non-veg meals with plant-based alternatives saves **\`4.5 kg CO₂\`** weekly (equivalent to driving 22.5 km!).\n2. **Local & Seasonal Produce**: Reduces refrigerated transport footprint.\n3. **Minimize Food Waste**: Composting organic waste prevents methane creation.\n\nWould you like to log a plant-based meal?`,
      suggestions: ["✏️ Log 2 veg meals", "✏️ Log 1 non veg meal", "📊 Analyze my footprint"],
    };
  }

  // 4. Travel & Transport comparisons
  if (query.includes("car") || query.includes("bus") || query.includes("travel") || query.includes("drive") || query.includes("commute") || query.includes("flight")) {
    return {
      markdown: `### 🚗 Travel & Commute Comparison\n\nHere is how transport modes stack up per kilometer in PlanetPulse:\n\n| Mode | Emission Factor | 30 km Trip CO₂ |\n|---|---|---|\n| 🚌 **Bus / Transit** | \`0.08 kg/km\` | **2.40 kg CO₂** |\n| 🚗 **Car Travel** | \`0.20 kg/km\` | **6.00 kg CO₂** |\n| ✈️ **Flight** | \`0.25 kg/km\` | **7.50 kg CO₂** |\n\n💡 **Key Takeaway**: Taking public transit instead of solo driving cuts your commute footprint by **60%**! Carpooling with 2 colleagues drops your net individual impact down to ~2.0 kg CO₂.`,
      suggestions: ["✏️ Log 30 km bus", "✏️ Log 30 km car", "⚡ Electricity reduction tips"],
    };
  }

  // 5. Electricity & Energy tips
  if (query.includes("electricity") || query.includes("power") || query.includes("energy") || query.includes("solar") || query.includes("kwh")) {
    return {
      markdown: `### ⚡ Electricity & Home Energy Insights\n\nElectricity has the highest single unit factor in PlanetPulse at **\`0.80 kg CO₂ per kWh\`**.\n\n#### 💡 Quick Savings Guide:\n- **LED Lighting Conversion**: Reduces lighting energy consumption by up to **75%**.\n- **Unplug Phantom Devices**: Appliances in standby account for 5-10% of home power draw.\n- **Smart Thermostat Settings**: Adjusting your HVAC by 1-2°C saves ~1.5 kWh per day (\`1.2 kg CO₂\` daily).\n- **Solar Energy Transition**: Can eliminate home electricity emissions entirely!`,
      suggestions: ["✏️ Log 10 kWh electricity", "📊 Analyze my footprint", "🎯 Set weekly target"],
    };
  }

  // 6. Weekly Target advice
  if (query.includes("target") || query.includes("goal") || query.includes("budget") || query.includes("limit")) {
    const isEx = isExceeded;
    return {
      markdown: `### 🎯 Weekly CO₂ Target Advisor\n\nYour current weekly target is **\`${weeklyTarget} kg CO₂\`**.\n\n- Current Usage: **\`${weeklyCo2} kg CO₂\`** (${isEx ? "🚨 Exceeded" : "🟢 On Track"})\n\n#### 💡 Recommended Target Guidelines:\n- 🌿 **Eco Champion**: \`50 kg / week\` (~7.1 kg/day)\n- ⚖️ **Balanced Citizen**: \`100 kg / week\` (~14.2 kg/day)\n- 🚗 **High Mobility**: \`180 kg / week\` (~25.7 kg/day)\n\nWould you like me to adjust your weekly target?`,
      suggestions: ["✏️ Set target to 80", "✏️ Set target to 50", "💡 How to reduce emissions"],
    };
  }

  // 7. General / Friendly greeting or fallback response
  return {
    markdown: `Hello! I'm **EcoBot AI**, your personal carbon & sustainability assistant for **PlanetPulse** 🌿.\n\nI can analyze your real-time carbon data, calculate emissions for travel, meals, & electricity, provide tailored eco hacks, or log activities directly for you!\n\n#### 💡 Try asking me:\n- *"Analyze my carbon footprint stats"* \n- *"How can I lower my food emissions this week?"*\n- *"Log a 25 km car ride for me"*\n- *"Compare driving vs taking the bus for 30 km"*\n- *"What is the emission factor for electricity?"*`,
    suggestions: [
      "📊 Analyze my footprint",
      "💡 Tips to reduce food emissions",
      "🚗 Compare car vs bus",
      "✏️ Log 20 km car trip",
    ],
  };
}
