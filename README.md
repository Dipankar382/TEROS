# Teros: Advanced Emergency Routing AI

[![Netlify Status](https://api.netlify.com/api/v1/badges/550f4a1d-d517-4167-a73f-3ba9a2b18b26/deploy-status)](https://teros-ai.netlify.app/)
[![Next.js](https://img.shields.io/badge/Framework-Next.js-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/Library-React-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Leaflet](https://img.shields.io/badge/Mapping-Leaflet-199900?logo=leaflet&logoColor=white)](https://leafletjs.com/)

**Teros** is a state-of-the-art emergency routing system designed to optimize ambulance dispatch and navigation. Unlike traditional GPS systems that prioritize the shortest distance, Teros uses a **Survivability Index** to determine the safest and most efficient path, accounting for terrain steepness, real-time traffic, weather conditions, and hospital resource availability.

🚀 **[View Live Demo](https://teros-ai.netlify.app/)**

---

## 📸 Preview

![Teros Dashboard Preview](public/preview.png)

---

## ✨ Key Features

- 🏥 **Survival-First Routing**: AI calculates the safest path using a composite survivability index.
- ⛰️ **Terrain Intelligence**: Real-time altitude and landslide risk analysis integrated into the HUD.
- ⏱️ **Golden Hour HUD**: High-tech transparent overlay for mission-critical time monitoring.
- 🚥 **Path-Based Traffic**: Live street-level congestion simulation on arterial road segments.
- ✨ **Premium Glassmorphism**: Ultra-modern, simplified UI optimized for both desktop and mobile.
- 🧘 **Strictly Clean Layout**: Optimized component spacing to prevent any UI overlaps or visual clutter.
- 🤖 **Predictive AI Rerouting**: Dynamic multi-factor path scoring (Weather + Traffic + Safety).

---

## 🛠️ Tech Stack

- **Core**: [Next.js 15+](https://nextjs.org/) (App Router)
- **UI**: [React 19](https://react.dev/), [Lucide React](https://lucide.dev/)
- **Mapping**: [Leaflet](https://leafletjs.com/), [React-Leaflet](https://react-leaflet.js.org/)
- **Deployment**: [Netlify](https://www.netlify.com/)
- **Styling**: Vanilla CSS (Modern CSS3)

---

## ⚙️ Setup & Installation

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd teros-app
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env.local` file in the root directory and add:
```env
NEXT_PUBLIC_MAP_TILE_URL=https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
NEXT_PUBLIC_TERRAIN_TILE_URL=https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png
WEATHER_API_KEY=your_api_key
ROUTING_API_KEY=your_api_key
```

### 4. Run Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to see it in action.

---

## 🧠 Mission Workflow

1. **Scenario Selection**: The user selects an emergency scenario (e.g., Cardiac Arrest).
2. **Data Integration**: Teros fetches real-time terrain, traffic, and hospital data.
3. **Route Optimization**: The AI calculates multiple routes and assigns a **Survivability Index**.
4. **Dispatch**: The safest route is displayed, and the Golden Hour timer begins.
5. **Real-time Navigation**: The ambulance follows the path with dynamic re-routing.

---

## 📄 License

This project is developed for the **Yukti Hackathon**. © 2026 Pat Hawkers.

