const https = require('https');

/**
 * Sends a photo message with caption to Telegram
 */
const sendTelegramPhoto = (photoUrl, caption = '') => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId || !photoUrl) {
    return;
  }

  const payload = JSON.stringify({
    chat_id: chatId,
    photo: photoUrl,
    caption: caption.slice(0, 1000),
    parse_mode: 'HTML'
  });

  const options = {
    hostname: 'api.telegram.org',
    port: 443,
    path: `/bot${token}/sendPhoto`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    }
  };

  const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        console.log('[Telegram Photo Alert]: Product photo sent successfully.');
      } else {
        console.error('[Telegram Photo Alert Failed]:', data);
      }
    });
  });

  req.on('error', (err) => {
    console.error('[Telegram Photo Error]:', err.message);
  });

  req.write(payload);
  req.end();
};

/**
 * Sends a Telegram notification message to the configured bot and chat
 * @param {string} text - Message text (HTML formatted)
 */
const sendTelegramNotification = (text) => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.log('[Telegram Alert Skipped]: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not configured in .env');
    return;
  }

  const payload = JSON.stringify({
    chat_id: chatId,
    text: text,
    parse_mode: 'HTML'
  });

  const options = {
    hostname: 'api.telegram.org',
    port: 443,
    path: `/bot${token}/sendMessage`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    }
  };

  const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        console.log('[Telegram Alert]: Order notification sent successfully.');
      } else {
        console.error('[Telegram Alert Failed]:', data);
      }
    });
  });

  req.on('error', (err) => {
    console.error('[Telegram Alert Error]:', err.message);
  });

  req.write(payload);
  req.end();
};

/**
 * Formats order data into a clean, crystal-clear Telegram notification
 * @param {Object} order - Created order document
 */
