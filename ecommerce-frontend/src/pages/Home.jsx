import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import BookMeasurementModal from '../components/BookMeasurementModal';

const Home = ({ products, onAddToCart, favorites, onToggleFavorite }) => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSubCategory, setSelectedSubCategory] = useState('All');
  const [isMeasurementOpen, setIsMeasurementOpen] = useState(false);

  const categories = [
    { id: 'All', name: 'ទាំងអស់' },
    { id: 'Curtain', name: 'វាំងនន' },
    { id: 'Valance', name: 'ដក់' },
    { id: 'Fabric', name: 'ក្រណាត់ម៉ែត្រ' },
    { id: 'Bed Sheet', name: 'កម្រាលពូក' },
    { id: 'Pillow Case', name: 'ស្រោមខ្នើយ' },
    { id: 'Accessories', name: 'គ្រឿងបន្លាស់' }
  ];

  const accessorySubCategories = [
    { id: 'All', name: 'ទាំងអស់' },
    { id: 'Pole', name: 'ដង' },
    { id: 'Ring', name: 'កង' },
    { id: 'Bracket', name: 'ជើងទម្រ' },
    { id: 'Hook', name: 'ទំពក់' },
    { id: 'Tassel', name: 'រំយោល' },
    { id: 'Other', name: 'ផ្សេងៗ' }
  ];

  const filteredProducts = products.filter(p => {
    if (selectedCategory === 'All') return true;
    const matchCategory = p.category?.toLowerCase() === selectedCategory.toLowerCase();
    if (selectedCategory === 'Accessories' && selectedSubCategory !== 'All') {
      return matchCategory && p.subCategory?.toLowerCase() === selectedSubCategory.toLowerCase();
    }
    return matchCategory;
  });

  return (
    <div style={{ width: '100%', backgroundColor: '#ffffff' }}>
      {/* 1. Top Full-Width Split Banner (Pure Product Types, No Collection Text) */}
      <section className="editorial-hero-split">
        {/* Left Panel: Store Name & Product Type Quick Buttons */}
        <div className="editorial-hero-left">
          <div>
            <h1
              style={{
                fontSize: 'clamp(1.75rem, 2.8vw, 2.6rem)',
                fontWeight: '900',
                color: '#ffffff',
                lineHeight: '1.25',
                margin: '0 0 12px 0',
                letterSpacing: '-0.5px'
              }}
            >
              ស្រីថា វាំងនន
              <br />
              <span style={{ color: '#a1a1aa', fontSize: '0.72em', fontWeight: '700' }}>
                SREY THA CURTAIN
              </span>
            </h1>

            <p
              style={{
                fontSize: '0.88rem',
                color: '#d4d4d8',
                lineHeight: '1.7',
                margin: '0 0 22px 0',
                maxWidth: '420px'
              }}
            >
              វាំងនន • ដក់ • ក្រណាត់ម៉ែត្រ • កម្រាលពូក • ស្រោមខ្នើយ • គ្រឿងបន្លាស់
            </p>
          </div>

          {/* Direct Product Type Pills + Book Measurement Button on Banner */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {categories.filter(c => c.id !== 'All').map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  style={{
                    backgroundColor: selectedCategory === cat.id ? '#ffffff' : 'rgba(255,255,255,0.1)',
                    color: selectedCategory === cat.id ? '#000000' : '#ffffff',
                    border: '1px solid rgba(255,255,255,0.28)',
                    borderRadius: '50px',
                    padding: '8px 16px',
                    fontSize: '0.76rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    fontFamily: "'Poppins', 'Noto Sans Khmer', 'Kdam Thmor Pro', sans-serif"
                  }}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            <div>
              <button
                type="button"
                onClick={() => setIsMeasurementOpen(true)}
                style={{
                  backgroundColor: '#ffffff',
                  color: '#000000',
                  border: 'none',
                  borderRadius: '50px',
                  padding: '9px 20px',
                  fontSize: '0.78rem',
                  fontWeight: '800',
                  cursor: 'pointer',
                  fontFamily: "'Poppins', 'Noto Sans Khmer', 'Kdam Thmor Pro', sans-serif"
                }}
              >
                ណាត់ជាងចុះវាស់វែងដល់ផ្ទះ &gt;
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel: 3-Column Visual Banner of Product Types */}
        <div className="editorial-hero-triptych">
          <div onClick={() => setSelectedCategory('Curtain')} className="triptych-panel">
            <img
              src="https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=900&q=80"
              alt="វាំងនន"
            />
            <div className="triptych-overlay">
              <span className="triptych-title">វាំងនន</span>
            </div>
          </div>

          <div onClick={() => setSelectedCategory('Valance')} className="triptych-panel">
            <img
              src="https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=900&q=80"
              alt="ដក់"
            />
            <div className="triptych-overlay">
              <span className="triptych-title">ដក់</span>
            </div>
          </div>

          <div onClick={() => setSelectedCategory('Bed Sheet')} className="triptych-panel">
            <img
              src="https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=900&q=80"
              alt="កម្រាលពូក និងស្រោមខ្នើយ"
            />
            <div className="triptych-overlay">
              <span className="triptych-title">កម្រាលពូក &amp; ស្រោមខ្នើយ</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Product Type Filter Bar + View All */}
      <section
        style={{
          width: '100%',
          padding: '16px clamp(12px, 3vw, 24px) 10px',
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
            gap: 'clamp(16px, 3vw, 26px)',
            overflowX: 'auto',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
        >
          {categories.map(cat => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setSelectedSubCategory('All');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  borderBottom: isActive ? '2px solid #000000' : '2px solid transparent',
                  padding: '6px 2px',
                  fontSize: '0.85rem',
                  fontWeight: isActive ? '800' : '600',
                  color: isActive ? '#000000' : '#52525b',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                  fontFamily: "'Poppins', 'Noto Sans Khmer', 'Kdam Thmor Pro', sans-serif"
                }}
              >
                {cat.name}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => navigate('/shop')}
          style={{
            background: '#ffffff',
            border: '1px solid #000000',
            borderRadius: '50px',
            padding: '5px 16px',
            fontSize: '0.72rem',
            fontWeight: '800',
            color: '#000000',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            fontFamily: "'Poppins', 'Noto Sans Khmer', 'Kdam Thmor Pro', sans-serif"
          }}
        >
          មើលទាំងអស់ &gt;
        </button>
      </section>

      {/* Sub-Type Bar when Accessories is selected */}
      {selectedCategory === 'Accessories' && (
        <section
          style={{
            width: '100%',
            padding: '10px 24px',
            boxSizing: 'border-box',
            display: 'flex',
            gap: '10px',
            borderBottom: '1px solid #f5f5f5',
            overflowX: 'auto'
          }}
        >
          {accessorySubCategories.map(sub => {
            const isSubActive = selectedSubCategory === sub.id;
            return (
              <button
                key={sub.id}
                type="button"
                onClick={() => setSelectedSubCategory(sub.id)}
                style={{
                  backgroundColor: isSubActive ? '#000000' : '#f4f4f5',
                  color: isSubActive ? '#ffffff' : '#3f3f46',
                  border: 'none',
                  borderRadius: '50px',
                  padding: '5px 14px',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  fontFamily: "'Poppins', 'Noto Sans Khmer', 'Kdam Thmor Pro', sans-serif"
                }}
              >
                {sub.name}
              </button>
            );
          })}
        </section>
      )}

      {/* 3. Full-Width 5-Column Product Grid */}
      <section style={{ width: '100%', padding: '14px clamp(12px, 3vw, 24px) 36px', boxSizing: 'border-box' }}>
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
              textAlign: 'center',
              padding: '80px 20px',
              backgroundColor: '#fafafa',
              color: '#71717a',
              fontSize: '0.92rem'
            }}
          >
            មិនមានផលិតផលក្នុងប្រភេទនេះទេ
          </div>
        )}
      </section>

      <BookMeasurementModal
        isOpen={isMeasurementOpen}
        onClose={() => setIsMeasurementOpen(false)}
      />
    </div>
  );
};

export default Home;
