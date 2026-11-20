const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.set('trust proxy', 1);

// 1. Security Headers (Helmet-equivalent, zero external dependencies)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.removeHeader('X-Powered-By');
  next();
});

// 2. Restricted CORS (Storefront, Admin Dashboard, and Localhost only)
const allowedOrigins = [
  'https://sreythacurtain.store',
  'https://www.sreythacurtain.store',
  'https://sreytha-curtain.vercel.app',
  'https://curtain-shop-smoky.vercel.app',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000'
];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || /\.vercel\.app$/.test(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-token']
}));

// 3. Body size limit (1MB)
app.use(express.json({ limit: '1mb' }));

// 4. Global & Order Rate Limiting (in-memory per IP)
const createRateLimiter = (windowMs, maxRequests) => {
  const hits = new Map();
  return (req, res, next) => {
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    const now = Date.now();
    const record = hits.get(ip);
    if (!record || now > record.resetAt) {
      hits.set(ip, { count: 1, resetAt: now + windowMs });
      return next();
    }
    if (record.count >= maxRequests) {
      return res.status(429).json({ error: 'Too many requests, please try again later.' });
    }
    record.count += 1;
    return next();
  };
};

// General API rate limit: 200 req / 15 min per IP
app.use('/api', createRateLimiter(15 * 60 * 1000, 200));
// Stricter limit on order creation: 10 orders / 5 min per IP
app.use('/api/orders', (req, res, next) => {
  if (req.method === 'POST' && req.path === '/') {
    return createRateLimiter(5 * 60 * 1000, 10)(req, res, next);
  }
  return next();
});

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
