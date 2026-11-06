const express = require('express');
const router = express.Router();
const https = require('https');
const { BakongKHQR, khqrData, IndividualInfo } = require('bakong-khqr');
const QRCode = require('qrcode');
const { db } = require('../config/firebase');

const settingsCollection = db.collection('settings');
const khqrSessionsCollection = db.collection('khqr_sessions');

const DEFAULT_PAYMENT_SETTINGS = {
  bakongAccountId: 'chanmonyroth_hout@bkrt',
  accountName: 'CHANMONYROTH HOUT',
  merchantCity: 'Phnom Penh',
  merchantId: '14463116',
  bakongToken: process.env.BAKONG_TOKEN || '',
  bakongQrUrl: '',
  abaQrUrl: '',
  acledaQrUrl: '',
  acledaAccountNumber: '089 902 001',
  updatedAt: null
};

// Helper to call Bakong Open API via native https
const postBakongApi = (path, payload, token) => {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const options = {
      hostname: 'api-bakong.nbc.gov.kh',
      port: 443,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      timeout: 8000
    };

    const req = https.request(options, (res) => {
      let raw = '';
      res.on('data', (chunk) => { raw += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(raw));
        } catch (e) {
          resolve({ raw, statusCode: res.statusCode });
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Bakong API request timeout'));
    });
    req.write(body);
    req.end();
  });
};

// @desc    Get payment settings (Bakong / ABA / ACLEDA QR & account info)
// @route   GET /api/settings/payment
router.get('/payment', async (req, res) => {
  try {
    const doc = await settingsCollection.doc('payment').get();
    if (!doc.exists) {
      return res.json(DEFAULT_PAYMENT_SETTINGS);
    }
    const data = doc.data();
    res.json({
      ...DEFAULT_PAYMENT_SETTINGS,
      ...data,
      bakongAccountId: data.bakongAccountId || 'chanmonyroth_hout@bkrt',
      accountName: data.accountName || 'CHANMONYROTH HOUT'
    });
  } catch (err) {
    console.error('Get payment settings error:', err);
    res.status(500).json({ message: err.message });
  }
});

// @desc    Update payment settings (Admin)
// @route   PUT /api/settings/payment
router.put('/payment', async (req, res) => {
  try {
    const {
      bakongAccountId,
      accountName,
      merchantId,
      bakongToken,
      bakongQrUrl,
      abaQrUrl,
      acledaQrUrl,
      acledaAccountNumber
    } = req.body;

    const updates = {
      updatedAt: new Date().toISOString()
    };

    if (bakongAccountId !== undefined) updates.bakongAccountId = String(bakongAccountId).trim() || 'chanmonyroth_hout@bkrt';
    if (accountName !== undefined) updates.accountName = String(accountName).trim() || 'CHANMONYROTH HOUT';
    if (merchantId !== undefined) updates.merchantId = String(merchantId).trim() || '14463116';
    if (bakongToken !== undefined) updates.bakongToken = String(bakongToken).trim();
    if (bakongQrUrl !== undefined) updates.bakongQrUrl = bakongQrUrl;
    if (abaQrUrl !== undefined) updates.abaQrUrl = abaQrUrl;
    if (acledaQrUrl !== undefined) updates.acledaQrUrl = acledaQrUrl;
    if (acledaAccountNumber !== undefined) updates.acledaAccountNumber = String(acledaAccountNumber).trim();

    await settingsCollection.doc('payment').set(updates, { merge: true });
    const updatedDoc = await settingsCollection.doc('payment').get();
    res.json({ ...DEFAULT_PAYMENT_SETTINGS, ...updatedDoc.data() });
  } catch (err) {
    console.error('Update payment settings error:', err);
    res.status(400).json({ message: err.message });
  }
});

