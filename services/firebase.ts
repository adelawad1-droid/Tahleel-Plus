
import { initializeApp } from "firebase/app";
// Fix: Ensure proper export from firebase/auth
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyAch6npJL9rfD9aBr8B2q5Ec8VAVvy_rWk",
  authDomain: "muhll-ca343.firebaseapp.com",
  projectId: "muhll-ca343",
  storageBucket: "muhll-ca343.firebasestorage.app",
  messagingSenderId: "393991777150",
  appId: "1:393991777150:web:e049dd17b3c2794784e12f",
  measurementId: "G-P8XSBNDX81"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export const analytics = typeof window !== 'undefined' ? isSupported().then(yes => yes ? getAnalytics(app) : null) : null;

export const ADMIN_EMAIL = "adelawad1@gmail.com";
