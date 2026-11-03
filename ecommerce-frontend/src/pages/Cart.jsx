import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ArrowRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const Cart = ({ cart, onRemoveFromCart, onUpdateQuantity }) => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const subtotal = cart.reduce((acc, item) => acc + Number(item.totalPrice || item.price), 0).toFixed(2);

  if (cart.length === 0) {
    return (
      <div style={{ padding: '150px 0', textAlign: 'center' }}>
        <h2 className="serif" style={{ fontSize: '2rem', marginBottom: '20px' }}>{t('cart_empty')}</h2>
        <p style={{ color: '#999', marginBottom: '40px' }}>{t('cart_empty_desc')}</p>
        <Link to="/shop" className="btn-primary" style={{ display: 'inline-block', width: 'auto', padding: '15px 40px', textDecoration: 'none' }}>
          {t('back_to_shop')}
        </Link>
      </div>
    );
  }

  return (
    <div style={{ padding: '30px 16px 80px', maxWidth: '1200px', margin: '0 auto', boxSizing: 'border-box' }}>
      <h1 className="serif" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', marginBottom: '32px' }}>{t('your_cart')}</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '36px' }} className="mobile-stack">
        {/* Item List */}
        <div>
          {cart.map((item, idx) => (
            <div key={idx} style={{ 
              display: 'flex', 
              gap: '16px', 
              padding: '24px 0', 
              borderBottom: '1px solid #f0f0f0',
              alignItems: 'flex-start'
            }}>
              <img 
                src={(item.images && item.images.length > 0) ? item.images[0].url : (item.imageUrl || 'https://via.placeholder.com/300')} 
                style={{ width: '85px', height: '105px', objectFit: 'contain', borderRadius: '14px', backgroundColor: '#f9f9f9', flexShrink: 0 }} 
                alt={item.name} 
              />
              
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', flexWrap: 'wrap' }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    {item.windowLabel && (
                      <span style={{ display: 'inline-block', backgroundColor: '#e2e8f0', color: '#0f172a', padding: '2px 8px', borderRadius: '4px', fontWeight: '800', fontSize: '0.72rem', marginBottom: '6px' }}>
                        {item.windowLabel}
                      </span>
                    )}
                    <h4 className="serif" style={{ fontSize: '1.05rem', margin: '0', wordBreak: 'break-word' }}>{item.name}</h4>
                  </div>
                  <p style={{ fontWeight: '800', fontSize: '1.15rem', margin: 0, color: '#0f172a' }}>
                    ${Number(item.totalPrice || item.price).toFixed(2)}
                  </p>
                </div>
                
                <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '8px', display: 'grid', gap: '4px' }}>
                  {item.selectedSize && <p style={{ margin: 0 }}>{t('dimension')}: {item.selectedSize.name}</p>}
                  {item.selectedColorName && <p style={{ margin: 0 }}>{t('color')}: {item.selectedColorName}</p>}
                  {item.category !== 'Fabric' && item.poleColor && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <p style={{ margin: 0 }}>{t('pole_ring')}: {item.poleColor.name || item.poleColor}</p>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {item.poleColor.imageUrl && <img src={item.poleColor.imageUrl} style={{ width: '20px', height: '20px', borderRadius: '4px', objectFit: 'contain', backgroundColor: '#fff', border: '1px solid #eee' }} alt="Ring" />}
                        {item.poleColor.poleImageUrl && <img src={item.poleColor.poleImageUrl} style={{ width: '20px', height: '20px', borderRadius: '4px', objectFit: 'contain', backgroundColor: '#fff', border: '1px solid #eee' }} alt="Pole" />}
                      </div>
                    </div>
                  )}
                  {item.cascadeStyle && <p style={{ margin: 0 }}>{t('cascade_style')}: {item.cascadeStyle.name}</p>}
                  {item.customWidth && <p style={{ margin: 0 }}>{t('width')}: {item.customWidth}m</p>}
                  {item.customHeight && <p style={{ margin: 0 }}>{t('height')}: {item.customHeight}m</p>}
                  {item.fabricMeters && <p style={{ margin: 0 }}>{t('quantity')}: {item.fabricMeters} {t('meters')}</p>}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '14px', flexWrap: 'wrap' }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    backgroundColor: '#f1f5f9', 
                    borderRadius: '10px', 
                    padding: '2px' 
                  }}>
                    <button 
                      onClick={() => onUpdateQuantity(idx, Math.max(1, (item.quantity || 1) - 1))}
                      style={{ width: '28px', height: '28px', border: 'none', background: '#fff', borderRadius: '8px', cursor: 'pointer', fontWeight: '700' }}
                    >-</button>
                    <span style={{ width: '36px', textAlign: 'center', fontWeight: '700', fontSize: '0.85rem' }}>{item.quantity || 1}</span>
                    <button 
                      onClick={() => onUpdateQuantity(idx, (item.quantity || 1) + 1)}
                      style={{ width: '28px', height: '28px', border: 'none', background: '#fff', borderRadius: '8px', cursor: 'pointer', fontWeight: '700' }}
                    >+</button>
                  </div>

                  <button 
                    onClick={() => onRemoveFromCart(idx)}
                    style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', padding: '4px' }}
                  >
                    <Trash2 size={14} /> <span style={{ fontSize: '0.72rem' }}>{t('remove')}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary Table */}
        <div>
          <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', padding: '28px 22px', borderRadius: '24px', position: 'sticky', top: '20px' }}>
            <h3 className="serif" style={{ marginBottom: '24px', fontSize: '1.2rem' }}>{t('order_summary')}</h3>
            
            <div style={{ display: 'grid', gap: '12px', fontSize: '0.9rem', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>{t('subtotal')}</span>
                <span style={{ fontWeight: '700' }}>${subtotal}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>{t('shipping')}</span>
                <span style={{ color: '#16a34a', fontWeight: '600' }}>{t('calc_checkout')}</span>
              </div>
            </div>

            <div style={{ width: '100%', height: '1px', backgroundColor: '#e2e8f0', marginBottom: '20px' }}></div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '900', fontSize: '1.25rem', marginBottom: '30px' }}>
              <span>{t('total')}</span>
              <span style={{ color: '#0f172a' }}>${subtotal}</span>
            </div>

            <button 
              onClick={() => navigate('/checkout')}
              className="btn-primary" 
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '16px', width: '100%', borderRadius: '12px', fontWeight: '800' }}
            >
              {t('checkout')} <ArrowRight size={18} />
            </button>
            
            <p style={{ textAlign: 'center', fontSize: '0.65rem', color: '#94a3b8', marginTop: '16px', letterSpacing: '0.5px' }}>
              {t('complimentary_shipping')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
