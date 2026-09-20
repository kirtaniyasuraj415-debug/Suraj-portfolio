// lib/firebase.ts
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getAnalytics, isSupported, type Analytics } from "firebase/analytics";

// Suraj Portfolio Firebase Web Configuration
export const firebaseConfig = {
  apiKey: "AIzaSyDSEcOjftkJOPmuh1NHzzMXXLEVnxOj240",
  authDomain: "suraj-portfolio-b90e6.firebaseapp.com",
  projectId: "suraj-portfolio-b90e6",
  storageBucket: "suraj-portfolio-b90e6.firebasestorage.app",
  messagingSenderId: "230275143027",
  appId: "1:230275143027:web:fb745df1f4b6cca9d8e106",
  measurementId: "G-K5908D2950",
};

// Initialize Firebase App singleton
export const firebaseApp: FirebaseApp =
  getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore
export const db: Firestore = getFirestore(firebaseApp);

// Initialize Firebase Analytics safely (Client-side only)
let analyticsInstance: Analytics | null = null;

export async function getClientAnalytics(): Promise<Analytics | null> {
  if (typeof window === "undefined") return null;
  if (analyticsInstance) return analyticsInstance;

  try {
    const supported = await isSupported();
    if (supported) {
      analyticsInstance = getAnalytics(firebaseApp);
    }
  } catch (error) {
    console.warn("[Firebase] Analytics initialization skipped or unsupported:", error);
  }
  return analyticsInstance;
}
