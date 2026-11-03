import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, ArrowRight, History, Calendar, ExternalLink, Clock, CheckCircle } from 'lucide-react';
import axios from '../api/axios';
import { useLanguage } from '../context/LanguageContext';

const MyOrders = () => {
  const { t } = useLanguage();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Active');

  useEffect(() => {
    const fetchOrdersData = async () => {
      try {
        const savedOrders = JSON.parse(localStorage.getItem('srey_tha_orders') || '[]');
        if (savedOrders.length === 0) {
          setLoading(false);
          return;
        }

        // Fetch full order data for each saved ID to get current status
        const ordersData = await Promise.all(
          savedOrders.map(async (localOrder) => {
            try {
              const res = await axios.get(`/orders/${localOrder.id}`);
              return res.data;
            } catch (err) {
              console.error(`Error fetching order ${localOrder.id}:`, err);
              // Fallback to local data if fetch fails
              return { 
                _id: localOrder.id, 
                createdAt: localOrder.date, 
                subtotal: localOrder.total, 
                status: 'Unknown',
                items: [] 
              };
            }
          })
        );

        setOrders(ordersData);
      } catch (err) {
        console.error('Error in fetchOrdersData:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrdersData();
  }, []);

  const activeOrders = orders.filter(o => o.status !== 'Order Arrived' && o.status !== 'Cancelled');
  const historyOrders = orders.filter(o => o.status === 'Order Arrived' || o.status === 'Cancelled');

  const displayOrders = activeTab === 'Active' ? activeOrders : historyOrders;

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

  if (loading) {
    return (
      <div style={{ padding: '100px 20px', textAlign: 'center', minHeight: '60vh' }}>
        <div className="spinner" style={{ margin: '0 auto 20px' }}></div>
        <p style={{ letterSpacing: '2px', color: '#999', fontSize: '0.8rem' }}>{t('fetching_orders')}</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div style={{ padding: '100px 20px', textAlign: 'center', minHeight: '60vh' }}>
        <h2 className="serif" style={{ fontSize: '2.5rem', marginBottom: '20px' }}>{t('no_orders_yet')}</h2>
        <p style={{ color: '#666', marginBottom: '40px' }}>{t('no_orders_yet_desc')}</p>
        <Link to="/shop" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-block', padding: '15px 40px' }}>
          {t('explore_collection')}
        </Link>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px 16px 80px', minHeight: '70vh', maxWidth: '850px', margin: '0 auto', boxSizing: 'border-box' }}>
      <div style={{ textAlign: 'center', marginBottom: '36px' }}>
        <h1 className="serif" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', marginBottom: '16px' }}>{t('my_orders')}</h1>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '20px' }}>
          <button 
            onClick={() => setActiveTab('Active')}
            style={{ 
              background: 'none', 
              border: 'none', 
              fontSize: '0.88rem', 
              fontWeight: '800', 
              color: activeTab === 'Active' ? '#000' : '#ccc',
              cursor: 'pointer',
              borderBottom: activeTab === 'Active' ? '2px solid #000' : 'none',
              paddingBottom: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Clock size={16} /> {t('active').toUpperCase()} ({activeOrders.length})
          </button>
          <button 
            onClick={() => setActiveTab('History')}
            style={{ 
              background: 'none', 
              border: 'none', 
              fontSize: '0.88rem', 
              fontWeight: '800', 
              color: activeTab === 'History' ? '#000' : '#ccc',
              cursor: 'pointer',
              borderBottom: activeTab === 'History' ? '2px solid #000' : 'none',
              paddingBottom: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <CheckCircle size={16} /> {t('history').toUpperCase()} ({historyOrders.length})
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto', display: 'grid', gap: '16px' }}>
        {displayOrders.length > 0 ? (
          displayOrders.map((order, idx) => (
            <Link 
              key={idx} 
              to={`/order-status?id=${order._id}`}
              style={{ 
                backgroundColor: '#fff', 
                border: '1px solid #f0f0f0', 
                borderRadius: '20px', 
                padding: '20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px',
                transition: 'all 0.3s ease',
                textDecoration: 'none',
                color: 'inherit',
                boxSizing: 'border-box'
              }} 
              className="menu-item-hover"
            >
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap', flex: 1, minWidth: 0 }}>
                 <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: '#f9f9f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Package size={20} color="#000" />
                 </div>
                 <div style={{ minWidth: 0 }}>
                    <h4 style={{ fontSize: '0.95rem', margin: '0 0 4px', wordBreak: 'break-all' }}>{t('order_number')} #{order._id.slice(-8)}</h4>
                    <div style={{ display: 'flex', gap: '14px', fontSize: '0.78rem', color: '#999', flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={12} /> {new Date(order.createdAt).toLocaleDateString()}
                      </span>
                      <span style={{ fontWeight: '800', color: '#000' }}>${order.subtotal?.toFixed(2)}</span>
                      <span style={{ 
                        color: order.status === 'Order Arrived' ? '#16a34a' : order.status === 'Cancelled' ? '#dc2626' : '#d97706',
                        fontWeight: '800',
                        fontSize: '0.72rem'
                      }}>
                        {getStatusLabel(order.status).toUpperCase()}
                      </span>
                    </div>
                 </div>
              </div>
              
              <div style={{ color: '#ccc', flexShrink: 0 }}>
                <ExternalLink size={18} />
              </div>
            </Link>
          ))
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
            {t('no_orders_section')}
          </div>
        )}
      </div>

      <div style={{ textAlign: 'center', marginTop: '60px' }}>
        <p style={{ color: '#ccc', fontSize: '0.8rem' }}>{t('secure_server_info')}</p>
      </div>
    </div>
  );
};

export default MyOrders;
