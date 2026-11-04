const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');

const settingsCollection = db.collection('settings');

const DEFAULT_PAYMENT_SETTINGS = {
  accountName: 'LIM SITHA',
  merchantId: '14463116',
  bakongQrUrl: '',
  abaQrUrl: '',
  acledaQrUrl: '',
  acledaAccountNumber: '',
  updatedAt: null
};

// @desc    Get payment settings (Bakong / ABA / ACLEDA QR & account info)
// @route   GET /api/settings/payment
router.get('/payment', async (req, res) => {
  try {
    const doc = await settingsCollection.doc('payment').get();
    if (!doc.exists) {
      return res.json(DEFAULT_PAYMENT_SETTINGS);
    }
    res.json({ ...DEFAULT_PAYMENT_SETTINGS, ...doc.data() });
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
      accountName,
      merchantId,
      bakongQrUrl,
      abaQrUrl,
      acledaQrUrl,
      acledaAccountNumber
    } = req.body;

    const updates = {
      updatedAt: new Date().toISOString()
    };

    if (accountName !== undefined) updates.accountName = String(accountName).trim() || 'LIM SITHA';
    if (merchantId !== undefined) updates.merchantId = String(merchantId).trim() || '14463116';
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

module.exports = router;
