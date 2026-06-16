import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import StockTable from '../components/StockTable';
import OrdersTable from '../components/OrdersTable';
import ProductModal from '../components/ProductModal';
import LiveChat from './LiveChat';
import HardwareManager from '../components/HardwareManager';
import { Plus, Package, ChevronRight, Globe, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

function Dashboard() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [view, setView] = useState('products'); // 'products', 'orders', 'history'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [orderFilter, setOrderFilter] = useState('Pending');
  const [productCategoryFilter, setProductCategoryFilter] = useState('all');
  const [productSearch, setProductSearch] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { t, language, toggleLanguage } = useLanguage();

  const productCategories = ['all', 'curtain', 'bed_sheet', 'pillow_case', 'accessories'];

  useEffect(() => {
    fetchProducts();
    fetchOrders();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/products');
      setProducts(res.data);
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders');
      setOrders(res.data);
    } catch (err) {
      console.error('Error fetching orders:', err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to remove this product?')) {
      try {
        await api.delete(`/products/${id}`);
        fetchProducts();
      } catch (err) {
        console.error('Error deleting product:', err);
        alert('Failed to delete item.');
      }
    }
  };

  const handleSave = async (formData) => {
    try {
      if (editingProduct) {
        await api.put(`/products/${editingProduct._id}`, formData);
      } else {
        await api.post('/products', formData);
      }
      setIsModalOpen(false);
      fetchProducts();
    } catch (err) {
      console.error('Error saving product:', err);
      const msg = err.response?.data?.message || 'Check your information and try again.';
      alert('Save Failed: ' + msg);
    }
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const getCount = (tab) => {
    if (tab === 'Pending') return orders.filter(o => o.status !== 'Order Arrived' && o.status !== 'Cancelled').length;
    if (tab === 'Complete') return orders.filter(o => o.status === 'Order Arrived').length;
    if (tab === 'Cancelled') return orders.filter(o => o.status === 'Cancelled').length;
    return 0;
  };

  const handleSelectOrder = (order) => {
    navigate(`/order/${order._id}`);
  };

  const filteredProducts = products.filter(p => {
    const matchesCategory = productCategoryFilter === 'all' || p.category.toLowerCase().replace(' ', '_') === productCategoryFilter;
    const matchesSearch = p.name.toLowerCase().includes(productSearch.toLowerCase()) || 
                          p.description?.toLowerCase().includes(productSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const filteredOrders = orders.filter(order => {
    if (view === 'history') {
      return order.status === 'Order Arrived';
    }
    if (orderFilter === 'Pending') {
      return order.status !== 'Order Arrived' && order.status !== 'Cancelled';
    }
    if (orderFilter === 'Cancelled') {
      return order.status === 'Cancelled';
    }
    return true;
  });

  return (
    <div className="dashboard-container">
      <header className="dashboard-header" style={{ borderBottom: '1px solid #efefef', paddingBottom: '20px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1 className="serif" style={{ fontSize: '1.5rem', letterSpacing: '-0.5px' }}>Srey Tha Curtain</h1>
            <div 
              onClick={toggleLanguage}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                fontSize: '0.75rem', 
                fontWeight: '700', 
                cursor: 'pointer',
                padding: '6px 12px',
                border: '1px solid #eee',
                borderRadius: '8px'
              }}
            >
              <Globe size={14} />
              {language === 'en' ? 'KH' : 'EN'}
            </div>
          </div>
          <div className="tab-header">
            <span 
              onClick={() => setView('products')} 
              style={{ 
                cursor: 'pointer', 
                fontSize: '0.85rem',
                fontWeight: view === 'products' ? '700' : '400', 
                color: view === 'products' ? '#000' : '#8e8e8e',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Package size={16} />
              {t('inventory')}
            </span>
            <span 
              onClick={() => { setView('orders'); setOrderFilter('Pending'); }} 
              style={{ 
                cursor: 'pointer', 
                fontSize: '0.85rem',
                fontWeight: view === 'orders' ? '700' : '400', 
                color: view === 'orders' ? '#000' : '#8e8e8e',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <ChevronRight size={16} />
              {t('orders')} ({orders.filter(o => o.status !== 'Order Arrived' && o.status !== 'Cancelled').length})
            </span>
            <span 
              onClick={() => { setView('history'); setOrderFilter('Complete'); }} 
              style={{ 
                cursor: 'pointer', 
                fontSize: '0.85rem',
                fontWeight: view === 'history' ? '700' : '400', 
                color: view === 'history' ? '#000' : '#8e8e8e',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Clock size={16} />
              History
            </span>
            <span 
              onClick={() => setIsChatOpen(true)} 
              style={{ 
                cursor: 'pointer', 
                fontSize: '0.85rem',
                fontWeight: '400', 
                color: '#8e8e8e',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Plus size={16} />
              {t('messages')}
            </span>
          </div>
        </div>
        {view === 'products' && (
          <button 
            className="btn-primary" 
            onClick={openAddModal} 
            style={{ 
              backgroundColor: '#000', 
              borderRadius: '8px', 
              fontSize: '0.85rem', 
              padding: '8px 16px',
              textTransform: 'none',
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px' 
            }}
          >
            <Plus size={18} />
            <span>{t('add_product')}</span>
          </button>
        )}
      </header>
      
      {view === 'products' && (
        <>
          {/* Global Hardware Library Section on Top */}
          <div style={{ 
            marginTop: '30px', 
            padding: '25px', 
            backgroundColor: '#f8fbff', 
            borderRadius: '24px', 
            border: '1px solid #e1f0ff' 
          }}>
            <HardwareManager isCompact={true} />
          </div>

          <div style={{ margin: '30px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '10px' }}>
                {productCategories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setProductCategoryFilter(cat)}
                    style={{
                      padding: '6px 16px',
                      borderRadius: '8px',
                      border: '1px solid #dbdbdb',
                      backgroundColor: productCategoryFilter === cat ? '#000' : '#fff',
                      color: productCategoryFilter === cat ? '#fff' : '#000',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {t(cat)}
                  </button>
                ))}
              </div>
              
              <div style={{ position: 'relative', width: '100%', maxWidth: '350px' }}>
                <input 
                  type="text" 
                  placeholder={t('search_placeholder')}
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  style={{ 
                    width: '100%', 
                    padding: '10px 15px', 
                    borderRadius: '10px', 
                    border: '1px solid #dbdbdb',
                    backgroundColor: '#fafafa',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                />
              </div>
            </div>
          </div>
        </>
      )}

      {view === 'orders' && (
        <div style={{ display: 'flex', gap: '15px', marginBottom: '30px' }}>
          {['Pending', 'Cancelled'].map(tab => (
            <button
              key={tab}
              onClick={() => setOrderFilter(tab)}
              style={{
                padding: '10px 25px',
                borderRadius: '50px',
                border: '1px solid #eee',
                backgroundColor: orderFilter === tab ? '#000' : '#fff',
                color: orderFilter === tab ? '#fff' : '#666',
                fontSize: '0.8rem',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              {tab.toUpperCase()} ({getCount(tab)})
            </button>
          ))}
        </div>
      )}

      {view === 'history' && (
        <div style={{ marginBottom: '30px' }}>
          <h2 className="serif" style={{ fontSize: '1.8rem' }}>Order History</h2>
          <p style={{ fontSize: '0.8rem', color: '#999' }}>All completed orders that have arrived.</p>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', marginTop: '100px', letterSpacing: '2px' }}>
          ACCESSING DATABASE...
        </div>
      ) : view === 'products' ? (
        <StockTable 
          products={filteredProducts} 
          onEdit={openEditModal} 
          onDelete={handleDelete} 
        />
      ) : (
        <OrdersTable orders={filteredOrders} onSelectOrder={handleSelectOrder} />
      )}

      <ProductModal 
        isOpen={isModalOpen} 
        product={editingProduct} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSave} 
      />

      {isChatOpen && <LiveChat onClose={() => setIsChatOpen(false)} />}
      
      <footer style={{ marginTop: 'auto', paddingTop: '40px', color: 'var(--border)', fontSize: '0.6rem', textAlign: 'center', letterSpacing: '4px' }}>
        SREY THA &copy; 2026 COLLECTION MANAGER
      </footer>
    </div>
  );
}

export default Dashboard;
