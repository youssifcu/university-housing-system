import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import Constants from 'expo-constants';

// Get Firebase config from Expo constants (populated from app.config.js or .env)
const extra = (Constants.expoConfig?.extra as any) || {};

const firebaseConfig = {
  apiKey: extra.firebaseApiKey,
  authDomain: extra.firebaseAuthDomain,
  projectId: extra.firebaseProjectId,
  storageBucket: extra.firebaseStorageBucket,
  messagingSenderId: extra.firebaseMessagingSenderId,
  appId: extra.firebaseAppId
};

// Warn if any required config is missing
const requiredFields = [
  'apiKey',
  'projectId',
  'appId'
];

const missingFields = requiredFields.filter(field => !firebaseConfig[field as keyof typeof firebaseConfig]);

if (missingFields.length > 0) {
  console.warn(
    `⚠️  Firebase config incomplete. Missing: ${missingFields.join(', ')}. ` +
    `Please set up mobile/.env file with Firebase credentials (see .env.example).`
  );
}

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);