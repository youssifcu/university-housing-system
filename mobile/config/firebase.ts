
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth'; 
const firebaseConfig = {
  apiKey: "AIzaSyBQFf6t0zBqraGFL3PGP8L6GXHVDjFkIPQ",
  authDomain: "university-housing-d5c12.firebaseapp.com",
  projectId: "university-housing-d5c12",
  storageBucket: "university-housing-d5c12.firebasestorage.app",
  messagingSenderId: "1047560552219",
  appId: "1:1047560552219:web:0e4515f662664cdf125dbe",
  measurementId: "G-PX70W35LWQ"
};
let app: FirebaseApp;
let auth: Auth;


if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app) ;
} else {
  app = getApp();
  auth = getAuth(app);
}

export { app, auth };