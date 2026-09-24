# Decision Points — PlanetPulse

## DP1: The Nudge

**Decision:** 
When the weekly target is crossed, the dashboard informs and encourages the user rather than shaming or blocking them. We implemented a "Target Exceeded" feedback UI that clearly displays the overage amount and identifies their largest contributing category for the week.

**Explanation:**
Behavioral research shows that punitive measures (like blocking input or using aggressive red error states) trigger avoidance rather than habit change. By keeping logging open and using a supportive amber "nudge" that highlights the primary source of their footprint, the app maintains user trust and provides actionable awareness without fabricating insights or modifying their historical data.

## DP2: Absurd Input

**Decision:**
For obviously unrealistic values (like 500,000 km car travel), we implement an explicit verification step that prevents accidental submission without silently clamping or rejecting the data. 

**Explanation:**
Silently modifying user data violates data integrity, and strict hard-limits prevent legitimate edge cases (like batch-logging annual flights). When a user enters an unusually high quantity, the app halts the submission and displays an amber warning: "⚠️ That quantity appears unusually high. Please check the value before logging this activity." The user must explicitly click "Yes, log it anyway" to proceed, ensuring intentionality while preserving normal CRUD operations for legitimate values.

## DP3: The Week

**Decision:**
We define a week explicitly as a strict **Monday → Sunday** calendar week. The dashboard clearly displays this period (e.g., "Mon, Sep 21 – Sun, Sep 27") alongside the weekly budget.

**Explanation:**
A fixed Monday-Sunday cycle aligns with natural human planning rhythms and provides users with a clean "fresh start" every week. Mid-week progress is calculated deterministically using only the activities actually logged during that specific date range, avoiding complex rolling averages or inaccurate normalizations that might confuse a user trying to hit a tangible weekend target.
