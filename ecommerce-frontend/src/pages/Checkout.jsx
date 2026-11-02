import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, CheckCircle, Copy, Check } from 'lucide-react';
import axios from '../api/axios';
import { useLanguage } from '../context/LanguageContext';
import LocationPickerMap from '../components/LocationPickerMap';

const Checkout = ({ cart, onOrderPlaced }) => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [isSuccess, setIsSuccess] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [abaTxRef, setAbaTxRef] = useState('');
  const subtotal = cart.reduce((acc, item) => acc + Number(item.totalPrice || item.price), 0).toFixed(2);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    phone2: '',
    address: '',
    additionalAddress: '',
    city: '',
    latitude: null,
    longitude: null,
    googleMapsUrl: '',
    paymentMethod: 'ABA Bank',
    cardNumber: '',
    cardExpiry: '',
    cardCvv: '',
    cardName: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.paymentMethod === 'Credit Card') {
      const cleanNum = formData.cardNumber.replace(/\D/g, '');
      if (cleanNum.length < 15) {
        alert(language === 'kh' ? 'សូមបញ្ចូលលេខកាតធនាគារឱ្យបានត្រឹមត្រូវ (១៦ ខ្ទង់)!' : 'Please enter a valid credit card number');
        return;
      }
      if (!formData.cardExpiry || !formData.cardCvv || formData.cardCvv.length < 3) {
        alert(language === 'kh' ? 'សូមបញ្ចូលថ្ងៃផុតកំណត់ និងលេខកូដ CVV ឱ្យបានត្រឹមត្រូវ!' : 'Please enter valid expiry date and CVV');
        return;
      }
    }
    
    const { paymentMethod, cardNumber, cardExpiry, cardCvv, cardName, ...customerData } = formData;
    const orderData = {
      customer: customerData,
      paymentMethod: paymentMethod,
      paymentDetails: paymentMethod === 'ABA Bank' ? {
        merchantId: '14463116',
        accountName: 'LIM SITHA',
        transactionRef: abaTxRef.trim() || null
      } : null,
      cardDetails: paymentMethod === 'Credit Card' ? { cardNumber: '**** **** **** ' + cardNumber.slice(-4), cardName } : null,
      items: cart,
      subtotal: subtotal,
      status: 'Preparing'
    };
    
    try {
      setSubmitting(true);
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
      if (onOrderPlaced) onOrderPlaced(); // Clear cart immediately
    } catch (err) {
      console.error('Failed to place order:', err);
      const msg = err.response?.data?.error || t('order_failed_alert');
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div style={{ padding: '100px 20px', textAlign: 'center' }}>
        <CheckCircle size={80} color="#16a34a" style={{ marginBottom: '25px' }} />
        <h2 className="serif" style={{ fontSize: '2.2rem', marginBottom: '16px' }}>{t('order_placed')}</h2>
        <p style={{ color: '#64748b', maxWidth: '440px', margin: '0 auto', lineHeight: '1.8', fontSize: '0.95rem' }}>
          {t('order_placed_desc')}
        </p>
        <div style={{ marginTop: '35px', padding: '18px 24px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', display: 'inline-block' }}>
          <p style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: '4px', fontWeight: '700' }}>
            {String(t('transaction_id') || 'លេខកូដបញ្ជាទិញ').toUpperCase()}
          </p>
          <p style={{ fontWeight: '800', fontSize: '1.25rem', letterSpacing: '1px', margin: 0, color: '#0f172a' }}>
            #{orderDetails?._id || orderDetails?.id}
          </p>
        </div>
        <div style={{ marginTop: '30px' }}>
          <button 
            type="button"
            onClick={() => navigate('/')}
            style={{ padding: '14px 36px', borderRadius: '50px', border: '1px solid #0f172a', backgroundColor: '#0f172a', color: '#fff', cursor: 'pointer', fontWeight: '700', fontSize: '0.9rem' }}
          >
            {String(t('return_to_shop') || 'ត្រឡប់ទៅទំព័រដើម')}
          </button>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div style={{ padding: '120px 20px', textAlign: 'center' }}>
        <h2 className="serif" style={{ fontSize: '1.8rem', marginBottom: '14px' }}>
          {language === 'kh' ? 'កន្ត្រកទំនិញរបស់អ្នកទទេស្អាត' : 'Your cart is empty'}
        </h2>
        <p style={{ color: '#64748b', marginBottom: '30px', fontSize: '0.9rem' }}>
          {language === 'kh' ? 'សូមជ្រើសរើសទំនិញមុននឹងបន្តការទូទាត់' : 'Please add items to your cart before proceeding to checkout.'}
        </p>
        <button
          type="button"
          onClick={() => navigate('/')}
          style={{ padding: '12px 30px', borderRadius: '50px', border: 'none', backgroundColor: '#0f172a', color: '#fff', cursor: 'pointer', fontWeight: '700' }}
        >
          {language === 'kh' ? 'ទស្សនាទំនិញទាំងអស់' : 'Browse Products'}
        </button>
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
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                  {language === 'kh' ? 'លេខទូរស័ព្ទ (ចាំបាច់) *' : 'Phone Number (Required) *'}
                </label>
                <input 
                  required 
                  type="tel" 
                  placeholder={language === 'kh' ? 'ឧ. 012 345 678' : t('phone_number')} 
                  style={inputStyle} 
                  value={formData.phone} 
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: '700', color: '#64748b', marginBottom: '6px' }}>
                  {language === 'kh' ? 'លេខទូរស័ព្ទទី ២ (ជាជម្រើស)' : 'Secondary Phone (Optional)'}
                </label>
                <input 
                  type="tel" 
                  placeholder={language === 'kh' ? 'ឧ. 098 765 432 (បើមាន)' : 'Secondary phone (optional)'} 
                  style={inputStyle} 
                  value={formData.phone2} 
                  onChange={(e) => setFormData({...formData, phone2: e.target.value})}
                />
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '40px' }}>
            <h3 style={{ fontSize: '0.8rem', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '20px' }}>{t('shipping_addr')}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              <input required placeholder={t('first_name')} style={inputStyle} value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})}/>
              <input required placeholder={t('last_name')} style={inputStyle} value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})}/>
            </div>

            {/* Interactive Draggable Delivery Map */}
            <LocationPickerMap 
              initialAddress={formData.address}
              onLocationSelected={(loc) => {
                setFormData(prev => ({
                  ...prev,
                  address: loc.fullAddress || prev.address,
                  city: loc.city || prev.city || 'Phnom Penh',
                  latitude: loc.lat,
                  longitude: loc.lng,
                  googleMapsUrl: `https://www.google.com/maps?q=${loc.lat},${loc.lng}`
                }));
              }}
            />

            <input required placeholder={t('street_address')} style={{ ...inputStyle, marginBottom: '15px' }} value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})}/>
            <input placeholder={t('additional_address')} style={{ ...inputStyle, marginBottom: '15px' }} value={formData.additionalAddress} onChange={(e) => setFormData({...formData, additionalAddress: e.target.value})}/>
            <input required placeholder={language === 'kh' ? 'រាជធានី / ខេត្ត' : t('city')} style={inputStyle} value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})}/>
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

            {formData.paymentMethod === 'ABA Bank' && (
              <div className="page-transition" style={{
                backgroundColor: '#fff',
                border: '2px solid #004B6E',
                borderRadius: '24px',
                overflow: 'hidden',
                boxShadow: '0 12px 32px rgba(0,75,110,0.08)',
                marginBottom: '25px'
              }}>
                {/* ABA Brand Header */}
                <div style={{
                  backgroundColor: '#004B6E',
                  color: '#fff',
                  padding: '16px 24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      backgroundColor: '#fff',
                      color: '#004B6E',
                      fontWeight: '900',
                      fontSize: '0.9rem',
                      padding: '3px 9px',
                      borderRadius: '8px',
                      letterSpacing: '1px'
                    }}>
                      ABA
                    </div>
                    <span style={{ fontWeight: '700', fontSize: '1.05rem', letterSpacing: '0.5px' }}>
                      ABA PAY / MERCHANT
                    </span>
                  </div>
                  <span style={{ fontSize: '0.75rem', backgroundColor: 'rgba(255,255,255,0.15)', padding: '4px 10px', borderRadius: '12px' }}>
                    {language === 'kh' ? 'ផ្ទេរប្រាក់ផ្ទាល់' : 'Direct Transfer'}
                  </span>
                </div>

                {/* Merchant Details Box */}
                <div style={{ padding: '24px' }}>
                  <div style={{
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '18px',
                    padding: '20px',
                    marginBottom: '20px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px dashed #cbd5e1', paddingBottom: '12px' }}>
                      <div>
                        <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '1px' }}>
                          {language === 'kh' ? 'ឈ្មោះគណនី (ACCOUNT NAME)' : 'ACCOUNT NAME'}
                        </span>
                        <p style={{ margin: '2px 0 0', fontSize: '1.25rem', fontWeight: '800', color: '#0f172a' }}>
                          LIM SITHA
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '1px' }}>
                          {language === 'kh' ? 'ចំនួនទឹកប្រាក់' : 'AMOUNT TO PAY'}
                        </span>
                        <p style={{ margin: '2px 0 0', fontSize: '1.35rem', fontWeight: '900', color: '#004B6E' }}>
                          ${subtotal}
                        </p>
                      </div>
                    </div>

                    <div>
                      <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '1px' }}>
                        {language === 'kh' ? 'លេខសម្គាល់អាជីវករ (MERCHANT ID)' : 'MERCHANT ID'}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
                        <span style={{ fontSize: '1.75rem', fontWeight: '900', letterSpacing: '3px', color: '#004B6E', fontFamily: 'monospace' }}>
                          14463116
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText('14463116');
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                          }}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 18px',
                            borderRadius: '10px',
                            backgroundColor: copied ? '#16a34a' : '#004B6E',
                            color: '#fff',
                            border: 'none',
                            fontWeight: '700',
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          {copied ? <Check size={14} /> : <Copy size={14} />}
                          {copied ? (language === 'kh' ? 'បានចម្លង!' : 'Copied!') : (language === 'kh' ? 'ចម្លងលេខ' : 'Copy ID')}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Step by Step Instruction */}
                  <div style={{ marginBottom: '20px' }}>
                    <h4 style={{ fontSize: '0.8rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', color: '#475569', marginBottom: '10px' }}>
                      {language === 'kh' ? 'របៀបបង់ប្រាក់តាម ABA Mobile' : 'How to Pay via ABA Mobile'}
                    </h4>
                    <ol style={{ margin: 0, paddingLeft: '20px', color: '#334155', fontSize: '0.88rem', lineHeight: '1.8' }}>
                      <li>
                        {language === 'kh' ? 'បើកកម្មវិធី ' : 'Open the '}
                        <b>ABA Mobile</b>
                        {language === 'kh' ? ' នៅលើទូរស័ព្ទដៃរបស់អ្នក' : ' app on your phone'}
                      </li>
                      <li>
                        {language === 'kh' ? 'ចូលទៅកាន់ ' : 'Go to '}
                        <b>Payments / ការទូទាត់</b>
                        {language === 'kh' ? ' ហើយបញ្ចូល Merchant ID: ' : ' and enter Merchant ID: '}
                        <code style={{ backgroundColor: '#e2e8f0', padding: '2px 6px', borderRadius: '4px', fontWeight: '700', color: '#004B6E' }}>14463116</code>
                      </li>
                      <li>
                        {language === 'kh' ? 'ផ្ទៀងផ្ទាត់ឈ្មោះអ្នកទទួល: ' : 'Verify recipient name: '}
                        <b>LIM SITHA</b>
                      </li>
                      <li>
                        {language === 'kh' ? 'បញ្ចូលចំនួនទឹកប្រាក់ ' : 'Transfer the total amount of '}
                        <b>${subtotal}</b>
                        {language === 'kh' ? ' ហើយចុចបញ្ជាក់ការផ្ទេរ' : ' and confirm transfer'}
                      </li>
                    </ol>
                  </div>

                  {/* Optional Transaction Ref Input */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                      {language === 'kh' 
                        ? 'លេខកូដប្រតិបត្តិការ ឬ ៤ខ្ទង់ចុងក្រោយ (ប្រសិនបើមាន / ជាជម្រើស)' 
                        : 'ABA Transaction ID or Last 4 Digits (Optional)'}
                    </label>
                    <input
                      type="text"
                      placeholder={language === 'kh' ? 'ឧ. TRX-123456 ឬ ៤ខ្ទង់ចុងក្រោយ...' : 'e.g. TRX-123456 or last 4 digits...'}
                      value={abaTxRef}
                      onChange={(e) => setAbaTxRef(e.target.value)}
                      style={{
                        ...inputStyle,
                        backgroundColor: '#f8fafc',
                        border: '1px solid #cbd5e1',
                        borderRadius: '12px',
                        fontSize: '0.9rem',
                        padding: '12px 16px'
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

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
            {t('complete_order')} — ${subtotal}
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
                        ? `${item.quantity} x (${item.customWidth}m × $${item.price}/m)` 
                        : (item.category === 'Curtain' || item.category === 'Valance' 
                            ? `${item.quantity} x (${item.customWidth}m x ${item.customHeight}m × $${item.price}/m²)`
                            : (item.category === 'Fabric'
                                ? `${item.quantity} x (${item.fabricMeters}m × $${item.price}/m)`
                                : (item.quantity ? `${item.quantity} x $${item.price}` : `$${item.totalPrice || item.price}`)
                              )
                          )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', fontWeight: '800' }}>
              <span>{t('total_due')}</span>
              <span>${subtotal}</span>
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
