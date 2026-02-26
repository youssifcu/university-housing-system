import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import Constants from 'expo-constants';

// Get Firebase config from Expo constants (populated from app.config.js or .env)
const extra = (Constants.expoConfig?.extra as any) || {};

// Debug: log the values being loaded
console.log('🔍 Firebase Config Debug:');
console.log('  apiKey loaded:', !!extra.firebaseApiKey);
console.log('  projectId:', extra.firebaseProjectId || 'NOT LOADED');
console.log('  authDomain:', extra.firebaseAuthDomain || 'NOT LOADED');
console.log('  appId:', extra.firebaseAppId || 'NOT LOADED');
console.log('  Full extra config:', JSON.stringify(extra, null, 2));

const firebaseConfig = {
  apiKey: extra.firebaseApiKey || '',
  authDomain: extra.firebaseAuthDomain || '',
  projectId: extra.firebaseProjectId || '',
  storageBucket: extra.firebaseStorageBucket || '',
  messagingSenderId: extra.firebaseMessagingSenderId || '',
  appId: extra.firebaseAppId || ''
};

// Validate required config
const requiredFields = ['apiKey', 'projectId', 'appId'];
const missingFields = requiredFields.filter(field => {
  const value = firebaseConfig[field as keyof typeof firebaseConfig];
  return !value || value.length === 0;
});

if (missingFields.length > 0) {
  console.error(
    `❌ Firebase config INCOMPLETE. Missing: ${missingFields.join(', ')}. ` +
    `Create mobile/.env with Firebase credentials (see .env.example). ` +
    `Then restart Expo with: expo start -c`
  );
}

let app;
try {
  app = initializeApp(firebaseConfig);
  console.log('✅ Firebase initialized successfully');
} catch (error: any) {
  console.error('❌ Firebase initialization failed:', error.message);
  throw error;
}

export const auth = getAuth(app);
export const db = getFirestore(app);