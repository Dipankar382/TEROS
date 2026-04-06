# 🚀 Teros Deployment Guide

This guide explains how to deploy the **Teros App** to Vercel and how to configure the necessary environment variables for real-time synchronization via Firebase.

---

## 1. Vercel Deployment Steps

1.  **Push to GitHub**: Ensure your latest code is pushed to a GitHub repository.
2.  **Import to Vercel**:
    - Log in to [Vercel](https://vercel.com/).
    - Click **"Add New"** > **"Project"**.
    - Import your Teros repository.
3.  **Configure Build Settings**:
    - **Framework Preset**: Next.js
    - **Root Directory**: `./`
    - **Build Command**: `npm run build`
    - **Output Directory**: `.next`
4.  **Add Environment Variables**: Copy and paste the variables listed below into the "Environment Variables" section before clicking **Deploy**.

---

## 2. Required Environment Variables

All variables prefixed with `NEXT_PUBLIC_` are required on the client side.

### 🔥 Firebase Configuration (Essential)
These enable the real-time "Sync Engine" (Ambulance tracking, SOS broadcast, etc.).

| Variable | Source / Value |
| :--- | :--- |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Console > Project Settings |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `your-project-id.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `your-project-id` |
| `NEXT_PUBLIC_FIREBASE_DATABASE_URL` | Firebase Console > Realtime Database URL |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `your-project-id.firebasestorage.app` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | From Firebase Config object |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | From Firebase Config object |

> [!IMPORTANT]
> **Realtime Database Requirement**: You MUST enable "Realtime Database" in your Firebase console and set its rules to allow read/write for testing, or implement appropriate Auth rules if using Firebase Auth.

### 🗺️ Map & UI Settings
| Variable | Recommended Default Value |
| :--- | :--- |
| `NEXT_PUBLIC_MAP_TILE_URL` | `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png` |
| `NEXT_PUBLIC_MAP_ATTRIBUTION` | `&copy; OpenStreetMap contributors` |
| `NEXT_PUBLIC_TERRAIN_TILE_URL` | `https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png` |
| `NEXT_PUBLIC_COPYRIGHT_NOTICE` | `© 2026 Teros AI Systems` |

---

## 3. How to Get Firebase Credentials

1.  Open the [Firebase Console](https://console.firebase.google.com/).
2.  Select your project.
3.  Click the **Settings (gear icon)** > **Project Settings**.
4.  Under the **General** tab, scroll down to **Your apps**.
5.  If you haven't created a Web App, click the **</>** icon to add one.
6.  Copy the values from the `firebaseConfig` snippet:
    ```javascript
    const firebaseConfig = {
      apiKey: "...", // NEXT_PUBLIC_FIREBASE_API_KEY
      authDomain: "...",
      databaseURL: "...", // NEXT_PUBLIC_FIREBASE_DATABASE_URL
      projectId: "...",
      storageBucket: "...",
      messagingSenderId: "...",
      appId: "..."
    };
    ```

---

## 4. Troubleshooting
- **Firebase not connecting?** Ensure your `NEXT_PUBLIC_FIREBASE_DATABASE_URL` starts with `https://`.
- **Map not showing?** Ensure the `NEXT_PUBLIC_MAP_TILE_URL` is correct and you have an internet connection.
- **WebSocket legacy?** If you are still using the C++ backend for certain features, add `NEXT_PUBLIC_WS_SERVER_URL=wss://your-render-app.onrender.com`.
