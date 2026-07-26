# Fire Commander - Dynamic Evacuation Router 🚨

🔗 **GitHub Repository:** [garv4884/fire-commander-honeywell](https://github.com/garv4884/fire-commander-honeywell)
🌐 **Live Deployment:** [fire-commander-honeywell.vercel.app](https://fire-commander-honeywell.vercel.app/)
📺 **Video Demo:** [Watch on Google Drive](https://drive.google.com/file/d/1uDhRF4J9pFC5MuIlkdcPNjX9YWORtdMp/view)

Fire Commander is an intelligent, real-time fire evacuation routing system designed to dynamically guide building occupants to safety during an emergency. By fusing real-time sensor data (temperature, smoke, flame presence) with a Dijkstra-based pathfinding engine, the system recalculates the safest escape routes instantly when hazards block primary exits.

This project was built for the Honeywell Hackathon/Project and consists of two main components:
1. **[Dashboard (Web App)](./dashboard/README.md)** - A Next.js-based centralized command center for administrators and automated systems.
2. **[Firmware (Hardware Node)](./firmware/README.md)** - A Python-based hardware layer meant to run on distributed microcontrollers (e.g., ESP32, Raspberry Pi) representing "Smart Nodes" throughout a building.

## 🌟 Key Features

- **Dynamic Pathfinding (Dijkstra):** Instantly calculates the lowest-hazard path to the nearest safe exit for every node in a building.
- **Sensor Fusion Engine:** Combines temperature and smoke telemetry, applying penalty weights to edge traversals. A detected flame instantly creates an infinite weight block (hard-block) preventing any routing through that area.
- **2D Visual Map Editor:** An interactive SVG-based canvas where administrators can drag-and-drop nodes, draw edges, edit floor assignments, and assign exit points.
- **Smart Signs Integration:** Emulated digital signage that updates direction arrows dynamically based on the current safest computed route.
- **Automated HVAC & Door Controls:** Automatically suppresses HVAC in danger zones and unlocks fire doors to prevent smoke spread, with full manual override capability.
- **Incident Playback Simulator:** Built-in scenario simulator allowing admins to inject faults (e.g., a server room fire at T+5s) to test system resilience and routing logic.

## 📂 Repository Structure

```text
fire-commander-honeywell/
├── dashboard/               # Next.js 14 Web Application
│   ├── src/app/             # Routes (Map Editor, Simulator, Controls)
│   ├── src/components/      # React UI Components (FloorPlan, SmartSigns)
│   └── src/core/            # Shared logic (Dijkstra, Sensor Fusion)
├── firmware/                # Python Hardware Layer
│   ├── main.py              # Node initialization
│   ├── sensor_reader.py     # Hardware telemetry interface
│   └── led_controller.py    # Physical smart sign indicator
└── README.md                # This file
```

## 🚀 Quick Start

### 1. Dashboard (Web Application)
The dashboard is a standard Next.js application. You need [Node.js](https://nodejs.org/) installed.

```bash
cd dashboard
npm install
npm run dev
```
Navigate to `http://localhost:3000`. 
*Note: To access protected routes like Map Editor or Controls, click the Admin Toggle in the bottom left sidebar and use password: `admin123`.*

### 2. Firmware (Hardware Nodes)
The firmware runs in Python 3.x and requires zero external pip dependencies for basic simulation.

```bash
cd firmware
python main.py
```

## 🌐 Deployment
The dashboard is optimized for 1-click deployment on [Vercel](https://vercel.com).
When importing this repository into Vercel, **ensure you set the "Root Directory" to `dashboard`** in the project settings before clicking deploy.

---
*Developed for Honeywell*
