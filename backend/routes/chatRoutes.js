const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');

const collection = db.collection('chat_messages');

const formatMessage = (doc) => {
  const data = doc.data();
  return {
    _id: doc.id,
    id: doc.id,
    ...data
  };
};

// Get messages for a specific session
router.get('/:sessionId', async (req, res) => {
  try {
    const snapshot = await collection
      .where('sessionId', '==', req.params.sessionId)
      .get();

    const messages = snapshot.docs.map(formatMessage);
    messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    res.json(messages);
  } catch (err) {
    console.error('Get chat error:', err);
    res.status(500).json({ message: err.message });
  }
});

// Send a message
router.post('/', async (req, res) => {
  const { sessionId, sender, message } = req.body;
  if (!sessionId || !message) {
    return res.status(400).json({ message: 'Session ID and message required' });
  }

  try {
    const msgData = {
      sessionId,
      sender: sender || 'customer',
      message,
      timestamp: new Date().toISOString(),
      readByAdmin: sender === 'admin',
      readByCustomer: sender === 'customer'
    };

    const docRef = await collection.add(msgData);
    const doc = await docRef.get();
    res.status(201).json(formatMessage(doc));
  } catch (err) {
    console.error('Send chat error:', err);
    res.status(400).json({ message: err.message });
  }
});

// Admin: Get all active chat sessions (unique sessionIds)
router.get('/admin/sessions', async (req, res) => {
  try {
    const snapshot = await collection.get();
    const messages = snapshot.docs.map(formatMessage);

    // Group by sessionId
    const sessionMap = {};
    messages.forEach(msg => {
      const sId = msg.sessionId;
      if (!sessionMap[sId]) {
        sessionMap[sId] = {
          _id: sId,
          sessionId: sId,
          lastMessage: msg.message,
          lastTimestamp: msg.timestamp,
          unreadCount: 0
        };
      }
      // Update with newest message
      if (new Date(msg.timestamp) > new Date(sessionMap[sId].lastTimestamp)) {
        sessionMap[sId].lastMessage = msg.message;
        sessionMap[sId].lastTimestamp = msg.timestamp;
      }
      if (msg.sender === 'customer' && !msg.readByAdmin) {
        sessionMap[sId].unreadCount += 1;
      }
    });

    const sessions = Object.values(sessionMap);
    sessions.sort((a, b) => new Date(b.lastTimestamp) - new Date(a.lastTimestamp));
    res.json(sessions);
  } catch (err) {
    console.error('Admin sessions error:', err);
    res.status(500).json({ message: err.message });
  }
});

// Mark messages as read
router.put('/read/:sessionId/:role', async (req, res) => {
  const { sessionId, role } = req.params;
  try {
    const targetSender = role === 'admin' ? 'customer' : 'admin';
    const snapshot = await collection
      .where('sessionId', '==', sessionId)
      .where('sender', '==', targetSender)
      .get();

    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, role === 'admin' ? { readByAdmin: true } : { readByCustomer: true });
    });
    await batch.commit();

    res.json({ message: 'Marked as read' });
  } catch (err) {
    console.error('Mark read error:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
