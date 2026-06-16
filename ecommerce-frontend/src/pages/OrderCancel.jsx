import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const OrderCancel = () => {
  const { t } = useLanguage();
  return (
    <div style={{ padding: '80px 20px', textAlign: 'center' }}>
      <h2 className="serif" style={{ fontSize: '2rem', marginBottom: '20px' }}>{t('order_cancelled')}</h2>
      <p style={{ color: '#666', marginBottom: '30px' }}>{t('order_cancelled_desc')}</p>
      <Link to="/" className="btn-primary" style={{ display: 'inline-block', padding: '12px 30px', textDecoration: 'none' }}>{t('return_to_home')}</Link>
    </div>
  );
};

export default OrderCancel;
