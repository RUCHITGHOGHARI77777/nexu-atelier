import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

// Standard production-ready Firebase configuration slots
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDemoFallbackKeyForIndianSellersEvaluationMode",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "indiacraft-saas.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "indiacraft-saas",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "indiacraft-saas.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "102938475610",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:102938475610:web:98ab23c45d6e7f8a",
};

// Singleton App Instance with Graceful Initialization
let app: FirebaseApp;
let auth: Auth | null = null;
let db: Firestore | null = null;
let isLiveFirebase = false;

try {
  if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    isLiveFirebase = true;
  } else {
    // Evaluation / Demo mode
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    isLiveFirebase = false;
  }
} catch {
  // If browser security or offline restricts WebSocket/HTTP, continue with simulated mirror
  isLiveFirebase = false;
}

export { app, auth, db, isLiveFirebase };
export default firebaseConfig;

