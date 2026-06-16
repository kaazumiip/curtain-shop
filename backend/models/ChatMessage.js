const mongoose = require('mongoose');

const ChatMessageSchema = new mongoose.Schema({
  sessionId: { type: String, required: true }, // Unique ID for guest/user session
  sender: { type: String, enum: ['customer', 'admin'], required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  readByAdmin: { type: Boolean, default: false },
  readByCustomer: { type: Boolean, default: false }
});

module.exports = mongoose.model('ChatMessage', ChatMessageSchema);
