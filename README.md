# Teros: Advanced Emergency Healthcare Routing AI

[![Netlify Status](https://api.netlify.com/api/v1/badges/550f4a1d-d517-4167-a73f-3ba9a2b18b26/deploy-status)](https://teros-ai.netlify.app/)
[![Next.js](https://img.shields.io/badge/Framework-Next.js-black?logo=next.js)](https://nextjs.org/)
[![C++](https://img.shields.io/badge/Backend-C++-00599C?logo=c%2B%2B&logoColor=white)](https://isocpp.org/)
[![WebSocket](https://img.shields.io/badge/Sync-WebSocket-010101?logo=socket.io&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)

**Teros** is a high-performance emergency routing system designed for extreme mountain environments, specifically the **Tehri Garhwal** region. It optimizes ambulance dispatch using a **Survivability Index** that accounts for terrain, weather, and real-time hospital resource availability.

🚀 **[View Live Web App](https://teros-ai.netlify.app/)** | ⚙️ **[Backend Server](https://teros-1.onrender.com)**

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
- **Framework**: Next.js 15+ (App Router)
- **State Management**: React Context API with Native WebSocket integration.
- **Mapping**: Leaflet.js with custom topographic and traffic layers.
- **Iconography**: Lucide React / Custom SVG HUDs.

### Backend (C++/Networking)
- **Engine**: Custom C++ Telemetry Server.
- **Logic**: Handles authentication (Patient/Driver/Admin roles) and high-frequency coordinate broadcasting.
- **Hosting**: Render (Web Service).

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

## 📄 License & Recognition
Developed for the **Yukti Hackathon**. Produced by **Pat Hawkers**.
© 2026 Teros AI Systems.
