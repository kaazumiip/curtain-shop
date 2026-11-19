const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const requireAdmin = require('../middleware/requireAdmin');
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

// @route   GET /api/orders/measurements
// @desc    Get all measurement appointments (Admin)
router.get('/measurements', requireAdmin, async (req, res) => {
  try {
    const snapshot = await measurementsCollection.orderBy('createdAt', 'desc').get();
    const list = snapshot.docs.map((doc) => ({ _id: doc.id, id: doc.id, ...doc.data() }));
    res.json(list);
  } catch (err) {
    try {
      const snapshot = await measurementsCollection.get();
      const list = snapshot.docs.map((doc) => ({ _id: doc.id, id: doc.id, ...doc.data() }));
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      res.json(list);
    } catch (fallbackErr) {
      console.error('Get measurements error:', fallbackErr);
      res.status(500).json({ error: 'Server error' });
    }
  }
});

// @route   PUT /api/orders/measurements/:id
// @desc    Update measurement appointment status
router.put('/measurements/:id', requireAdmin, async (req, res) => {
  try {
    const docRef = measurementsCollection.doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ error: 'Measurement booking not found' });

    const { status } = req.body;
    await docRef.set({ status: status || 'Completed', updatedAt: new Date().toISOString() }, { merge: true });
    const updated = await docRef.get();
    res.json({ _id: updated.id, id: updated.id, ...updated.data() });
  } catch (err) {
    console.error('Update measurement error:', err);
    res.status(500).json({ error: 'Server error' });
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
    if (paymentMethod === 'ABA / ACLEDA / Bakong KHQR' || paymentMethod === 'ABA Bank') {
      const md5 = req.body.paymentDetails?.md5;
      const isClientPaid = req.body.paymentDetails?.khqrStatus === 'PAID';
      if (!md5 && !isClientPaid) {
        return res.status(400).json({ error: 'សូមស្កេនបង់ប្រាក់តាមកូដ KHQR ជាមុនសិន!' });
      }
      if (md5 && !isClientPaid) {
        const sessionDoc = await db.collection('khqr_sessions').doc(String(md5)).get();
        if (!sessionDoc.exists || sessionDoc.data()?.status !== 'PAID') {
          return res.status(400).json({ error: 'ការទូទាត់ប្រាក់តាមកូដ KHQR មិនទាន់បានបញ្ចប់ទេ សូមបង់ប្រាក់ជាមុនសិន!' });
        }
      }
    }

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
        const extraHeight = Math.max(0, h - 2.5);
        calculatedItemTotal = verifiedUnitPrice * w * (1 + extraHeight) * qty;
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

    // Generate sequential order number (1, 2, 3, ...)
    let orderNumber = 1;
    try {
      const counterRef = db.collection('settings').doc('orderCounter');
      orderNumber = await db.runTransaction(async (tx) => {
        const counterDoc = await tx.get(counterRef);
        const nextNum = (counterDoc.exists ? Number(counterDoc.data()?.lastOrderNumber || 0) : 0) + 1;
        tx.set(counterRef, { lastOrderNumber: nextNum }, { merge: true });
        return nextNum;
      });
    } catch (counterErr) {
      console.error('Order counter error:', counterErr.message);
    }

    // 2. Save order document with server-verified total
    const newOrderData = {
      orderNumber,
      customer: customer || {},
      items: verifiedItems,
      subtotal: finalSubtotal,
      paymentMethod: paymentMethod || 'ABA / ACLEDA / Bakong KHQR',
      paymentDetails: req.body.paymentDetails || ((paymentMethod === 'ABA Bank' || paymentMethod === 'ABA / ACLEDA / Bakong KHQR') ? { bakongAccountId: 'lim_sitha1@bkrt', accountName: 'LIM SITHA' } : null),
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

// @route   GET /api/orders/measurements
// @desc    Get all measurement appointments (Admin)
router.get('/measurements', requireAdmin, async (req, res) => {
  try {
    const snapshot = await measurementsCollection.orderBy('createdAt', 'desc').get();
    const list = snapshot.docs.map((doc) => ({ _id: doc.id, id: doc.id, ...doc.data() }));
    res.json(list);
  } catch (err) {
    try {
      const snapshot = await measurementsCollection.get();
      const list = snapshot.docs.map((doc) => ({ _id: doc.id, id: doc.id, ...doc.data() }));
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      res.json(list);
    } catch (fallbackErr) {
      console.error('Get measurements error:', fallbackErr);
      res.status(500).json({ error: 'Server error' });
    }
  }
});

// @route   PUT /api/orders/measurements/:id
// @desc    Update measurement appointment status
router.put('/measurements/:id', requireAdmin, async (req, res) => {
  try {
    const docRef = measurementsCollection.doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ error: 'Measurement booking not found' });

    const { status } = req.body;
    await docRef.set({ status: status || 'Completed', updatedAt: new Date().toISOString() }, { merge: true });
    const updated = await docRef.get();
    res.json({ _id: updated.id, id: updated.id, ...updated.data() });
  } catch (err) {
    console.error('Update measurement error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/orders
// @desc    Get all orders (for admin)
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

const filterAndCleanupCancelledOrders = (orders) => {
  const now = Date.now();
  return orders.filter((order) => {
    if (String(order.status || '').toLowerCase() === 'cancelled') {
      const refTime = new Date(order.updatedAt || order.createdAt || 0).getTime();
      if (refTime > 0 && now - refTime > SEVEN_DAYS_MS) {
        collection.doc(order._id).delete().catch(() => {});
        return false;
      }
    }
    return true;
  });
};

router.get('/', requireAdmin, async (req, res) => {
  try {
    const snapshot = await collection.orderBy('createdAt', 'desc').get();
    const orders = filterAndCleanupCancelledOrders(snapshot.docs.map(formatOrder));
    res.json(orders);
  } catch (err) {
    try {
      const snapshot = await collection.get();
      const orders = filterAndCleanupCancelledOrders(snapshot.docs.map(formatOrder));
      orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      res.json(orders);
    } catch (fallbackErr) {
      console.error('Get orders error:', fallbackErr);
      res.status(500).json({ error: 'Server error' });
    }
  }
});

// @route   POST /api/orders/telegram-webhook
// @desc    Handle Telegram inline button callbacks to update order status directly from Telegram
router.post('/telegram-webhook', async (req, res) => {
  try {
    const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET || 'sreytha_tg_wh_2026';
    const receivedSecret = req.headers['x-telegram-bot-api-secret-token'];
    if (receivedSecret !== expectedSecret) {
      return res.sendStatus(403);
    }
    const cb = req.body?.callback_query;
    if (!cb || !cb.data) {
      return res.sendStatus(200);
    }

    const parts = String(cb.data).split(':');
    if (parts[0] === 'st' && parts.length >= 3) {
      const newStatus = parts[1];
      const orderId = parts.slice(2).join(':');
      const docRef = collection.doc(orderId);
      const doc = await docRef.get();

      if (doc.exists) {
        await docRef.set(
          { status: newStatus, updatedAt: new Date().toISOString() },
          { merge: true }
        );
      }

      const token = process.env.TELEGRAM_BOT_TOKEN;
      if (token) {
        const https = require('https');
        const payload = JSON.stringify({
          callback_query_id: cb.id,
          text: doc.exists ? `✅ Order updated to: ${newStatus}` : 'Order not found',
          show_alert: false
        });
        const tgReq = https.request({
          hostname: 'api.telegram.org',
          port: 443,
          path: `/bot${token}/answerCallbackQuery`,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload)
          }
        });
        tgReq.on('error', () => {});
        tgReq.write(payload);
        tgReq.end();

        // Remove inline buttons only when order is Delivered or Cancelled
        if (['Order Arrived', 'Cancelled'].includes(newStatus) && cb.message?.chat?.id && cb.message?.message_id) {
          const removeMarkupPayload = JSON.stringify({
            chat_id: cb.message.chat.id,
            message_id: cb.message.message_id,
            reply_markup: { inline_keyboard: [] }
          });
          const rmReq = https.request({
            hostname: 'api.telegram.org',
            port: 443,
            path: `/bot${token}/editMessageReplyMarkup`,
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(removeMarkupPayload)
            }
          });
          rmReq.on('error', () => {});
          rmReq.write(removeMarkupPayload);
          rmReq.end();
        }
      }
    }
    return res.sendStatus(200);
  } catch (err) {
    console.error('Telegram webhook error:', err);
    return res.sendStatus(200);
  }
});

// @route   GET /api/orders/lookup?q=...
// @desc    Track orders by phone number or order number without an account
router.get('/lookup', async (req, res) => {
  try {
    const rawQuery = String(req.query.q || '').trim();
    const cleanQuery = rawQuery.replace(/[\s\-#]/g, '');
    if (!cleanQuery || cleanQuery.length < 1) {
      return res.json([]);
    }

    const snapshot = await collection.get();
    const allOrders = snapshot.docs.map(formatOrder);
    const matched = allOrders.filter((order) => {
      const phone1 = String(order.customer?.phone || '').replace(/[\s\-]/g, '');
      const phone2 = String(order.customer?.phone2 || '').replace(/[\s\-]/g, '');
      const orderNum = String(order.orderNumber || '');
      const orderId = String(order._id || '');
      return (
        (phone1 && phone1 === cleanQuery) ||
        (phone2 && phone2 === cleanQuery) ||
        (orderNum && orderNum === cleanQuery) ||
        orderId === rawQuery
      );
    });

    matched.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(matched);
  } catch (err) {
    console.error('Order lookup error:', err);
    res.status(500).json({ error: 'Server error' });
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