const formatOrderMessage = (order) => {
  const customer = order.customer || {};
  const items = order.items || [];

  const itemsList = items.map((item, index) => {
    const itemPrice = item.totalPrice || item.price || item.basePrice || 0;
    const rawCategory = item.category || 'Curtain';
    const category = rawCategory === 'Valance' ? 'ដក់ (Valance)' : (rawCategory === 'Curtain' ? 'វាំងនន (Curtain)' : rawCategory);
    
    // Build clear line-by-line product specification
    let specs = [];
    
    if (item.quantity) {
      specs.push(`▫️ <b>Quantity:</b> <code>${item.quantity} Unit(s)</code>`);
    }

    if (category === 'Fabric' && item.fabricMeters) {
      specs.push(`▫️ <b>Fabric Length:</b> <code>${item.fabricMeters} Meters</code>`);
    } else if (item.customWidth || item.customHeight) {
      const w = item.customWidth || '-';
      const h = item.customHeight ? ` x ${item.customHeight}m (H)` : '';
      specs.push(`▫️ <b>Dimensions:</b> <code>${w}m (W)${h}</code>`);
    }

    if (item.selectedColorName || item.selectedColor?.name) {
      const color = item.selectedColorName || item.selectedColor?.name;
      specs.push(`▫️ <b>Color / Shade:</b> <b>${color}</b>`);
    }

    if (item.poleColor && category !== 'Fabric') {
      const hardware = typeof item.poleColor === 'object' ? item.poleColor.name : item.poleColor;
      specs.push(`▫️ <b>គ្រឿងបង្គុំ (ដង/កង):</b> <b>${hardware}</b>`);
    }

    if (item.cascadeStyle?.name) {
      specs.push(`▫️ <b>Cascade Style:</b> <b>${item.cascadeStyle.name}</b>`);
    }

    if (item.selectedSize?.name) {
      specs.push(`▫️ <b>Size Spec:</b> <code>${item.selectedSize.name}</code>`);
    }

    const itemImg = item.imageUrl || (item.images && item.images[0]?.url);
    if (itemImg) {
      specs.push(`▫️ <b>Photo:</b> <a href="${itemImg}">🖼️ មើលរូបថតផលិតផល (Product Image)</a>`);
    }

    return `
📌 <b>ITEM #${index + 1}: ${item.name || 'Custom Product'}</b>
   Category: <i>${category}</i>
${specs.join('\n')}
   💵 <b>Item Subtotal:</b> <b>$${Number(itemPrice).toFixed(2)}</b>
──────────────────────`;
  }).join('\n');

  const customerName = `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'Valued Customer';
  
  // Format Address & Location Details
  let addressLines = [];
  if (customer.address) {
    addressLines.push(`  ▫️ <b>Street / Area:</b> ${customer.address}`);
  }
  if (customer.additionalAddress) {
    addressLines.push(`  ▫️ <b>House / Apt / Notes:</b> ${customer.additionalAddress}`);
  }
  if (customer.city) {
    addressLines.push(`  ▫️ <b>City / Province:</b> ${customer.city}`);
  }

  const mapLink = customer.googleMapsUrl || (customer.latitude && customer.longitude ? `https://www.google.com/maps?q=${customer.latitude},${customer.longitude}` : null);
  if (mapLink) {
    const coordsStr = (customer.latitude && customer.longitude) ? ` (<code>${Number(customer.latitude).toFixed(5)}, ${Number(customer.longitude).toFixed(5)}</code>)` : '';
    addressLines.push(`  ▫️ <b>Google Maps Pin:</b> <a href="${mapLink}">📍 Open Map & Drive</a>${coordsStr}`);
  }

  const addressDisplay = addressLines.length > 0 ? addressLines.join('\n') : '  ▫️ <i>No address provided</i>';
  const orderTime = new Date(order.createdAt || Date.now()).toLocaleString('en-US', { timeZone: 'Asia/Phnom_Penh' });

  // Find first product image for inline Telegram preview
  const firstItemImg = items.find(it => it.imageUrl || (it.images && it.images[0]?.url));
  const previewImg = firstItemImg ? (firstItemImg.imageUrl || firstItemImg.images?.[0]?.url) : null;
  const imagePreviewTag = previewImg ? `<a href="${previewImg}">&#8205;</a>` : '';

  return `${imagePreviewTag}
🔔 <b>NEW ORDER PLACED!</b>
━━━━━━━━━━━━━━━━━━━━
🆔 <b>Order ID:</b> <code>${order._id || order.id}</code>
📅 <b>Date:</b> ${orderTime}
⚡ <b>Status:</b> <b>${order.status || 'Preparing'}</b>

👤 <b>CUSTOMER & DELIVERY INFORMATION</b>
• <b>Customer:</b> ${customerName}
• <b>Phone:</b> <code>${customer.phone || 'N/A'}${customer.phone2 ? ` / ${customer.phone2}` : ''}</code>
${customer.email ? `• <b>Email:</b> ${customer.email}\n` : ''}• <b>Delivery Address & Map:</b>
${addressDisplay}
• <b>Payment Method:</b> 💳 <b>${order.paymentMethod || 'ABA Bank'}</b>

📦 <b>ORDER SPECIFICATIONS (${items.length} Item${items.length > 1 ? 's' : ''})</b>
━━━━━━━━━━━━━━━━━━━━
${itemsList || '  (No items details)'}

💰 <b>TOTAL AMOUNT DUE:</b> <b>$${Number(order.subtotal || 0).toFixed(2)}</b>
━━━━━━━━━━━━━━━━━━━━
<i>Check the Admin Dashboard to accept and advance this order.</i>
`;
};

/**
 * Formats an order cancellation or installation/completion request alert
 */
