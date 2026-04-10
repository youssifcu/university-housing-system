const admin = require("firebase-admin");

let serviceAccount;

// لو إحنا على Railway (بندور على أي متغير خاص بالمفتاح)
if (process.env.FIREBASE_PRIVATE_KEY) {
  serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    // السطر ده مهم جداً عشان يعالج المسافات والسطور في المفتاح السري
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  };
} else {
  // لو على جهازك
  serviceAccount = require("../../serviceAccountKey.json");
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

console.log("✅ Firebase Admin SDK Initialized Successfully!");

module.exports = admin;