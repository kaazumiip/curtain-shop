const mongoose = require('mongoose');
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const Order = require('./models/Order');
require('dotenv').config();

const test = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    const orderData = {
      customer: {
        firstName: 'Test',
        lastName: 'Direct',
        email: 'test@example.com',
        address: '123 Street',
        city: 'Phnom Penh',
        postcode: '12000',
        phone: '012345678'
      },
      paymentMethod: 'ABA Bank',
      items: [
        {
          name: 'Curtain Direct Test',
          price: 50,
          totalPrice: 50,
          selectedSize: { name: '140x250', price: 50, width: 1.4 },
          poleColor: 'Gold',
          imageUrl: 'https://via.placeholder.com/150'
        }
      ],
      subtotal: 50
    };

    const newOrder = new Order(orderData);
    const saved = await newOrder.save();
    console.log('Saved Pole Color:', saved.items[0].poleColor);
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

test();
