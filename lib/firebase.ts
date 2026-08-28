import { getApps, initializeApp, type FirebaseApp } from "firebase/app"
import { getAnalytics, isSupported, type Analytics } from "firebase/analytics"

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAc41HyGzUDsTMf69JUR_My0mb79u0OlmA",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "habit-runner-2050.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "habit-runner-2050",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "habit-runner-2050.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "925969151664",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:925969151664:web:1256f3f77821bae97f2d75",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-9V8WQSM3Q5",
}

// Initialize Firebase as a singleton instance
export const app: FirebaseApp =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]

// Analytics is only supported in browser environments
let analytics: Analytics | null = null

export async function initAnalytics(): Promise<Analytics | null> {
  if (typeof window !== "undefined" && !analytics) {
    const supported = await isSupported()
    if (supported) {
      analytics = getAnalytics(app)
    }
  }
  return analytics
}

export { analytics }
