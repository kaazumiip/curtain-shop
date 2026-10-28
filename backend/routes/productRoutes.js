const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const upload = require('../config/cloudinary');

const collection = db.collection('products');

// Helper to format Firestore doc into product object
const formatDoc = (doc) => {
  const data = doc.data();
  return {
    _id: doc.id,
    id: doc.id,
    ...data,
    price: data.price !== undefined ? Number(data.price) : 0,
    originalPrice: data.originalPrice !== undefined && data.originalPrice !== '' && data.originalPrice !== null ? Number(data.originalPrice) : null,
    stock: data.stock !== undefined ? Number(data.stock) : 0,
    images: data.images || [],
    customOptions: data.customOptions || { ringColors: [], sizeOptions: [], cascadeOptions: [] }
  };
};

// Calculate status from stock
const calculateStatus = (stock) => {
  const num = Number(stock) || 0;
  if (num <= 0) return 'sold-out';
  if (num <= 5) return 'low-stock';
  return 'available';
};

// @desc    Upload image to Cloudinary
// @route   POST /api/products/upload
router.post('/upload', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
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
    const snapshot = await collection.orderBy('createdAt', 'desc').get();
    const products = snapshot.docs.map(formatDoc);
    res.json(products);
  } catch (err) {
    // If createdAt index isn't ready or missing, fallback to unordered get
    try {
      const snapshot = await collection.get();
      const products = snapshot.docs.map(formatDoc);
      res.json(products);
    } catch (fallbackErr) {
      console.error('Get products error:', fallbackErr);
      res.status(500).json({ message: fallbackErr.message });
    }
  }
});

// @desc    Get single product
// @route   GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const doc = await collection.doc(req.params.id).get();
    if (!doc.exists) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(formatDoc(doc));
  } catch (err) {
    console.error('Get product error:', err);
    res.status(500).json({ message: err.message });
  }
});

// @desc    Create a product (CRUD - Admin)
// @route   POST /api/products
router.post('/', async (req, res) => {
  try {
    const productData = { ...req.body };
    delete productData._id;
    delete productData.id;

    productData.price = Number(productData.price) || 0;
    productData.originalPrice = productData.originalPrice ? Number(productData.originalPrice) : null;
    productData.stock = Number(productData.stock) || 0;
    productData.status = calculateStatus(productData.stock);
    productData.createdAt = new Date().toISOString();
    productData.updatedAt = new Date().toISOString();

    const docRef = await collection.add(productData);
    const createdDoc = await docRef.get();
    res.status(201).json(formatDoc(createdDoc));
  } catch (err) {
    console.error('Create product error:', err);
    res.status(400).json({ message: err.message });
  }
});

// @desc    Update a product (Edit/Stock - Admin)
// @route   PUT /api/products/:id
router.put('/:id', async (req, res) => {
  try {
    const docRef = collection.doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const updates = { ...req.body };
    delete updates._id;
    delete updates.id;

    if (updates.stock !== undefined) {
      updates.stock = Number(updates.stock) || 0;
      updates.status = calculateStatus(updates.stock);
    }
    if (updates.price !== undefined) {
      updates.price = Number(updates.price) || 0;
    }
    if (updates.originalPrice !== undefined) {
      updates.originalPrice = updates.originalPrice ? Number(updates.originalPrice) : null;
    }
    updates.updatedAt = new Date().toISOString();

    await docRef.set(updates, { merge: true });
    const updatedDoc = await docRef.get();
    res.json(formatDoc(updatedDoc));
  } catch (err) {
    console.error('Update product error:', err);
    res.status(400).json({ message: err.message });
  }
});

// @desc    Delete a product (Delete - Admin)
// @route   DELETE /api/products/:id
router.delete('/:id', async (req, res) => {
  try {
    const docRef = collection.doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json({ message: 'Product not found' });
    }

    await docRef.delete();
    res.json({ message: 'Product removed successfully' });
  } catch (err) {
    console.error('Delete product error:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
