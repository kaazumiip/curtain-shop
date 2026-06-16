import React from 'react';
import { Edit2, Trash2, PlusCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const StockTable = ({ products, onEdit, onDelete }) => {
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
                  style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '12px', border: '1px solid #efefef', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }} 
                />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontWeight: '700', fontSize: '0.95rem', color: '#000' }}>{product.name}</span>
                  {product.nameKh && (
                    <span style={{ fontSize: '0.8rem', color: '#666', fontFamily: "'Kantumruy Pro', sans-serif" }}>{product.nameKh}</span>
                  )}
                  <span style={{ fontSize: '0.7rem', color: '#8e8e8e', letterSpacing: '0.5px', marginTop: '2px' }}>
                    {t(product.category.toLowerCase().replace(' ', '_'))}
                    {product.subCategory && ` — ${t(product.subCategory.toLowerCase())}`}
                  </span>
                </div>
              </td>
              <td style={{ color: '#000', fontWeight: '500' }}>£{product.price}</td>
              <td style={{ color: '#8e8e8e' }}>{product.stock} {t('in_stock')}</td>
              <td>
                <span className={`stock-badge ${product.status}`}>
                  {product.status.replace('-', ' ')}
                </span>
              </td>
              <td>
                <button className="action-btn" onClick={() => onEdit(product)}>
                  <Edit2 size={16} />
                </button>
                <button className="action-btn" onClick={() => onDelete(product._id)} style={{ color: 'var(--vanguard-pink)' }}>
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
