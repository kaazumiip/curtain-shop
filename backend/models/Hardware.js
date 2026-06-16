const mongoose = require('mongoose');

const HardwareSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Please add a hardware color name'],
    trim: true,
    unique: true
  },
  ringImageUrl: { 
    type: String, 
    required: [true, 'Please add a ring image']
  },
  poleImageUrl: { 
    type: String, 
    required: [true, 'Please add a pole image']
  },
  status: {
    type: String,
    enum: ['available', 'out-of-stock'],
    default: 'available'
  }
}, { 
  timestamps: true 
});

module.exports = mongoose.model('Hardware', HardwareSchema);
