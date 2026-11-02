import React from 'react';
import { MapPin, Phone, Clock, ExternalLink } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const About = () => {
  const { t, language } = useLanguage();
  const addressText = language === 'km' 
    ? 'ផ្លូវលេខ ២០៤, រាជធានីភ្នំពេញ, ខេត្តកណ្តាល' 
    : 'Street 204, Phnom Penh, Kandal Province';
  const mapsSearchUrl = 'https://www.google.com/maps/search/?api=1&query=Street+204,+Phnom+Penh';

  return (
    <div className="about-container">
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 className="serif" style={{ fontSize: '2.8rem', margin: '0 0 10px', fontWeight: '800' }}>
          {t('contact_location')}
        </h1>
        <p style={{ color: '#666', fontSize: '1rem', margin: 0 }}>
          {language === 'km' ? 'សូមស្វាគមន៍មកកាន់ហាង ស្រីថា វាំងនន' : 'Welcome to Srey Tha Curtain Shop'}
        </p>
      </div>
      
      <div className="about-grid">
        {/* Left Column: Contact & Address Cards */}
        <div className="contact-info-column">
          {/* Location & Address Card */}
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '28px',
            padding: '32px',
            border: '1px solid #eee',
            boxShadow: '0 10px 30px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '16px',
                backgroundColor: '#f5f5f7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#000'
              }}>
                <MapPin size={24} />
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: '800', letterSpacing: '1.5px', textTransform: 'uppercase', color: '#888' }}>
                  {t('address')}
                </span>
                <h3 style={{ margin: '2px 0 0', fontSize: '1.25rem', fontWeight: '700', color: '#111' }}>
                  {language === 'km' ? 'ទីតាំងហាងយើងខ្ញុំ' : 'Our Store Location'}
                </h3>
              </div>
            </div>

            <p style={{ fontSize: '1.05rem', lineHeight: '1.6', color: '#333', margin: '6px 0 12px' }}>
              {addressText}
            </p>

            <a
              href={mapsSearchUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px 20px',
                borderRadius: '14px',
                backgroundColor: '#111',
                color: '#fff',
                textDecoration: 'none',
                fontWeight: '600',
                fontSize: '0.9rem',
                transition: 'all 0.2s ease',
                width: '100%',
                boxSizing: 'border-box'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#333'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#111'}
            >
              <ExternalLink size={16} />
              <span>{t('open_in_maps')}</span>
            </a>
          </div>

          {/* Phone & Availability Card */}
          <div style={{ 
            padding: '36px 32px', 
            backgroundColor: '#000', 
            borderRadius: '28px', 
            textAlign: 'center',
            color: '#fff',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '20px',
            boxShadow: '0 16px 40px rgba(0,0,0,0.1)'
          }}>
            <div style={{ 
              width: '52px', 
              height: '52px', 
              borderRadius: '50%', 
              backgroundColor: 'rgba(255,255,255,0.12)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <Phone size={24} color="#fff" />
            </div>

            <div style={{ width: '100%' }}>
              <h4 style={{ fontSize: '0.75rem', fontWeight: '800', letterSpacing: '2px', marginBottom: '16px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>
                {t('phone')}
              </h4>
              <div style={{ display: 'grid', gap: '14px' }}>
                <a 
                  href="tel:089902001" 
                  style={{ textDecoration: 'none', color: '#fff', display: 'block' }}
                >
                  <p style={{ fontSize: '1.5rem', fontWeight: '700', letterSpacing: '1px', margin: '0' }}>089 902 001</p>
                  <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase' }}>{t('cellcard')}</span>
                </a>
                <div style={{ width: '40px', height: '1px', backgroundColor: 'rgba(255,255,255,0.12)', margin: '0 auto' }}></div>
                <a 
                  href="tel:0968127590" 
                  style={{ textDecoration: 'none', color: '#fff', display: 'block' }}
                >
                  <p style={{ fontSize: '1.5rem', fontWeight: '700', letterSpacing: '1px', margin: '0' }}>096 812 7590</p>
                  <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase' }}>{t('smart')}</span>
                </a>
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              paddingTop: '10px',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              width: '100%',
              justifyContent: 'center',
              color: 'rgba(255,255,255,0.6)',
              fontSize: '0.85rem'
            }}>
              <Clock size={15} />
              <span>{t('available_hours')}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Embedded Responsive Map */}
        <div className="map-container">
          <iframe 
            src="https://maps.google.com/maps?q=Street+204,+Phnom+Penh&t=&z=16&ie=UTF8&iwloc=&output=embed"
            width="100%" 
            height="100%" 
            style={{ border: 0 }} 
            allowFullScreen="" 
            loading="lazy" 
            referrerPolicy="no-referrer-when-downgrade"
            title={t('map_title')}
          ></iframe>
        </div>
      </div>
    </div>
  );
};

export default About;
