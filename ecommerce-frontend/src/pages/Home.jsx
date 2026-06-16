import React from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { useLanguage } from '../context/LanguageContext';

const Home = ({ products, onAddToCart, favorites, onToggleFavorite }) => {
  const { t } = useLanguage();
  // Show only first 4 products as "Featured"
  const featured = products.slice(0, 4);

  return (
    <div>
      <section className="hero-section">
        <div className="hero-overlay" style={{ position: 'relative', zIndex: 2 }}>
          <span style={{ fontSize: '0.7rem', letterSpacing: '4px', textTransform: 'uppercase', color: '#999' }}>{t('new_collection')}</span>
          <h2 className="serif" style={{ fontSize: '3rem', margin: '15px 0' }}>{t('art_of_living')}</h2>
          <p style={{ color: '#666', maxWidth: '400px', margin: '0 auto 30px', fontSize: '0.9rem', lineHeight: '1.6' }}>
            {t('hero_desc')}
          </p>
          <Link to="/shop" className="btn-primary" style={{ display: 'inline-block', width: 'auto', padding: '15px 40px', textDecoration: 'none' }}>
            {t('explore_full')}
          </Link>
        </div>
      </section>

      <div style={{ padding: '80px 0', textAlign: 'center' }}>
        <h3 className="serif" style={{ fontSize: '1.5rem', marginBottom: '15px' }}>{t('featured_selection')}</h3>
        <div style={{ width: '40px', height: '1px', backgroundColor: 'black', margin: '0 auto' }}></div>
      </div>

      <div className="product-grid">
        {featured.map(product => (
          <ProductCard 
            key={product._id} 
            product={product} 
            onAddToCart={onAddToCart} 
            isFavorite={favorites.some(f => f._id === product._id)}
            onToggleFavorite={onToggleFavorite}
          />
        ))}
      </div>

      <div style={{ textAlign: 'center', padding: '60px 0' }}>
        <Link to="/shop" style={{ color: '#000', fontSize: '0.8rem', fontWeight: '800', letterSpacing: '2px', textDecoration: 'none', borderBottom: '1px solid #000', paddingBottom: '5px' }}>
          {t('view_all')}
        </Link>
      </div>

      {/* Simplified Contact Section */}
      <section className="contact-section">
        <span style={{ fontSize: '0.65rem', letterSpacing: '3px', textTransform: 'uppercase', color: '#999', display: 'block', marginBottom: '40px' }}>{t('contact_us') || 'Contact Us'}</span>
        
        <div style={{ 
          maxWidth: '500px', 
          margin: '0 auto' 
        }}>
          <div style={{ padding: '40px', backgroundColor: '#fff', border: '1px solid #f0f0f0', borderRadius: '24px', textAlign: 'center' }}>
             <h4 style={{ fontSize: '0.75rem', fontWeight: '800', letterSpacing: '1px', marginBottom: '15px', textTransform: 'uppercase' }}>{t('direct_support')}</h4>
             <div style={{ display: 'grid', gap: '15px' }}>
               <div>
                 <p style={{ fontSize: '1.2rem', fontWeight: '700', margin: '0' }}>089 902 001</p>
                 <span style={{ fontSize: '0.65rem', color: '#999', textTransform: 'uppercase', letterSpacing: '1px' }}>Cellcard</span>
               </div>
               <div style={{ width: '30px', height: '1px', backgroundColor: '#eee', margin: '0 auto' }}></div>
               <div>
                 <p style={{ fontSize: '1.2rem', fontWeight: '700', margin: '0' }}>096 812 7590</p>
                 <span style={{ fontSize: '0.65rem', color: '#999', textTransform: 'uppercase', letterSpacing: '1px' }}>Smart</span>
               </div>
             </div>
             <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '20px' }}>{t('support_hours')}</p>
          </div>
        </div>

        {/* Embedded Map */}
        <div className="map-container">
          <iframe 
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3909.5256561118!2d104.94122797584674!3d11.49263978870198!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x310959304b1a3e33%3A0x2b32b9aea69c134!2zQ3VydGFpbiwg4Z6W4Z-W4Z6T4Z6T!5e0!3m2!1sen!2skh!4v1715500000000!5m2!1sen!2skh" 
            width="100%" 
            height="100%" 
            style={{ border: 0 }} 
            allowFullScreen="" 
            loading="lazy" 
            referrerPolicy="no-referrer-when-downgrade"
            title="Sreytha Curtain Location"
          ></iframe>
        </div>
      </section>
    </div>
  );
};

export default Home;
