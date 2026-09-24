# 🌿 PlanetPulse — Carbon Footprint Tracker

**Track**: Track 2 (Code to Career AI Hackathon)  
**Brief**: B — PlanetPulse (Climate Tech)  
**Hackathon ID**: `AZIS-CRK5J4`  
**GitHub Repository**: [https://github.com/SHIVIKA330/PlanetPulse.git](https://github.com/SHIVIKA330/PlanetPulse.git)

> A modern, fintech-style carbon footprint tracker powered by **EcoBot AI Assistant** that turns daily choices into visible carbon impacts. Built for the Azisly Code2Career AI Hackathon.

---

## 🚀 Live Demo

🔗 **[https://github.com/SHIVIKA330/PlanetPulse.git](https://github.com/SHIVIKA330/PlanetPulse.git)**

---

## ✨ What's New: EcoBot AI & Premium Fintech Redesign

### 🤖 1. EcoBot AI Assistant (`AIBotAssistant.tsx`)
- **Natural Language Intent Recognition**: Chat with EcoBot using natural phrases like *"Log 30 km car ride"*, *"I had 2 veg meals"*, or *"Set target to 80 kg"*.
- **1-Click Executable Action Cards**: When EcoBot detects a log request, it presents a **`Execute & Log Now ⚡`** button directly inside the chat bubble that writes to the store live.
- **Real-Time Carbon Audit**: Analyzes your weekly carbon emissions against your target and gives tailored category reduction recommendations.
- **Smart Eco Hacks & Comparisons**: Instant carbon factor comparisons between solo driving, bus, and flights, plus dietary and home electricity reduction guides.
- **API Endpoint**: Accessible at `/api/ai-assistant` for programmatic query resolution.

### 🎨 2. Modern Fintech Dashboard & Glassmorphic UI
- **Glassmorphic App Bar**: Floating top bar with brand logo, `🟢 Tracking Live` indicator, pill active-tab indicators, quick log CTA, and mobile drawer.
- **Circular SVG Progress Ring**: Visual budget gauge displaying remaining CO₂ allowance with dynamic color states (Green ➔ Amber ➔ Crimson).
- **Interactive Metric Cards**: Total Footprint with trend badges, editable inline Weekly Target, and per-category breakdown chips.
- **Eco Notification Center**: Bell icon dropdown with unread badge notifying users of target status, category warnings, and eco tips.
- **Animated Dark / Light Mode Toggle**: Smooth Sun/Moon switch supporting dark mode with Tailwind `dark` class & localStorage persistence.

---

## 🏗️ Tech Stack

- **Framework**: Next.js 15 / 16 (App Router with Turbopack)
- **Language**: TypeScript
- **AI Intelligence**: Eco Intelligence Engine & `/api/ai-assistant` Route
- **Styling**: Vanilla CSS Design System + Tailwind CSS v4
- **Icons & Graphics**: Heroicons, SVG Gauges & Custom Glassmorphism
- **Charts**: Recharts & Custom SVG Visualizers
- **Deployment**: Vercel

---

## 📦 Getting Started

### Prerequisites
- Node.js 18+ 
- npm 9+

### Installation

```bash
git clone https://github.com/SHIVIKA330/PlanetPulse.git
cd planetpulse
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the live dashboard and interact with **EcoBot AI Assistant**.

> **Note on Data Persistence**: The backend uses an in-memory data store for the standard REST API to ensure grading scripts have a pristine test environment. When deployed on Vercel serverless functions, the memory will reset if the function goes to sleep. For local testing, data persists as long as the Next.js development server is running.

### Test Credentials
No authentication required — zero barriers, all features are accessible immediately.

---

## ✅ Core Features & Emission Factors

### CO₂ Calculation Factors
Fixed emission factors as specified by competition guidelines:

| Category | Emission Factor | Unit |
|----------|-----------------|------|
| 🚗 **Car Travel** | `0.20 kg/km` | km |
| 🚌 **Bus Travel** | `0.08 kg/km` | km |
| ✈️ **Flight** | `0.25 kg/km` | km |
| ⚡ **Electricity** | `0.80 kg/kWh` | kWh |
| 🥗 **Vegetarian Meal** | `0.50 kg/meal` | meals |
| 🥩 **Non-Veg Meal** | `2.00 kg/meal` | meals |

---

## ⚖️ Decision Point Summary (Hackathon Guardrails)

- **DP1 — The Nudge:** Uses a supportive, non-punitive "Target Exceeded" feedback UI that identifies the largest contributing category.
- **DP2 — Absurd Input:** Implements an explicit verification step that pauses submission and requests confirmation before logging unusual outliers.
- **DP3 — The Week:** Strict Monday → Sunday calendar week computation for intuitive tracking and target-setting.

*See [DECISIONS.md](./DECISIONS.md) for full details.*

---

## 🔌 API Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/activities` | GET | List activities (query: `type`, `start_date`, `end_date`) |
| `/api/activities` | POST | Create activity `{ type, quantity }` |
| `/api/activities/:id` | GET | Get single activity details |
| `/api/activities/:id` | DELETE | Delete activity by ID |
| `/api/stats` | GET | Real-time dashboard statistics |
| `/api/target` | GET | Get current weekly target |
| `/api/target` | PUT / POST | Update weekly target `{ target_kg }` |
| `/api/ai-assistant` | POST | Query EcoBot AI `{ message, stats }` |

---

## 📁 Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── activities/        # GET/POST activities
│   │   ├── ai-assistant/      # EcoBot AI assistant endpoint
│   │   ├── stats/            # Dashboard stats endpoint
│   │   └── target/           # Weekly target endpoint
│   ├── history/              # History & filter page
│   ├── log/                  # Log activity page
│   ├── globals.css           # Global CSS variables & design tokens
│   ├── layout.tsx            # Root layout & global EcoBot AI widget
│   └── page.tsx              # Main Fintech Dashboard
├── components/
│   ├── AIBotAssistant.tsx    # EcoBot AI Assistant Chat Widget
│   ├── NavBar.tsx            # Glassmorphic Navigation & Utility Tray
│   ├── NotificationCenter.tsx# Eco Notification Center
│   ├── ThemeProvider.tsx     # Next-themes provider
│   └── ThemeToggle.tsx       # Animated Sun/Moon theme switch
└── lib/
    ├── ecoIntelligence.ts    # AI Bot Natural Language Engine
    └── store.ts              # In-memory store & CO₂ calculation factors
```

---

## 📄 License

MIT © PlanetPulse Team
