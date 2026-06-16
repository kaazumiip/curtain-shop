import React from 'react';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const About = () => {
  const { t } = useLanguage();

  return (
    <div className="about-container">
      <h1 className="serif" style={{ fontSize: '3.5rem', marginBottom: '80px', textAlign: 'center' }}>{t('contact_location')}</h1>
      
      <div style={{ 
        width: '100%', 
        maxWidth: '500px' 
      }} className="mobile-stack">

        {/* Phone Card */}
        <div style={{ 
          padding: '60px 40px', 
          backgroundColor: '#000', 
          borderRadius: '40px', 
          textAlign: 'center',
          color: '#fff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '25px'
        }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Phone size={28} color="#fff" />
          </div>
          <div>
            <h4 style={{ fontSize: '0.8rem', fontWeight: '800', letterSpacing: '2px', marginBottom: '15px', color: 'rgba(255,255,255,0.5)' }}>{t('phone')}</h4>
            <div style={{ display: 'grid', gap: '20px' }}>
              <div>
                <p style={{ fontSize: '1.6rem', fontWeight: '700', letterSpacing: '1px', margin: '0' }}>089 902 001</p>
                <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>{t('cellcard')}</span>
              </div>
              <div style={{ width: '40px', height: '1px', backgroundColor: 'rgba(255,255,255,0.1)', margin: '0 auto' }}></div>
              <div>
                <p style={{ fontSize: '1.6rem', fontWeight: '700', letterSpacing: '1px', margin: '0' }}>096 812 7590</p>
                <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>{t('smart')}</span>
              </div>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)', marginTop: '20px' }}>{t('available_hours')}</p>
          </div>
        </div>

      </div>

      {/* Embedded Map Section */}
      <div className="map-container" style={{ width: '100%', maxWidth: '900px' }}>
        <iframe 
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3909.5256561118!2d104.94122797584674!3d11.49263978870198!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x310959304b1a3e33%3A0x2b32b9aea69c134!2zQ3VydGFpbiwg4Z6W4Z-W4Z6T4Z6T!5e0!3m2!1sen!2skh!4v1715500000000!5m2!1sen!2skh" 
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
  );
};

export default About;
