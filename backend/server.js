const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const dns = require('dns');

dns.setServers(['8.8.8.8', '1.1.1.1']);

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('>>> MongoDB Atlas Connected: Srey Tha Central Data'))
  .catch(err => {
    console.error('!!! MongoDB Connection Error:', err.message);
    console.log('Ensure your MONGO_URI in .env is correct.');
  });

// Routes
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/hardware', require('./routes/hardwareRoutes'));

// Basic Route
app.get('/', (req, res) => {
  res.json({ 
    brand: "Srey Tha Curtain",
    message: "Core API is active",
    status: "vanguard-active"
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`-------------------------------------------`);
  console.log(` SREY THA CURTAIN - CORE API `);
  console.log(` Server running on port: ${PORT} `);
  console.log(`-------------------------------------------`);
});
