
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth'; 

const firebaseConfig = {
  apiKey: "AIzaSyA8S0tEeRAoMNpY7z6hTVNARwhCXTgh_uo",
  authDomain: "university-housing-syste-1b09f.firebaseapp.com",
  projectId: "university-housing-syste-1b09f",
  storageBucket: "university-housing-syste-1b09f.firebasestorage.app",
  messagingSenderId: "975365542180",
  appId: "1:975365542180:web:ba399ed734c731804ea3b1",
  measurementId: "G-E91W036L9P"
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