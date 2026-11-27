import React, { useState } from 'react';
import { Edit2, Trash2, Copy, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const StockTable = ({ products, onEdit, onDelete, onDuplicate, onAddStock }) => {
  const { t } = useLanguage();
  const [stockModalProduct, setStockModalProduct] = useState(null);
  const [addAmount, setAddAmount] = useState('1');

  return (
    <div className="vanguard-table-container no-scroll-mobile">
      <table className="vanguard-table">
        <thead>
          <tr>
            <th>{t('product')}</th>
            <th>{t('price')}</th>
            <th>{t('stock')}</th>
            <th>{t('status')}</th>
            <th>{t('actions')}</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product._id}>
              <td style={{ display: 'flex', alignItems: 'center', gap: '20px', border: 'none' }}>
                <img 
                  src={product.imageUrl || (product.images && product.images.length > 0 ? product.images[0].url : '')} 
                  alt="" 
                  style={{ 
                    width: '80px', 
                    height: '80px', 
                    objectFit: 'cover', 
                    borderRadius: '14px', 
                    border: '1px solid #e2e8f0', 
                    boxShadow: '0 4px 14px rgba(0,0,0,0.06)',
                    flexShrink: 0
                  }} 
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontWeight: '800', fontSize: '1.05rem', color: '#0f172a' }}>{product.name}</span>
                  {product.nameKh && (
                    <span style={{ fontSize: '0.9rem', color: '#64748b', fontFamily: "'Poppins', 'Noto Sans Khmer', 'Kdam Thmor Pro', sans-serif" }}>{product.nameKh}</span>
                  )}
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', letterSpacing: '0.5px', marginTop: '2px', fontWeight: '600' }}>
                    {t(product.category.toLowerCase().replace(' ', '_'))}
                    {product.subCategory && ` — ${t(product.subCategory.toLowerCase())}`}
                  </span>
                </div>
              </td>
              <td style={{ color: '#0f172a', fontWeight: '700', fontSize: '1.05rem' }}>
                {(() => {
                  const szOpts = product.customOptions?.sizeOptions || [];
                  const isPerMeter =
                    ['Curtain', 'Sheer Curtain', 'Valance', 'Fabric'].includes(product.category) ||
                    (product.category === 'Accessories' && ['pole', 'tassel'].includes(product.subCategory?.toLowerCase()));
                  if (szOpts.length > 0) {
                    const minP = Math.min(...szOpts.map((s) => Number(s.price) || 0).filter((p) => p > 0));
                    const val = Number.isFinite(minP) ? minP : Number(product.price || 0);
                    return <div>ចាប់ពី ${val.toFixed(2)}</div>;
                  }
                  if (isPerMeter) {
                    return <div>${Number(product.price || 0).toFixed(2)} / ម៉ែត្រ</div>;
                  }
                  return <div>${Number(product.price || 0).toFixed(2)}</div>;
                })()}
                {Number(product.originalPrice) > Number(product.price) && (
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8', textDecoration: 'line-through', fontWeight: '600' }}>
                    ${Number(product.originalPrice).toFixed(2)}
                  </div>
                )}
              </td>
              <td style={{ color: '#8e8e8e' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontWeight: '700', color: '#0f172a' }}>{product.stock} {t('in_stock')}</span>
                  {onAddStock && (
                    <button
                      type="button"
                      onClick={() => {
                        setStockModalProduct(product);
                        setAddAmount('1');
                      }}
                      style={{
                        alignSelf: 'flex-start',
                        padding: '5px 12px',
                        fontSize: '0.78rem',
                        fontWeight: '700',
                        borderRadius: '8px',
                        border: '1px solid #0f172a',
                        backgroundColor: '#0f172a',
                        color: '#ffffff',
                        cursor: 'pointer'
                      }}
                    >
                      + Add Stock
                    </button>
                  )}
                </div>
              </td>
              <td>
                <span className={`stock-badge ${product.status}`}>
                  {product.status === 'available' ? t('status_available') : product.status === 'low-stock' ? t('status_low_stock') : t('status_sold_out')}
                </span>
              </td>
              <td>
                <button className="action-btn" title="Duplicate product" onClick={() => onDuplicate && onDuplicate(product)} style={{ marginRight: '6px' }}>
                  <Copy size={16} />
                </button>
                <button className="action-btn" title="Edit" onClick={() => onEdit(product)}>
                  <Edit2 size={16} />
                </button>
                <button className="action-btn" title="Delete" onClick={() => onDelete(product._id)} style={{ color: 'var(--vanguard-pink)' }}>
                  <Trash2 size={16} />
                </button>
              </td>
            </tr>
          ))}
          {products.length === 0 && (
            <tr>
              <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>
                {t('no_records')}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Add Stock Dialog */}
      {stockModalProduct && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.55)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '400px',
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            padding: '24px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: '#0f172a' }}>
                បន្ថែមស្តុក (Add Stock)
              </h3>
              <button
                type="button"
                onClick={() => setStockModalProduct(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '0.95rem' }}>{stockModalProduct.name}</div>
              <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '4px' }}>
                ស្តុកបច្ចុប្បន្ន (Current Stock): <strong style={{ color: '#0f172a' }}>{stockModalProduct.stock}</strong>
              </div>
            </div>

            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
              ចំនួនត្រូវបន្ថែម (Quantity to Add)
            </label>
            <input
              type="number"
              value={addAmount}
              onChange={(e) => setAddAmount(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                fontSize: '1rem',
                fontWeight: '700',
                boxSizing: 'border-box',
                marginBottom: '12px'
              }}
            />

            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              {[1, 5, 10, 20].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAddAmount(String(preset))}
                  style={{
                    flex: 1,
                    padding: '6px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#f1f5f9',
                    fontWeight: '700',
                    fontSize: '0.8rem',
                    cursor: 'pointer'
                  }}
                >
                  +{preset}
                </button>
              ))}
            </div>

            <div style={{ fontSize: '0.85rem', color: '#15803d', fontWeight: '700', marginBottom: '18px' }}>
              ស្តុកថ្មីសរុប (New Total): {Math.max(0, Number(stockModalProduct.stock || 0) + (parseInt(addAmount, 10) || 0))}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setStockModalProduct(null)}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                បោះបង់ (Cancel)
              </button>
              <button
                type="button"
                onClick={() => {
                  const amt = parseInt(addAmount, 10);
                  if (Number.isNaN(amt) || amt === 0) {
                    alert('Please enter a valid number.');
                    return;
                  }
                  onAddStock(stockModalProduct, amt);
                  setStockModalProduct(null);
                }}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: '#0f172a',
                  color: '#ffffff',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                រក្សាទុក (Save)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockTable;
