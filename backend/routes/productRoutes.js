const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const upload = require('../config/cloudinary');

// @desc    Upload image to Cloudinary
// @route   POST /api/products/upload
router.post('/upload', upload.single('image'), (req, res) => {
  try {
    console.log('--- Upload Request Received ---');
    if (!req.file) {
      console.log('No file in request');
      return res.status(400).json({ message: 'No file uploaded' });
    }
    console.log('File uploaded to Cloudinary:', req.file.path);
    res.json({ imageUrl: req.file.path });
  } catch (err) {
    console.error('Cloudinary Error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// @desc    Get all products
// @route   GET /api/products
router.get('/', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @desc    Get single product
// @route   GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @desc    Create a product (CRUD - Admin)
// @route   POST /api/products
router.post('/', async (req, res) => {
  try {
    const newProduct = new Product(req.body);
    const savedProduct = await newProduct.save();
    res.status(201).json(savedProduct);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// @desc    Update a product (Edit/Stock - Admin)
// @route   PUT /api/products/:id
router.put('/:id', async (req, res) => {
  try {
    // Re-run the self-update status logic on findByIdAndUpdate
    // requires setting runValidators: true if using specific validators
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    Object.assign(product, req.body);
    const updatedProduct = await product.save(); // save() triggers the 'pre' middleware
    res.json(updatedProduct);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// @desc    Delete a product (Delete - Admin)
// @route   DELETE /api/products/:id
router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product removed successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
