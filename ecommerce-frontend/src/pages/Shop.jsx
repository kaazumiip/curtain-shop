import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { useLanguage } from '../context/LanguageContext';

const Shop = ({ products, onAddToCart, favorites, onToggleFavorite }) => {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get('category') || 'All';
  const activeSubCategory = searchParams.get('subCategory') || 'All';
  
  const setActiveCategory = (category) => {
    setSearchParams({ category });
  };

  const setActiveSubCategory = (subCategory) => {
    setSearchParams({ category: activeCategory, subCategory });
  };
  
  const categories = ['All', 'New Arrival', 'Curtain', 'Valance', 'Fabric', 'Bed Sheet', 'Pillow Case', 'Accessories'];
  
  const accessorySubCategories = ['All', 'Pole', 'Ring', 'Bracket', 'Hook', 'Tassel', 'Other'];
  
  const filteredProducts = products.filter(p => {
    if (activeCategory === 'All') return true;
    if (activeCategory === 'New Arrival') return p.isNew || (new Date(p.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
    
    const matchesCategory = p.category.toLowerCase() === activeCategory.toLowerCase();
    
    if (activeCategory === 'Accessories' && activeSubCategory !== 'All') {
      return matchesCategory && p.subCategory === activeSubCategory;
    }
    
    return matchesCategory;
  });

  return (
    <div className="page-container">
      <div className="shop-header">
        <h1 className="serif page-title">{t('full_collection')}</h1>
        
        {/* Category Filter Bar */}
        <div className="category-scroll-bar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                background: 'none',
                border: 'none',
                padding: '0',
                fontSize: '0.75rem',
                fontWeight: '700',
                letterSpacing: '2px',
                textTransform: 'uppercase',
                color: activeCategory === cat ? '#000' : '#ccc',
                cursor: 'pointer',
                position: 'relative',
                transition: 'color 0.3s ease'
              }}
            >
              {t(cat.toLowerCase().replace(' ', '_'))}
              {activeCategory === cat && (
                <div style={{
                  position: 'absolute',
                  bottom: '-21px',
                  left: 0,
                  width: '100%',
                  height: '2px',
                  backgroundColor: '#000'
                }}></div>
              )}
            </button>
          ))}
        </div>

        {/* Sub-Category Filter Bar for Accessories */}
        {activeCategory === 'Accessories' && (
          <div style={{ 
            display: 'flex', 
            gap: '20px', 
            marginTop: '20px',
            overflowX: 'auto',
            paddingBottom: '10px'
          }}>
            {accessorySubCategories.map(sub => (
              <button
                key={sub}
                onClick={() => setActiveSubCategory(sub)}
                style={{
                  background: activeSubCategory === sub ? '#000' : 'none',
                  border: '1px solid #000',
                  padding: '6px 15px',
                  borderRadius: '20px',
                  fontSize: '0.65rem',
                  fontWeight: '600',
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  color: activeSubCategory === sub ? '#fff' : '#000',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  whiteSpace: 'nowrap'
                }}
              >
                {t(sub.toLowerCase())}
              </button>
            ))}
          </div>
        )}
        
        <p className="showing-count">
          {t('showing')} {filteredProducts.length} {t('curated_pieces')}
        </p>
      </div>

      <div className="product-grid">
        {filteredProducts.map(product => (
          <ProductCard 
            key={product._id} 
            product={product} 
            onAddToCart={onAddToCart} 
            isFavorite={favorites.some(f => f._id === product._id)}
            onToggleFavorite={onToggleFavorite}
          />
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div style={{ padding: '100px 0', textAlign: 'center', color: '#ccc', letterSpacing: '2px' }}>
          {t('no_pieces_found')}
        </div>
      )}
    </div>
  );
};

export default Shop;
