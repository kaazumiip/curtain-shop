import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, CheckCircle, Copy, Check, Truck, Download, Upload, QrCode, Image as ImageIcon } from 'lucide-react';
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
  const [copiedAcleda, setCopiedAcleda] = useState(false);
  const [abaTxRef, setAbaTxRef] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [downloadingQr, setDownloadingQr] = useState(false);
  const [paymentConfig, setPaymentConfig] = useState({
    accountName: 'LIM SITHA',
    merchantId: '14463116',
    bakongQrUrl: '',
    acledaAccountNumber: '089 902 001'
  });
  const subtotal = cart.reduce((acc, item) => acc + Number(item.totalPrice || item.price), 0).toFixed(2);

  useEffect(() => {
    axios.get('/settings/payment')
      .then((res) => {
        if (res.data) {
          setPaymentConfig((prev) => ({
            ...prev,
            accountName: res.data.accountName || 'LIM SITHA',
            merchantId: res.data.merchantId || '14463116',
            bakongQrUrl: res.data.bakongQrUrl || '',
            acledaAccountNumber: res.data.acledaAccountNumber || '089 902 001'
          }));
        }
      })
      .catch(() => {});
  }, []);

  const handleDownloadQrImage = async () => {
    const qrSrc = paymentConfig.bakongQrUrl || '/bakong-qr.png';
    try {
      setDownloadingQr(true);
      const response = await fetch(qrSrc);
      if (!response.ok) throw new Error('QR image not found');
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `LIM_SITHA_Bakong_KHQR_${subtotal}USD.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      window.open(qrSrc, '_blank');
    } finally {
      setDownloadingQr(false);
    }
  };

  const handleReceiptUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const data = new FormData();
    data.append('image', file);
    try {
      setUploadingReceipt(true);
      const res = await axios.post('/products/upload', data);
      if (res.data?.imageUrl) {
        setReceiptUrl(res.data.imageUrl);
      }
    } catch (err) {
      alert(language === 'kh' ? 'បរាជ័យក្នុងការបង្ហោះរូបវិក្កយបត្រ!' : 'Failed to upload payment screenshot');
    } finally {
      setUploadingReceipt(false);
    }
  };

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
    paymentMethod: 'ABA / ACLEDA / Bakong KHQR',
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
    const isKhqrBank = paymentMethod === 'ABA / ACLEDA / Bakong KHQR' || paymentMethod === 'ABA Bank';
    const orderData = {
      customer: customerData,
      paymentMethod: paymentMethod,
      paymentDetails: isKhqrBank ? {
        merchantId: paymentConfig.merchantId || '14463116',
        accountName: paymentConfig.accountName || 'LIM SITHA',
        transactionRef: abaTxRef.trim() || null,
        receiptUrl: receiptUrl || null
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
    <div style={{ padding: '30px 16px 80px', maxWidth: '1200px', margin: '0 auto', boxSizing: 'border-box' }}>
      <h1 className="serif" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', marginBottom: '18px' }}>{t('shipping_details')}</h1>

      {/* 3-Step Checkout Guide Banner */}
      <div style={{
        backgroundColor: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '16px',
        padding: '12px 18px',
        marginBottom: '26px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', fontWeight: '700', color: '#0f172a' }}>
          <span style={{ backgroundColor: '#0f172a', color: '#fff', width: '22px', height: '22px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: '800' }}>1</span>
          <span>{language === 'kh' ? 'បំពេញព័ត៌មាន និងទីតាំង' : 'Enter Info & Address'}</span>
        </div>
        <span style={{ color: '#cbd5e1', fontWeight: '900' }}>→</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', fontWeight: '700', color: '#0f172a' }}>
          <span style={{ backgroundColor: '#0f172a', color: '#fff', width: '22px', height: '22px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: '800' }}>2</span>
          <span>{language === 'kh' ? 'ជ្រើសរើស ABA / ACLEDA (KHQR) ឬ ទូទាត់ពេលដឹកដល់' : 'Choose ABA / ACLEDA (KHQR) or COD'}</span>
        </div>
        <span style={{ color: '#cbd5e1', fontWeight: '900' }}>→</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', fontWeight: '700', color: '#16a34a' }}>
          <span style={{ backgroundColor: '#16a34a', color: '#fff', width: '22px', height: '22px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: '800' }}>3</span>
          <span>{language === 'kh' ? 'ចុច "បំពេញការបញ្ជាទិញ" ខាងក្រោម' : 'Click "Complete Order" Below'}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '36px' }} className="mobile-stack">
        {/* Shipping Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '40px' }}>
            <h3 style={{ fontSize: '0.8rem', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '20px' }}>{t('contact_info')}</h3>
            <div className="responsive-inputs-2col">
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
            <div className="responsive-inputs-2col" style={{ marginBottom: '15px' }}>
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
              {[
                {
                  id: 'ABA / ACLEDA / Bakong KHQR',
                  label: language === 'kh' ? 'ABA / ACLEDA / Bakong KHQR (ទូទាត់ប្រាក់ជាមុន)' : 'ABA / ACLEDA / Bakong KHQR (Pay Upfront)',
                  sub: language === 'kh'
                    ? `ទាញយករូប QR រួចបញ្ចូលក្នុងកន្លែង Scan QR របស់ ABA ឬ ACLEDA (${paymentConfig.accountName})`
                    : `Save QR & Upload inside ABA or ACLEDA Scan QR (${paymentConfig.accountName})`
                },
                {
                  id: 'Cash on Delivery',
                  label: language === 'kh' ? 'ទូទាត់ពេលដឹកជញ្ជូនដល់ (Pay on Delivery / COD)' : 'Cash on Delivery (Pay on Delivery / COD)',
                  sub: language === 'kh' ? 'ទូទាត់ប្រាក់សុទ្ធ ឬ ស្កេន ABA / ACLEDA ពេលទំនិញដឹកដល់ដៃអ្នក' : 'Pay in cash or scan ABA / ACLEDA when curtains arrive at your door'
                },
                {
                  id: 'Wing Bank',
                  label: language === 'kh' ? 'Wing Bank (ទូទាត់ជាមុន / Pay Upfront)' : 'Wing Bank (Pay Upfront)',
                  sub: language === 'kh' ? 'ផ្ទេរប្រាក់ជាមុនតាមគណនីវីង' : 'Transfer upfront via Wing Bank'
                },
                {
                  id: 'Credit Card',
                  label: language === 'kh' ? 'កាតឥណទាន (Credit / Debit Card)' : 'Credit / Debit Card',
                  sub: 'Visa, MasterCard, UnionPay'
                }
              ].map((opt) => (
                <label 
                  key={opt.id} 
                  style={{ 
                    ...inputStyle, 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '15px', 
                    cursor: 'pointer',
                    padding: '16px 20px',
                    border: formData.paymentMethod === opt.id ? '2px solid black' : '1px solid #eeeeee',
                    backgroundColor: formData.paymentMethod === opt.id ? '#fafafa' : '#fff'
                  }}
                >
                  <input 
                    type="radio" 
                    name="paymentMethod" 
                    value={opt.id} 
                    checked={formData.paymentMethod === opt.id}
                    onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                    style={{ accentColor: 'black', width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <div>
                    <span style={{ fontWeight: formData.paymentMethod === opt.id ? '700' : '500', fontSize: '0.95rem', display: 'block', color: '#111' }}>
                      {opt.label}
                    </span>
                    <span style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px', display: 'block' }}>
                      {opt.sub}
                    </span>
                  </div>
                </label>
              ))}
            </div>

            {(formData.paymentMethod === 'ABA / ACLEDA / Bakong KHQR' || formData.paymentMethod === 'ABA Bank') && (
              <div className="page-transition" style={{
                backgroundColor: '#fff',
                border: '2px solid #E1232E',
                borderRadius: '24px',
                overflow: 'hidden',
                boxShadow: '0 12px 32px rgba(225,35,46,0.08)',
                marginBottom: '25px'
              }}>
                {/* KHQR / ABA / ACLEDA Brand Header */}
                <div style={{
                  background: 'linear-gradient(135deg, #E1232E 0%, #004B6E 55%, #003A70 100%)',
                  color: '#fff',
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '10px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{
                      backgroundColor: '#fff',
                      color: '#E1232E',
                      fontWeight: '900',
                      fontSize: '0.8rem',
                      padding: '4px 9px',
                      borderRadius: '7px',
                      letterSpacing: '0.8px'
                    }}>
                      KHQR
                    </span>
                    <span style={{
                      backgroundColor: '#004B6E',
                      border: '1px solid rgba(255,255,255,0.4)',
                      color: '#fff',
                      fontWeight: '900',
                      fontSize: '0.8rem',
                      padding: '4px 9px',
                      borderRadius: '7px',
                      letterSpacing: '0.8px'
                    }}>
                      ABA
                    </span>
                    <span style={{
                      backgroundColor: '#003A70',
                      border: '1px solid #f59e0b',
                      color: '#fbbf24',
                      fontWeight: '900',
                      fontSize: '0.8rem',
                      padding: '4px 9px',
                      borderRadius: '7px',
                      letterSpacing: '0.8px'
                    }}>
                      ACLEDA
                    </span>
                    <span style={{ fontWeight: '800', fontSize: '0.95rem', letterSpacing: '0.3px', marginLeft: '2px' }}>
                      {language === 'kh' ? 'ស្កេន Bakong KHQR' : 'Scan Bakong KHQR'}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.73rem', backgroundColor: 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: '12px', fontWeight: '700' }}>
                    {language === 'kh' ? 'គ្រប់ធនាគារទាំងអស់' : 'All Banks Supported'}
                  </span>
                </div>

                {/* Main Content */}
                <div style={{ padding: '20px' }}>
                  {/* Account Summary Box */}
                  <div style={{
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '18px',
                    padding: '16px 18px',
                    marginBottom: '18px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px dashed #cbd5e1', paddingBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
                      <div>
                        <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '1px' }}>
                          {language === 'kh' ? 'ឈ្មោះគណនី (ACCOUNT NAME)' : 'ACCOUNT NAME'}
                        </span>
                        <p style={{ margin: '2px 0 0', fontSize: '1.2rem', fontWeight: '900', color: '#0f172a' }}>
                          {paymentConfig.accountName || 'LIM SITHA'}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '1px' }}>
                          {language === 'kh' ? 'ចំនួនទឹកប្រាក់ត្រូវបង់' : 'AMOUNT TO PAY'}
                        </span>
                        <p style={{ margin: '2px 0 0', fontSize: '1.4rem', fontWeight: '900', color: '#E1232E' }}>
                          ${subtotal}
                        </p>
                      </div>
                    </div>

                    {/* ABA Merchant ID Copy Row */}
                    <div style={{ marginBottom: paymentConfig.acledaAccountNumber ? '12px' : 0 }}>
                      <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '0.8px' }}>
                        {language === 'kh' ? 'លេខសម្គាល់ ABA / Bakong ID' : 'ABA MERCHANT / ACCOUNT ID'}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px', flexWrap: 'wrap', gap: '10px' }}>
                        <span style={{ fontSize: 'clamp(1.2rem, 4.5vw, 1.55rem)', fontWeight: '900', letterSpacing: '1.5px', color: '#004B6E', fontFamily: 'monospace' }}>
                          {paymentConfig.merchantId || '14463116'}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(paymentConfig.merchantId || '14463116');
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                          }}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '7px 15px',
                            borderRadius: '10px',
                            backgroundColor: copied ? '#16a34a' : '#004B6E',
                            color: '#fff',
                            border: 'none',
                            fontWeight: '700',
                            fontSize: '0.8rem',
                            cursor: 'pointer'
                          }}
                        >
                          {copied ? <Check size={14} /> : <Copy size={14} />}
                          {copied ? (language === 'kh' ? 'បានចម្លង!' : 'Copied!') : (language === 'kh' ? 'ចម្លងលេខ ABA' : 'Copy ABA ID')}
                        </button>
                      </div>
                    </div>

                    {/* ACLEDA Phone / Account Copy Row */}
                    {paymentConfig.acledaAccountNumber && (
                      <div style={{ borderTop: '1px dashed #e2e8f0', paddingTop: '10px' }}>
                        <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '0.8px' }}>
                          {language === 'kh' ? 'លេខទូរស័ព្ទ / គណនី ACLEDA' : 'ACLEDA PHONE / ACCOUNT'}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px', flexWrap: 'wrap', gap: '10px' }}>
                          <span style={{ fontSize: 'clamp(1.1rem, 4vw, 1.35rem)', fontWeight: '900', letterSpacing: '1px', color: '#003A70', fontFamily: 'monospace' }}>
                            {paymentConfig.acledaAccountNumber}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(paymentConfig.acledaAccountNumber.replace(/\s+/g, ''));
                              setCopiedAcleda(true);
                              setTimeout(() => setCopiedAcleda(false), 2000);
                            }}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '7px 15px',
                              borderRadius: '10px',
                              backgroundColor: copiedAcleda ? '#16a34a' : '#003A70',
                              color: '#fff',
                              border: 'none',
                              fontWeight: '700',
                              fontSize: '0.8rem',
                              cursor: 'pointer'
                            }}
                          >
                            {copiedAcleda ? <Check size={14} /> : <Copy size={14} />}
                            {copiedAcleda ? (language === 'kh' ? 'បានចម្លង!' : 'Copied!') : (language === 'kh' ? 'ចម្លងលេខ ACLEDA' : 'Copy ACLEDA')}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Bakong KHQR Card & 1-Tap Save QR for ABA / ACLEDA "Scan QR -> Upload Image" */}
                  <div style={{
                    backgroundColor: '#ffffff',
                    border: '2px solid #f1f5f9',
                    borderRadius: '20px',
                    padding: '18px',
                    marginBottom: '18px',
                    textAlign: 'center',
                    boxShadow: '0 6px 20px rgba(15,23,42,0.05)'
                  }}>
                    {/* Official-style Bakong KHQR Stand Card */}
                    <div style={{
                      maxWidth: '280px',
                      margin: '0 auto 14px',
                      borderRadius: '18px',
                      overflow: 'hidden',
                      border: '2px solid #E1232E',
                      backgroundColor: '#ffffff',
                      boxShadow: '0 8px 24px rgba(225,35,46,0.12)'
                    }}>
                      <div style={{
                        backgroundColor: '#E1232E',
                        color: '#ffffff',
                        padding: '10px 16px',
                        fontWeight: '900',
                        fontSize: '1.05rem',
                        letterSpacing: '2px',
                        textAlign: 'center'
                      }}>
                        KHQR
                      </div>
                      <div style={{ padding: '14px 16px 10px', textAlign: 'left', borderBottom: '1px dashed #e2e8f0' }}>
                        <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>
                          {paymentConfig.accountName || 'LIM SITHA'}
                        </div>
                        <div style={{ fontSize: '1.35rem', fontWeight: '900', color: '#0f172a', marginTop: '2px' }}>
                          ${subtotal} <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b' }}>USD</span>
                        </div>
                      </div>

                      <div style={{ padding: '16px', backgroundColor: '#ffffff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        {(paymentConfig.bakongQrUrl || true) && (
                          <img
                            src={paymentConfig.bakongQrUrl || '/bakong-qr.png'}
                            alt="Bakong KHQR Code"
                            style={{
                              width: '210px',
                              height: '210px',
                              objectFit: 'contain',
                              borderRadius: '10px',
                              display: 'block'
                            }}
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              const fallback = e.currentTarget.nextElementSibling;
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                        )}
                        <div style={{
                          display: 'none',
                          width: '210px',
                          height: '210px',
                          borderRadius: '12px',
                          border: '2px dashed #cbd5e1',
                          backgroundColor: '#f8fafc',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '16px',
                          boxSizing: 'border-box',
                          textAlign: 'center'
                        }}>
                          <QrCode size={52} color="#E1232E" style={{ marginBottom: '8px' }} />
                          <span style={{ fontSize: '0.8rem', fontWeight: '800', color: '#0f172a' }}>
                            {paymentConfig.accountName || 'LIM SITHA'}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: '#004B6E', fontWeight: '800', marginTop: '4px' }}>
                            ID: {paymentConfig.merchantId || '14463116'}
                          </span>
                          <span style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '6px', lineHeight: '1.4' }}>
                            {language === 'kh'
                              ? 'សូមបង្ហោះរូប QR ក្នុងផ្ទាំង Admin ដើម្បីឱ្យអតិថិជនទាញយកស្កេន'
                              : 'Upload your Bakong QR in Admin Dashboard to display here'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Save / Download QR Button for Mobile Upload into ABA & ACLEDA */}
                    <button
                      type="button"
                      onClick={handleDownloadQrImage}
                      disabled={downloadingQr}
                      style={{
                        width: '100%',
                        maxWidth: '340px',
                        padding: '13px 18px',
                        borderRadius: '14px',
                        backgroundColor: '#E1232E',
                        color: '#ffffff',
                        border: 'none',
                        fontWeight: '800',
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        boxShadow: '0 6px 18px rgba(225,35,46,0.25)',
                        fontFamily: "'Poppins', 'Noto Sans Khmer', sans-serif"
                      }}
                    >
                      <Download size={18} />
                      <span>
                        {language === 'kh'
                          ? 'ទាញយករូប QR (ដាក់ក្នុងកន្លែង Scan QR របស់ ABA / ACLEDA)'
                          : 'Save QR Image (To Upload in ABA / ACLEDA Scan QR)'}
                      </span>
                    </button>
                    <p style={{ margin: '8px 0 0', fontSize: '0.75rem', color: '#64748b', lineHeight: '1.5' }}>
                      {language === 'kh'
                        ? '💡 លើទូរស័ព្ទ៖ ចុចប៊ូតុងខាងលើដើម្បីរក្សាទុករូប QR ចូលទូរស័ព្ទ រួចបើក ABA ឬ ACLEDA → ចុច "Scan QR" → ចុចរូបភាពជ្រុងខាងក្រោមដើម្បីជ្រើសរើសរូប QR ពីទូរស័ព្ទ!'
                        : '💡 On mobile: Tap above to save the QR to your photos, then open ABA or ACLEDA → tap "Scan QR" → tap the gallery icon to upload the saved QR!'}
                    </p>
                  </div>

                  {/* Step by Step Instruction for ABA & ACLEDA Scan -> Upload QR */}
                  <div style={{
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '16px',
                    padding: '16px',
                    marginBottom: '18px'
                  }}>
                    <h4 style={{ fontSize: '0.82rem', fontWeight: '800', color: '#0f172a', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>📲</span>
                      <span>
                        {language === 'kh'
                          ? 'របៀបបញ្ចូលរូប QR ក្នុងកន្លែង Scan QR របស់ ABA និង ACLEDA៖'
                          : 'How to Upload QR in ABA & ACLEDA Scan QR:'}
                      </span>
                    </h4>
                    <ol style={{ margin: 0, paddingLeft: '20px', color: '#334155', fontSize: '0.84rem', lineHeight: '1.85' }}>
                      <li>
                        {language === 'kh'
                          ? 'ចុចប៊ូតុងពណ៌ក្រហមខាងលើ '
                          : 'Tap the red button above '}
                        <b>"{language === 'kh' ? 'ទាញយករូប QR' : 'Save QR Image'}"</b>
                        {language === 'kh' ? ' (ឬចុចសង្កត់លើរូប QR ដើម្បីរក្សាទុកក្នុងទូរស័ព្ទ)' : ' to save the QR to your phone gallery'}
                      </li>
                      <li>
                        {language === 'kh' ? 'បើកកម្មវិធី ' : 'Open '}
                        <b style={{ color: '#004B6E' }}>ABA Mobile</b>
                        {language === 'kh' ? ' ឬ ' : ' or '}
                        <b style={{ color: '#003A70' }}>ACLEDA Mobile</b>
                        {language === 'kh' ? ' ហើយចុចលើប៊ូតុង ' : ' and tap '}
                        <b>"Scan QR / ស្កេន QR"</b>
                      </li>
                      <li>
                        {language === 'kh'
                          ? 'នៅក្នុងអេក្រង់ស្កេន សូមចុចប៊ូតុង '
                          : 'Inside the scanner screen, tap '}
                        <b style={{ color: '#E1232E' }}>
                          {language === 'kh' ? '"Upload QR / រូបភាពពីទូរស័ព្ទ (Gallery)"' : '"Upload QR / Select from Gallery"'}
                        </b>
                        {language === 'kh' ? ' រួចជ្រើសរើសរូប QR ដែលបានទាញយក' : ' and select the saved QR image'}
                      </li>
                      <li>
                        {language === 'kh' ? 'ផ្ទៀងផ្ទាត់ឈ្មោះ ' : 'Verify account name '}
                        <b>{paymentConfig.accountName || 'LIM SITHA'}</b>
                        {language === 'kh' ? ' និងបញ្ចូលទឹកប្រាក់ ' : ' and enter amount '}
                        <b style={{ color: '#E1232E' }}>${subtotal}</b>
                        {language === 'kh' ? ' រួចចុចបង់ប្រាក់' : ' to complete payment'}
                      </li>
                    </ol>
                  </div>

                  {/* Upload Payment Screenshot / Slip (Optional) + Transaction Ref */}
                  <div style={{ display: 'grid', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '800', color: '#0f172a', marginBottom: '6px' }}>
                        {language === 'kh'
                          ? '📸 បង្ហោះរូបភាពវិក្កយបត្របង់ប្រាក់ ABA / ACLEDA (ប្រសិនបើមាន)'
                          : '📸 Upload ABA / ACLEDA Payment Screenshot (Optional)'}
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                        <label style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '11px 16px',
                          borderRadius: '12px',
                          border: receiptUrl ? '2px solid #16a34a' : '1.5px dashed #94a3b8',
                          backgroundColor: receiptUrl ? '#f0fdf4' : '#f8fafc',
                          color: receiptUrl ? '#15803d' : '#0f172a',
                          fontWeight: '700',
                          fontSize: '0.84rem',
                          cursor: 'pointer'
                        }}>
                          <Upload size={16} />
                          <span>
                            {uploadingReceipt
                              ? (language === 'kh' ? 'កំពុងបង្ហោះរូបភាព...' : 'Uploading screenshot...')
                              : (receiptUrl
                                  ? (language === 'kh' ? 'បានភ្ជាប់រូបវិក្កយបត្រ ✓ (ចុចដើម្បីប្តូរ)' : 'Screenshot Attached ✓ (Tap to change)')
                                  : (language === 'kh' ? 'ជ្រើសរើសរូបថតអេក្រង់បង់ប្រាក់ (Screenshot)' : 'Select Payment Screenshot'))}
                          </span>
                          <input type="file" accept="image/*" onChange={handleReceiptUpload} hidden />
                        </label>
                        {receiptUrl && (
                          <img
                            src={receiptUrl}
                            alt="Receipt preview"
                            style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #bbf7d0' }}
                          />
                        )}
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                        {language === 'kh' 
                          ? 'លេខកូដប្រតិបត្តិការ ឬ ៤ខ្ទង់ចុងក្រោយ (ជាជម្រើស)' 
                          : 'ABA / ACLEDA Transaction ID or Last 4 Digits (Optional)'}
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
              </div>
            )}

            {formData.paymentMethod === 'Cash on Delivery' && (
              <div className="page-transition" style={{
                backgroundColor: '#fff',
                border: '2px solid #16a34a',
                borderRadius: '24px',
                overflow: 'hidden',
                boxShadow: '0 12px 32px rgba(22,163,74,0.08)',
                marginBottom: '25px'
              }}>
                <div style={{
                  backgroundColor: '#16a34a',
                  color: '#fff',
                  padding: '16px 24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Truck size={20} />
                    <span style={{ fontWeight: '700', fontSize: '1.05rem', letterSpacing: '0.5px' }}>
                      {language === 'kh' ? 'ទូទាត់ពេលដឹកជញ្ជូនដល់ (PAY ON DELIVERY)' : 'CASH ON DELIVERY (COD)'}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.75rem', backgroundColor: 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: '12px', fontWeight: '700' }}>
                    {language === 'kh' ? 'បង់លុយពេលទំនិញដល់ដៃ' : 'Pay Upon Delivery'}
                  </span>
                </div>

                <div style={{ padding: '24px' }}>
                  <div style={{
                    backgroundColor: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: '16px',
                    padding: '18px',
                    marginBottom: '16px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#166534' }}>
                        {language === 'kh' ? 'ទឹកប្រាក់ត្រូវទូទាត់ពេលដឹកដល់:' : 'Amount to pay on delivery:'}
                      </span>
                      <span style={{ fontSize: '1.45rem', fontWeight: '900', color: '#15803d' }}>
                        ${subtotal}
                      </span>
                    </div>
                  </div>

                  <p style={{ margin: 0, fontSize: '0.9rem', color: '#334155', lineHeight: '1.7' }}>
                    {language === 'kh' 
                      ? '👉 អ្នកអាចទូទាត់ជាសាច់ប្រាក់សុទ្ធ ឬ ស្កេន ABA ផ្ទាល់ជាមួយអ្នកដឹកជញ្ជូន នៅពេលទំនិញត្រូវបានដឹកជញ្ជូនដល់គេហដ្ឋានរបស់អ្នក។ ខាងហាងនឹងទាក់ទងទូរស័ព្ទទៅកាន់អ្នកមុនពេលចេញដំណើរដឹកជញ្ជូន។'
                      : '👉 You can pay in cash or scan ABA directly with the courier when your package arrives at your address. We will call your phone before heading out for delivery.'}
                  </p>
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

          <button 
            type="submit" 
            disabled={submitting}
            className="btn-primary" 
            style={{ 
              width: '100%', 
              padding: '18px 24px', 
              fontSize: '1.08rem', 
              fontWeight: '800', 
              backgroundColor: submitting ? '#64748b' : '#0f172a', 
              color: '#ffffff', 
              border: 'none', 
              borderRadius: '16px', 
              cursor: submitting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              boxShadow: '0 10px 25px rgba(15, 23, 42, 0.25)',
              marginTop: '15px',
              fontFamily: "'Poppins', 'Noto Sans Khmer', 'Kdam Thmor Pro', sans-serif",
              transition: 'all 0.2s ease'
            }}
          >
            {submitting ? (
              <span>{language === 'kh' ? 'កំពុងដំណើរការបញ្ជាទិញ...' : 'Processing Order...'}</span>
            ) : (
              <>
                <span>{t('complete_order')}</span>
                <span style={{ opacity: 0.5 }}>—</span>
                <span style={{ fontSize: '1.2rem', fontWeight: '900' }}>${subtotal}</span>
                <Check size={20} />
              </>
            )}
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
                            ? `${item.quantity} x (${item.customWidth}m (W) × ${item.customHeight}m (H))`
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
