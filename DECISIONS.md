# Decision Points — PlanetPulse

## DP1: The Nudge

**What does the app do when the weekly target is crossed: warn, encourage, shame, block?**

We chose a **"Restorative Pacing"** model. When the weekly CO₂ budget is exceeded, the app does not block further logging (which would cause users to abandon tracking entirely) nor does it shame the user (which behavioral research shows triggers avoidance rather than behavior change). Instead, the dashboard transitions from its standard green "Budget Mode" into an amber "Restoration Mode." In this state, the primary metric shifts from cumulative emissions to a compensatory action exchange — for example, "Swapping 2 non-veg meals to veg this weekend absorbs the 3.0 kg overage." The visual palette softens to amber rather than displaying aggressive red error banners, framing the overage as a recoverable situation rather than a failure. This approach is grounded in self-determination theory: autonomy-supportive nudges sustain engagement better than punitive ones.

## DP2: Absurd Input

**How do you treat an obviously wrong entry, like a 500,000 km car trip?**

We use **context-aware statistical sanity checking with soft override**. Hard validation limits (e.g., HTML `max=10000`) would break legitimate edge cases such as a user batch-logging annual fleet mileage or recording a long-haul international flight series. Instead, PlanetPulse applies a two-tier check: if an input exceeds 3 standard deviations above the reasonable daily maximum for that activity type (e.g., >1,000 km/day for car travel), the app shows an inline amber confirmation prompt: "That's a very long trip — did you mean [quantity] km, or is this a batch entry?" If the user confirms intentionally, the activity is accepted but tagged with an `[Outlier / Batch Entry]` flag in the history timeline. This prevents the entry from silently skewing rolling averages while preserving data integrity and user trust.

## DP3: The Week

**When does a "week" start, and how is mid-week progress shown?**

We use a **rolling 7-day window** rather than a fixed Monday–Sunday calendar week. Fixed calendar weeks create two behavioral pathologies: "Sunday panic" (cramming emission reductions before the week resets) and "Monday apathy" (feeling that a fresh week means past overages don't matter). A rolling window means every day carries equal weight — the budget always reflects your most recent 7 days of activity. Mid-week progress is shown as a burn-down gauge: a horizontal progress bar with the remaining CO₂ budget in kilograms, color-coded green (<70% used), amber (70–100%), and entering Restorative Mode when exceeded. This continuous feedback loop encourages steady behavioral adjustment rather than binge-and-purge cycles.
