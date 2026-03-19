# Teros: Advanced Emergency Healthcare Routing AI

[![Vercel Deployment](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)](https://teros-five.vercel.app/)
[![Next.js](https://img.shields.io/badge/Framework-Next.js-black?logo=next.js)](https://nextjs.org/)
[![C++](https://img.shields.io/badge/Backend-C++-00599C?logo=c%2B%2B&logoColor=white)](https://isocpp.org/)
[![WebSocket](https://img.shields.io/badge/Sync-WebSocket-010101?logo=socket.io&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)

**Teros** is a high-performance emergency routing system designed for extreme mountain environments, specifically the **Tehri Garhwal** region. It optimizes ambulance dispatch using a **Survivability Index** that accounts for terrain, weather, and real-time hospital resource availability.

🚀 **[View Live Demo](https://teros-five.vercel.app/)** | ⚙️ **[Backend Server](https://teros-1.onrender.com)**

![TEROS Preview](./public/preview.png)

---

## 📸 Core Dashboards
- **Patient Dashboard**: SOS triggers with dynamic **Patient Condition** selection (Stable, Unstable, Critical).
- **Driver HUD**: Real-time terrain risk alerts, elevation profiles, and golden-hour countdowns.
- **Admin/Hospital Panel**: Live fleet tracking via WebSocket and ICU bed management.

---

## ✨ Key Technical Features

### ⛰️ Tehri Garhwal Extreme Mountain Scenario
Teros is pre-configured with a simulation environment centered around **THDC IHET / Bhagirathipuram**. It simulates:
- **Steep Gradients**: Navigation through high-altitude terrain with varying risks.
- **Landslide Prediction**: AI-driven path scoring that avoids high-risk rockfall zones using topographic data.

### ⏱️ Dynamic Golden Hour HUD
The "Golden Hour" is no longer a static timer. It dynamically shifts based on the **Patient's Condition**:
- **Critical**: 60 Minutes
- **Unstable**: 120 Minutes
- **Stable**: 180 Minutes
The countdown begins precisely when the ambulance is dispatched, ensuring accurate triage monitoring.

### 🌐 Real-Time C++ WebSocket Sync
Unlike typical mock demos, Teros uses a **C++ Asynchronous WebSocket Server** (deployed on Render) to:
- Synchronize live GPS locations across multiple real hardware devices.
- Filter and allocate only **Online/Connected** drivers for emergency requests.
- Broadcast SOS alerts instantly to all authenticated drivers on the network.

### 📱 Ultra-Responsive Mobile UI
- **Hamburger Navigation**: Simplified mobile controls for clean map visibility on Android & iOS.
- **High Contrast Role Headers**: Optimized for outdoor readability in varying light conditions.
- **Safari/MacBook GPS Fallback**: High-accuracy manual pinning for cases where browser geolocation is blocked or inaccurate.

---

## 🛠️ Technical Architecture

### Frontend (React/Next.js)
- **Framework**: [Next.js 15+](https://nextjs.org/) (App Router)
- **UI**: [React 19](https://react.dev/), [Lucide React](https://lucide.dev/)
- **Mapping**: [Leaflet](https://leafletjs.com/), [React-Leaflet](https://react-leaflet.js.org/)
- **Styling**: Vanilla CSS (Modern CSS3 with Glassmorphism)

### Backend (C++/Networking)
- **Engine**: Custom C++ Telemetry Server (High-Performance Engine).
- **Logic**: Handles authentication (Patient/Driver/Admin roles) and high-frequency coordinate broadcasting.
- **Hosting**: Render (Web Service) / Vercel.

---

## ⚙️ Local Development

### 1. Frontend Setup
```bash
git clone https://github.com/Dipankar382/TEROS.git
npm install
npm run dev
```

### 2. Environment Configuration
Create a `.env.local`:
```env
NEXT_PUBLIC_WS_URL=wss://teros-1.onrender.com
NEXT_PUBLIC_MAP_TILE_URL=https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
```

---

## 🧠 Mission Workflow

1. **Scenario Selection**: The user selects an emergency scenario (e.g., Cardiac Arrest).
2. **Data Integration**: Teros fetches real-time terrain, traffic, and hospital data.
3. **Route Optimization**: The AI calculates multiple routes and assigns a **Survivability Index**.
4. **Dispatch**: The safest route is displayed, and the Golden Hour timer begins.
5. **Real-time Navigation**: The ambulance follows the path with dynamic re-routing.

---

## 📄 License & Recognition
This project is developed for the **Yukti Hackathon**. Developed by **Dipankar Mehata**.
© 2026 Teros AI Systems.
