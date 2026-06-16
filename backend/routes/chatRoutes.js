const express = require('express');
const router = express.Router();
const ChatMessage = require('../models/ChatMessage');

// Get messages for a specific session
router.get('/:sessionId', async (req, res) => {
  try {
    const messages = await ChatMessage.find({ sessionId: req.params.sessionId }).sort({ timestamp: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Send a message
router.post('/', async (req, res) => {
  const { sessionId, sender, message } = req.body;
  const chatMessage = new ChatMessage({ sessionId, sender, message });
  try {
    const newMessage = await chatMessage.save();
    res.status(201).json(newMessage);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Admin: Get all active chat sessions (unique sessionIds)
router.get('/admin/sessions', async (req, res) => {
  try {
    const sessions = await ChatMessage.aggregate([
      { $sort: { timestamp: -1 } },
      { $group: { 
        _id: "$sessionId", 
        lastMessage: { $first: "$message" }, 
        lastTimestamp: { $first: "$timestamp" },
        unreadCount: { $sum: { $cond: [{ $and: [{ $eq: ["$sender", "customer"] }, { $eq: ["$readByAdmin", false] }] }, 1, 0] } }
      }},
      { $sort: { lastTimestamp: -1 } }
    ]);
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Mark messages as read
router.put('/read/:sessionId/:role', async (req, res) => {
  const { sessionId, role } = req.params;
  try {
    const update = role === 'admin' ? { readByAdmin: true } : { readByCustomer: true };
    await ChatMessage.updateMany({ sessionId, sender: role === 'admin' ? 'customer' : 'admin' }, update);
    res.json({ message: 'Marked as read' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