// @desc    Generate Dynamic Bakong KHQR (with 100s expiration, QR PNG DataURL & MD5)
// @route   POST /api/settings/khqr/generate
router.post('/khqr/generate', async (req, res) => {
  try {
    const rawAmount = parseFloat(req.body.amount);
    const amount = !isNaN(rawAmount) && rawAmount > 0 ? Number(rawAmount.toFixed(2)) : 0.01;

    // Fetch saved settings or use defaults
    let config = { ...DEFAULT_PAYMENT_SETTINGS };
    try {
      const doc = await settingsCollection.doc('payment').get();
      if (doc.exists) {
        config = { ...config, ...doc.data() };
      }
    } catch (e) {}

    const bakongAccountId = config.bakongAccountId || 'chanmonyroth_hout@bkrt';
    const merchantName = (config.accountName || 'CHANMONYROTH HOUT').slice(0, 25);
    const merchantCity = (config.merchantCity || 'Phnom Penh').slice(0, 15);
    const now = Date.now();
    const expiresAt = now + 100 * 1000; // 100 seconds expiration

    // Only include currency, amount, and expirationTimestamp (no extra billNumber/storeLabel/terminalLabel)
    const optionalData = {
      currency: khqrData.currency.usd,
      amount: amount,
      expirationTimestamp: expiresAt
    };

    const individualInfo = new IndividualInfo(
      bakongAccountId,
      merchantName,
      merchantCity,
      optionalData
    );

    const khqr = new BakongKHQR();
    const result = khqr.generateIndividual(individualInfo);

    if (!result || !result.data || !result.data.qr) {
      return res.status(400).json({
        error: result?.status?.message || 'Failed to generate Bakong KHQR payload'
      });
    }

    const qrString = result.data.qr;
    const md5 = result.data.md5;

    // Generate high-contrast scannable QR image DataURL
    const qrDataUrl = await QRCode.toDataURL(qrString, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 420,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    // Optional: try generating official Bakong deep link if token is available
    let bakongDeepLink = null;
    const token = config.bakongToken || process.env.BAKONG_TOKEN;
    if (token) {
      try {
        const dlRes = await postBakongApi('/v1/generate_deeplink_by_qr', {
          qr: qrString,
          sourceInfo: {
            appIconUrl: 'https://sreytha-curtain.vercel.app/favicon.ico',
            appName: 'Srey Tha Curtain',
            appDeepLinkCallback: 'https://sreytha-curtain.vercel.app/checkout'
          }
        }, token);
        if (dlRes?.data?.shortLink) {
          bakongDeepLink = dlRes.data.shortLink;
        }
      } catch (dlErr) {
        // Ignore deep link error and fallback to client-side bank schemes + QR image share/upload
      }
    }

    // Store session in Firestore so status checks can track expiration & manual/webhook confirmations
    try {
      await khqrSessionsCollection.doc(md5).set({
        md5,
        qrString,
        amount,
        currency: 'USD',
        bakongAccountId,
        merchantName,
        status: 'PENDING',
        createdAt: now,
        expiresAt: expiresAt
      });
    } catch (dbErr) {
      console.error('Failed to save KHQR session:', dbErr.message);
    }

    res.json({
      qrString,
      qrDataUrl,
      md5,
      amount,
      currency: 'USD',
      bakongAccountId,
      merchantName,
      createdAt: now,
      expiresAt,
      expiresInSeconds: 100,
      checkScheduleSeconds: [5, 10, 30, 45, 80, 100],
      bakongDeepLink
    });
  } catch (err) {
    console.error('KHQR Generate Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// @desc    Check Bakong KHQR transaction status by MD5 (called at 5s, 10s, 30s, 45s, 80s, 100s)
// @route   POST /api/settings/khqr/check
router.post('/khqr/check', async (req, res) => {
  try {
    const { md5, checkSecond } = req.body;
    if (!md5) {
      return res.status(400).json({ error: 'MD5 hash is required' });
    }

    // 1. Check local Firestore session first
    let sessionData = null;
    try {
      const sessionDoc = await khqrSessionsCollection.doc(String(md5)).get();
      if (sessionDoc.exists) {
        sessionData = sessionDoc.data();
        if (sessionData.status === 'PAID') {
          return res.json({
            paid: true,
            status: 'PAID',
            transaction: sessionData.transaction || null,
            checkSecond
          });
        }
        if (Date.now() > sessionData.expiresAt + 3000) {
          return res.json({
            paid: false,
            status: 'EXPIRED',
            checkSecond
          });
        }
      }
    } catch (e) {}

    // 2. Check Bakong Open API `/v1/check_transaction_by_md5`
    let token = process.env.BAKONG_TOKEN || '';
    if (!token) {
      try {
        const settingsDoc = await settingsCollection.doc('payment').get();
        if (settingsDoc.exists && settingsDoc.data().bakongToken) {
          token = settingsDoc.data().bakongToken;
        }
      } catch (e) {}
    }

    if (token) {
      try {
        const bakongRes = await postBakongApi('/v1/check_transaction_by_md5', { md5 }, token);
        // Bakong returns responseCode === 0 when transaction is paid
        if (bakongRes && (bakongRes.responseCode === 0 || bakongRes.status?.code === 0) && bakongRes.data) {
          try {
            await khqrSessionsCollection.doc(String(md5)).set({
              status: 'PAID',
              paidAt: Date.now(),
              transaction: bakongRes.data
            }, { merge: true });
          } catch (e) {}

          return res.json({
            paid: true,
            status: 'PAID',
            transaction: bakongRes.data,
            checkSecond
          });
        }
      } catch (apiErr) {
        console.error(`Bakong API check at ${checkSecond || '?'}s warning:`, apiErr.message);
      }
    }

    return res.json({
      paid: false,
      status: 'PENDING',
      checkSecond: checkSecond || null,
      tokenConfigured: Boolean(token)
    });
  } catch (err) {
    console.error('KHQR Check Error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
