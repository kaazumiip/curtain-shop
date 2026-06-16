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
    <div style={{ padding: '40px 0' }}>
      <h1 className="serif" style={{ fontSize: '2.5rem', marginBottom: '60px' }}>{t('your_cart')}</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '80px' }} className="mobile-stack">
        {/* Item List */}
        <div>
          {cart.map((item, idx) => (
            <div key={idx} style={{ 
              display: 'flex', 
              gap: '20px', 
              padding: '30px 0', 
              borderBottom: '1px solid #f0f0f0' 
            }}>
              <img src={(item.images && item.images.length > 0) ? item.images[0].url : (item.imageUrl || 'https://via.placeholder.com/300')} style={{ width: '100px', height: '120px', objectFit: 'contain', borderRadius: '15px', backgroundColor: '#f9f9f9' }} alt={item.name} />
              
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h4 className="serif" style={{ fontSize: '1.2rem', margin: '0', flex: 1 }}>{item.name}</h4>
                  <p style={{ fontWeight: '800', fontSize: '1.2rem', marginLeft: '20px' }}>£{Number(item.totalPrice || item.price).toFixed(2)}</p>
                </div>
                
                <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '10px', display: 'grid', gap: '5px' }}>
                  {item.selectedSize && <p>{t('dimension')}: {item.selectedSize.name}</p>}
                  {item.selectedColorName && <p>{t('color')}: {item.selectedColorName}</p>}
                  {item.category !== 'Fabric' && item.poleColor && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <p style={{ margin: 0 }}>{t('pole_ring')}: {item.poleColor.name || item.poleColor}</p>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {item.poleColor.imageUrl && <img src={item.poleColor.imageUrl} style={{ width: '20px', height: '20px', borderRadius: '4px', objectFit: 'contain', backgroundColor: '#fff', border: '1px solid #eee' }} alt="Ring" />}
                        {item.poleColor.poleImageUrl && <img src={item.poleColor.poleImageUrl} style={{ width: '20px', height: '20px', borderRadius: '4px', objectFit: 'contain', backgroundColor: '#fff', border: '1px solid #eee' }} alt="Pole" />}
                      </div>
                    </div>
                  )}
                  {item.cascadeStyle && <p>{t('cascade_style')}: {item.cascadeStyle.name}</p>}
                  {item.customWidth && <p>{t('width')}: {item.customWidth}m</p>}
                  {item.customHeight && <p>{t('height')}: {item.customHeight}m</p>}
                  {item.fabricMeters && <p>{t('quantity')}: {item.fabricMeters} {t('meters')}</p>}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '15px' }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    backgroundColor: '#f9f9f9', 
                    borderRadius: '10px', 
                    padding: '2px' 
                  }}>
                    <button 
                      onClick={() => onUpdateQuantity(idx, Math.max(1, (item.quantity || 1) - 1))}
                      style={{ width: '25px', height: '25px', border: 'none', background: '#fff', borderRadius: '8px', cursor: 'pointer', fontWeight: '700' }}
                    >-</button>
                    <span style={{ width: '40px', textAlign: 'center', fontWeight: '700', fontSize: '0.8rem' }}>{item.quantity || 1}</span>
                    <button 
                      onClick={() => onUpdateQuantity(idx, (item.quantity || 1) + 1)}
                      style={{ width: '25px', height: '25px', border: 'none', background: '#fff', borderRadius: '8px', cursor: 'pointer', fontWeight: '700' }}
                    >+</button>
                  </div>
                  <span style={{ fontSize: '0.65rem', color: '#999' }}>{t('quantity') || 'Quantity'}</span>
                </div>

                <button 
                  onClick={() => onRemoveFromCart(idx)}
                  style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer', marginTop: '15px', display: 'flex', alignItems: 'center', gap: '5px', padding: '0' }}
                >
                  <Trash2 size={14} /> <span style={{ fontSize: '0.7rem' }}>{t('remove')}</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Summary Table */}
        <div>
          <div style={{ backgroundColor: '#f9f9f9', padding: '40px', borderRadius: '30px', position: 'sticky', top: '40px' }}>
            <h3 className="serif" style={{ marginBottom: '30px' }}>{t('order_summary')}</h3>
            
            <div style={{ display: 'grid', gap: '15px', fontSize: '0.9rem', marginBottom: '30px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{t('subtotal')}</span>
                <span>£{subtotal}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{t('shipping')}</span>
                <span>{t('calc_checkout')}</span>
              </div>
            </div>

            <div style={{ width: '100%', height: '1px', backgroundColor: '#eee', marginBottom: '20px' }}></div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '800', fontSize: '1.2rem', marginBottom: '40px' }}>
              <span>{t('total')}</span>
              <span>£{subtotal}</span>
            </div>

            <button 
              onClick={() => navigate('/checkout')}
              className="btn-primary" 
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '20px' }}
            >
              {t('checkout')} <ArrowRight size={18} />
            </button>
            
            <p style={{ textAlign: 'center', fontSize: '0.6rem', color: '#999', marginTop: '20px', letterSpacing: '1px' }}>
              {t('complimentary_shipping')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
