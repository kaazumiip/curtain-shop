const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Firebase Firestore Connection
require('./config/firebase');

// Routes
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/hardware', require('./routes/hardwareRoutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));

// Basic Health Check Route
app.get(['/', '/health'], (req, res) => {
  res.json({ 
    brand: "Srey Tha Curtain",
    message: "Core API is active (Powered by Firebase Firestore)",
    database: "Firebase Firestore",
    status: "vanguard-active",
    uptime: process.uptime()
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`-------------------------------------------`);
  console.log(` SREY THA CURTAIN - CORE API `);
  console.log(` Database: Firebase Firestore `);
  console.log(` Server running on port: ${PORT} (0.0.0.0) `);
  console.log(`-------------------------------------------`);
});

process.on('uncaughtException', (err) => {
  console.error('CRITICAL: Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('CRITICAL: Unhandled Rejection at:', promise, 'reason:', reason);
});
