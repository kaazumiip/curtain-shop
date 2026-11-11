import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, CheckCircle, Copy, Check, Truck, Download, Upload, QrCode, RefreshCw, Clock, Smartphone, ExternalLink } from 'lucide-react';
import QRCode from 'qrcode';
import CryptoJS from 'crypto-js';
import axios from '../api/axios';
import { useLanguage } from '../context/LanguageContext';
import LocationPickerMap from '../components/LocationPickerMap';

const CHECK_INTERVALS_SECONDS = [5, 10, 30, 45, 80, 100];
const QR_EXPIRATION_SECONDS = 100;

// Pure client-side EMVCo CRC16-CCITT helper (fallback if backend is waking up)
const computeCrc16 = (str) => {
  let crc = 0xFFFF;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
      } else {
        crc = (crc << 1) & 0xFFFF;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
};

const formatTag = (tag, val) => {
  const s = String(val);
  return `${tag}${String(s.length).padStart(2, '0')}${s}`;
};

const buildLocalBakongKhqr = (bakongId, merchantName, amountUsd, expiresAtMs) => {
  const cleanId = bakongId || 'chanmonyroth_hout@bkrt';
  const cleanName = (merchantName || 'CHANMONYROTH HOUT').slice(0, 25);
  const rounded = Math.round(Number(amountUsd || 0) * 100) / 100;
  const amtStr = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
  const tag29 = formatTag('29', formatTag('00', cleanId));
  const tag99 = formatTag('99', formatTag('00', String(Date.now())) + formatTag('01', String(expiresAtMs)));
  const bodyWithoutCrc =
    '000201010212' +
    tag29 +
    '520459995303840' +
    formatTag('54', amtStr) +
    '5802KH' +
    formatTag('59', cleanName) +
    formatTag('60', 'Phnom Penh') +
    tag99 +
    '6304';
  return bodyWithoutCrc + computeCrc16(bodyWithoutCrc);
};

