const admin = require("firebase-admin");

let serviceAccount;
const normalizePrivateKey = (key) => {
  if (!key || typeof key !== "string") return key;
  const trimmed = key.trim().replace(/^"|"$/g, "");
  return trimmed.replace(/\\n/g, "\n");
};

// Priority 1: full JSON in one env var (best for Railway)
if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON || process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    const rawJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON || process.env.FIREBASE_SERVICE_ACCOUNT;
    serviceAccount = JSON.parse(rawJson);
    serviceAccount.private_key = normalizePrivateKey(serviceAccount.private_key);
    serviceAccount.privateKey = normalizePrivateKey(serviceAccount.privateKey);
  } catch (error) {
    throw new Error("Invalid FIREBASE_SERVICE_ACCOUNT_JSON/FIREBASE_SERVICE_ACCOUNT value. It must be valid JSON.");
  }
} else if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
  try {
    const decoded = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, "base64").toString("utf-8");
    serviceAccount = JSON.parse(decoded);
    serviceAccount.private_key = normalizePrivateKey(serviceAccount.private_key);
    serviceAccount.privateKey = normalizePrivateKey(serviceAccount.privateKey);
  } catch (error) {
    throw new Error("Invalid FIREBASE_SERVICE_ACCOUNT_BASE64 value. It must be base64-encoded JSON.");
  }
} else if (
  (process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT) &&
  (process.env.FIREBASE_CLIENT_EMAIL || process.env.FIREBASE_CLIENT_EMAIL_ADDRESS) &&
  process.env.FIREBASE_PRIVATE_KEY
) {
  // Priority 2: split env vars
  serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || process.env.FIREBASE_CLIENT_EMAIL_ADDRESS,
    privateKey: normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY),
  };
} else {
  // Priority 3: local development fallback
  try {
    serviceAccount = require("../../backend/serviceAccountKey.json");
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