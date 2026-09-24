# 🌿 PlanetPulse — Carbon Footprint Tracker

**Track**: Track 2 (Code to Career AI Hackathon)  
**Brief**: B — PlanetPulse (Climate Tech)  
**Hackathon ID**: `AZIS-CRK5J4`

> A carbon footprint tracker that turns daily choices into a visible carbon footprint. Built for the Azisly Code2Career AI Hackathon.

## 🚀 Live Demo

🔗 **[planet-pulse-five.vercel.app](https://planet-pulse-five.vercel.app/)**

## 🏗️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Charts**: Recharts
- **Deployment**: Vercel

## 📦 Getting Started

### Prerequisites
- Node.js 18+ 
- npm 9+

### Installation

```bash
git clone https://github.com/YOUR_USERNAME/planetpulse.git
cd planetpulse
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Test Credentials
No authentication required — all features are accessible without login.

## ✅ Features Implemented

### 1. Log an Activity
Record an activity with type (car, bus, flight, electricity, veg meal, non-veg meal) and quantity.

### 2. CO₂ Calculation
Fixed emission factors as specified:
| Activity | Factor | Unit |
|----------|--------|------|
| Car | 0.20 kg/km | km |
| Bus | 0.08 kg/km | km |
| Flight | 0.25 kg/km | km |
| Electricity | 0.80 kg/kWh | kWh |
| Veg Meal | 0.50 kg/meal | meals |
| Non-Veg Meal | 2.00 kg/meal | meals |

### 3. Dashboard
Total footprint plus per-category breakdown with interactive donut chart.

### 4. Weekly Target
Set a weekly CO₂ target; the app shows progress via a visual gauge and flags when exceeded.

### 5. History & Filter
All logged activities, filterable by type and date range.

## ⚖️ Decision Point Summary

- **DP1 — The Nudge:** Uses a supportive, non-punitive "Target Exceeded" feedback UI that identifies the largest contributing category.
- **DP2 — Absurd Input:** Implements a two-tier check that pauses submission and requests explicit verification before logging unusual outliers.
- **DP3 — The Week:** Strict Monday → Sunday calendar week computation for intuitive tracking and target-setting.
*See [DECISIONS.md](./DECISIONS.md) for full context.*

## 🧪 Tests Performed

The following test scenarios were manually validated:
- Base factors test (10km Car = 2.00kg, 10kWh Electricity = 8.00kg, etc.)
- Exceeded target limits (Shows correct overage amount and largest contributor)
- Absurd Input (500,000 km car warns user correctly)
- History filtering (By type and date range combined)
- Calendar week accuracy (Activities outside the current Mon-Sun period do not affect the weekly target metric)

## 🔌 Standard API

This project implements the standard REST API:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/activities` | GET | List activities (query: type, start_date, end_date) |
| `/api/activities` | POST | Create activity `{ type, quantity }` |
| `/api/activities/:id` | GET | Get single activity |
| `/api/activities/:id` | DELETE | Delete activity |
| `/api/stats` | GET | Dashboard stats |
| `/api/target` | GET | Get weekly target |
| `/api/target` | PUT | Set weekly target `{ target_kg }` |

## 📁 Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── activities/
│   │   │   ├── route.ts       # GET/POST activities
│   │   │   └── [id]/route.ts  # GET/DELETE single activity
│   │   ├── stats/route.ts     # Dashboard statistics
│   │   └── target/route.ts    # Weekly target GET/PUT
│   ├── log/page.tsx           # Log activity page
│   ├── history/page.tsx       # History & filter page
│   ├── layout.tsx             # Root layout with navigation
│   ├── page.tsx               # Dashboard page
│   └── globals.css            # Global styles
└── lib/
    └── store.ts               # In-memory data store & CO₂ engine
```

## 📄 License

MIT
