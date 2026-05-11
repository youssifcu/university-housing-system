import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA9qMYjOjfGyVXgZUvL_2L1BBgLWjyyoH4",
  authDomain: "housing-53d87.firebaseapp.com",
  projectId: "housing-53d87",
  storageBucket: "housing-53d87.firebasestorage.app",
  messagingSenderId: "399139942239",
  appId: "1:399139942239:web:97bbe5b8d529031d3b50ea"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);