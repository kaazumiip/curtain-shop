import React from 'react';
import { useLocation } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { useLanguage } from '../context/LanguageContext';
const SearchResults = ({ products, onAddToCart, favorites, onToggleFavorite }) => {
  const location = useLocation();
  const { t } = useLanguage();
  const query = new URLSearchParams(location.search).get('q') || '';
  
  const results = products.filter(p => 
    p.name.toLowerCase().includes(query.toLowerCase()) ||
    p.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="page-container">
      <h1 className="serif page-title">{t('results_for')} "{query}"</h1>
      <p style={{ color: '#999', fontSize: '0.9rem', marginTop: '10px' }}>
        {results.length} {t('found_products')}
      </p>
      {results.length > 0 ? (
        <div className="product-grid">
          {results.map(product => (
            <ProductCard 
              key={product._id} 
              product={product} 
              onAddToCart={onAddToCart} 
              isFavorite={favorites.some(f => f._id === product._id)}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </div>
      ) : (
        <div style={{ padding: '100px 0', textAlign: 'center', color: '#999' }}>
          {t('no_items_found')}
        </div>
      )}
    </div>
  );
};

export default SearchResults;
