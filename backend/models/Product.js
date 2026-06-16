const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Please add a product name'],
    trim: true 
  },
  nameKh: {
    type: String,
    trim: true,
    default: ''
  },
  description: { 
    type: String,
    default: ''
  },
  descriptionKh: {
    type: String,
    default: ''
  },
  price: { 
    type: Number, 
    required: [true, 'Please add a price']
  },
  category: { 
    type: String, 
    required: [true, 'Please select a category'],
    enum: ['Curtain', 'Bed Sheet', 'Pillow Case', 'Accessories', 'Valance', 'Fabric']
  },
  subCategory: {
    type: String,
    default: ''
  },
  stock: { 
    type: Number, 
    required: [true, 'Please add stock quantity'],
    default: 0
  },
  images: [{ 
    url: { type: String, required: true },
    color: { type: String, default: '' }
  }],
  status: {
    type: String,
    enum: ['available', 'low-stock', 'sold-out'],
    default: 'available'
  },
  customOptions: {
    hasHeaderOptions: { type: Boolean, default: false },
    ringPricePerPiece: { type: Number, default: 0.5 },
    ringColors: [{
      name: { type: String },
      imageUrl: { type: String },
      poleImageUrl: { type: String }
    }],
    sizeOptions: [{
      name: { type: String },
      price: { type: Number },
      width: { type: Number, default: 1 }
    }],
    colorOptions: [{
      name: { type: String },
      imageUrl: { type: String },
      swatchUrl: { type: String }
    }],
    cascadeOptions: [{
      name: { type: String },
      imageUrl: { type: String }
    }],
    hardwareColor: { type: String, default: '' }
  }
}, { 
  timestamps: true 
});

// Middleware to automatically update status based on stock
ProductSchema.pre('save', function(next) {
  if (this.stock <= 0) {
    this.status = 'sold-out';
  } else if (this.stock <= 5) {
    this.status = 'low-stock';
  } else {
    this.status = 'available';
  }
  next();
});

module.exports = mongoose.model('Product', ProductSchema);
