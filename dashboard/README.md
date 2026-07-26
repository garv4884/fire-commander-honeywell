# Dashboard - Fire Commander

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app), serving as the central command node for the Fire Commander system.

## Overview
The dashboard provides total visibility over the building's safety state. It listens to telemetry from physical/simulated nodes, evaluates risks using a Sensor Fusion engine, computes the lowest-hazard path via Dijkstra's algorithm, and pushes visual instructions to Smart Signs and Map views.

### Key Routes
- `/` - **Main Dashboard**: Live system health, recent incidents, and quick-glance status.
- `/admin/map` & `/map-editor` - **Visual Map Editor**: 2D SVG canvas for designing the building node layout.
- `/controls` - **HVAC & Doors**: Override zones, suppress alarms, and manage automated fire response systems.
- `/simulate` - **Simulator**: Inject faults, test preset scenarios, and verify smart sign rerouting logic.
- `/signs` - **Smart Signs**: Live preview of what occupants are seeing at every node intersection.
- `/reports` - **Historical Logs**: Playback and auditing of past incidents and automated responses.

## Getting Started

First, install dependencies:
```bash
npm install
```

Then, run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Admin Privileges
The system requires an Admin password to edit the map or toggle manual overrides.
Click the **Admin Mode** toggle in the bottom left sidebar.
- Password: `admin123`

## Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS & custom CSS variables (`globals.css`)
- **Icons**: Lucide React
- **Pathfinding**: Custom Dijkstra implementation (`pathfinder.ts`)
- **State**: React Context API (`MapContext.tsx`, `AdminContext.tsx`)
