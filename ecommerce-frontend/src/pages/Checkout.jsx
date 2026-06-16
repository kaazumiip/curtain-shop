import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, CheckCircle } from 'lucide-react';
import axios from '../api/axios';
import { useLanguage } from '../context/LanguageContext';

const Checkout = ({ cart, onOrderPlaced }) => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [isSuccess, setIsSuccess] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);
  const subtotal = cart.reduce((acc, item) => acc + Number(item.totalPrice || item.price), 0).toFixed(2);

  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    postcode: '',
    phone: '',
    paymentMethod: 'ABA Bank',
    cardNumber: '',
    cardExpiry: '',
    cardCvv: '',
    cardName: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const { paymentMethod, cardNumber, cardExpiry, cardCvv, cardName, ...customerData } = formData;
    const orderData = {
      customer: customerData,
      paymentMethod: paymentMethod,
      cardDetails: paymentMethod === 'Credit Card' ? { cardNumber: '**** **** **** ' + cardNumber.slice(-4), cardName } : null,
      items: cart,
      subtotal: subtotal,
      status: 'Preparing'
    };
    
    try {
      const res = await axios.post('/orders', orderData);
      
      // Save order to history
      const orderHistory = JSON.parse(localStorage.getItem('srey_tha_orders') || '[]');
      const newOrder = {
        id: res.data._id,
        date: new Date().toISOString(),
        total: res.data.subtotal
      };
      localStorage.setItem('srey_tha_orders', JSON.stringify([newOrder, ...orderHistory]));
      
      setOrderDetails(res.data);
      setIsSuccess(true);
      onOrderPlaced(); // Clear cart immediately
    } catch (err) {
      console.error('Failed to place order:', err);
      alert(t('order_failed_alert'));
    }
  };

  if (isSuccess) {
    return (
      <div style={{ padding: '150px 0', textAlign: 'center' }}>
        <CheckCircle size={80} color="#000" style={{ marginBottom: '30px' }} />
        <h2 className="serif" style={{ fontSize: '2.5rem', marginBottom: '20px' }}>{t('order_placed')}</h2>
        <p style={{ color: '#666', maxWidth: '400px', margin: '0 auto', lineHeight: '1.8' }}>
          {t('order_placed_desc')}
        </p>
        <div style={{ marginTop: '40px', padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '15px', display: 'inline-block' }}>
          <p style={{ fontSize: '0.7rem', color: '#999', marginBottom: '5px' }}>{t('transaction_id').toUpperCase()}</p>
          <p style={{ fontWeight: '800', fontSize: '1.2rem', letterSpacing: '1px' }}>{orderDetails?._id}</p>
        </div>
        <div style={{ marginTop: '30px' }}>
          <button 
            onClick={() => navigate('/')}
            style={{ padding: '15px 40px', borderRadius: '30px', border: '1px solid #000', backgroundColor: '#fff', cursor: 'pointer', fontWeight: '700' }}
          >
            {t('return_to_shop').toUpperCase()}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px 0' }}>
      <h1 className="serif" style={{ fontSize: '2.5rem', marginBottom: '60px' }}>{t('shipping_details')}</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '80px' }} className="mobile-stack">
        {/* Shipping Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '40px' }}>
            <h3 style={{ fontSize: '0.8rem', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '20px' }}>{t('contact_info')}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <input 
                required type="email" placeholder={t('email_address')} 
                style={inputStyle} value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
              <input 
                required type="tel" placeholder={t('phone_number')} 
                style={inputStyle} value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
            </div>
          </div>

          <div style={{ marginBottom: '40px' }}>
            <h3 style={{ fontSize: '0.8rem', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '20px' }}>{t('shipping_addr')}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              <input required placeholder={t('first_name')} style={inputStyle} value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})}/>
              <input required placeholder={t('last_name')} style={inputStyle} value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})}/>
            </div>
            <input required placeholder={t('street_address')} style={{ ...inputStyle, marginBottom: '15px' }} value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})}/>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <input required placeholder={t('city')} style={inputStyle} value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})}/>
              <input required placeholder={t('postcode')} style={inputStyle} value={formData.postcode} onChange={(e) => setFormData({...formData, postcode: e.target.value})}/>
            </div>
          </div>

          <div style={{ marginBottom: '40px' }}>
            <h3 style={{ fontSize: '0.8rem', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '20px' }}>{t('payment_method')}</h3>
            <div style={{ display: 'grid', gap: '15px', marginBottom: '30px' }}>
              {['ABA Bank', 'Wing Bank', 'Credit Card'].map((method) => (
                <label 
                  key={method} 
                  style={{ 
                    ...inputStyle, 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '15px', 
                    cursor: 'pointer',
                    border: formData.paymentMethod === method ? '2px solid black' : '1px solid #eeeeee' 
                  }}
                >
                  <input 
                    type="radio" 
                    name="paymentMethod" 
                    value={method} 
                    checked={formData.paymentMethod === method}
                    onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                    style={{ accentColor: 'black', width: '18px', height: '18px' }}
                  />
                  <span style={{ fontWeight: formData.paymentMethod === method ? '700' : '400' }}>
                    {method}
                  </span>
                </label>
              ))}
            </div>

            {formData.paymentMethod === 'Credit Card' && (
              <div className="page-transition" style={{ padding: '30px', backgroundColor: '#fdfdfd', border: '1px solid #f0f0f0', borderRadius: '20px' }}>
                <h3 style={{ fontSize: '0.8rem', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '20px' }}>{t('card_details')}</h3>
                <input 
                  required placeholder={t('cardholder_name')} 
                  style={{ ...inputStyle, marginBottom: '15px', backgroundColor: '#fff' }} 
                  value={formData.cardName} onChange={(e) => setFormData({...formData, cardName: e.target.value})}
                />
                <input 
                  required placeholder={t('card_number')} 
                  style={{ ...inputStyle, marginBottom: '15px', backgroundColor: '#fff' }} 
                  value={formData.cardNumber} 
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').substring(0, 16);
                    const formatted = value.match(/.{1,4}/g)?.join(' ') || value;
                    setFormData({...formData, cardNumber: formatted});
                  }}
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <input 
                    required placeholder="MM / YY" 
                    style={{ ...inputStyle, backgroundColor: '#fff' }} 
                    value={formData.cardExpiry} 
                    onChange={(e) => {
                      let value = e.target.value.replace(/\D/g, '').substring(0, 4);
                      if (value.length > 2) value = value.substring(0, 2) + ' / ' + value.substring(2);
                      setFormData({...formData, cardExpiry: value});
                    }}
                  />
                  <input 
                    required placeholder="CVV" 
                    maxLength={3}
                    style={{ ...inputStyle, backgroundColor: '#fff' }} 
                    value={formData.cardCvv} 
                    onChange={(e) => setFormData({...formData, cardCvv: e.target.value.replace(/\D/g, '')})}
                  />
                </div>
              </div>
            )}
          </div>

          <button type="submit" className="btn-primary" style={{ padding: '20px' }}>
            {t('complete_order')} — £{subtotal}
          </button>
        </form>

        {/* Sidebar Mini Cart */}
        <div>
          <div style={{ border: '1px solid #f0f0f0', padding: '30px', borderRadius: '24px' }}>
            <h4 className="serif" style={{ marginBottom: '20px' }}>{t('your_cart')} ({cart.length})</h4>
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {cart.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '15px', marginBottom: '15px', fontSize: '0.8rem' }}>
                  <img src={item.imageUrl || (item.images && item.images.length > 0 ? item.images[0].url : '')} style={{ width: '50px', height: '60px', objectFit: 'cover', borderRadius: '8px' }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: '700' }}>{item.name}</p>
                    <p style={{ color: '#999', fontSize: '0.7rem' }}>
                      {item.category === 'Accessories' && item.subCategory?.toLowerCase() === 'pole' 
                        ? `${item.quantity} x (${item.customWidth}m × £${item.price}/m)` 
                        : (item.category === 'Curtain' || item.category === 'Valance' 
                            ? `${item.quantity} x (${item.customWidth}m x ${item.customHeight}m × £${item.price}/m²)`
                            : (item.category === 'Fabric'
                                ? `${item.quantity} x (${item.fabricMeters}m × £${item.price}/m)`
                                : (item.quantity ? `${item.quantity} x £${item.price}` : `£${item.totalPrice || item.price}`)
                              )
                          )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', fontWeight: '800' }}>
              <span>{t('total_due')}</span>
              <span>£{subtotal}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const inputStyle = {
  width: '100%',
  padding: '16px',
  borderRadius: '12px',
  border: '1px solid #eeeeee',
  backgroundColor: '#f9f9f9',
  fontSize: '0.9rem',
  outline: 'none'
};

export default Checkout;
