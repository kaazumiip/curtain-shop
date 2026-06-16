const express = require('express');
const router = express.Router();
const Hardware = require('../models/Hardware');

// @desc    Get all hardware sets
// @route   GET /api/hardware
router.get('/', async (req, res) => {
  try {
    const hardware = await Hardware.find();
    res.json(hardware);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @desc    Create a new hardware set
// @route   POST /api/hardware
router.post('/', async (req, res) => {
  const hardware = new Hardware({
    name: req.body.name,
    ringImageUrl: req.body.ringImageUrl,
    poleImageUrl: req.body.poleImageUrl,
    status: req.body.status
  });

  try {
    const newHardware = await hardware.save();
    res.status(201).json(newHardware);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// @desc    Delete a hardware set
// @route   DELETE /api/hardware/:id
router.delete('/:id', async (req, res) => {
  try {
    await Hardware.findByIdAndDelete(req.params.id);
    res.json({ message: 'Hardware set deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