const formatStatusUpdateMessage = (order, actionType = 'status_update', note = '') => {
  const customer = order.customer || {};
  const customerName = `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'Valued Customer';
  const mapLink = customer.googleMapsUrl || (customer.latitude && customer.longitude ? `https://www.google.com/maps?q=${customer.latitude},${customer.longitude}` : null);
  const timeStr = new Date().toLocaleString('en-US', { timeZone: 'Asia/Phnom_Penh' });

  let headerTitle = '🔔 <b>ការផ្លាស់ប្តូរស្ថានភាពបញ្ជាទិញ (ORDER UPDATE)</b>';
  if (actionType === 'cancelled' || order.status === 'Cancelled') {
    headerTitle = '❌ <b>អតិថិជនបានបោះបង់ការកម្ម៉ង់ (ORDER CANCELLED)</b>';
  } else if (actionType === 'installation_request') {
    headerTitle = '🛠️ <b>អតិថិជនស្នើសុំជាងចុះតម្លើងវាំងនន (INSTALLATION REQUEST)</b>';
  } else if (order.status === 'Order Arrived') {
    headerTitle = '✅ <b>ការបញ្ជាទិញបានដឹកដល់ដៃអតិថិជន (ORDER COMPLETED)</b>';
  }

  return `
${headerTitle}
━━━━━━━━━━━━━━━━━━━━
🆔 <b>Order ID:</b> <code>${order._id || order.id}</code>
📅 <b>Time:</b> ${timeStr}
⚡ <b>Status:</b> <b>${order.status}</b>
${note ? `📝 <b>ចំណាំ / មូលហេតុ:</b> ${note}\n` : ''}
👤 <b>ព័ត៌មានអតិថិជន</b>
• <b>ឈ្មោះ:</b> ${customerName}
• <b>លេខទូរស័ព្ទ:</b> <code>${customer.phone || 'N/A'}${customer.phone2 ? ` / ${customer.phone2}` : ''}</code>
• <b>អាសយដ្ឋាន:</b> ${customer.address || 'N/A'}${customer.city ? `, ${customer.city}` : ''}
${mapLink ? `• <b>Google Maps:</b> <a href="${mapLink}">📍 បើកផែនទីទីតាំង</a>\n` : ''}💰 <b>តម្លៃសរុប:</b> <b>$${Number(order.subtotal || 0).toFixed(2)}</b>
━━━━━━━━━━━━━━━━━━━━
`;
};

/**
 * Formats a Free Home Measurement booking alert for Telegram
 */
const formatMeasurementMessage = (booking) => {
  const timeStr = new Date().toLocaleString('en-US', { timeZone: 'Asia/Phnom_Penh' });
  const mapLink = booking.googleMapsUrl || (booking.latitude && booking.longitude ? `https://www.google.com/maps?q=${booking.latitude},${booking.longitude}` : null);

  return `
📏 <b>សំណើណាត់ជាងចុះវាស់វែងដល់ផ្ទះ (BOOK MEASUREMENT)</b>
━━━━━━━━━━━━━━━━━━━━
📅 <b>កាលបរិច្ឆេទស្នើសុំ:</b> ${timeStr}
👤 <b>ឈ្មោះអតិថិជន:</b> <b>${booking.name || 'N/A'}</b>
📞 <b>លេខទូរស័ព្ទ:</b> <code>${booking.phone || 'N/A'}${booking.phone2 ? ` / ${booking.phone2}` : ''}</code>
🗓️ <b>ថ្ងៃ/ម៉ោងណាត់វាស់វែង:</b> <b>${booking.preferredDate || 'ពេលណាក៏បាន'}</b>
🪟 <b>ប្រភេទ និងចំនួនបង្អួច:</b> ${booking.windowNotes || 'មិនបានបញ្ជាក់'}

📍 <b>អាសយដ្ឋាន និងផែនទី:</b>
• <b>ទីតាំង:</b> ${booking.address || 'N/A'}
${booking.additionalAddress ? `• <b>ចំណាំទីតាំង:</b> ${booking.additionalAddress}\n` : ''}${mapLink ? `• <b>Google Maps Pin:</b> <a href="${mapLink}">📍 បើកផែនទី Google Maps</a>` : ''}
━━━━━━━━━━━━━━━━━━━━
<i>សូមទាក់ទងទៅកាន់អតិថិជនដើម្បីបញ្ជាក់ម៉ោងចុះវាស់វែង។</i>
`;
};

module.exports = {
  sendTelegramNotification,
  sendTelegramPhoto,
  formatOrderMessage,
  formatStatusUpdateMessage,
  formatMeasurementMessage
};

