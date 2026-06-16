import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const OrderFinish = () => {
  const { t } = useLanguage();
  return (
    <div style={{ padding: '100px 20px', textAlign: 'center' }}>
      <h2 className="serif" style={{ fontSize: '2rem' }}>{t('order_completed')}</h2>
      <p style={{ marginTop: '20px', fontSize: '1rem' }}>{t('order_completed_desc')}</p>
      <Link to="/" style={{ display: 'inline-block', marginTop: '30px', padding: '15px 40px', backgroundColor: '#000', color: '#fff', textDecoration: 'none', borderRadius: '8px' }}>
        {t('continue_shopping')}
      </Link>
    </div>
  );
};

export default OrderFinish;
