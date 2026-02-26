const admin = require("firebase-admin");

// In a CI/test environment we may not have the service account file available,
// and we don't actually need a working admin SDK for most automated tests
// because token verification is short‑circuited before reaching Firebase.
// This helper wraps initialization so that missing credentials don't crash the app.
if (process.env.NODE_ENV === 'test') {
  console.log('Skipping Firebase Admin initialization in test environment');
} else {
  try {
    // the key is kept out of source control; CI should provide it via a secret
    const serviceAccount = require("../../serviceAccountKey.json");
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log(" Firebase Admin SDK Initialized Successfully!");
  } catch (err) {
    console.warn(
      "Firebase Admin SDK initialization skipped (service account file missing or invalid).",
      err.message
    );
  }
}

module.exports = admin;