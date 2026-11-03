import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ShoppingBag, Search, Menu, X, Heart } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const Navbar = ({ products, cartCount, favoriteCount, searchQuery, setSearchQuery }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [hoveredProduct, setHoveredProduct] = useState(null);
  const inputRef = useRef(null);
  const capsuleRef = useRef(null);
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const categories = ['All', 'Curtain', 'Valance', 'Fabric', 'Bed Sheet', 'Pillow Case', 'Accessories'];

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
  
  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  // Update suggestions as user types
  useEffect(() => {
    if (searchQuery.length > 0) {
      const filtered = products.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5);
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
    <nav className="nav-header" style={{ position: 'relative', width: '100%' }}>
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
        {/* Left: Menu Hamburger Button */}
        <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          <button 
            type="button"
            onClick={() => setIsMenuOpen(true)}
            style={{ 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer', 
              padding: '6px 0', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px',
              fontFamily: "'Poppins', 'Noto Sans Khmer', 'Kdam Thmor Pro', sans-serif"
            }}
          >
            <Menu size={22} color="#0f172a" />
            <span className="desktop-menu-label" style={{ fontSize: '0.82rem', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase', color: '#0f172a' }}>
              {t('menu')}
            </span>
          </button>
        </div>
        
        {/* Center: Branding (Natural Flex Flow - Zero Overlap!) */}
        <Link 
          to="/" 
          style={{ 
            textDecoration: 'none', 
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
            minWidth: 0,
            padding: '0 8px',
            textAlign: 'center'
          }}
        >
          <div style={{ 
            fontSize: 'clamp(0.85rem, 3.4vw, 1.45rem)', 
            fontWeight: '900', 
            letterSpacing: '-0.4px', 
            color: '#0f172a', 
            lineHeight: 1.15, 
            whiteSpace: 'nowrap', 
            overflow: 'hidden', 
            textOverflow: 'ellipsis',
            maxWidth: '100%'
          }}>
            SREY THA CURTAIN
          </div>
          <span style={{ fontSize: '0.62rem', fontWeight: '700', letterSpacing: '0.5px', color: '#94a3b8', display: 'block', lineHeight: 1, marginTop: '2px' }}>
            ស្រីថា វាំងនន
          </span>
        </Link>
        
        {/* Right: Actions */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'flex-end', flexShrink: 0 }}>
          <button 
            type="button"
            onClick={openSearch} 
            className="nav-action-btn"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              width: '38px', 
              height: '38px', 
              borderRadius: '50%', 
              backgroundColor: '#f8fafc', 
              border: '1px solid #e2e8f0', 
              color: '#0f172a', 
              cursor: 'pointer' 
            }} 
            title="Search"
          >
            <Search size={17} />
          </button>

          <Link 
            to="/favorites" 
            className="nav-action-btn"
            style={{ 
              position: 'relative', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              width: '38px', 
              height: '38px', 
              borderRadius: '50%', 
              backgroundColor: '#f8fafc', 
              border: '1px solid #e2e8f0', 
              color: '#0f172a', 
              textDecoration: 'none' 
            }}
            title="Favorites"
          >
            <Heart size={18} color="#0f172a" />
            {favoriteCount > 0 && (
              <span style={{ 
                position: 'absolute', 
                top: '-3px', 
                right: '-3px', 
                backgroundColor: '#ef4444', 
                color: '#fff', 
                fontSize: '0.62rem', 
                fontWeight: '800', 
                width: '18px', 
                height: '18px', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>
                {favoriteCount}
              </span>
            )}
          </Link>

          <Link 
            to="/cart" 
            className="nav-action-btn"
            style={{ 
              position: 'relative', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              width: '38px', 
              height: '38px', 
              borderRadius: '50%', 
              backgroundColor: '#0f172a', 
              color: '#ffffff', 
              textDecoration: 'none',
              boxShadow: '0 4px 12px rgba(15, 23, 42, 0.2)' 
            }}
            title="Cart"
          >
            <ShoppingBag size={17} color="#ffffff" />
            {cartCount > 0 && (
              <span style={{ 
                position: 'absolute', 
                top: '-3px', 
                right: '-3px', 
                backgroundColor: '#22c55e', 
                color: '#fff', 
                fontSize: '0.62rem', 
                fontWeight: '800', 
                width: '18px', 
                height: '18px', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Drawer Overlay & Menu (Portal directly onto body) */}
      {typeof document !== 'undefined' && createPortal(
        <>
          {/* Backdrop */}
          {isMenuOpen && (
            <div 
              onClick={() => setIsMenuOpen(false)}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                backgroundColor: 'rgba(0, 0, 0, 0.45)',
                zIndex: 99998,
                transition: 'opacity 0.3s ease'
              }}
            />
          )}

          {/* Drawer Menu */}
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: isMenuOpen ? 0 : '-360px',
              width: '320px',
              maxWidth: '85vw',
              height: '100vh',
              overflowY: 'auto',
              backgroundColor: '#ffffff',
              zIndex: 99999,
              transition: 'left 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
              display: 'flex',
              flexDirection: 'column',
              padding: '30px 25px',
              boxShadow: isMenuOpen ? '0 10px 40px rgba(0,0,0,0.2)' : 'none',
              borderRight: '1px solid #e2e8f0',
              fontFamily: "'Poppins', 'Noto Sans Khmer', 'Kdam Thmor Pro', sans-serif"
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
              <span style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a' }}>{t('menu')}</span>
              <button 
                type="button"
                onClick={() => setIsMenuOpen(false)} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
              >
                <X size={22} color="#0f172a" />
              </button>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '30px', borderBottom: '1px solid #f1f5f9', paddingBottom: '22px' }}>
                <Link to="/" onClick={() => setIsMenuOpen(false)} style={{ color: '#0f172a', textDecoration: 'none', fontSize: '0.92rem', fontWeight: '700' }}>{t('home')}</Link>
                <Link to="/my-orders" onClick={() => setIsMenuOpen(false)} style={{ color: '#0f172a', textDecoration: 'none', fontSize: '0.92rem', fontWeight: '700' }}>{t('my_orders')}</Link>
                <Link to="/about" onClick={() => setIsMenuOpen(false)} style={{ color: '#0f172a', textDecoration: 'none', fontSize: '0.92rem', fontWeight: '700' }}>{t('about_us')}</Link>
                <Link to="/favorites" onClick={() => setIsMenuOpen(false)} style={{ color: '#0f172a', textDecoration: 'none', fontSize: '0.92rem', fontWeight: '700' }}>{t('my_favorites')} ({favoriteCount})</Link>
                <Link to="/cart" onClick={() => setIsMenuOpen(false)} style={{ color: '#0f172a', textDecoration: 'none', fontSize: '0.92rem', fontWeight: '700' }}>{t('my_cart')} ({cartCount})</Link>
                <a 
                  href="https://t.me/sreythacurtain" 
                  target="_blank" 
                  rel="noreferrer" 
                  style={{ color: '#0284c7', textDecoration: 'none', fontSize: '0.92rem', fontWeight: '800' }}
                >
                  {t('telegram_support')}
                </a>
              </div>

              <div>
                <h4 style={{ fontSize: '0.75rem', letterSpacing: '1px', textTransform: 'uppercase', color: '#64748b', marginBottom: '16px', fontWeight: '800' }}>{t('categories')}</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {categories.map(cat => (
                    <button 
                      key={cat}
                      type="button"
                      onClick={() => selectCategory(cat)}
                      style={{ 
                        textAlign: 'left', 
                        padding: '11px 12px', 
                        borderRadius: '10px',
                        border: 'none', 
                        background: 'none', 
                        fontSize: '0.92rem', 
                        cursor: 'pointer',
                        fontWeight: '700',
                        color: '#334155',
                        transition: 'background 0.2s ease',
                        fontFamily: "'Poppins', 'Noto Sans Khmer', 'Kdam Thmor Pro', sans-serif"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f1f5f9';
                        e.currentTarget.style.color = '#0f172a';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = '#334155';
                      }}
                    >
                      {t(cat.toLowerCase().replace(' ', '_'))}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>,
        document.body
      )}

      {/* Floating Slim Search Capsule */}
      <div 
        ref={capsuleRef}
        className={`search-takeover-capsule ${isExpanded ? 'active' : ''}`}
        style={{ 
          flexDirection: 'column', 
          height: suggestions.length > 0 ? 'auto' : '46px',
          padding: '0',
          top: isExpanded ? '12px' : '0', 
          left: '50%',
          transform: 'translateX(-50%)',
          borderRadius: '14px',
          zIndex: 6000
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', width: '100%', height: '46px', padding: '0 15px' }}>
          <Search size={16} color="#666" style={{ flexShrink: 0 }} />
          <input 
            ref={inputRef}
            type="text" 
            placeholder={t('search_placeholder')}
            className="search-input-pill" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchSubmit}
            style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', marginLeft: '10px', fontFamily: "'Poppins', 'Noto Sans Khmer', 'Kdam Thmor Pro', sans-serif" }}
          />
          <X 
            size={16} 
            color="#666" 
            style={{ cursor: 'pointer', flexShrink: 0 }} 
            onClick={closeSearch}
          />
        </div>

        {/* Live Search Suggestions Dropdown */}
        {suggestions.length > 0 && (
          <div style={{ width: '100%', borderTop: '1px solid #f0f0f0', display: 'flex', maxHeight: '350px' }}>
            <div style={{ flex: 1, padding: '10px 0', overflowY: 'auto' }}>
              {suggestions.map((p) => (
                <div 
                  key={p._id}
                  onClick={() => selectSuggestion(p)}
                  onMouseEnter={() => setHoveredProduct(p)}
                  className="suggestion-item"
                  style={{
                    padding: '8px 16px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                    backgroundColor: hoveredProduct?._id === p._id ? '#f9f9f9' : 'transparent'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                    <img
                      src={p.imageUrl || (p.images && p.images.length > 0 ? p.images[0].url : '')}
                      alt=""
                      style={{ width: '36px', height: '42px', objectFit: 'cover', borderRadius: '6px', flexShrink: 0, backgroundColor: '#f1f5f9' }}
                    />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#000', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {language === 'kh' && p.nameKh ? p.nameKh : p.name}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#999', textTransform: 'uppercase' }}>
                        {t(p.category.toLowerCase().replace(' ', '_'))}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#000', flexShrink: 0 }}>
                    ${p.price}
                  </div>
                </div>
              ))}
            </div>

            {/* Hover Image Preview (Desktop Only) */}
            {hoveredProduct && (
              <div className="desktop-quick-links" style={{ width: '120px', padding: '10px', borderLeft: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fafafa' }}>
                <img 
                  src={hoveredProduct.imageUrl || (hoveredProduct.images && hoveredProduct.images.length > 0 ? hoveredProduct.images[0].url : '')} 
                  alt="" 
                  style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '8px' }}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
