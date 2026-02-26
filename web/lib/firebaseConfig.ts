// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAcFEMaEyEc1aeebzkpqy6R2It9-4fA9ZE",
  authDomain: "cs303-3d9c5.firebaseapp.com",
  projectId: "cs303-3d9c5",
  storageBucket: "cs303-3d9c5.firebasestorage.app",
  messagingSenderId: "52010993972",
  appId: "1:52010993972:web:b412c399a8a08644317d61",
  measurementId: "G-K6XFRNMWN9"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
