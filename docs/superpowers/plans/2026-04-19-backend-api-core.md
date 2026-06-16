# Implementation Plan: Backend API Core

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal**: Create a robust Node.js/Express API with MongoDB/Mongoose to manage curtains and bedsheets for Srey Tha Curtain.

**Architecture**: RESTful API with separate controllers and routes for products. Security handled via environment variables.

**Tech Stack**: Node.js, Express, Mongoose, MongoDB Atlas.

---

### Task 1: Backend Project Initialization
**Files**: 
- Create: `backend/package.json`
- Create: `backend/server.js`
- Create: `backend/.env`

- [ ] **Step 1: Create package.json**
```json
{
  "name": "srey-tha-backend",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^7.0.0",
    "cors": "^2.8.5",
    "dotenv": "^16.0.3"
  },
  "devDependencies": {
    "nodemon": "^2.0.22"
  }
}
```

- [ ] **Step 2: Create basic server.js with middleware**
```javascript
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.json({ message: 'Srey Tha API Core Running...' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

- [ ] **Step 3: Create .env placeholder**
```text
PORT=5000
MONGO_URI=mongodb+srv://admin:placeholder@cluster0.mongodb.net/srey_tha?retryWrites=true&w=majority
```

- [ ] **Step 4: Commit**
```bash
git add backend/
git commit -m "chore: initialize backend api server"
```

---

### Task 2: MongoDB Connection & Product Model
**Files**:
- Create: `backend/models/Product.js`
- Modify: `backend/server.js`

- [ ] **Step 1: Define Product Schema**
```javascript
const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  category: { type: String, enum: ['Curtain', 'Bed Sheet', 'Pillow Case'], required: true },
  stock: { type: Number, default: 0 },
  imageUrl: { type: String },
  status: { type: String, enum: ['available', 'low-stock', 'sold-out'], default: 'available' }
}, { timestamps: true });

module.exports = mongoose.model('Product', ProductSchema);
```

- [ ] **Step 2: Connect DB in server.js**
Insert after `dotenv.config()`:
```javascript
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Atlas Connected'))
  .catch(err => console.error('Conenction Error:', err));
```

- [ ] **Step 3: Commit**
```bash
git add backend/models/Product.js backend/server.js
git commit -m "feat: add mongo connection and product model"
```

---

### Task 3: API CRUD Routes
**Files**:
- Create: `backend/routes/productRoutes.js`
- Modify: `backend/server.js`

- [ ] **Step 1: Implement full CRUD routes**
```javascript
const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// Get all products
router.get('/', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create product
router.post('/', async (req, res) => {
  try {
    const newProduct = new Product(req.body);
    const savedProduct = await newProduct.save();
    res.status(201).json(savedProduct);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update stock/details
router.put('/:id', async (req, res) => {
  try {
    const updated = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete product
router.delete('/:id', async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
```

- [ ] **Step 2: Register routes in server.js**
Insert before `app.listen()`:
```javascript
app.use('/api/products', require('./routes/productRoutes'));
```

- [ ] **Step 3: Commit**
```bash
git add backend/routes/productRoutes.js backend/server.js
git commit -m "feat: implement refined product crud api"
```
