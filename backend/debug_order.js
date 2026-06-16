const mongoose = require('mongoose');
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const Order = require('./models/Order');
require('dotenv').config();

const check = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const orders = await Order.find().sort({ createdAt: -1 }).limit(1);
  console.log('LATEST ORDER ITEMS:');
  console.log(JSON.stringify(orders[0].items, null, 2));
  process.exit();
};

check();
