import React from 'react';
import { X, User, MapPin, Package, CreditCard, Clock } from 'lucide-react';

const OrderDetailsModal = ({ isOpen, order, onClose, onUpdateStatus }) => {
  if (!isOpen || !order) return null;

  const statuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return '#f39c12';
      case 'Processing': return '#3498db';
      case 'Shipped': return '#9b59b6';
      case 'Delivered': return '#2ecc71';
      case 'Cancelled': return '#e74c3c';
      default: return '#000';
    }
  };

  return (
    <div className="modal-overlay" style={{ display: 'flex', zIndex: 11000 }}>
      <div className="modal-content" style={{ width: '700px', maxHeight: '90vh', overflowY: 'auto', padding: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <div>
            <h2 className="serif" style={{ fontSize: '1.8rem' }}>Order Details</h2>
            <p style={{ fontSize: '0.7rem', color: '#999', letterSpacing: '2px', marginTop: '5px' }}>REF: {order._id}</p>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X /></button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '40px' }}>
          {/* Customer & Shipping */}
          <div style={{ padding: '20px', borderRadius: '15px', backgroundColor: '#f9f9f9' }}>
             <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', alignItems: 'center' }}>
               <User size={16} color="#666" />
               <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Customer</h4>
             </div>
             <p style={{ fontWeight: '700' }}>{order.customer.firstName} {order.customer.lastName}</p>
             <p style={{ fontSize: '0.85rem' }}>{order.customer.email}</p>
             <p style={{ fontSize: '0.85rem', fontWeight: '600', marginTop: '5px' }}>{order.customer.phone}</p>
             
             <div style={{ borderTop: '1px solid #eee', marginTop: '15px', paddingTop: '15px' }}>
               <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
                 <MapPin size={16} color="#666" />
                 <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Shipping</h4>
               </div>
               <p style={{ fontSize: '0.85rem', lineHeight: '1.5' }}>
                 {order.customer.address}<br />
                 {order.customer.city}, {order.customer.postcode}
               </p>
             </div>
          </div>

          {/* Payment & Status Control */}
          <div style={{ padding: '20px', borderRadius: '15px', border: '1px solid #eee' }}>
             <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', alignItems: 'center' }}>
               <CreditCard size={16} color="#666" />
               <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Fulfillment</h4>
             </div>
             <div style={{ marginBottom: '20px' }}>
                <p style={{ fontSize: '1.2rem', fontWeight: '800' }}>£{order.subtotal?.toFixed(2)}</p>
                <p style={{ fontSize: '0.8rem', color: '#666' }}>{order.paymentMethod}</p>
                {order.cardDetails && (
                  <p style={{ display: 'inline-block', marginTop: '5px', padding: '4px 8px', backgroundColor: '#eee', borderRadius: '5px', fontSize: '0.7rem' }}>
                    {order.cardDetails.cardNumber}
                  </p>
                )}
             </div>

             <div style={{ borderTop: '1px solid #eee', paddingTop: '15px' }}>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', alignItems: 'center' }}>
                  <Clock size={16} color="#666" />
                  <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Current Status</h4>
                </div>
                <select 
                  value={order.status} 
                  onChange={(e) => onUpdateStatus(order._id, e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '2px solid ' + getStatusColor(order.status),
                    fontWeight: '700',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
             </div>
          </div>
        </div>

        {/* Itemized List */}
        <div>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', alignItems: 'center' }}>
             <Package size={16} color="#666" />
             <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Selected Items</h4>
          </div>
          <div style={{ display: 'grid', gap: '15px' }}>
            {order.items.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '20px', padding: '20px', border: '1px solid #f0f0f0', borderRadius: '15px', alignItems: 'center' }}>
                <img src={item.imageUrl || (item.images && item.images.length > 0 ? item.images[0].url : '')} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '10px' }} />
                <div style={{ flex: 1 }}>
                  <h5 style={{ fontSize: '0.9rem', marginBottom: '5px' }}>{item.name}</h5>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 15px', fontSize: '0.7rem', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {item.quantity && <span>QTY: {item.quantity}</span>}
                    <span>Spec: {item.selectedSize?.name}</span>
                    {item.selectedColorName && <span>Color: {item.selectedColorName}</span>}
                    {item.poleColor && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>Hardware: {item.poleColor.name || item.poleColor}</span>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          {item.poleColor.imageUrl && <img src={item.poleColor.imageUrl} style={{ width: '18px', height: '18px', borderRadius: '4px', objectFit: 'contain', border: '1px solid #eee' }} alt="Ring" />}
                          {item.poleColor.poleImageUrl && <img src={item.poleColor.poleImageUrl} style={{ width: '18px', height: '18px', borderRadius: '4px', objectFit: 'contain', border: '1px solid #eee' }} alt="Pole" />}
                        </div>
                      </div>
                    )}
                    {item.fabricMeters && <span>Fabric: {item.fabricMeters}m</span>}
                  </div>
                </div>
                <div style={{ fontWeight: '700' }}>£{item.totalPrice || item.price}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsModal;
