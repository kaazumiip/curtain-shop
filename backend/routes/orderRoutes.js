const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const {
  sendTelegramNotification,
  sendOrderNotification,
  formatOrderMessage,
  formatStatusUpdateMessage,
  formatMeasurementMessage
} = require('../utils/telegram');

const collection = db.collection('orders');
const productsCollection = db.collection('products');
const measurementsCollection = db.collection('measurements');

const calculateProductStatus = (stock) => {
  const num = Number(stock) || 0;
  if (num <= 0) return 'sold-out';
  if (num <= 5) return 'low-stock';
  return 'available';
};

const formatOrder = (doc) => {
  const data = doc.data();
  return {
    _id: doc.id,
    id: doc.id,
    ...data,
    subtotal: Number(data.subtotal) || 0,
    items: data.items || [],
    customer: data.customer || {},
    status: data.status || 'Preparing',
    createdAt: data.createdAt || new Date().toISOString()
  };
};

// @route   POST /api/orders/book-measurement
// @desc    Book a free home window measurement and notify Telegram
router.post('/book-measurement', async (req, res) => {
  try {
    const {
      name,
      phone,
      preferredDate,
      windowNotes,
      address,
      additionalAddress,
      latitude,
      longitude,
      googleMapsUrl
    } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ error: 'Name and phone number are required' });
    }

    const bookingData = {
      name,
      phone,
      preferredDate: preferredDate || 'ពេលណាក៏បាន',
      windowNotes: windowNotes || '',
      address: address || '',
      additionalAddress: additionalAddress || '',
      latitude: latitude || null,
      longitude: longitude || null,
      googleMapsUrl: googleMapsUrl || (latitude && longitude ? `https://www.google.com/maps?q=${latitude},${longitude}` : ''),
      status: 'Pending',
      createdAt: new Date().toISOString()
    };

    const docRef = await measurementsCollection.add(bookingData);

    try {
      const msg = formatMeasurementMessage({ id: docRef.id, ...bookingData });
      sendTelegramNotification(msg);
    } catch (telegramErr) {
      console.error('Failed to trigger measurement Telegram alert:', telegramErr.message);
    }

    res.status(201).json({ id: docRef.id, ...bookingData });
  } catch (err) {
    console.error('Book measurement error:', err);
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

// @route   POST /api/orders
// @desc    Create a new order and automatically deduct product stock with server-verified pricing
router.post('/', async (req, res) => {
  try {
    const { customer, items, paymentMethod } = req.body;
    const orderItems = Array.isArray(items) ? items : [];

    if (orderItems.length === 0) {
      return res.status(400).json({ error: 'កន្ត្រកទំនិញរបស់អ្នកទទេស្អាត' });
    }

    // Payment validation check
    if (paymentMethod === 'Credit Card') {
      const card = req.body.cardDetails || customer?.cardDetails;
      const cleanCard = String(card?.cardNumber || '').replace(/\D/g, '');
      if (cleanCard.length < 4) {
        return res.status(400).json({ error: 'ការទូទាត់កាតមិនជោគជ័យ សូមពិនិត្យព័ត៌មានកាតឡើងវិញ' });
      }
    }

    let calculatedSubtotal = 0;
    const verifiedItems = [];

    // 1. Process items, verify prices with DB, calculate actual subtotal, and deduct stock
    for (const item of orderItems) {
      const prodId = item._id || item.id || item.productId;
      const qty = Math.max(1, Number(item.quantity) || 1);
      let verifiedUnitPrice = Number(item.price) || 0;
      let calculatedItemTotal = 0;
      let prodData = null;

      if (prodId) {
        try {
          const prodRef = productsCollection.doc(String(prodId));
          const prodDoc = await prodRef.get();
          if (prodDoc.exists) {
            prodData = prodDoc.data();
            verifiedUnitPrice = Number(prodData.price) || 0;

            // Accurate stock deduction (Curtains/Valance area or Fabric meters if applicable, or unit quantity)
            let stockUnitsDeduct = qty;
            if (prodData.category === 'Fabric' && item.fabricMeters) {
              stockUnitsDeduct = Math.ceil((parseFloat(item.fabricMeters) || 1) * qty);
            }
            const currentStock = Number(prodData.stock) || 0;
            const newStock = Math.max(0, currentStock - stockUnitsDeduct);

            await prodRef.set(
              {
                stock: newStock,
                status: calculateProductStatus(newStock),
                updatedAt: new Date().toISOString()
              },
              { merge: true }
            );
          }
        } catch (stockErr) {
          console.error(`Failed to verify product ${prodId}:`, stockErr.message);
        }
      }

      // Calculate server item total based on category rules
      if (item.category === 'Accessories' && item.subCategory?.toLowerCase() === 'pole') {
        const w = parseFloat(item.customWidth) || 1;
        calculatedItemTotal = verifiedUnitPrice * w * qty;
      } else if (item.category === 'Curtain' || item.category === 'Valance') {
        const w = parseFloat(item.customWidth) || 1;
        const h = parseFloat(item.customHeight) || 1;
        calculatedItemTotal = verifiedUnitPrice * w * h * qty;
      } else if (item.category === 'Fabric') {
        const m = parseFloat(item.fabricMeters) || 1;
        calculatedItemTotal = verifiedUnitPrice * m * qty;
      } else if (item.selectedSize?.price) {
        calculatedItemTotal = Number(item.selectedSize.price) * qty;
      } else {
        calculatedItemTotal = verifiedUnitPrice * qty;
      }

      const prodImg = (prodData?.images && prodData.images.length > 0 ? prodData.images[0].url : '') || prodData?.imageUrl || item.imageUrl || (item.images && item.images[0]?.url) || '';

      calculatedSubtotal += calculatedItemTotal;
      verifiedItems.push({
        ...item,
        name: item.name || prodData?.name || 'Curtain',
        imageUrl: prodImg,
        images: prodData?.images || item.images || (prodImg ? [{ url: prodImg }] : []),
        price: verifiedUnitPrice,
        totalPrice: Number(calculatedItemTotal.toFixed(2))
      });
    }

    const finalSubtotal = Number(calculatedSubtotal.toFixed(2));

    // 2. Save order document with server-verified total
    const newOrderData = {
      customer: customer || {},
      items: verifiedItems,
      subtotal: finalSubtotal,
      paymentMethod: paymentMethod || 'ABA Bank',
      paymentDetails: req.body.paymentDetails || (paymentMethod === 'ABA Bank' ? { merchantId: '14463116', accountName: 'LIM SITHA' } : null),
      status: 'Preparing',
      stockDeducted: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const docRef = await collection.add(newOrderData);
    const savedDoc = await docRef.get();
    const formattedOrder = formatOrder(savedDoc);

    // 3. Trigger exactly ONE single Telegram notification with photo and order text
    try {
      sendOrderNotification(formattedOrder);
    } catch (telegramErr) {
      console.error('Failed to trigger Telegram alert:', telegramErr.message);
    }

    res.status(201).json(formattedOrder);
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

// @route   GET /api/orders
// @desc    Get all orders (for admin)
router.get('/', async (req, res) => {
  try {
    const snapshot = await collection.orderBy('createdAt', 'desc').get();
    const orders = snapshot.docs.map(formatOrder);
    res.json(orders);
  } catch (err) {
    try {
      const snapshot = await collection.get();
      const orders = snapshot.docs.map(formatOrder);
      orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      res.json(orders);
    } catch (fallbackErr) {
      console.error('Get orders error:', fallbackErr);
      res.status(500).json({ error: 'Server error' });
    }
  }
});

// @route   GET /api/orders/:id
// @desc    Get order by ID
router.get('/:id', async (req, res) => {
  try {
    const doc = await collection.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Order not found' });
    res.json(formatOrder(doc));
  } catch (err) {
    console.error('Get order error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/orders/:id
// @desc    Update order status (and restore stock if Cancelled, plus notify Telegram)
router.put('/:id', async (req, res) => {
  try {
    const { status, actionType, note } = req.body;
    const docRef = collection.doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ error: 'Order not found' });

    const prevData = doc.data();
    const prevStatus = prevData.status;

    const updates = {
      updatedAt: new Date().toISOString()
    };
    if (status) updates.status = status;
    if (note) updates.customerNote = note;
    if (actionType === 'installation_request') {
      updates.installationRequested = true;
      updates.installationRequestedAt = new Date().toISOString();
    }

    // Restore stock if transitioning to Cancelled for the first time
    if (status === 'Cancelled' && prevStatus !== 'Cancelled' && prevData.stockDeducted !== false) {
      const orderItems = Array.isArray(prevData.items) ? prevData.items : [];
      for (const item of orderItems) {
        const prodId = item._id || item.id || item.productId;
        const qtyToRestore = Math.max(1, Number(item.quantity) || 1);
        if (prodId) {
          try {
            const prodRef = productsCollection.doc(String(prodId));
            const prodDoc = await prodRef.get();
            if (prodDoc.exists) {
              const currentStock = Number(prodDoc.data().stock) || 0;
              const newStock = currentStock + qtyToRestore;
              await prodRef.set(
                {
                  stock: newStock,
                  status: calculateProductStatus(newStock),
                  updatedAt: new Date().toISOString()
                },
                { merge: true }
              );
            }
          } catch (restoreErr) {
            console.error(`Failed to restore stock for product ${prodId}:`, restoreErr.message);
          }
        }
      }
      updates.stockDeducted = false;
    }

    await docRef.set(updates, { merge: true });
    const updatedDoc = await docRef.get();
    const formattedUpdated = formatOrder(updatedDoc);

    // Send Telegram notification on Cancel, Installation Request, or Completion
    if (
      status === 'Cancelled' ||
      status === 'Order Arrived' ||
      actionType === 'cancelled' ||
      actionType === 'installation_request'
    ) {
      try {
        const msg = formatStatusUpdateMessage(
          formattedUpdated,
          actionType || (status === 'Cancelled' ? 'cancelled' : 'status_update'),
          note
        );
        sendTelegramNotification(msg);
      } catch (teleErr) {
        console.error('Telegram update alert failed:', teleErr.message);
      }
    }

    res.json(formattedUpdated);
  } catch (err) {
    console.error('Update order error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
