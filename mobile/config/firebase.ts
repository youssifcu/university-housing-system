
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth'; 
const firebaseConfig = {
  apiKey: "AIzaSyA9qMYjOjfGyVXgZUvL_2L1BBgLWjyyoH4",
  authDomain: "housing-53d87.firebaseapp.com",
  projectId: "housing-53d87",
  storageBucket: "housing-53d87.firebasestorage.app",
  messagingSenderId: "399139942239",
  appId: "1:399139942239:web:97bbe5b8d529031d3b50ea",
  measurementId: "G-YH063LXRD0"
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