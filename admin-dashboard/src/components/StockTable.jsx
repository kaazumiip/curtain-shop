import React from 'react';
import { Edit2, Trash2, Copy } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const StockTable = ({ products, onEdit, onDelete, onDuplicate }) => {
  const { t } = useLanguage();

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
                <div>${Number(product.price).toFixed(2)}</div>
                {Number(product.originalPrice) > Number(product.price) && (
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8', textDecoration: 'line-through', fontWeight: '600' }}>
                    ${Number(product.originalPrice).toFixed(2)}
                  </div>
                )}
              </td>
              <td style={{ color: '#8e8e8e' }}>{product.stock} {t('in_stock')}</td>
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
    </div>
  );
};

export default StockTable;
