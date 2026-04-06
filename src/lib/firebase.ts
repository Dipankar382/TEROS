import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
};

// Check if Firebase is actually configured with real credentials
export const isFirebaseConfigured =
  !!firebaseConfig.apiKey &&
  firebaseConfig.apiKey !== 'your-api-key' &&
  !!firebaseConfig.databaseURL &&
  firebaseConfig.databaseURL !== 'your-database-url' &&
  firebaseConfig.databaseURL.startsWith('https://');

// Initialize Firebase app only if configured
const app = isFirebaseConfigured
  ? (getApps().length > 0 ? getApp() : initializeApp(firebaseConfig))
  : null;

// Lazy getters — only call these when isFirebaseConfigured is true
const auth = app ? getAuth(app) : null as any;
const rtdb = (app && isFirebaseConfigured) ? getDatabase(app) : null as any;
const db = app ? getFirestore(app) : null as any;

export { app, auth, rtdb, db };
