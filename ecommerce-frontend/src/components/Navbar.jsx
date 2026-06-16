import React, { useState, useEffect, useRef } from 'react';
import { ShoppingBag, Search, Command, Menu, X, ArrowRight, Heart } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const Navbar = ({ products, cartCount, favoriteCount, searchQuery, setSearchQuery }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [hoveredProduct, setHoveredProduct] = useState(null);
  const inputRef = useRef(null);
  const capsuleRef = useRef(null);
  const { t, language, toggleLanguage } = useLanguage();
  const navigate = useNavigate();

  const categories = ['All', 'New Arrival', 'Curtain', 'Valance', 'Fabric', 'Bed Sheet', 'Pillow Case', 'Accessories'];

  const selectCategory = (category) => {
    setIsMenuOpen(false);
    navigate(`/shop?category=${encodeURIComponent(category)}`);
  };

  // Detect Click Outside to Close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (capsuleRef.current && !capsuleRef.current.contains(event.target)) {
        closeSearch();
      }
    };
    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isExpanded]);

  // Update suggestions as user types
  useEffect(() => {
    if (searchQuery.length > 0) {
      const filtered = products.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5); // Show top 5 matches
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
      setHoveredProduct(null);
    }
  }, [searchQuery, products]);

  const openSearch = () => {
    setIsExpanded(true);
    setTimeout(() => inputRef.current?.focus(), 300);
  };

  const closeSearch = () => {
    setIsExpanded(false);
    setSearchQuery('');
    setSuggestions([]);
    setHoveredProduct(null);
  };

  const handleSearchSubmit = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      setIsExpanded(false);
      navigate(`/search?q=${searchQuery}`);
    }
    if (e.key === 'Escape') closeSearch();
  };

  const selectSuggestion = (product) => {
    setIsExpanded(false);
    setSearchQuery('');
    setSuggestions([]);
    setHoveredProduct(null);
    navigate(`/product/${product._id}`);
  };

  return (
    <nav className="nav-header" style={{ position: 'relative' }}>
      {/* Normal View */}
      <div style={{ 
        display: 'flex', 
        width: '100%', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        opacity: isExpanded ? 0 : 1,
        visibility: isExpanded ? 'hidden' : 'visible',
        transition: 'opacity 0.3s ease'
      }}>
        <div style={{ display: 'flex', gap: '25px', alignItems: 'center' }}>
          <button 
            onClick={() => setIsMenuOpen(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0', display: 'flex', alignItems: 'center', gap: '10px' }}
          >
            <Menu size={24} color="#000" />
            <span style={{ fontSize: '0.7rem', fontWeight: '800', letterSpacing: '2px', textTransform: 'uppercase', color: '#000' }}>{t('menu')}</span>
          </button>
        </div>
        
        <Link to="/" style={{ textDecoration: 'none', position: 'absolute', left: '50%', transform: 'translateX(-50%)', width: 'max-content', textAlign: 'center' }}>
          <div className="logo serif">
            SREY THA CURTAIN
          </div>
        </Link>
        
        <div className="nav-links" style={{ justifyContent: 'flex-end', alignItems: 'center' }}>
          <div 
            className="nav-lang-toggle"
            onClick={toggleLanguage}
            style={{ 
              fontSize: '0.75rem', 
              fontWeight: '800', 
              cursor: 'pointer', 
              padding: '4px 8px', 
              border: '1px solid #000', 
              borderRadius: '4px',
              marginRight: '20px'
            }}
          >
            {language === 'en' ? 'KH' : 'EN'}
          </div>
          <Search size={20} onClick={openSearch} style={{ cursor: 'pointer', color: '#000' }} />
          <Link to="/favorites" className="nav-favorites-link nav-link-item">
            <Heart size={20} />
            <span>({favoriteCount})</span>
          </Link>
          <Link to="/cart" className="nav-link-item">
            <ShoppingBag size={20} />
            <span>({cartCount})</span>
          </Link>
        </div>
      </div>

      {/* Drawer Overlay Backdrop */}
      {isMenuOpen && (
        <div 
          onClick={() => setIsMenuOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.2)',
            backdropFilter: 'blur(2px)',
            zIndex: 4000
          }}
        />
      )}

      {/* Hamburger Menu Overlay / Drawer */}
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: isMenuOpen ? 0 : '-350px',
          width: '320px',
          height: '100vh',
          backgroundColor: '#fff',
          zIndex: 5000,
          transition: 'all 0.5s cubic-bezier(0.165, 0.84, 0.44, 1)',
          display: 'flex',
          flexDirection: 'column',
          padding: '40px',
          boxShadow: isMenuOpen ? '0 0 50px rgba(0,0,0,0.1)' : 'none',
          borderRight: '1px solid #f0f0f0'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '40px' }}>
          <X 
            size={24} 
            onClick={() => setIsMenuOpen(false)} 
            style={{ cursor: 'pointer', color: '#000' }} 
          />
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '40px', borderBottom: '1px solid #f0f0f0', paddingBottom: '30px' }}>
            <Link to="/" onClick={() => setIsMenuOpen(false)} style={{ color: '#000', textDecoration: 'none', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('home')}</Link>
            <Link to="/my-orders" onClick={() => setIsMenuOpen(false)} style={{ color: '#000', textDecoration: 'none', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('my_orders')}</Link>
            <Link to="/about" onClick={() => setIsMenuOpen(false)} style={{ color: '#000', textDecoration: 'none', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('about_us')}</Link>
            <Link to="/favorites" onClick={() => setIsMenuOpen(false)} style={{ color: '#000', textDecoration: 'none', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('my_favorites')} ({favoriteCount})</Link>
            <Link to="/cart" onClick={() => setIsMenuOpen(false)} style={{ color: '#000', textDecoration: 'none', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('my_cart')} ({cartCount})</Link>
            <a 
              href="https://t.me/sreythacurtain" 
              target="_blank" 
              rel="noreferrer" 
              style={{ color: '#0088cc', textDecoration: 'none', fontSize: '0.8rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}
            >
              {t('telegram_support')}
            </a>
            <div 
              onClick={() => {
                toggleLanguage();
                setIsMenuOpen(false);
              }}
              style={{ 
                color: '#000', 
                cursor: 'pointer', 
                fontSize: '0.75rem', 
                fontWeight: '800', 
                textTransform: 'uppercase', 
                letterSpacing: '1px',
                border: '1px solid #000',
                padding: '10px 15px',
                borderRadius: '8px',
                textAlign: 'center',
                marginTop: '15px'
              }}
            >
              {language === 'en' ? 'ភាសាខ្មែរ (KH)' : 'ENGLISH (EN)'}
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: '0.65rem', letterSpacing: '2px', textTransform: 'uppercase', color: '#999', marginBottom: '25px' }}>{t('categories')}</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {categories.map(cat => (
                <button 
                  key={cat}
                  onClick={() => selectCategory(cat)}
                  className="category-btn"
                  style={{ 
                    textAlign: 'left', 
                    padding: '15px 0', 
                    border: 'none', 
                    background: 'none', 
                    fontSize: '1rem', 
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    color: '#444'
                  }}
                >
                  {t(cat)}
                  <ArrowRight size={14} className="arrow-icon" style={{ opacity: 0, transition: 'all 0.3s ease' }} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Slim Snap-Pill Search Header */}
      <div 
        ref={capsuleRef}
        className={`search-takeover-capsule ${isExpanded ? 'active' : ''}`}
        style={{ 
          flexDirection: 'column', 
          height: suggestions.length > 0 ? 'auto' : '45px',
          padding: '0',
          top: isExpanded ? '40px' : '0', 
          left: '50%',
          transform: 'translateX(-50%)',
          borderRadius: suggestions.length > 0 ? '24px' : '50px',
          width: isExpanded ? '95%' : '0',
          maxWidth: '800px',
          overflow: suggestions.length > 0 ? 'visible' : 'hidden',
          transition: 'all 0.5s cubic-bezier(0.165, 0.84, 0.44, 1)'
        }}
      >
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          width: '100%', 
          height: '45px',
          padding: '0 20px'
        }}>
          <Search size={18} style={{ color: '#666', flexShrink: 0 }} />
          <input 
            ref={inputRef}
            type="text" 
            placeholder={t('search_placeholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchSubmit}
            className="search-input-pill"
            style={{ fontSize: '0.95rem', color: '#000', margin: '0 15px' }}
          />

        </div>

        {/* Suggestion List (Hangs from the Pill) */}
        {suggestions.length > 0 && (
          <div style={{ 
            width: '100%', 
            backgroundColor: '#fff',
            borderBottomLeftRadius: '24px',
            borderBottomRightRadius: '24px',
            borderTop: '1px solid #f0f0f0',
            paddingBottom: '10px'
          }}>
            {suggestions.map(p => (
              <div 
                key={p._id}
                onMouseEnter={() => setHoveredProduct(p)}
                onMouseLeave={() => setHoveredProduct(null)}
                onClick={() => selectSuggestion(p)}
                style={{ 
                  padding: '12px 20px', 
                  cursor: 'pointer', 
                  display: 'flex', 
                  alignItems: 'center',
                  gap: '15px',
                  backgroundColor: hoveredProduct?._id === p._id ? '#f9f9f9' : 'transparent',
                  transition: 'background 0.2s ease'
                }}
              >
                <img src={p.imageUrl} alt="" style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.85rem', color: '#333', fontWeight: '600' }}>{p.name}</div>
                  <div style={{ fontSize: '0.6rem', color: '#999', textTransform: 'uppercase', letterSpacing: '1px' }}>{p.category}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SIDE-CAR PREVIEW (Docked to the Pill) */}
      {hoveredProduct && (
        <div style={{
          position: 'fixed',
          top: '100px',
          left: 'calc(50% + 420px)', /* Adjusted for wider 800px pill */
          width: '300px',
          backgroundColor: '#fff',
          borderRadius: '30px',
          padding: '30px',
          zIndex: 2000,
          boxShadow: '0 40px 100px rgba(0,0,0,0.1)',
          animation: 'fadeUp 0.4s ease-out',
          border: '1px solid #f0f0f0',
          pointerEvents: 'none'
        }}>
          <img 
            src={hoveredProduct.imageUrl} 
            alt="Preview" 
            style={{ width: '100%', height: '300px', objectFit: 'cover', borderRadius: '20px', marginBottom: '20px' }} 
          />
          <h3 className="serif" style={{ fontSize: '1.4rem', marginBottom: '10px' }}>{hoveredProduct.name}</h3>
          <p style={{ fontSize: '0.75rem', color: '#999', lineHeight: '1.6' }}>
            {hoveredProduct.description || "High quality products."}
          </p>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
