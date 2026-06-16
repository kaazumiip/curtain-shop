import React from 'react';
import ProductCard from '../components/ProductCard';
import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const Favorites = ({ favorites, onToggleFavorite, onAddToCart }) => {
  const { t } = useLanguage();

  return (
    <div style={{ padding: '40px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '60px' }}>
        <Heart size={32} color="#000" fill="#000" />
        <h1 className="serif" style={{ fontSize: '2.5rem' }}>{t('your_favorites')}</h1>
      </div>

      {favorites.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '100px 0' }}>
          <p style={{ color: '#999', fontSize: '1.2rem', marginBottom: '30px', letterSpacing: '1px' }}>
            {t('wishlist_empty')}
          </p>
          <Link 
            to="/shop" 
            style={{ 
              padding: '15px 40px', 
              borderRadius: '30px', 
              backgroundColor: '#000', 
              color: '#fff', 
              textDecoration: 'none',
              fontWeight: '700',
              fontSize: '0.8rem',
              letterSpacing: '1px'
            }}
          >
            {t('explore_collection')}
          </Link>
        </div>
      ) : (
        <div className="product-grid">
          {favorites.map(product => (
            <ProductCard 
              key={product._id} 
              product={product} 
              onAddToCart={onAddToCart} 
              isFavorite={true}
              onToggleFavorite={() => onToggleFavorite(product)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Favorites;
