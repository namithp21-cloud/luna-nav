# 🌕 LUNA NAV — Lunar Landing Site Navigator

**One interface. Multiple landing scenarios. Smarter lunar mission decisions.**

LUNA NAV is an interactive lunar mission-planning and decision-support platform designed to help explore and compare potential landing regions near the Moon's South Pole.

It focuses on two important challenges for future lunar missions: **solar illumination availability** and **Direct-to-Earth (DTE) communication visibility**.

By combining celestial ephemeris data, candidate-site information, mission timelines, and scenario assessments, LUNA NAV helps users understand how landing location and mission start date can influence surface operations.

---

## 🚀 Project Overview

Landing near the lunar South Pole presents unique operational challenges. The Moon's low axial tilt creates extreme lighting conditions, while the lunar horizon and libration affect communication visibility with Earth.

A landing region with favourable sunlight may not always offer continuous communication with Earth.

LUNA NAV addresses this planning challenge through an interactive environment where users can:

- Explore candidate lunar South Pole landing regions.
- Select mission start dates and analysis durations.
- Visualize Sun and Earth positions relative to the local horizon.
- Examine illumination and communication availability over time.
- Compare two mission scenarios side by side.
- Evaluate operational suitability using configurable assessment criteria.

## ✨ Key Features

### 1. Mission Overview
A centralized mission dashboard displaying the selected landing region, celestial elevation readings, illumination status, Earth visibility, and mission assessment information.

### 2. Lunar Site Explorer
Explore five predefined candidate regions:

- Shackleton Crater Rim Region
- Connecting Ridge Region
- Malapert Massif Region
- Nobile Crater Rim Region
- de Gerlache Crater Rim Region

The application also supports custom candidate-site configuration.

### 3. Horizon Simulator
Visualize the Sun and Earth relative to the local lunar horizon, including their elevation and azimuth angles.

Understand when celestial bodies are geometrically above or below the horizon at the selected location.

### 4. Mission Timeline & Power Analysis
Explore how sunlight availability changes throughout the selected mission window.

Examine illumination intervals, continuous sunlight periods, and operational power considerations using configurable solar-panel assumptions.

### 5. Scenario Comparison
Compare two mission scenarios using:

- Different landing regions
- Different mission start dates
- Sunlight availability
- Longest continuous illumination
- Earth visibility
- Overall suitability assessment

The comparison interface provides charts, metrics, and an exportable comparison summary.

### 6. Mission Analysis
Evaluate candidate scenarios through a configurable assessment model that considers:

- Total solar illumination
- Longest continuous sunlight window
- Direct-to-Earth visibility

The model generates an explainable suitability score, along with identified strengths, weaknesses, and potential operational risks.

### 7. Learn & Understand
An educational section explaining lunar polar lighting, permanently shadowed regions, Earth libration, communication constraints, data provenance, and model limitations.

### 8. Data Export
Export mission ephemeris samples and scenario comparisons as CSV files. Generate a printable mission report using the browser's print functionality.

---

## 🛰️ Scientific Data & Methodology

LUNA NAV uses a combination of external ephemeris data and an analytical fallback model.

**NASA JPL Horizons API**

The application queries the JPL Horizons system for Sun and Earth observer ephemerides at the selected lunar surface location.

- Sun target: `10`
- Earth target: `399`
- Observer centre: `coord@301`
- Observer coordinates: Geodetic lunar surface coordinates
- Apparent position setting: `AIRLESS`
- Ephemeris sampling interval: 60 minutes by default

**Data source handling**

The application identifies three data-source states:

| Source | Description |
|---|---|
| Live Horizons | Ephemeris retrieved from JPL Horizons |
| Cached Horizons | Previously retrieved ephemeris stored locally |
| Analytical Model | Local analytical fallback when the API is unavailable |

Retrieved ephemeris samples are cached in browser local storage to reduce repeated requests.

**Lunar candidate regions**

Candidate-site reference coordinates and regional context are documented in the application's site data, referencing NASA GSFC Planetary Geodynamics Data Archive material and lunar surface reference resources.

These coordinates represent preliminary regional references, not certified spacecraft landing coordinates.

---

## ⚙️ Technology Stack

| Technology | Purpose |
|---|---|
| React 19 | Frontend application |
| TypeScript | Type-safe application development |
| Vite | Development server and build tooling |
| Tailwind CSS | Responsive interface styling |
| Three.js | 3D graphics foundation |
| React Three Fiber & Drei | React integration for Three.js |
| Recharts | Mission charts and data visualization |
| Lucide React | Interface icons |
| NASA JPL Horizons API | Celestial ephemeris data |

---

## 🏗️ Project Structure

```text
luna-nav/
├── public/
├── src/
│   ├── components/
│   │   ├── HorizonVisualizer.tsx
│   │   ├── SiteExplorer.tsx
│   │   ├── TimelinePowerAnalysis.tsx
│   │   ├── ScenarioComparison.tsx
│   │   └── EducationLearn.tsx
│   ├── data/
│   │   └── candidateSites.ts
│   ├── services/
│   │   ├── ephemerisService.ts
│   │   └── assessmentService.ts
│   ├── types/
│   │   └── lunar.ts
│   ├── App.tsx
│   └── main.tsx
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 💻 Getting Started

### Prerequisites

- Node.js (compatible with the installed Vite version)
- npm
- Git

### Installation

Clone the repository:

```bash
git clone https://github.com/namithp21-cloud/luna-nav.git
```

Navigate into the project:

```bash
cd luna-nav
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open the local URL displayed in your terminal, usually:

```text
http://localhost:5173/
```

### Production Build

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

---

## ⚠️ Scientific Assumptions & Limitations

LUNA NAV is a preliminary mission-planning and educational decision-support tool. Its outputs should not be treated as certified landing-site assessments or flight-qualified mission predictions.

- Visibility is evaluated against a geometric 0° airless local horizon.
- Local crater walls, ridges, and other terrain obstructions are not automatically incorporated through full 360° LOLA digital elevation model ray-tracing.
- The analytical fallback model is an approximation and is not equivalent to live JPL Horizons ephemerides.
- Solar-panel power estimates depend on configured panel assumptions and should not be interpreted as validated spacecraft power-system predictions.
- Direct-to-Earth visibility is a geometric line-of-sight indicator, not a complete radio-link budget. Antenna performance, terrain blockage, spacecraft attitude, and link constraints require further analysis.
- Candidate coordinates are regional references, not approved landing targets.

The application displays the ephemeris source state so users can distinguish live, cached, and analytical results.

---

## 🌑 Project Vision

Future lunar exploration will require mission planners to balance illumination, energy availability, communication opportunities, and landing-region characteristics.

LUNA NAV aims to make these relationships easier to explore through an accessible, interactive, and explainable planning environment.

**Explore the Moon. Compare the possibilities. Plan with better insight.**

---

## 🔗 Links & References

- **GitHub Repository:** https://github.com/namithp21-cloud/luna-nav
- **NASA JPL Horizons:** https://ssd.jpl.nasa.gov/horizons/
- **NASA Moon Trek:** https://trek.nasa.gov/moon/
- **NASA Planetary Geodynamics Data Archive:** https://pgda.gsfc.nasa.gov/

---

*Developed as a submission for the NASA Space Apps Challenge 2026.*
