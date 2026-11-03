import React from 'react';
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

  const categories = [
    'All',
    'Curtain',
    'Valance',
    'Fabric',
    'Bed Sheet',
    'Pillow Case',
    'Accessories'
  ];

  const accessorySubCategories = ['All', 'Pole', 'Ring', 'Bracket', 'Hook', 'Tassel', 'Other'];

  const filteredProducts = products.filter(p => {
    if (activeCategory === 'All') return true;
    if (activeCategory === 'New Arrival') return p.isNew || (new Date(p.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));

    const matchesCategory = p.category?.toLowerCase() === activeCategory.toLowerCase();

    if (activeCategory === 'Accessories' && activeSubCategory !== 'All') {
      return matchesCategory && p.subCategory?.toLowerCase() === activeSubCategory.toLowerCase();
    }

    return matchesCategory;
  });

  return (
    <div style={{ width: '100%', padding: '0 0 60px 0' }}>
      {/* Editorial Category Tab Bar */}
      <div
        style={{
          width: '100%',
          padding: '16px clamp(12px, 3vw, 20px) 10px',
          boxSizing: 'border-box',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          borderBottom: '1px solid #f1f1f1'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(16px, 3vw, 24px)',
            overflowX: 'auto',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
        >
          {categories.map(cat => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                style={{
                  background: 'none',
                  border: 'none',
                  borderBottom: isActive ? '2px solid #000000' : '2px solid transparent',
                  padding: '6px 2px',
                  fontSize: '0.78rem',
                  fontWeight: isActive ? '800' : '600',
                  color: isActive ? '#000000' : '#52525b',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  fontFamily: "'Poppins', 'Noto Sans Khmer', 'Kdam Thmor Pro', sans-serif"
                }}
              >
                {t(cat.toLowerCase().replace(' ', '_'))}
              </button>
            );
          })}
        </div>

        <span style={{ fontSize: '0.72rem', fontWeight: '800', color: '#52525b', whiteSpace: 'nowrap', textTransform: 'uppercase' }}>
          {filteredProducts.length} មុខទំនិញ
        </span>
      </div>

      {/* Sub-Category Filter Bar for Accessories */}
      {activeCategory === 'Accessories' && (
        <div
          style={{
            display: 'flex',
            gap: '14px',
            padding: '12px 20px',
            borderBottom: '1px solid #f5f5f5',
            overflowX: 'auto'
          }}
        >
          {accessorySubCategories.map(sub => {
            const isSubActive = activeSubCategory === sub;
            return (
              <button
                key={sub}
                type="button"
                onClick={() => setActiveSubCategory(sub)}
                style={{
                  backgroundColor: isSubActive ? '#000000' : '#f4f4f5',
                  border: 'none',
                  padding: '5px 14px',
                  borderRadius: '50px',
                  fontSize: '0.72rem',
                  fontWeight: '700',
                  color: isSubActive ? '#ffffff' : '#3f3f46',
                  cursor: 'pointer',
                  fontFamily: "'Poppins', 'Noto Sans Khmer', 'Kdam Thmor Pro', sans-serif"
                }}
              >
                {t(sub.toLowerCase())}
              </button>
            );
          })}
        </div>
      )}

      {/* 5-Column Editorial Products Grid */}
      <div style={{ width: '100%', padding: '14px clamp(12px, 3vw, 20px)', boxSizing: 'border-box' }}>
        <div className="editorial-product-grid">
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
          <div
            style={{
              padding: '60px 20px',
              textAlign: 'center',
              backgroundColor: '#fafafa',
              margin: '20px 0'
            }}
          >
            <p style={{ fontSize: '0.95rem', fontWeight: '700', color: '#52525b', marginBottom: '14px' }}>
              {t('no_pieces_found')}
            </p>
            <button
              type="button"
              onClick={() => setActiveCategory('All')}
              style={{
                padding: '8px 20px',
                borderRadius: '50px',
                backgroundColor: '#000000',
                color: '#ffffff',
                fontSize: '0.75rem',
                fontWeight: '800',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              បង្ហាញផលិតផលទាំងអស់
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Shop;
