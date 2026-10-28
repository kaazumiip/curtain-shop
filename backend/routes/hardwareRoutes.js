const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');

const collection = db.collection('hardware');

const formatHardware = (doc) => {
  const data = doc.data();
  return {
    _id: doc.id,
    id: doc.id,
    ...data
  };
};

// @desc    Get all hardware items
// @route   GET /api/hardware
router.get('/', async (req, res) => {
  try {
    const snapshot = await collection.get();
    const items = snapshot.docs.map(formatHardware);
    res.json(items);
  } catch (err) {
    console.error('Get hardware error:', err);
    res.status(500).json({ message: err.message });
  }
});

// @desc    Create a new hardware item
// @route   POST /api/hardware
router.post('/', async (req, res) => {
  try {
    const { name, ringImageUrl, poleImageUrl } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const docRef = await collection.add({
      name,
      ringImageUrl: ringImageUrl || '',
      poleImageUrl: poleImageUrl || '',
      createdAt: new Date().toISOString()
    });

    const doc = await docRef.get();
    res.status(201).json(formatHardware(doc));
  } catch (err) {
    console.error('Create hardware error:', err);
    res.status(400).json({ message: err.message });
  }
});

// @desc    Delete a hardware item
// @route   DELETE /api/hardware/:id
router.delete('/:id', async (req, res) => {
  try {
    const docRef = collection.doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json({ message: 'Hardware item not found' });
    }
    await docRef.delete();
    res.json({ message: 'Hardware set deleted successfully' });
  } catch (err) {
    console.error('Delete hardware error:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
