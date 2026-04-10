const admin = require("firebase-admin");

let serviceAccount;

// بنشيك لو إحنا على السيرفر (Railway) ومجهزين متغير البيئة
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} else {
  // لو إحنا على جهازك ومفيش متغير، هيقرأ من الملف بتاعك عادي جداً
  serviceAccount = require("../../serviceAccountKey.json");
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

console.log(" Firebase Admin SDK Initialized Successfully!");

module.exports = admin;