const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const path = require('path');
const fs = require('fs');

let serviceAccount = null;

// 1. Try reading from FIREBASE_SERVICE_ACCOUNT environment variable (for Render/Cloud hosting)
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT.trim();
    if (raw.startsWith('{')) {
      serviceAccount = JSON.parse(raw);
    } else {
      const decoded = Buffer.from(raw, 'base64').toString('utf8');
      serviceAccount = JSON.parse(decoded);
    }
  } catch (err) {
    console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT environment variable:', err.message);
  }
}

// 2. Fallback to local serviceAccountKey.json file if present
if (!serviceAccount) {
  const localKeyPath = path.join(__dirname, '..', 'serviceAccountKey.json');
  if (fs.existsSync(localKeyPath)) {
    try {
      serviceAccount = require(localKeyPath);
    } catch (err) {
      console.error('Failed to load local serviceAccountKey.json:', err.message);
    }
  }
}

if (serviceAccount) {
  // Fix escaped newlines in private_key if passed via env var
  if (serviceAccount.private_key && typeof serviceAccount.private_key === 'string') {
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
  }

  try {
    if (!admin.getApps().length) {
      admin.initializeApp({
        credential: admin.cert(serviceAccount)
      });
      console.log('>>> Firebase Firestore Connected: ' + (serviceAccount.project_id || 'sreythacurtain'));
    }
  } catch (err) {
    console.error('❌ Failed to initialize Firebase Admin SDK:', err.message);
  }
} else if (!admin.getApps().length) {
  console.error('⚠️ WARNING: No Firebase credentials found! Please set FIREBASE_SERVICE_ACCOUNT in your Render environment variables or add Secret File serviceAccountKey.json.');
}

const fallbackDb = {
  collection: (colName) => ({
    get: async () => {
      console.error(`Attempted to query '${colName}', but Firebase is not initialized yet. Set FIREBASE_SERVICE_ACCOUNT in Render.`);
      return { docs: [], empty: true, size: 0, forEach: () => {} };
    },
    doc: (docId) => ({
      get: async () => ({ exists: false, data: () => null }),
      set: async () => { throw new Error('Firebase credentials missing'); },
      update: async () => { throw new Error('Firebase credentials missing'); },
      delete: async () => { throw new Error('Firebase credentials missing'); }
    }),
    add: async () => { throw new Error('Firebase credentials missing'); },
    where: function() { return this; },
    orderBy: function() { return this; },
    limit: function() { return this; }
  })
};

const db = admin.getApps().length ? getFirestore() : fallbackDb;

module.exports = { admin, db };


