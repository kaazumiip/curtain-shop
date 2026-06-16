import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import axios from '../api/axios';
import { Package, Truck, Sparkles, Home, CheckCircle2, ArrowLeft, MapPin, User, Mail } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const OrderStatus = () => {
  const { t } = useLanguage();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const idFromUrl = queryParams.get('id');
  const [order, setOrder] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (order) {
      if (order.status === 'Order Arrived') {
        navigate('/order-finish');
      } else if (order.status === 'Cancelled') {
        navigate('/order-cancel');
      }
    }
  }, [order, navigate]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const statusSequence = [
    { label: 'Preparing', desc: 'Working on your selection', icon: <Package size={20} /> },
    { label: 'Finishing Touch', desc: 'Inspecting quality & tailoring', icon: <Sparkles size={20} /> },
    { label: 'To Shipping Place', desc: 'Moving to fulfillment center', icon: <Truck size={20} /> },
    { label: 'Shipping Processing', desc: 'Manifesting & packing', icon: <Package size={20} /> },
    { label: 'Head to Location', desc: 'Out for delivery', icon: <Truck size={20} /> },
    { label: 'Order Arrived', desc: 'Delivered to your doorstep', icon: <Home size={20} /> }
  ];

  useEffect(() => {
    if (idFromUrl) {
      fetchOrder(idFromUrl);
    }
  }, [idFromUrl]);

  const fetchOrder = async (id) => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`/orders/${id}`);
      setOrder(res.data);
    } catch (err) {
      setError(t('item_not_found'));
    } finally {
      setLoading(false);
    }
  };

  const getStatusIndex = (currentStatus) => {
    return statusSequence.findIndex(s => s.label === currentStatus);
  };

  const getStatusLabel = (status) => {
    const statusMap = {
      'Preparing': t('status_preparing'),
      'Finishing Touch': t('status_finishing_touch'),
      'To Shipping Place': t('status_to_shipping_place'),
      'Shipping Processing': t('status_shipping_processing'),
      'Head to Location': t('status_head_to_location'),
      'Order Arrived': t('status_order_arrived'),
      'Cancelled': t('status_cancelled'),
      'Unknown': t('status_unknown')
    };
    return statusMap[status] || status;
  };

  const getStatusDesc = (status) => {
    const descMap = {
      'Preparing': t('desc_preparing'),
      'Finishing Touch': t('desc_finishing_touch'),
      'To Shipping Place': t('desc_to_shipping_place'),
      'Shipping Processing': t('desc_shipping_processing'),
      'Head to Location': t('desc_head_to_location'),
      'Order Arrived': t('desc_order_arrived'),
      'Cancelled': t('desc_cancelled')
    };
    return descMap[status] || '';
  };

  if (!idFromUrl) {
    return (
      <div style={{ padding: '100px 20px', textAlign: 'center' }}>
        <h2 className="serif" style={{ fontSize: '2rem' }}>{t('missing_order_ref')}</h2>
        <p style={{ color: '#666', marginTop: '20px' }}>{t('missing_order_ref_desc')}</p>
        <Link to="/my-orders" className="btn-primary" style={{ display: 'inline-block', marginTop: '30px', textDecoration: 'none', padding: '15px 40px' }}>{t('go_to_my_orders')}</Link>
      </div>
    );
  }

  if (loading) return <div style={{ textAlign: 'center', padding: '150px', letterSpacing: '3px' }}>{t('loading').toUpperCase()}</div>;
  if (error) return <div style={{ textAlign: 'center', padding: '150px', color: '#e74c3c' }}>{error}</div>;
  if (!order) return null;

  const currentIdx = getStatusIndex(order.status);

  return (
    <div style={{ padding: '60px 0', minHeight: '80vh' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        
        {/* Modern Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '60px', borderBottom: '1px solid #f0f0f0', paddingBottom: '40px' }}>
          <div>
             <Link to="/my-orders" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#999', fontSize: '0.8rem', textDecoration: 'none', fontWeight: '800', marginBottom: '20px' }}>
               <ArrowLeft size={14} /> {t('back_to_orders').toUpperCase()}
             </Link>
             <h1 className="serif" style={{ fontSize: '2.5rem' }}>{t('order_status')}</h1>
             <p style={{ color: '#999', letterSpacing: '2px', fontSize: '0.7rem', textTransform: 'uppercase', marginTop: '10px' }}>{t('order_ref')}: {order._id}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
             <span style={{ padding: '8px 20px', borderRadius: '50px', backgroundColor: '#000', color: '#fff', fontSize: '0.8rem', fontWeight: '800' }}>
               {getStatusLabel(order.status)?.toUpperCase()}
             </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '80px' }} className="mobile-stack">
          
          {/* Vertical Timeline */}
          <div>
            <h3 style={{ fontSize: '0.75rem', fontWeight: '900', letterSpacing: '2px', textTransform: 'uppercase', color: '#ccc', marginBottom: '40px' }}>{t('order_progress')}</h3>
            
            <div style={{ position: 'relative', paddingLeft: '50px' }}>
               {/* Vertical Line Backdrop */}
               <div style={{ position: 'absolute', left: '19px', top: '10px', bottom: '10px', width: '2px', backgroundColor: '#f5f5f5' }}></div>
               
               {/* Active Progress Line */}
               {currentIdx >= 0 && (
                 <div style={{ 
                   position: 'absolute', 
                   left: '19px', 
                   top: '10px', 
                   height: `${(currentIdx / (statusSequence.length - 1)) * 95}%`, 
                   width: '2px', 
                   backgroundColor: '#000',
                   transition: 'all 1s ease'
                 }}></div>
               )}

               <div style={{ display: 'grid', gap: '50px' }}>
                 {statusSequence.map((step, idx) => {
                   const isCompleted = idx <= currentIdx;
                   const isCurrent = idx === currentIdx;

                   return (
                     <div key={idx} style={{ 
                       position: 'relative', 
                       display: 'flex', 
                       gap: '30px', 
                       alignItems: 'flex-start',
                       opacity: isCompleted ? 1 : 0.3,
                       transition: 'all 0.5s ease'
                     }}>
                        {/* Status Node */}
                        <div style={{ 
                          position: 'absolute', 
                          left: '-50px', 
                          width: '40px', 
                          height: '40px', 
                          borderRadius: '50%', 
                          backgroundColor: isCompleted ? '#000' : '#fff',
                          border: isCompleted ? 'none' : '2px solid #f0f0f0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          zIndex: 2,
                          color: isCompleted ? '#fff' : '#ccc',
                          transform: isCurrent ? 'scale(1.2)' : 'scale(1)',
                          boxShadow: isCurrent ? '0 10px 20px rgba(0,0,0,0.1)' : 'none'
                        }}>
                          {isCompleted ? <CheckCircle2 size={20} /> : step.icon}
                        </div>

                        <div>
                           <h4 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '5px' }}>{getStatusLabel(step.label)}</h4>
                           <p style={{ fontSize: '0.9rem', color: '#666' }}>{getStatusDesc(step.label)}</p>
                        </div>
                     </div>
                   );
                 })}
               </div>
            </div>
          </div>

          {/* Customer & Receipt Info */}
          <div>
             <div style={{ backgroundColor: '#f9f9f9', padding: '40px', borderRadius: '32px', marginBottom: '30px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px', color: '#999' }}>
                  <MapPin size={18} />
                  <span style={{ fontSize: '0.75rem', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase' }}>{t('delivery_address')}</span>
                </div>
                <p style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '10px' }}>{order.customer.firstName} {order.customer.lastName}</p>
                <p style={{ fontSize: '0.9rem', color: '#666', lineHeight: '1.8' }}>
                  {order.customer.address}<br />
                  {order.customer.city}, {order.customer.postcode}
                </p>
             </div>

             <div style={{ border: '1px solid #f0f0f0', padding: '40px', borderRadius: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px', color: '#999' }}>
                   <Package size={18} />
                   <span style={{ fontSize: '0.75rem', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase' }}>{t('order_items')}</span>
                </div>
                 <div style={{ display: 'grid', gap: '15px' }}>
                    {order.items.map((item, idx) => (
                      <div key={idx} style={{ 
                        display: 'flex', 
                        gap: '20px', 
                        alignItems: 'center', 
                        padding: '15px', 
                        backgroundColor: '#fff', 
                        borderRadius: '20px',
                        border: '1px solid #f9f9f9'
                      }}>
                         <img 
                           src={item.images && item.images.length > 0 ? item.images[0].url : item.imageUrl} 
                           style={{ width: '60px', height: '70px', borderRadius: '12px', objectFit: 'contain', backgroundColor: '#f9f9f9' }} 
                         />
                         <div style={{ flex: 1 }}>
                            <p style={{ fontWeight: '800', fontSize: '0.9rem', marginBottom: '5px' }}>{item.name}</p>
                            <div style={{ fontSize: '0.65rem', color: '#999', display: 'flex', flexWrap: 'wrap', gap: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                {item.quantity && <span>• {item.quantity} {t('units').toUpperCase()}</span>}
                               {item.selectedColorName && <span>• {item.selectedColorName}</span>}
                               {item.fabricMeters && <span>• {item.fabricMeters} {t('meters')}</span>}
                               {item.customWidth && <span>• {item.customWidth}m{item.customHeight ? ` x ${item.customHeight}m` : ''}</span>}
                               {item.poleColor && item.category !== 'Fabric' && <span>• {item.poleColor} {t('hardware')}</span>}
                            </div>
                         </div>
                         <span style={{ fontWeight: '900', fontSize: '0.9rem' }}>£{Number(item.totalPrice || item.price).toFixed(2)}</span>
                      </div>
                    ))}
                    <div style={{ borderTop: '1px solid #f0f0f0', marginTop: '20px', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                       <span style={{ fontWeight: '900', fontSize: '1.1rem', letterSpacing: '1px' }}>{t('total_paid')}</span>
                       <span style={{ fontWeight: '900', fontSize: '1.4rem' }}>£{order.subtotal?.toFixed(2)}</span>
                    </div>
                 </div>
             </div>

             <div style={{ marginTop: '40px', textAlign: 'center' }}>
                <p style={{ color: '#ccc', fontSize: '0.75rem' }}>{t('support_question')}</p>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default OrderStatus;
