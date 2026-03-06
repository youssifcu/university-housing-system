const admin = require("firebase-admin");
const serviceAccount = require("../../serviceAccountKey.json");

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log("✅ Firebase Admin SDK Initialized Successfully!");
  } catch (error) {
    console.error("❌ Firebase Admin Initialization Error:", error.stack);
  }
}

module.exports = admin;