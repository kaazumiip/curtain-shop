const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  customer: {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    postcode: { type: String, required: true },
    phone: { type: String }
  },
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: { type: String },
    basePrice: { type: Number },
    totalPrice: { type: Number },
    selectedSize: {
      name: { type: String },
      width: { type: Number },
      price: { type: Number }
    },
    selectedColor: {
      name: { type: String },
      imageUrl: { type: String }
    },
    poleColor: { type: String },
    imageUrl: { type: String }
  }],
  subtotal: { type: Number, required: true },
  paymentMethod: { type: String, required: true },
  status: { 
    type: String, 
    default: 'Preparing', 
    enum: ['Preparing', 'Finishing Touch', 'To Shipping Place', 'Shipping Processing', 'Head to Location', 'Order Arrived', 'Cancelled'] 
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', OrderSchema);
