import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { ArrowLeft, User, MapPin, Package, CreditCard, Clock } from 'lucide-react';

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
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
      setOrder({ ...order, status });
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update status.');
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '100px', letterSpacing: '2px' }}>LOADING ORDER...</div>;
  if (!order) return <div style={{ textAlign: 'center', padding: '100px' }}>Order not found.</div>;

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

  return (
    <div className="dashboard-container">
      <button 
        onClick={() => navigate(-1)} 
        style={{ border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '30px', fontWeight: '700' }}
      >
        <ArrowLeft size={18} /> BACK TO DASHBOARD
      </button>

      <div className="order-header-flex">
        <div>
          <h1 className="serif" style={{ fontSize: '2.5rem' }}>Order Information</h1>
          <p style={{ fontSize: '0.8rem', color: '#999', letterSpacing: '2px', marginTop: '10px' }}>ORDER REFERENCE: {order._id}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
           <p style={{ fontSize: '0.7rem', color: '#999', marginBottom: '10px', textTransform: 'uppercase' }}>Update Fulfillment Status</p>
           <select 
              value={order.status} 
              onChange={(e) => handleUpdateStatus(e.target.value)}
              style={{
                padding: '12px 24px',
                borderRadius: '50px',
                border: '2px solid ' + getStatusColor(order.status),
                fontWeight: '800',
                outline: 'none',
                cursor: 'pointer',
                backgroundColor: '#fff',
                fontSize: '0.9rem'
              }}
            >
              {statuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '60px' }} className="mobile-stack">
          {/* Customer & Shipping */}
          <div style={{ padding: '40px', borderRadius: '32px', backgroundColor: '#f9f9f9' }}>
             <div style={{ display: 'flex', gap: '10px', marginBottom: '25px', alignItems: 'center' }}>
               <User size={20} color="#666" />
               <h4 style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: '800' }}>Customer Name</h4>
             </div>
             <p style={{ fontSize: '1.2rem', fontWeight: '800' }}>{order.customer.firstName} {order.customer.lastName}</p>
             <p style={{ fontSize: '1rem', color: '#444', marginTop: '5px' }}>{order.customer.email}</p>
             <p style={{ fontSize: '1.1rem', fontWeight: '700', marginTop: '10px', color: '#000' }}>{order.customer.phone}</p>
             
             <div style={{ borderTop: '2px solid #fff', marginTop: '30px', paddingTop: '30px' }}>
               <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', alignItems: 'center' }}>
                 <MapPin size={20} color="#666" />
                 <h4 style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: '800' }}>Shipping Address</h4>
               </div>
               <p style={{ fontSize: '1rem', lineHeight: '1.8' }}>
                 {order.customer.address}<br />
                 {order.customer.city}, {order.customer.postcode}
               </p>
             </div>
          </div>

          {/* Payment Details */}
          <div style={{ padding: '40px', borderRadius: '32px', border: '1px solid #eee' }}>
             <div style={{ display: 'flex', gap: '10px', marginBottom: '25px', alignItems: 'center' }}>
               <CreditCard size={20} color="#666" />
               <h4 style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: '800' }}>Payment Details</h4>
             </div>
             <div style={{ marginBottom: '30px' }}>
                <p style={{ fontSize: '2.5rem', fontWeight: '900' }}>£{order.subtotal?.toFixed(2)}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                  <span style={{ fontSize: '1rem', color: '#666' }}>Method: {order.paymentMethod}</span>
                  {order.cardDetails && (
                    <span style={{ padding: '6px 12px', backgroundColor: '#f0f0f0', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '700' }}>
                      {order.cardDetails.cardNumber}
                    </span>
                  )}
                </div>
             </div>

             <div style={{ backgroundColor: '#fdfdfd', padding: '25px', borderRadius: '20px', border: '1px solid #f2f2f2' }}>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
                  <Clock size={16} color="#666" />
                  <h4 style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Timeline</h4>
                </div>
                <p style={{ fontSize: '0.9rem', color: '#444' }}>Created: {new Date(order.createdAt).toLocaleString()}</p>
                <div style={{ marginTop: '15px' }}>
                   <span style={{ 
                     padding: '8px 16px', 
                     backgroundColor: getStatusColor(order.status) + '20', 
                     color: getStatusColor(order.status),
                     borderRadius: '50px',
                     fontSize: '0.8rem',
                     fontWeight: '800'
                   }}>
                     {order.status?.toUpperCase()}
                   </span>
                </div>
             </div>
          </div>
      </div>

      {/* Order Items */}
      <h3 className="serif" style={{ fontSize: '1.8rem', marginBottom: '30px' }}>Order Items</h3>
      <div style={{ display: 'grid', gap: '20px' }}>
        {order.items.map((item, idx) => (
          <div key={idx} className="order-item-card">
            <img 
              src={item.images && item.images.length > 0 ? item.images[0].url : item.imageUrl} 
              style={{ 
                width: '160px', 
                height: '200px', 
                objectFit: 'contain', 
                borderRadius: '24px',
                backgroundColor: '#f9f9f9'
              }} 
            />
            <div style={{ flex: 1 }}>
              <div className="order-item-header">
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#999', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: '700' }}>{item.category}</span>
                  <h5 style={{ fontSize: '1.8rem', fontWeight: '800', margin: '5px 0' }}>{item.name}</h5>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.7rem', color: '#999', textTransform: 'uppercase', fontWeight: '700' }}>Item Total</span>
                  <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#000' }}>£{Number(item.totalPrice || item.price).toFixed(2)}</div>
                </div>
              </div>

              <div style={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: '12px'
              }}>
                {/* Product Configuration Tags */}
                {item.selectedColorName && (
                  <div style={tagStyle}>
                    <span style={tagLabelStyle}>Color</span>
                    <span style={tagValueStyle}>{item.selectedColorName}</span>
                  </div>
                )}
                
                {item.category === 'Fabric' && item.fabricMeters && (
                   <div style={{ ...tagStyle, backgroundColor: '#eef9ff', border: '1px solid #d0ebff' }}>
                    <span style={{ ...tagLabelStyle, color: '#3498db' }}>Quantity</span>
                    <span style={{ ...tagValueStyle, color: '#3498db' }}>{item.fabricMeters} Meters</span>
                  </div>
                )}

                {(item.customWidth || item.customHeight) && (
                   <div style={{ ...tagStyle, backgroundColor: '#f9f5ff', border: '1px solid #e5dbff' }}>
                    <span style={{ ...tagLabelStyle, color: '#9b59b6' }}>Dimensions</span>
                    <span style={{ ...tagValueStyle, color: '#9b59b6' }}>
                      {item.customWidth || '??'}m (W) × {item.customHeight || '??'}m (H)
                    </span>
                  </div>
                )}

                {item.poleColor && item.category !== 'Fabric' && (
                  <div style={{ ...tagStyle, backgroundColor: '#fff5f8', border: '1px solid #ffdeeb' }}>
                    <span style={{ ...tagLabelStyle, color: '#e91e63' }}>Pole/Ring</span>
                    <span style={{ ...tagValueStyle, color: '#e91e63' }}>{item.poleColor}</span>
                  </div>
                )}

                {item.cascadeStyle?.name && (
                   <div style={{ ...tagStyle, backgroundColor: '#f0fff4', border: '1px solid #c6f6d5' }}>
                    <span style={{ ...tagLabelStyle, color: '#2ecc71' }}>Cascade</span>
                    <span style={{ ...tagValueStyle, color: '#2ecc71' }}>{item.cascadeStyle.name}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const tagStyle = {
  backgroundColor: '#f5f5f5',
  padding: '12px 20px',
  borderRadius: '16px',
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  border: '1px solid #eee'
};

const tagLabelStyle = {
  fontSize: '0.65rem',
  fontWeight: '800',
  color: '#999',
  textTransform: 'uppercase',
  letterSpacing: '1px'
};

const tagValueStyle = {
  fontSize: '0.9rem',
  fontWeight: '700',
  color: '#000'
};

export default OrderDetails;
