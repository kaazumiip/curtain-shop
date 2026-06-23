import React from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const ProductCard = ({ product, onAddToCart, isFavorite, onToggleFavorite }) => {
  const { t, language } = useLanguage();
  
  return (
    <div className="product-card">
      <Link to={`/product/${product._id}`} style={{ textDecoration: 'none' }}>
        <img 
          src={(product.images && product.images.length > 0) ? product.images[0].url : (product.imageUrl || 'https://via.placeholder.com/300')} 
          alt={product.name} 
          className="product-img" 
          style={{ objectFit: 'contain', backgroundColor: '#f9f9f9' }}
        />
        <div style={{ padding: '15px 5px 0' }}>
          <div style={{ marginBottom: '5px' }}>
            <span style={{ fontSize: '0.6rem', color: '#999', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700' }}>
              {product.subCategory ? t(product.subCategory.toLowerCase()) : t(product.category.toLowerCase().replace(' ', '_'))}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <h4 className="product-title serif" style={{ margin: 0 }}>
              {language === 'kh' && product.nameKh ? product.nameKh : product.name}
            </h4>
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation(); // Prevent link click
                onToggleFavorite(product);
              }}
              style={{ 
                background: 'none', 
                border: 'none', 
                padding: '5px', 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'transform 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <Heart 
                size={20} 
                color={isFavorite ? '#ff4d4d' : '#ccc'} 
                fill={isFavorite ? '#ff4d4d' : 'transparent'} 
              />
            </button>
          </div>
          <p className="product-price" style={{ marginTop: '5px' }}>
            {product.customOptions?.sizeOptions?.length > 0 
              ? `From £${Math.min(...product.customOptions.sizeOptions.map(s => s.price)).toFixed(2)}`
              : `£${Number(product.price).toFixed(2)}`
            }
          </p>
        </div>
      </Link>
      
      <button 
        className="btn-add" 
        onClick={(e) => {
          e.preventDefault();
          onAddToCart(product);
        }}
        style={{ marginTop: '15px', width: '100%' }}
      >
        ADD TO CART
      </button>
    </div>
  );
};

export default ProductCard;
