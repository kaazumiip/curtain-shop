import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { ArrowLeft, User, MapPin, Package, CreditCard, Clock, ExternalLink, Printer } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/orders/${id}`);
      setOrder(res.data);
    } catch (err) {
      console.error('Error fetching order:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (status) => {
    try {
      await api.put(`/orders/${id}`, { status });
      setOrder(prev => ({ ...prev, status }));
    } catch (err) {
      console.error('Error updating status:', err);
      alert(t('failed_save_product'));
    }
  };

  const getStatusLabel = (status) => {
    const map = {
      'Preparing': t('status_preparing'),
      'Finishing Touch': t('status_finishing_touch'),
      'To Shipping Place': t('status_to_shipping_place'),
      'Shipping Processing': t('status_shipping_processing'),
      'Head to Location': t('status_head_to_location'),
      'Order Arrived': t('status_order_arrived'),
      'Cancelled': t('status_cancelled')
    };
    return map[status] || status;
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '100px', letterSpacing: '2px' }}>{t('loading')}</div>;
  if (!order) return <div style={{ textAlign: 'center', padding: '100px' }}>{t('item_not_found')}</div>;

  const statuses = [
    'Preparing', 
    'Finishing Touch', 
    'To Shipping Place', 
    'Shipping Processing', 
    'Head to Location', 
    'Order Arrived',
    'Cancelled'
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'Preparing': return '#f39c12';
      case 'Finishing Touch': return '#3498db';
      case 'To Shipping Place': return '#9b59b6';
      case 'Shipping Processing': return '#34495e';
      case 'Head to Location': return '#2980b9';
      case 'Order Arrived': return '#2ecc71';
      case 'Cancelled': return '#e74c3c';
      default: return '#000';
    }
  };

  const customer = order.customer || {};
  const items = order.items || [];
  const mapLink = customer.googleMapsUrl || (customer.latitude && customer.longitude ? `https://www.google.com/maps?q=${customer.latitude},${customer.longitude}` : null);

  const handlePrintInvoice = () => {
    const printWin = window.open('', '_blank', 'width=850,height=950');
    if (!printWin) {
      window.print();
      return;
    }

    const orderDate = new Date(order.createdAt || Date.now()).toLocaleString();
    const customerFullName = `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'អតិថិជន';
    const addressFull = [customer.address, customer.additionalAddress, customer.city, customer.postcode].filter(Boolean).join(', ');

    const rowsHtml = items.map((item, idx) => {
      const hardwareName = typeof item.poleColor === 'object' ? item.poleColor?.name : item.poleColor;
      const colorName = item.selectedColorName || (typeof item.selectedColor === 'object' ? item.selectedColor?.name : item.selectedColor);
      const cascadeName = typeof item.cascadeStyle === 'object' ? item.cascadeStyle?.name : item.cascadeStyle;
      const sizeName = typeof item.selectedSize === 'object' ? item.selectedSize?.name : item.selectedSize;

      const specs = [];
      if (item.customWidth || item.customHeight) {
        specs.push(`ទំហំកាត់ដេរ: ${item.customWidth || '-'}m (ទទឹង) × ${item.customHeight || '-'}m (កម្ពស់)`);
      } else if (item.fabricMeters) {
        specs.push(`ប្រវែងក្រណាត់: ${item.fabricMeters} ម៉ែត្រ`);
      } else if (sizeName) {
        specs.push(`ទំហំ: ${sizeName}`);
      }
      if (colorName) specs.push(`ពណ៌: ${colorName}`);
      if (hardwareName && item.category !== 'Fabric') specs.push(`ដង/កង: ${hardwareName}`);
      if (cascadeName) specs.push(`ម៉ូតរំយោល: ${cascadeName}`);

      return `
        <tr>
          <td style="padding:10px 8px;border-bottom:1px solid #e2e8f0;text-align:center;">${idx + 1}</td>
          <td style="padding:10px 8px;border-bottom:1px solid #e2e8f0;">
            <div style="font-weight:700;color:#0f172a;">${item.name || ''}</div>
            <div style="font-size:12px;color:#475569;margin-top:3px;">${specs.join(' • ')}</div>
          </td>
          <td style="padding:10px 8px;border-bottom:1px solid #e2e8f0;text-align:center;font-weight:700;">${item.quantity || 1}</td>
          <td style="padding:10px 8px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:700;">$${Number(item.totalPrice || item.price || 0).toFixed(2)}</td>
        </tr>
      `;
    }).join('');

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>វិក្កយបត្រ #${order._id || order.id}</title>
          <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Khmer:wght@400;600;700;800&family=Poppins:wght@400;600;700;800&display=swap" rel="stylesheet">
          <style>
            body {
              font-family: 'Poppins', 'Noto Sans Khmer', sans-serif;
              color: #0f172a;
              padding: 32px;
              margin: 0;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              border-bottom: 2px solid #0f172a;
              padding-bottom: 18px;
              margin-bottom: 24px;
            }
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin-bottom: 24px;
              background: #f8fafc;
              padding: 16px;
              border-radius: 10px;
              border: 1px solid #e2e8f0;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 24px;
            }
            th {
              background: #0f172a;
              color: #fff;
              padding: 10px 8px;
              font-size: 13px;
              text-align: left;
            }
            .signatures {
              display: grid;
              grid-template-columns: 1fr 1fr 1fr;
              gap: 20px;
              margin-top: 55px;
              text-align: center;
              font-size: 13px;
            }
            .sig-line {
              border-top: 1px dashed #94a3b8;
              margin-top: 50px;
              padding-top: 6px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 style="margin:0;font-size:24px;font-weight:800;">ស្រីថា វាំងនន (SREY THA CURTAIN)</h1>
              <p style="margin:4px 0 0 0;font-size:13px;color:#475569;">វិក្កយបត្រ និងបណ្ណកម្ម៉ង់កាត់ដេរ (INVOICE &amp; TAILOR SHEET)</p>
            </div>
            <div style="text-align:right;font-size:13px;">
              <div><strong>លេខវិក្កយបត្រ:</strong> #${order._id || order.id}</div>
              <div><strong>កាលបរិច្ឆេទ:</strong> ${orderDate}</div>
              <div><strong>ស្ថានភាព:</strong> ${getStatusLabel(order.status)}</div>
            </div>
          </div>

          <div class="info-grid">
            <div style="font-size:13px;line-height:1.7;">
              <div style="font-weight:800;margin-bottom:4px;">ព័ត៌មានអតិថិជន និងទីតាំងដឹកជញ្ជូន:</div>
              <div><strong>ឈ្មោះ:</strong> ${customerFullName}</div>
              <div><strong>ទូរស័ព្ទ:</strong> ${customer.phone || 'N/A'}${customer.phone2 ? ` / ${customer.phone2}` : ''}</div>
              <div><strong>អាសយដ្ឋាន:</strong> ${addressFull || 'N/A'}</div>
            </div>
            <div style="font-size:13px;line-height:1.7;text-align:right;">
              <div style="font-weight:800;margin-bottom:4px;">ព័ត៌មានការទូទាត់:</div>
              <div><strong>វិធីទូទាត់:</strong> ${order.paymentMethod || 'ABA Bank'}</div>
              <div style="font-size:20px;font-weight:800;margin-top:8px;">សរុប: $${Number(order.subtotal || 0).toFixed(2)}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width:45px;text-align:center;">ល.រ</th>
                <th>មុខទំនិញ និងទំហំបច្ចេកទេសកាត់ដេរ</th>
                <th style="width:80px;text-align:center;">ចំនួន</th>
                <th style="width:120px;text-align:right;">តម្លៃសរុប</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <div style="text-align:right;font-size:18px;font-weight:800;margin-top:12px;">
            ទឹកប្រាក់សរុបរួម (TOTAL): $${Number(order.subtotal || 0).toFixed(2)}
          </div>

          <div class="signatures">
            <div>
              <strong>ជាងកាត់ដេរ / ត្រួតពិនិត្យ</strong>
              <div class="sig-line">ហត្ថលេខា និងកាលបរិច្ឆេទ</div>
            </div>
            <div>
              <strong>អ្នកដឹកជញ្ជូន / ជាងតម្លើង</strong>
              <div class="sig-line">ហត្ថលេខា និងកាលបរិច្ឆេទ</div>
            </div>
            <div>
              <strong>អតិថិជនទទួលទំនិញ</strong>
              <div class="sig-line">ហត្ថលេខា និងកាលបរិច្ឆេទ</div>
            </div>
          </div>
          <script>
            window.onload = function() { window.print(); };
          </script>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  return (
    <div className="dashboard-container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '30px 20px' }}>
      {/* Top Header */}
      <button 
        onClick={() => navigate(-1)} 
        style={{ 
          border: 'none', 
          background: 'none', 
          cursor: 'pointer', 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '8px', 
          marginBottom: '25px', 
          fontWeight: '700',
          fontSize: '0.9rem',
          color: '#475569',
          fontFamily: "'Poppins', 'Noto Sans Khmer', 'Kdam Thmor Pro', sans-serif" 
        }}
      >
        <ArrowLeft size={18} /> {t('back_to_dashboard')}
      </button>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px',
        marginBottom: '35px',
        paddingBottom: '20px',
        borderBottom: '1px solid #f1f5f9'
      }}>
        <div>
          <h1 className="serif" style={{ fontSize: '1.9rem', margin: 0, color: '#0f172a' }}>{t('order_info_title')}</h1>
          <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '6px', margin: 0 }}>
            {t('order_ref')}: <span style={{ fontFamily: 'monospace', fontWeight: '700', color: '#0f172a' }}>{order._id || order.id}</span>
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handlePrintInvoice}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              borderRadius: '50px',
              border: '1px solid #0f172a',
              backgroundColor: '#0f172a',
              color: '#ffffff',
              fontSize: '0.85rem',
              fontWeight: '700',
              cursor: 'pointer',
              fontFamily: "'Poppins', 'Noto Sans Khmer', 'Kdam Thmor Pro', sans-serif"
            }}
          >
            <Printer size={16} />
            <span>បោះពុម្ពវិក្កយបត្រ (Print Invoice)</span>
          </button>

          <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '700' }}>{t('fulfillment_status_update')}:</span>
          <select 
            value={order.status || 'Preparing'} 
            onChange={(e) => handleUpdateStatus(e.target.value)}
            style={{
              padding: '10px 20px',
              borderRadius: '50px',
              border: '2px solid ' + getStatusColor(order.status),
              fontWeight: '700',
              outline: 'none',
              cursor: 'pointer',
              backgroundColor: '#fff',
              fontSize: '0.85rem',
              color: '#0f172a',
              fontFamily: "'Poppins', 'Noto Sans Khmer', 'Kdam Thmor Pro', sans-serif"
            }}
          >
            {statuses.map(s => <option key={s} value={s}>{getStatusLabel(s)}</option>)}
          </select>
        </div>
      </div>

      {/* Customer & Payment Top Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '20px', marginBottom: '32px' }}>
        {/* Customer & Shipping Card */}
        <div style={{
          padding: 'clamp(18px, 3vw, 28px)',
          borderRadius: '20px',
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '18px', alignItems: 'center' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f172a' }}>
              <User size={18} />
            </div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: '800', margin: 0, color: '#0f172a' }}>{t('customer_name')}</h4>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <p style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0' }}>{customer.firstName || ''} {customer.lastName || ''}</p>
            <p style={{ fontSize: '0.95rem', fontWeight: '700', color: '#16a34a', margin: '0 0 4px 0' }}>
              📞 {customer.phone || 'N/A'}{customer.phone2 ? ` / ${customer.phone2}` : ''}
            </p>
            {customer.email && <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>✉️ {customer.email}</p>}
          </div>

          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '18px' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
              <MapPin size={16} color="#16a34a" />
              <span style={{ fontSize: '0.8rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('shipping_address')}</span>
            </div>
            <p style={{ fontSize: '0.9rem', lineHeight: '1.6', color: '#1e293b', margin: '0 0 10px 0' }}>
              {customer.address || 'Not Provided'}<br />
              {customer.additionalAddress && (
                <span style={{ color: '#0f172a', fontWeight: '700' }}>{customer.additionalAddress}<br /></span>
              )}
              {customer.city || ''}
            </p>

            {mapLink && (
              <a 
                href={mapLink} 
                target="_blank" 
                rel="noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginTop: '6px',
                  padding: '9px 16px',
                  borderRadius: '50px',
                  backgroundColor: '#16a34a',
                  color: '#fff',
                  fontSize: '0.82rem',
                  fontWeight: '700',
                  textDecoration: 'none',
                  boxShadow: '0 3px 10px rgba(22, 163, 74, 0.25)'
                }}
              >
                <MapPin size={15} /> <span>បើកផែនទី Google Maps</span> <ExternalLink size={13} />
              </a>
            )}
          </div>
        </div>

        {/* Payment & Order Summary Card */}
        <div style={{
          padding: 'clamp(18px, 3vw, 28px)',
          borderRadius: '20px',
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '18px', alignItems: 'center' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f172a' }}>
                <CreditCard size={18} />
              </div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: '800', margin: 0, color: '#0f172a' }}>{t('payment_details_title')}</h4>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>
                {t('total_due') || 'Total Amount Due'}
              </span>
              <p style={{ fontSize: '2.2rem', fontWeight: '900', color: '#0f172a', margin: '4px 0 10px 0' }}>
                ${Number(order.subtotal || 0).toFixed(2)}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.85rem', color: '#475569', fontWeight: '600' }}>
                  💳 {order.paymentMethod || 'ABA / ACLEDA / Bakong KHQR'}
                </span>
                {order.cardDetails && (
                  <span style={{ padding: '4px 10px', backgroundColor: '#f1f5f9', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700', color: '#0f172a' }}>
                    {order.cardDetails.cardNumber}
                  </span>
                )}
              </div>
              {order.paymentDetails?.transactionRef && (
                <div style={{ marginTop: '8px', fontSize: '0.82rem', color: '#0f172a', fontWeight: '700' }}>
                  🔢 លេខកូដប្រតិបត្តិការ: <code style={{ backgroundColor: '#f1f5f9', padding: '2px 8px', borderRadius: '6px' }}>{order.paymentDetails.transactionRef}</code>
                </div>
              )}
              {order.paymentDetails?.receiptUrl && (
                <div style={{ marginTop: '10px' }}>
                  <a
                    href={order.paymentDetails.receiptUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 14px',
                      borderRadius: '10px',
                      backgroundColor: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                      color: '#15803d',
                      fontSize: '0.8rem',
                      fontWeight: '700',
                      textDecoration: 'none'
                    }}
                  >
                    <img src={order.paymentDetails.receiptUrl} alt="Receipt" style={{ width: '28px', height: '28px', objectFit: 'cover', borderRadius: '4px' }} />
                    <span>មើលវិក្កយបត្របង់ប្រាក់ (Payment Screenshot)</span>
                    <ExternalLink size={13} />
                  </a>
                </div>
              )}
            </div>
          </div>

          <div style={{ backgroundColor: '#f8fafc', padding: '16px 20px', borderRadius: '14px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={16} color="#64748b" />
              <span style={{ fontSize: '0.82rem', color: '#475569' }}>
                {new Date(order.createdAt || Date.now()).toLocaleString()}
              </span>
            </div>
            <span style={{ 
              padding: '6px 14px', 
              backgroundColor: getStatusColor(order.status) + '18', 
              color: getStatusColor(order.status),
              borderRadius: '50px',
              fontSize: '0.78rem',
              fontWeight: '800'
            }}>
              {getStatusLabel(order.status)}
            </span>
          </div>
        </div>
      </div>

      {/* Ordered Products Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 className="serif" style={{ fontSize: '1.4rem', margin: 0, color: '#0f172a' }}>
          {t('order_items')} ({items.length})
        </h3>
      </div>

      <div style={{ display: 'grid', gap: '16px' }}>
        {items.map((item, idx) => {
          const hardwareName = typeof item.poleColor === 'object' ? item.poleColor?.name : item.poleColor;
          const colorName = item.selectedColorName || (typeof item.selectedColor === 'object' ? item.selectedColor?.name : item.selectedColor);
          const cascadeName = typeof item.cascadeStyle === 'object' ? item.cascadeStyle?.name : item.cascadeStyle;
          const sizeName = typeof item.selectedSize === 'object' ? item.selectedSize?.name : item.selectedSize;
          const itemImg = item.images && item.images.length > 0 ? item.images[0].url : (item.imageUrl || 'https://via.placeholder.com/120');

          return (
            <div 
              key={idx} 
              className="admin-order-item-row"
              style={{
                display: 'flex',
                gap: '24px',
                padding: '22px',
                borderRadius: '18px',
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                alignItems: 'center',
                flexWrap: 'wrap',
                transition: 'all 0.2s ease'
              }}
            >
              {/* Product Thumbnail with Quantity Badge */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <img 
                  src={itemImg} 
                  alt=""
                  style={{ 
                    width: '88px', 
                    height: '105px', 
                    objectFit: 'cover', 
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    backgroundColor: '#f8fafc'
                  }} 
                />
                <span style={{
                  position: 'absolute',
                  bottom: '-6px',
                  right: '-6px',
                  backgroundColor: '#0f172a',
                  color: '#ffffff',
                  fontSize: '0.72rem',
                  fontWeight: '800',
                  padding: '2px 8px',
                  borderRadius: '20px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                }}>
                  x{item.quantity || 1}
                </span>
              </div>

              {/* Main Product Info & Unified Specs */}
              <div style={{ flex: '1 1 200px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: '700',
                    padding: '3px 10px',
                    borderRadius: '6px',
                    backgroundColor: '#f1f5f9',
                    color: '#475569',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    {item.category ? t(item.category.toLowerCase().replace(' ', '_')) : ''}
                  </span>
                  <h4 style={{ margin: 0, fontSize: '1.18rem', fontWeight: '800', color: '#0f172a' }}>
                    {item.name}
                  </h4>
                </div>

                {/* Unified Modern Specifications Row */}
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '10px',
                  alignItems: 'center'
                }}>
                  {/* Dimensions */}
                  {(item.customWidth || item.customHeight) && (
                    <div style={specChipStyle}>
                      <span style={specLabelStyle}>📐 {t('dimension')}</span>
                      <span style={specValueStyle}>{item.customWidth || '-'}m (W) × {item.customHeight || '-'}m (H)</span>
                    </div>
                  )}

                  {/* Fabric length */}
                  {item.category === 'Fabric' && item.fabricMeters && (
                    <div style={specChipStyle}>
                      <span style={specLabelStyle}>📏 {t('quantity')}</span>
                      <span style={specValueStyle}>{item.fabricMeters} {t('meters')}</span>
                    </div>
                  )}

                  {/* Color */}
                  {colorName && (
                    <div style={specChipStyle}>
                      <span style={specLabelStyle}>🎨 {t('color')}</span>
                      <span style={specValueStyle}>{colorName}</span>
                    </div>
                  )}

                  {/* Hardware */}
                  {hardwareName && item.category !== 'Fabric' && (
                    <div style={specChipStyle}>
                      <span style={specLabelStyle}>⚙️ {t('pole_ring')}</span>
                      <span style={specValueStyle}>{hardwareName}</span>
                    </div>
                  )}

                  {/* Cascade style */}
                  {cascadeName && (
                    <div style={specChipStyle}>
                      <span style={specLabelStyle}>✨ {t('cascade_style')}</span>
                      <span style={specValueStyle}>{cascadeName}</span>
                    </div>
                  )}

                  {/* Standalone size (for items without custom dimensions) */}
                  {sizeName && !item.customWidth && !item.customHeight && (
                    <div style={specChipStyle}>
                      <span style={specLabelStyle}>🏷️ {t('size') || 'Size'}</span>
                      <span style={specValueStyle}>{sizeName}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Price Block */}
              <div 
                className="admin-order-item-price"
                style={{ 
                  flexShrink: 0, 
                  textAlign: 'right', 
                  paddingLeft: '20px', 
                  borderLeft: '1px solid #f1f5f9',
                  minWidth: '140px' 
                }}
              >
                <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>
                  {t('item_total')}
                </span>
                <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#0f172a', margin: '4px 0' }}>
                  ${Number(item.totalPrice || item.price || 0).toFixed(2)}
                </div>
                {item.quantity && Number(item.quantity) > 1 && (
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                    ${(Number(item.totalPrice || item.price || 0) / Number(item.quantity)).toFixed(2)} / unit
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const specChipStyle = {
  backgroundColor: '#f8fafc',
  padding: '6px 12px',
  borderRadius: '8px',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  border: '1px solid #e2e8f0'
};

const specLabelStyle = {
  fontSize: '0.72rem',
  fontWeight: '700',
  color: '#64748b'
};

const specValueStyle = {
  fontSize: '0.82rem',
  fontWeight: '700',
  color: '#0f172a'
};

export default OrderDetails;
