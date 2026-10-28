const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const path = require('path');

const serviceAccount = require(path.join(__dirname, '..', 'serviceAccountKey.json'));

if (!admin.getApps().length) {
  admin.initializeApp({
    credential: admin.cert(serviceAccount)
  });
}

const db = getFirestore();
console.log('>>> Firebase Firestore Connected: ' + (serviceAccount.project_id || 'sreythacurtain'));

module.exports = { admin, db };

