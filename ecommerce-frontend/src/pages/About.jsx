import React, { useState } from 'react';
import { MapPin, Phone, Clock, ExternalLink } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const About = () => {
  const { t, language } = useLanguage();
  const [activeLocation, setActiveLocation] = useState(1);

  const locations = {
    1: {
      coords: '11.4841993,104.9452056',
      url: 'https://maps.app.goo.gl/3WhDDjSb6DBcasCB9'
    },
    2: {
      coords: '11.4926089,104.9433344',
      url: 'https://maps.app.goo.gl/KfHgvVg7VVJd7MdE9'
    }
  };
  const addressText = language === 'km' 
    ? 'ផ្លូវលេខ ២០៤, រាជធានីភ្នំពេញ, ខេត្តកណ្តាល' 
    : 'Street 204, Phnom Penh, Kandal Province';
  const mapsSearchUrl = 'https://maps.app.goo.gl/3WhDDjSb6DBcasCB9';

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

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[1, 2].map((locNum) => {
                const isSelected = activeLocation === locNum;
                const loc = locations[locNum];
                return (
                  <button
                    key={locNum}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        window.open(loc.url, '_blank', 'noopener,noreferrer');
                      } else {
                        setActiveLocation(locNum);
                      }
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '12px 20px',
                      borderRadius: '14px',
                      backgroundColor: isSelected ? '#111' : '#f1f5f9',
                      color: isSelected ? '#fff' : '#0f172a',
                      border: isSelected ? '1px solid #111' : '1px solid #cbd5e1',
                      fontWeight: '600',
                      fontSize: '0.9rem',
                      transition: 'all 0.2s ease',
                      width: '100%',
                      boxSizing: 'border-box',
                      cursor: 'pointer'
                    }}
                  >
                    <ExternalLink size={16} />
                    <span>
                      {language === 'km' ? `ទីតាំងទី ${locNum} — ` : `Location ${locNum} — `}
                      {isSelected
                        ? (language === 'km' ? 'ចុចម្តងទៀតដើម្បីបើក Google Maps' : 'Click again to open Google Maps')
                        : (language === 'km' ? 'ចុចដើម្បីមើលលើផែនទី' : 'Click to preview on map')}
                    </span>
                  </button>
                );
              })}
            </div>
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
                <a
                  href="https://www.facebook.com/profile.php?id=100057516936336"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    marginTop: '6px',
                    padding: '10px 18px',
                    borderRadius: '50px',
                    backgroundColor: '#1877f2',
                    color: '#ffffff',
                    fontSize: '0.85rem',
                    fontWeight: '700',
                    textDecoration: 'none',
                    boxShadow: '0 4px 12px rgba(24,119,242,0.3)'
                  }}
                >
                  <span>Facebook Page</span>
                  <ExternalLink size={14} />
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

        {/* Right Column: Embedded Responsive Map + Facebook Page Preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="map-container">
            <iframe 
              key={activeLocation}
              src={`https://maps.google.com/maps?q=${locations[activeLocation].coords}&t=&z=18&ie=UTF8&iwloc=&output=embed`}
              width="100%" 
              height="100%" 
              style={{ border: 0 }} 
              allowFullScreen="" 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
              title={t('map_title')}
            ></iframe>
          </div>

          {/* Dedicated Clickable Facebook Page Preview Card under Map */}
          <a
            href="https://www.facebook.com/profile.php?id=100057516936336"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px',
              padding: '22px 26px',
              borderRadius: '22px',
              background: 'linear-gradient(135deg, #1877f2 0%, #0d5bd9 100%)',
              color: '#ffffff',
              textDecoration: 'none',
              boxShadow: '0 10px 30px rgba(24, 119, 242, 0.25)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 14px 36px rgba(24, 119, 242, 0.35)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(24, 119, 242, 0.25)';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '50px',
                height: '50px',
                borderRadius: '14px',
                backgroundColor: 'rgba(255,255,255,0.18)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.6rem',
                fontWeight: '900',
                flexShrink: 0
              }}>
                f
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: '700', letterSpacing: '1.2px', textTransform: 'uppercase', opacity: 0.85 }}>
                  {language === 'km' ? 'ទំព័រហ្វេសប៊ុកផ្លូវការ' : 'Official Facebook Page'}
                </span>
                <h3 style={{ margin: '2px 0 4px', fontSize: '1.15rem', fontWeight: '800', color: '#ffffff' }}>
                  Srey Tha Curtain — ស្រីថា វាំងនន
                </h3>
                <p style={{ margin: 0, fontSize: '0.82rem', opacity: 0.9 }}>
                  {language === 'km' ? 'មើលម៉ូដវាំងននថ្មីៗ និងការងារដំឡើងពិតៗរបស់យើងខ្ញុំ' : 'See our latest curtain designs & real installations'}
                </p>
              </div>
            </div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              borderRadius: '50px',
              backgroundColor: '#ffffff',
              color: '#1877f2',
              fontWeight: '800',
              fontSize: '0.88rem'
            }}>
              <span>{language === 'km' ? 'ចូលមើល Facebook' : 'Visit Facebook'}</span>
              <ExternalLink size={16} />
            </div>
          </a>
        </div>
      </div>
    </div>
  );
};

export default About;