const Checkout = ({ cart, onOrderPlaced }) => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [isSuccess, setIsSuccess] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [abaTxRef, setAbaTxRef] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [downloadingQr, setDownloadingQr] = useState(false);

  const [paymentConfig, setPaymentConfig] = useState({
    bakongAccountId: 'chanmonyroth_hout@bkrt',
    accountName: 'CHANMONYROTH HOUT',
    merchantId: '14463116',
    acledaAccountNumber: '089 902 001'
  });

  // Dynamic KHQR session state
  const [khqrSession, setKhqrSession] = useState(null);
  const [generatingQr, setGeneratingQr] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(QR_EXPIRATION_SECONDS);
  const [khqrStatus, setKhqrStatus] = useState('IDLE'); // 'IDLE' | 'PENDING' | 'PAID' | 'EXPIRED'
  const [completedChecks, setCompletedChecks] = useState([]);
  const [activeCheckSecond, setActiveCheckSecond] = useState(null);
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [showBankChooser, setShowBankChooser] = useState(false);
  const [selectedBankHint, setSelectedBankHint] = useState('ABA');

  const checkTimersRef = useRef([]);
  const countdownRef = useRef(null);
  const prebuiltCardFileRef = useRef(null);
  const prebuiltCardBlobRef = useRef(null);
  const autoSubmittedRef = useRef(false);

  const subtotal = cart.reduce((acc, item) => acc + Number(item.totalPrice || item.price), 0).toFixed(2);

  useEffect(() => {
    const ua = navigator.userAgent || '';
    setIsMobileDevice(/Android|iPhone|iPad|iPod|Mobile/i.test(ua));

    axios.get('/settings/payment')
      .then((res) => {
        if (res.data) {
          setPaymentConfig((prev) => ({
            ...prev,
            bakongAccountId: res.data.bakongAccountId || 'chanmonyroth_hout@bkrt',
            accountName: res.data.accountName || 'CHANMONYROTH HOUT',
            merchantId: res.data.merchantId || '14463116',
            acledaAccountNumber: res.data.acledaAccountNumber || '089 902 001',
            bakongToken: res.data.bakongToken || prev.bakongToken
          }));
        }
      })
      .catch(() => {});
  }, []);

  const clearAllKhqrTimers = useCallback(() => {
    checkTimersRef.current.forEach((id) => {
      clearTimeout(id);
      clearInterval(id);
    });
    checkTimersRef.current = [];
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, []);

  const BAKONG_FALLBACK_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjp7ImlkIjoiNjYyNmFmNzhiZGJjNDY4ZSJ9LCJpYXQiOjE3ODk0MDMwMTQsImV4cCI6MTc5NzE3OTAxNH0.SuOcTS7RwlYaWhPbVXq-uF2UdNBOdKqSJNtANW59g4Y';

  const triggerCheckAtSecond = useCallback(async (md5, sec) => {
    if (!md5) return;
    setActiveCheckSecond(sec);
    try {
      let isPaid = false;
      let transactionData = null;

      // 1. Direct NBC Bakong Open API check (Guaranteed fast, real-time & direct CORS)
      const token = paymentConfig.bakongToken || BAKONG_FALLBACK_TOKEN;
      try {
        const nbcResponse = await fetch('https://api-bakong.nbc.gov.kh/v1/check_transaction_by_md5', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ md5: String(md5).trim() })
        });
        const nbcData = await nbcResponse.json();
        if (nbcData && (nbcData.responseCode === 0 || nbcData.status?.code === 0) && nbcData.data) {
          isPaid = true;
          transactionData = nbcData.data;
        }
      } catch (nbcErr) {
        // Network or rate limit warning
      }

      // 2. Try checking backend route as complementary verification
      if (!isPaid) {
        try {
          const res = await axios.post('/settings/khqr/check', {
            md5,
            checkSecond: sec
          });
          if (res.data?.paid || res.data?.status === 'PAID') {
            isPaid = true;
            transactionData = res.data.transaction || null;
          }
        } catch (backendErr) {
          // Backend may be sleeping or older revision
        }
      }

      setCompletedChecks((prev) => (prev.includes(sec) ? prev : [...prev, sec]));

      if (isPaid) {
        setKhqrStatus('PAID');
        const ref = transactionData?.hash || transactionData?.tranId || transactionData?.externalRef || 'PAID_NBC';
        setAbaTxRef(String(ref));
        clearAllKhqrTimers();
        return;
      }

      if (sec >= QR_EXPIRATION_SECONDS) {
        setKhqrStatus('EXPIRED');
        clearAllKhqrTimers();
      }
    } catch (err) {
      setCompletedChecks((prev) => (prev.includes(sec) ? prev : [...prev, sec]));
      if (sec >= QR_EXPIRATION_SECONDS) {
        setKhqrStatus('EXPIRED');
        clearAllKhqrTimers();
      }
    } finally {
      setActiveCheckSecond(null);
    }
  }, [clearAllKhqrTimers, paymentConfig.bakongToken]);

  const generateDynamicKhqr = useCallback(async () => {
    if (Number(subtotal) <= 0) return;
    clearAllKhqrTimers();
    setGeneratingQr(true);
    setCompletedChecks([]);
    setActiveCheckSecond(null);
    setSecondsLeft(QR_EXPIRATION_SECONDS);
    setKhqrStatus('PENDING');

    let sessionData = null;

    try {
      const now = Date.now();
      const expiresAt = now + QR_EXPIRATION_SECONDS * 1000;
      const accountId = paymentConfig.bakongAccountId || 'chanmonyroth_hout@bkrt';
      const merchantName = (paymentConfig.accountName || 'CHANMONYROTH HOUT').slice(0, 25);

      const qrString = buildLocalBakongKhqr(
        accountId,
        merchantName,
        Number(subtotal),
        expiresAt
      );
      const md5 = CryptoJS.MD5(qrString).toString().toLowerCase();

      const qrDataUrl = await QRCode.toDataURL(qrString, {
        errorCorrectionLevel: 'M',
        margin: 2,
        width: 420,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      sessionData = {
        qrString,
        qrDataUrl,
        md5,
        amount: Number(subtotal),
        currency: 'USD',
        bakongAccountId: accountId,
        merchantName,
        createdAt: now,
        expiresAt,
        expiresInSeconds: QR_EXPIRATION_SECONDS
      };
    } catch (genErr) {
      console.error('Failed to generate KHQR:', genErr);
    }

    setGeneratingQr(false);
    if (!sessionData) return;
    setKhqrSession(sessionData);

    // 1. Start 1-second visual countdown up to 100s expiration
    const expiryTime = sessionData.expiresAt || (Date.now() + QR_EXPIRATION_SECONDS * 1000);
    countdownRef.current = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((expiryTime - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining <= 0) {
        setKhqrStatus((curr) => (curr === 'PAID' ? 'PAID' : 'EXPIRED'));
        if (countdownRef.current) clearInterval(countdownRef.current);
      }
    }, 1000);

    // 2. Schedule status checks every 3 seconds for 100s so payment confirms immediately!
    const intervalId = setInterval(() => {
      triggerCheckAtSecond(sessionData.md5, 'interval');
    }, 3000);
    checkTimersRef.current.push(intervalId);
  }, [subtotal, paymentConfig.bakongAccountId, paymentConfig.accountName, clearAllKhqrTimers, triggerCheckAtSecond]);

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

  useEffect(() => {
    const isKhqr = formData.paymentMethod === 'ABA / ACLEDA / Bakong KHQR' || formData.paymentMethod === 'ABA Bank';
    if (isKhqr && cart.length > 0) {
      generateDynamicKhqr();
    } else {
      clearAllKhqrTimers();
    }
    return () => clearAllKhqrTimers();
  }, [formData.paymentMethod, subtotal, cart.length, generateDynamicKhqr, clearAllKhqrTimers]);

  // Immediately verify payment with Bakong when the customer switches back from ABA / ACLEDA to the browser!
  useEffect(() => {
    if (!khqrSession?.md5 || khqrStatus !== 'PENDING') return;
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        triggerCheckAtSecond(khqrSession.md5, 'return');
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
    };
  }, [khqrSession?.md5, khqrStatus, triggerCheckAtSecond]);

  // Build clean KHQR card PNG with ONLY Merchant and Total Amount + QR code
  const buildKhqrCardBlob = useCallback(async (qrDataUrl, merchantNameStr) => {
    const qrSrc = qrDataUrl || khqrSession?.qrDataUrl;
    if (!qrSrc) return null;

    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 740;
    const ctx = canvas.getContext('2d');

    // White card background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Red KHQR top header
    ctx.fillStyle = '#E1232E';
    ctx.fillRect(0, 0, canvas.width, 95);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 42px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('KHQR', canvas.width / 2, 64);

    // ONLY Merchant Name & Total Amount
    ctx.textAlign = 'left';
    ctx.fillStyle = '#64748B';
    ctx.font = 'bold 22px Arial, sans-serif';
    ctx.fillText(merchantNameStr || khqrSession?.merchantName || paymentConfig.accountName || 'CHANMONYROTH HOUT', 50, 155);

    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 48px Arial, sans-serif';
    ctx.fillText(`$${subtotal} USD`, 50, 215);

    // Dashed divider
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.moveTo(40, 245);
    ctx.lineTo(canvas.width - 40, 245);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw QR Code in the center
    const img = new Image();
    img.crossOrigin = 'anonymous';
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = qrSrc;
    });
    ctx.drawImage(img, 80, 270, 440, 440);

    return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  }, [khqrSession?.qrDataUrl, khqrSession?.merchantName, paymentConfig.accountName, subtotal]);

  // Pre-build the KHQR File object as soon as khqrSession is ready so tapping ABA / ACLEDA can invoke navigator.share({ files }) synchronously!
  useEffect(() => {
    if (!khqrSession?.qrDataUrl) return;
    let active = true;
    buildKhqrCardBlob(khqrSession.qrDataUrl, khqrSession.merchantName)
      .then((blob) => {
        if (!active || !blob) return;
        prebuiltCardBlobRef.current = blob;
        const fileName = `KHQR_${subtotal}USD.png`;
        try {
          prebuiltCardFileRef.current = new File([blob], fileName, { type: 'image/png' });
        } catch (e) {
          prebuiltCardFileRef.current = null;
        }
      })
      .catch(() => {});
    return () => { active = false; };
  }, [khqrSession, subtotal, buildKhqrCardBlob]);

  // Open our clean "Choose Banking App" dialog (showing ONLY ABA Mobile & ACLEDA Mobile — no social media icons!)
  const handleOpenBankChooser = (preferredBank = 'ABA') => {
    setSelectedBankHint(preferredBank);
    setShowBankChooser(true);
  };

  // Send the KHQR image File via navigator.share({ files }) so tapping ABA / ACLEDA auto-inserts the QR directly into Scan QR!
  // Never use `intent://...;package=...` because Android Chrome redirects `intent://` to the Google Play Store!
  const handleDirectSaveAndOpenBankApp = async (bankType = null) => {
    setShowBankChooser(false);
    const fileName = `KHQR_${subtotal}USD.png`;

    // 1. When clicking ABA or ACLEDA, share the pre-built KHQR image file synchronously (must use prebuiltCardFileRef.current directly without creating a new File!)
    if (
      bankType &&
      prebuiltCardFileRef.current &&
      typeof navigator !== 'undefined' &&
      navigator.share
    ) {
      try {
        await navigator.share({
          files: [prebuiltCardFileRef.current]
        });
        return;
      } catch (shareErr) {
        if (shareErr?.name === 'AbortError') return;
      }
    }

    // 2. Fallback (or when clicking "Download QR Image"): save the KHQR image to the phone gallery
    try {
      setDownloadingQr(true);
      const blob = prebuiltCardBlobRef.current || (await buildKhqrCardBlob());
      if (blob) {
        // If prebuiltCardFileRef wasn't ready yet when they tapped ABA/ACLEDA, try sharing the newly built File now
        if (bankType && typeof navigator !== 'undefined' && navigator.share) {
          try {
            const freshFile = new File([blob], fileName, { type: 'image/png' });
            prebuiltCardFileRef.current = freshFile;
            await navigator.share({ files: [freshFile] });
            return;
          } catch (lateShareErr) {
            if (lateShareErr?.name === 'AbortError') return;
          }
        }

        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => window.URL.revokeObjectURL(blobUrl), 3000);
      }
    } catch (e) {
      if (khqrSession?.qrDataUrl) {
        const link = document.createElement('a');
        link.href = khqrSession.qrDataUrl;
        link.download = fileName;
        link.click();
      }
    } finally {
      setDownloadingQr(false);
    }

    if (!bankType) return;

    // 3. Direct custom scheme ONLY (NEVER `intent://...package=...`, which opens Google Play Store!)
    if (bankType === 'ABA') {
      window.location.href = 'abamobilebank://';
    } else if (bankType === 'ACLEDA') {
      window.location.href = 'acledabank://';
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

  const submitOrderToBackend = useCallback(async (overrideKhqrStatus = null) => {
    if (submitting || isSuccess) return;

    const { paymentMethod, cardNumber, cardExpiry, cardCvv, cardName, ...customerData } = formData;
    const isKhqrBank = paymentMethod === 'ABA / ACLEDA / Bakong KHQR' || paymentMethod === 'ABA Bank';
    const orderData = {
      customer: customerData,
      paymentMethod: paymentMethod,
      paymentDetails: isKhqrBank ? {
        bakongAccountId: khqrSession?.bakongAccountId || paymentConfig.bakongAccountId || 'chanmonyroth_hout@bkrt',
        accountName: khqrSession?.merchantName || paymentConfig.accountName || 'CHANMONYROTH HOUT',
        md5: khqrSession?.md5 || null,
        khqrStatus: overrideKhqrStatus || khqrStatus,
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
      clearAllKhqrTimers();
      const res = await axios.post('/orders', orderData);

      const orderHistory = JSON.parse(localStorage.getItem('srey_tha_orders') || '[]');
      const newOrder = {
        id: res.data._id,
        date: new Date().toISOString(),
        total: res.data.subtotal
      };
      localStorage.setItem('srey_tha_orders', JSON.stringify([newOrder, ...orderHistory]));

      setOrderDetails(res.data);
      setIsSuccess(true);
      if (onOrderPlaced) onOrderPlaced();
    } catch (err) {
      console.error('Failed to place order:', err);
      const msg = err.response?.data?.error || t('order_failed_alert');
      alert(msg);
      autoSubmittedRef.current = false;
    } finally {
      setSubmitting(false);
    }
  }, [
    submitting,
    isSuccess,
    formData,
    khqrSession,
    paymentConfig.bakongAccountId,
    paymentConfig.accountName,
    khqrStatus,
    abaTxRef,
    receiptUrl,
    cart,
    subtotal,
    clearAllKhqrTimers,
    onOrderPlaced,
    t
  ]);

  // Automatically place the order and show "Order Succeeded!" as soon as Bakong verifies `PAID`!
  useEffect(() => {
    if (khqrStatus === 'PAID' && !isSuccess && !submitting && !autoSubmittedRef.current) {
      autoSubmittedRef.current = true;
      submitOrderToBackend('PAID');
    }
  }, [khqrStatus, isSuccess, submitting, submitOrderToBackend]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const isKhqrBank = formData.paymentMethod === 'ABA / ACLEDA / Bakong KHQR' || formData.paymentMethod === 'ABA Bank';
    if (isKhqrBank && khqrStatus !== 'PAID') {
      if (khqrSession?.md5) {
        triggerCheckAtSecond(khqrSession.md5, 'manual');
      }
      return;
    }

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

    await submitOrderToBackend();
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
                  label: language === 'kh' ? 'ABA / ACLEDA / Bakong KHQR (ស្កេន QR ទូទាត់ប្រាក់)' : 'ABA / ACLEDA / Bakong KHQR (Scan & Pay)',
                  sub: language === 'kh'
                    ? `គណនី Bakong: ${paymentConfig.bakongAccountId || 'chanmonyroth_hout@bkrt'}`
                    : `Bakong ID: ${paymentConfig.bakongAccountId || 'chanmonyroth_hout@bkrt'}`
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
                border: khqrStatus === 'PAID' ? '2px solid #16a34a' : (khqrStatus === 'EXPIRED' ? '2px solid #94a3b8' : '2px solid #E1232E'),
                borderRadius: '24px',
                overflow: 'hidden',
                boxShadow: '0 12px 32px rgba(225,35,46,0.08)',
                marginBottom: '25px'
              }}>
                {/* KHQR / ABA / ACLEDA Brand Header */}
                <div style={{
                  background: khqrStatus === 'PAID'
                    ? '#16a34a'
                    : 'linear-gradient(135deg, #E1232E 0%, #004B6E 55%, #003A70 100%)',
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
                      {khqrStatus === 'PAID'
                        ? (language === 'kh' ? 'បានបង់ប្រាក់ជោគជ័យ ✓' : 'Payment Verified ✓')
                        : (language === 'kh' ? 'ស្កេន Bakong KHQR' : 'Scan Bakong KHQR')}
                    </span>
                  </div>

                  {/* Live 100s Expiration Timer Badge */}
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.78rem',
                    backgroundColor: khqrStatus === 'EXPIRED' ? '#dc2626' : 'rgba(0,0,0,0.28)',
                    padding: '5px 12px',
                    borderRadius: '50px',
                    fontWeight: '800'
                  }}>
                    <Clock size={14} />
                    <span>
                      {khqrStatus === 'PAID'
                        ? (language === 'kh' ? 'បានទូទាត់រួចរាល់' : 'Paid')
                        : khqrStatus === 'EXPIRED'
                        ? (language === 'kh' ? 'QR ផុតកំណត់ (100s)' : 'QR Expired (100s)')
                        : (language === 'kh' ? `ផុតកំណត់ក្នុង ${secondsLeft}s` : `Expires in ${secondsLeft}s`)}
                    </span>
                  </div>
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px dashed #cbd5e1', paddingBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
                      <div>
                        <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '1px' }}>
                          {language === 'kh' ? 'គណនីទទួលប្រាក់ (BAKONG KHQR)' : 'MERCHANT BAKONG ACCOUNT'}
                        </span>
                        <p style={{ margin: '2px 0 0', fontSize: '1.15rem', fontWeight: '900', color: '#0f172a' }}>
                          {khqrSession?.merchantName || paymentConfig.accountName || 'CHANMONYROTH HOUT'}
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

                    {/* Bakong ID Copy Row */}
                    <div>
                      <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '0.8px' }}>
                        {language === 'kh' ? 'លេខសម្គាល់គណនី BAKONG ID' : 'BAKONG ACCOUNT ID'}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px', flexWrap: 'wrap', gap: '10px' }}>
                        <span style={{ fontSize: 'clamp(0.95rem, 3.8vw, 1.2rem)', fontWeight: '900', color: '#004B6E', fontFamily: 'monospace' }}>
                          {khqrSession?.bakongAccountId || paymentConfig.bakongAccountId || 'chanmonyroth_hout@bkrt'}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(khqrSession?.bakongAccountId || paymentConfig.bakongAccountId || 'chanmonyroth_hout@bkrt');
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                          }}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 14px',
                            borderRadius: '10px',
                            backgroundColor: copied ? '#16a34a' : '#004B6E',
                            color: '#fff',
                            border: 'none',
                            fontWeight: '700',
                            fontSize: '0.78rem',
                            cursor: 'pointer'
                          }}
                        >
                          {copied ? <Check size={14} /> : <Copy size={14} />}
                          {copied ? (language === 'kh' ? 'បានចម្លង!' : 'Copied!') : (language === 'kh' ? 'ចម្លង Bakong ID' : 'Copy ID')}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Bakong KHQR Card */}
                  <div style={{
                    backgroundColor: '#ffffff',
                    border: '2px solid #f1f5f9',
                    borderRadius: '20px',
                    padding: '18px',
                    marginBottom: '18px',
                    textAlign: 'center',
                    boxShadow: '0 6px 20px rgba(15,23,42,0.05)'
                  }}>
                    <div style={{
                      maxWidth: '280px',
                      margin: '0 auto 14px',
                      borderRadius: '18px',
                      overflow: 'hidden',
                      border: khqrStatus === 'EXPIRED' ? '2px solid #94a3b8' : '2px solid #E1232E',
                      backgroundColor: '#ffffff',
                      boxShadow: '0 8px 24px rgba(225,35,46,0.12)',
                      position: 'relative'
                    }}>
                      <div style={{
                        backgroundColor: khqrStatus === 'EXPIRED' ? '#64748b' : '#E1232E',
                        color: '#ffffff',
                        padding: '10px 16px',
                        fontWeight: '900',
                        fontSize: '1.05rem',
                        letterSpacing: '2px',
                        textAlign: 'center'
                      }}>
                        KHQR
                      </div>
                      <div style={{ padding: '12px 16px 8px', textAlign: 'left', borderBottom: '1px dashed #e2e8f0' }}>
                        <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: '800', textTransform: 'uppercase' }}>
                          {khqrSession?.merchantName || paymentConfig.accountName || 'CHANMONYROTH HOUT'}
                        </div>
                        <div style={{ fontSize: '1.35rem', fontWeight: '900', color: '#0f172a', marginTop: '2px' }}>
                          ${subtotal} <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b' }}>USD</span>
                        </div>
                      </div>

                      <div style={{ padding: '14px', backgroundColor: '#ffffff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '220px', position: 'relative' }}>
                        {generatingQr ? (
                          <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '700' }}>
                            {language === 'kh' ? 'កំពុងបង្កើតកូដ KHQR...' : 'Generating KHQR...'}
                          </div>
                        ) : khqrSession?.qrDataUrl ? (
                          <img
                            src={khqrSession.qrDataUrl}
                            alt="Dynamic Bakong KHQR"
                            style={{
                              width: '210px',
                              height: '210px',
                              objectFit: 'contain',
                              borderRadius: '8px',
                              display: 'block',
                              filter: khqrStatus === 'EXPIRED' ? 'blur(5px) grayscale(100%)' : 'none',
                              opacity: khqrStatus === 'EXPIRED' ? 0.35 : 1,
                              transition: 'all 0.3s ease'
                            }}
                          />
                        ) : null}

                        {/* Expired Overlay */}
                        {khqrStatus === 'EXPIRED' && (
                          <div style={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: 'rgba(255,255,255,0.86)',
                            padding: '16px'
                          }}>
                            <Clock size={36} color="#dc2626" style={{ marginBottom: '8px' }} />
                            <div style={{ fontSize: '0.9rem', fontWeight: '900', color: '#0f172a', marginBottom: '4px' }}>
                              {language === 'kh' ? 'កូដ QR បានផុតកំណត់ (100s)' : 'QR Code Expired (100s)'}
                            </div>
                            <button
                              type="button"
                              onClick={generateDynamicKhqr}
                              style={{
                                marginTop: '8px',
                                padding: '9px 16px',
                                borderRadius: '10px',
                                backgroundColor: '#E1232E',
                                color: '#fff',
                                border: 'none',
                                fontWeight: '800',
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}
                            >
                              <RefreshCw size={14} />
                              <span>{language === 'kh' ? 'បង្កើតកូដ QR ថ្មី' : 'Generate New QR'}</span>
                            </button>
                          </div>
                        )}

                        {/* Paid Overlay */}
                        {khqrStatus === 'PAID' && (
                          <div style={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: 'rgba(240,253,244,0.94)',
                            padding: '16px'
                          }}>
                            <CheckCircle size={48} color="#16a34a" style={{ marginBottom: '8px' }} />
                            <div style={{ fontSize: '0.95rem', fontWeight: '900', color: '#15803d' }}>
                              {language === 'kh' ? 'ការទូទាត់ប្រាក់បានជោគជ័យ!' : 'Payment Verified!'}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* ABA & ACLEDA Buttons (Directly opens the KHQR photo share sheet so 1 tap on ABA/ACLEDA loads the QR into Scan QR!) */}
                    {khqrStatus !== 'EXPIRED' && (
                      <div style={{ display: 'grid', gap: '10px', maxWidth: '380px', margin: '0 auto' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                          <button
                            type="button"
                            onClick={() => handleDirectSaveAndOpenBankApp('ABA')}
                            disabled={downloadingQr}
                            style={{
                              padding: '13px 10px',
                              borderRadius: '12px',
                              backgroundColor: '#004B6E',
                              color: '#ffffff',
                              border: 'none',
                              fontWeight: '800',
                              fontSize: '0.92rem',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              boxShadow: '0 4px 12px rgba(0,75,110,0.2)'
                            }}
                          >
                            <span>ABA</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDirectSaveAndOpenBankApp('ACLEDA')}
                            disabled={downloadingQr}
                            style={{
                              padding: '13px 10px',
                              borderRadius: '12px',
                              backgroundColor: '#003A70',
                              color: '#fbbf24',
                              border: '1px solid #f59e0b',
                              fontWeight: '800',
                              fontSize: '0.92rem',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              boxShadow: '0 4px 12px rgba(0,58,112,0.2)'
                            }}
                          >
                            <span>ACLEDA</span>
                          </button>
                        </div>

                        {/* Save QR Image Only Button */}
                        <button
                          type="button"
                          onClick={() => handleDirectSaveAndOpenBankApp(null)}
                          disabled={downloadingQr}
                          style={{
                            width: '100%',
                            padding: '11px 16px',
                            borderRadius: '12px',
                            backgroundColor: '#E1232E',
                            color: '#ffffff',
                            border: 'none',
                            fontWeight: '800',
                            fontSize: '0.84rem',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px'
                          }}
                        >
                          <Download size={16} />
                          <span>
                            {language === 'kh'
                              ? 'ទាញយករូប QR (សម្រាប់ដាក់ក្នុង Scan QR របស់ ABA / ACLEDA)'
                              : 'Download QR Image (For Upload QR in ABA / ACLEDA)'}
                          </span>
                        </button>

                        {/* Instant Verify Payment Button */}
                        <button
                          type="button"
                          onClick={() => {
                            if (khqrSession?.md5) {
                              triggerCheckAtSecond(khqrSession.md5, 'manual');
                            }
                          }}
                          disabled={khqrStatus === 'PAID' || activeCheckSecond !== null}
                          style={{
                            width: '100%',
                            padding: '11px 16px',
                            borderRadius: '12px',
                            backgroundColor: khqrStatus === 'PAID' ? '#16a34a' : '#0f172a',
                            color: '#ffffff',
                            border: 'none',
                            fontWeight: '800',
                            fontSize: '0.84rem',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            boxShadow: '0 4px 14px rgba(15,23,42,0.18)'
                          }}
                        >
                          <RefreshCw size={15} style={{ animation: activeCheckSecond ? 'spin 1s linear infinite' : 'none' }} />
                          <span>
                            {khqrStatus === 'PAID'
                              ? (language === 'kh' ? 'ការទូទាត់បានជោគជ័យ ✓' : 'Payment Verified ✓')
                              : activeCheckSecond
                              ? (language === 'kh' ? 'កំពុងផ្ទៀងផ្ទាត់ការទូទាត់...' : 'Verifying Payment...')
                              : (language === 'kh' ? 'ខ្ញុំបានបង់ប្រាក់រួចរាល់ (ផ្ទៀងផ្ទាត់ភ្លាមៗ)' : 'I Have Paid (Verify Immediately)')}
                          </span>
                        </button>
                      </div>
                    )}

                    <p style={{ margin: '10px 0 0', fontSize: '0.74rem', color: '#64748b', lineHeight: '1.55' }}>
                      {isMobileDevice
                        ? (language === 'kh'
                            ? '📱 លើទូរស័ព្ទ៖ ចុចប៊ូតុង "ABA" ឬ "ACLEDA" ខាងលើ → ជ្រើសរើសកម្មវិធីធនាគារក្នុងប្រអប់ដើម្បីបើក និងបង់ប្រាក់។ ពេលបង់ប្រាក់រួចរាល់ ប្រព័ន្ធនឹងបញ្ជាក់ការកម្មង់ដោយស្វ័យប្រវត្តិ!'
                            : '📱 On Phone: Tap "ABA" or "ACLEDA" above → choose your banking app in the dialog to open and pay. Once paid, your order completes automatically!')
                        : (language === 'kh'
                            ? '💻 លើកុំព្យូទ័រ (Laptop)៖ សូមបើកកម្មវិធី ABA ឬ ACLEDA លើទូរស័ព្ទរបស់អ្នក ហើយស្កេនកូដ QR ខាងលើមុនពេលផុតកំណត់ 100 វិនាទី។ ពេលបង់ប្រាក់រួចរាល់ ប្រព័ន្ធនឹងបញ្ជាក់ការកម្មង់ដោយស្វ័យប្រវត្តិ!'
                            : '💻 On Laptop: Scan the QR code above with ABA or ACLEDA before the 100s timer expires. Once paid, your order completes automatically!')}
                    </p>
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

          {formData.paymentMethod !== 'ABA / ACLEDA / Bakong KHQR' && formData.paymentMethod !== 'ABA Bank' && (
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
          )}
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

      {/* Native-Style "Open with ABA / ACLEDA" App Chooser Bottom-Sheet Modal (No Social Media Icons!) */}
      {showBankChooser && (
        <div
          onClick={() => setShowBankChooser(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '460px',
              backgroundColor: '#1e293b',
              color: '#ffffff',
              borderTopLeftRadius: '24px',
              borderTopRightRadius: '24px',
              padding: '20px 20px 28px',
              boxShadow: '0 -12px 40px rgba(0, 0, 0, 0.45)',
              animation: 'slideUp 0.2s ease-out'
            }}
          >
            {/* Drag Handle */}
            <div style={{ width: '42px', height: '4px', backgroundColor: '#475569', borderRadius: '4px', margin: '0 auto 14px' }} />

            {/* KHQR Photo Card Preview inside the Dialog (just like the photo sheet!) */}
            <div style={{
              maxWidth: '220px',
              margin: '0 auto 14px',
              borderRadius: '14px',
              overflow: 'hidden',
              backgroundColor: '#ffffff',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)'
            }}>
              <div style={{
                backgroundColor: '#E1232E',
                color: '#ffffff',
                padding: '7px 12px',
                fontWeight: '900',
                fontSize: '0.88rem',
                letterSpacing: '1.5px',
                textAlign: 'center'
              }}>
                KHQR
              </div>
              <div style={{ padding: '8px 14px 6px', textAlign: 'left', borderBottom: '1px dashed #e2e8f0' }}>
                <div style={{ fontSize: '0.62rem', color: '#64748b', fontWeight: '800', textTransform: 'uppercase' }}>
                  {khqrSession?.merchantName || paymentConfig.accountName || 'CHANMONYROTH HOUT'}
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: '900', color: '#0f172a' }}>
                  ${subtotal} <span style={{ fontSize: '0.68rem', fontWeight: '700', color: '#64748b' }}>USD</span>
                </div>
              </div>
              <div style={{ padding: '10px', display: 'flex', justifyContent: 'center', backgroundColor: '#ffffff' }}>
                {khqrSession?.qrDataUrl && (
                  <img
                    src={khqrSession.qrDataUrl}
                    alt="KHQR Preview"
                    style={{ width: '150px', height: '150px', objectFit: 'contain', display: 'block' }}
                  />
                )}
              </div>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '14px' }}>
              <div style={{ fontSize: '0.98rem', fontWeight: '800', color: '#f8fafc', marginBottom: '3px' }}>
                {language === 'kh' ? 'បញ្ជូនរូប QR ទៅកាន់កម្មវិធីស្កេនធនាគារ' : 'Send QR Photo to Bank Scanner'}
              </div>
              <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                {language === 'kh'
                  ? 'ចុចលើ ABA ឬ ACLEDA ខាងក្រោមដើម្បីបញ្ចូលរូប QR ទៅកាន់កន្លែងស្កេនដោយស្វ័យប្រវត្តិ'
                  : 'Tap ABA or ACLEDA below to send this QR photo directly into Scan QR'}
              </div>
            </div>

            {/* ONLY Two Banking Apps: 1st ABA Mobile, 2nd ACLEDA Mobile */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '18px' }}>
              {/* 1st Choice: ABA Mobile */}
              <button
                type="button"
                onClick={() => handleDirectSaveAndOpenBankApp('ABA')}
                style={{
                  padding: '18px 14px',
                  borderRadius: '18px',
                  backgroundColor: selectedBankHint === 'ABA' ? '#0f172a' : '#334155',
                  border: selectedBankHint === 'ABA' ? '2px solid #38bdf8' : '2px solid transparent',
                  color: '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '10px',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{
                  width: '58px',
                  height: '58px',
                  borderRadius: '16px',
                  backgroundColor: '#004B6E',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '900',
                  fontSize: '1.15rem',
                  color: '#ffffff',
                  boxShadow: '0 6px 16px rgba(0, 75, 110, 0.5)',
                  border: '1.5px solid rgba(255,255,255,0.2)'
                }}>
                  ABA<span style={{ color: '#E1232E' }}>&#39;</span>
                </div>
                <div style={{ fontWeight: '800', fontSize: '0.92rem' }}>ABA Mobile</div>
                <div style={{ fontSize: '0.7rem', color: '#38bdf8', fontWeight: '700' }}>
                  {language === 'kh' ? 'បើកកម្មវិធី ABA' : 'Open ABA App'}
                </div>
              </button>

              {/* 2nd Choice: ACLEDA Mobile */}
              <button
                type="button"
                onClick={() => handleDirectSaveAndOpenBankApp('ACLEDA')}
                style={{
                  padding: '18px 14px',
                  borderRadius: '18px',
                  backgroundColor: selectedBankHint === 'ACLEDA' ? '#0f172a' : '#334155',
                  border: selectedBankHint === 'ACLEDA' ? '2px solid #fbbf24' : '2px solid transparent',
                  color: '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '10px',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{
                  width: '58px',
                  height: '58px',
                  borderRadius: '16px',
                  backgroundColor: '#003A70',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '900',
                  fontSize: '0.88rem',
                  color: '#fbbf24',
                  boxShadow: '0 6px 16px rgba(0, 58, 112, 0.5)',
                  border: '1.5px solid #f59e0b'
                }}>
                  ACLEDA
                </div>
                <div style={{ fontWeight: '800', fontSize: '0.92rem' }}>ACLEDA Mobile</div>
                <div style={{ fontSize: '0.7rem', color: '#fbbf24', fontWeight: '700' }}>
                  {language === 'kh' ? 'បើកកម្មវិធី ACLEDA' : 'Open ACLEDA App'}
                </div>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowBankChooser(false)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                backgroundColor: '#334155',
                color: '#cbd5e1',
                border: 'none',
                fontWeight: '700',
                fontSize: '0.88rem',
                cursor: 'pointer'
              }}
            >
              {language === 'kh' ? 'បោះបង់ (Cancel)' : 'Cancel'}
            </button>
          </div>
        </div>
      )}
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
