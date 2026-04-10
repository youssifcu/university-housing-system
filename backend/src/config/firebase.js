const admin = require("firebase-admin");

let serviceAccount;

// Priority 1: full JSON in one env var (best for Railway)
if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  } catch (error) {
    throw new Error("Invalid FIREBASE_SERVICE_ACCOUNT_JSON value. It must be valid JSON.");
  }
} else if (
  process.env.FIREBASE_PROJECT_ID &&
  process.env.FIREBASE_CLIENT_EMAIL &&
  process.env.FIREBASE_PRIVATE_KEY
) {
  // Priority 2: split env vars
  serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  };
} else {
  // Priority 3: local development fallback
  try {
    serviceAccount = require("../../serviceAccountKey.json");
  } catch (error) {
    throw new Error(
      "Firebase credentials are missing. Set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_PROJECT_ID/FIREBASE_CLIENT_EMAIL/FIREBASE_PRIVATE_KEY in Railway."
    );
  }
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

console.log("✅ Firebase Admin SDK Initialized Successfully!");

module.exports = admin;