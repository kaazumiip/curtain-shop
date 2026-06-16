import React from 'react';
import { useLanguage } from '../context/LanguageContext';

const OrdersTable = ({ orders, onSelectOrder }) => {
  const { t } = useLanguage();

  const getStatusColors = (status) => {
    const s = status || 'Pending';
    if (s === 'Pending' || s === 'Preparing') return { bg: '#fff3cd', text: '#856404' };
    if (s === 'Processing' || s === 'Finishing Touch') return { bg: '#cce5ff', text: '#004085' };
    if (s === 'Shipped' || s === 'To Shipping Place' || s === 'Shipping Processing' || s === 'Head to Location') return { bg: '#e2e3e5', text: '#383d41' };
    if (s === 'Order Arrived' || s === 'Delivered') return { bg: '#d4edda', text: '#155724' };
    if (s === 'Cancelled') return { bg: '#ffebee', text: '#c62828' };
    return { bg: '#eee', text: '#666' };
  };

  return (
    <div>
      {/* Desktop Table View */}
      <div className="desktop-only-table vanguard-table-container">
        <table className="vanguard-table">
          <thead>
            <tr>
              <th>{t('order_ref')}</th>
              <th>{t('date')}</th>
              <th>{t('customer_name')}</th>
              <th>{t('shipping_address')}</th>
              <th>{t('order_items')}</th>
              <th>{t('fulfillment')}</th>
              <th>{t('status')}</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => {
              const colors = getStatusColors(order.status);
              return (
                <tr key={order._id} onClick={() => onSelectOrder(order)} style={{ cursor: 'pointer' }}>
                  <td style={{ fontSize: '0.7rem', fontWeight: '800', fontFamily: 'monospace', color: '#3498db' }}>
                    {order._id}
                  </td>
                  <td style={{ fontSize: '0.8rem', color: '#666' }}>
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    <div style={{ fontWeight: '700' }}>{order.customer.firstName} {order.customer.lastName}</div>
                    <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '5px' }}>
                      {order.customer.phone && <div style={{ fontWeight: '600', color: '#000' }}>{order.customer.phone}</div>}
                      <div>{order.customer.email}</div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <div style={{ fontSize: '0.75rem', lineHeight: '1.5' }}>
                        <div style={{ fontWeight: '700', textTransform: 'uppercase', fontSize: '0.65rem', color: '#999', marginBottom: '4px' }}>{t('shipping_addr')}</div>
                        <div>{order.customer.address}</div>
                        <div>{order.customer.city}, {order.customer.postcode}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ maxHeight: '120px', overflowY: 'auto' }}>
                      {order.items.map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '5px 0', borderBottom: idx < order.items.length - 1 ? '1px solid #f9f9f9' : 'none' }}>
                          <img 
                            src={item.imageUrl || (item.images && item.images.length > 0 ? item.images[0].url : 'https://via.placeholder.com/40')} 
                            style={{ width: '30px', height: '35px', objectFit: 'cover', borderRadius: '4px', backgroundColor: '#f9f9f9', border: '1px solid #eee', flexShrink: 0 }} 
                            alt=""
                          />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.8rem', fontWeight: '700' }}>{item.name}</div>
                            <div style={{ fontSize: '0.7rem', color: '#999' }}>
                              {item.selectedSize && `${t('dimension')}: ${item.selectedSize.name}`}
                              {item.selectedColor && ` • ${t('color')}: ${item.selectedColor.name}`}
                              {item.poleColor && ` • ${t('pole_ring')}: ${item.poleColor}`}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td style={{ fontWeight: '700' }}>
                    £{order.subtotal?.toFixed(2)}
                    <div style={{ fontSize: '0.7rem', color: '#666', fontWeight: '400', marginTop: '5px' }}>
                      {order.paymentMethod}
                      {order.cardDetails && <span style={{ color: '#000', fontWeight: '600', display: 'block' }}>• {order.cardDetails.cardNumber}</span>}
                    </div>
                  </td>
                  <td>
                    <span style={{ 
                      padding: '5px 12px', 
                      backgroundColor: colors.bg, 
                      color: colors.text,
                      borderRadius: '12px',
                      fontSize: '0.65rem',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      letterSpacing: '1px'
                    }}>
                       {order.status || 'Pending'}
                    </span>
                  </td>
                </tr>
              );
            })}
            {orders.length === 0 && (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '60px', color: '#999', fontSize: '0.9rem' }}>
                  {t('waiting_orders')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List View */}
      <div className="mobile-only-cards">
        {orders.map(order => {
          const colors = getStatusColors(order.status);
          return (
            <div key={order._id} className="mobile-order-card" onClick={() => onSelectOrder(order)}>
              <div className="card-header">
                <span className="order-ref">#{order._id.slice(-8).toUpperCase()}</span>
                <span className="order-date">{new Date(order.createdAt).toLocaleDateString()}</span>
              </div>
              
              <div className="card-body">
                <div className="customer-info">
                  <strong>{order.customer.firstName} {order.customer.lastName}</strong>
                  {order.customer.phone && <div style={{ fontWeight: '600', marginTop: '2px' }}>{order.customer.phone}</div>}
                  <div style={{ color: '#888', fontSize: '0.75rem' }}>{order.customer.email}</div>
                </div>
                
                <div className="address-info">
                  <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: '#aaa', fontWeight: '700', marginBottom: '2px' }}>{t('shipping_addr')}</div>
                  <div>{order.customer.address}</div>
                  <div>{order.customer.city}, {order.customer.postcode}</div>
                </div>
                
                <div className="items-summary">
                  <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: '#aaa', fontWeight: '700', marginBottom: '6px' }}>{t('order_items')}</div>
                  {order.items.map((item, idx) => (
                    <div key={idx} className="item-row" style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: idx < order.items.length - 1 ? '1px solid #f2f2f2' : 'none', padding: '6px 0' }}>
                      <img 
                        src={item.imageUrl || (item.images && item.images.length > 0 ? item.images[0].url : 'https://via.placeholder.com/40')} 
                        style={{ width: '40px', height: '48px', objectFit: 'cover', borderRadius: '6px', backgroundColor: '#f9f9f9', border: '1px solid #eee', flexShrink: 0 }} 
                        alt=""
                      />
                      <div style={{ flex: 1, textAlign: 'left' }}>
                        <div style={{ fontWeight: '700', textAlign: 'left' }}>{item.name}</div>
                        <div style={{ fontSize: '0.65rem', color: '#999', textAlign: 'left' }}>
                          {item.selectedSize && `${item.selectedSize.name}`}
                          {item.selectedColor && ` • ${item.selectedColor.name}`}
                        </div>
                      </div>
                      <span className="item-qty" style={{ flexShrink: 0 }}>x{item.quantity || 1}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card-footer">
                <div className="price-details">
                  <span className="payment-method">{order.paymentMethod}</span>
                  <span className="total-price">£{order.subtotal?.toFixed(2)}</span>
                </div>
                <span style={{ 
                  padding: '6px 14px', 
                  backgroundColor: colors.bg, 
                  color: colors.text,
                  borderRadius: '30px',
                  fontSize: '0.65rem',
                  fontWeight: '800',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}>
                   {order.status || 'Pending'}
                </span>
              </div>
            </div>
          );
        })}
        {orders.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#999', fontSize: '0.9rem', backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #eee' }}>
            {t('waiting_orders')}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersTable;
