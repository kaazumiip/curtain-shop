import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { QrCode, Upload, Check, X, Trash2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const PaymentQrManager = () => {
  const { language } = useLanguage();
  const [settings, setSettings] = useState({
    bakongAccountId: 'chanmonyroth_hout@bkrt',
    accountName: 'CHANMONYROTH HOUT',
    merchantId: '14463116',
    bakongToken: '',
    bakongQrUrl: '',
    acledaAccountNumber: '089 902 001'
  });
  const [showEditor, setShowEditor] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/settings/payment');
      if (res.data) {
        setSettings(prev => ({
          ...prev,
          ...res.data,
          bakongAccountId: res.data.bakongAccountId || 'chanmonyroth_hout@bkrt',
          accountName: res.data.accountName || 'CHANMONYROTH HOUT'
        }));
      }
    } catch (err) {
      console.error('Error fetching payment settings:', err);
    }
  };

  const handleQrUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const data = new FormData();
    data.append('image', file);
    try {
      setUploading(true);
      const res = await api.post('/products/upload', data);
      const uploadedUrl = res.data.imageUrl;
      const updated = { ...settings, bakongQrUrl: uploadedUrl };
      setSettings(updated);
      await api.put('/settings/payment', updated);
    } catch (err) {
      alert(language === 'kh' ? 'បរាជ័យក្នុងការបង្ហោះរូបភាព QR!' : 'Failed to upload QR image!');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await api.put('/settings/payment', settings);
      setSettings(prev => ({ ...prev, ...res.data }));
      setShowEditor(false);
    } catch (err) {
      alert(language === 'kh' ? 'បរាជ័យក្នុងការរក្សាទុក!' : 'Failed to save payment settings!');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveQr = async () => {
    if (!window.confirm(language === 'kh' ? 'តើអ្នកពិតជាចង់លុបរូបភាព QR នេះមែនទេ?' : 'Remove custom Bakong QR image?')) return;
    try {
      const updated = { ...settings, bakongQrUrl: '' };
      setSettings(updated);
      await api.put('/settings/payment', updated);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.95rem',
            fontWeight: '800',
            color: '#111111'
          }}>
            <QrCode size={18} color="#E1232E" />
            {language === 'kh' ? 'ការទូទាត់ ABA / ACLEDA / Bakong KHQR' : 'ABA / ACLEDA / Bakong KHQR Payment'}
          </span>

          <span style={{
            fontSize: '0.72rem',
            backgroundColor: '#16a34a',
            color: '#ffffff',
            padding: '3px 10px',
            borderRadius: '50px',
            fontWeight: '700'
          }}>
            {language === 'kh' ? `Dynamic KHQR (${settings.bakongAccountId}) ✓` : `Dynamic KHQR (${settings.bakongAccountId}) ✓`}
          </span>

          <span style={{ fontSize: '0.78rem', color: '#475569', fontWeight: '600' }}>
            • {settings.accountName} (100s Expiry • Checks: 5s, 10s, 30s, 45s, 80s, 100s)
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setShowEditor(!showEditor)}
            style={{
              backgroundColor: showEditor ? '#111111' : '#ffffff',
              color: showEditor ? '#ffffff' : '#111111',
              border: '1px solid #d4d4d4',
              padding: '7px 14px',
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {showEditor ? <><X size={14} /> {language === 'kh' ? 'បិទ' : 'Close'}</> : (language === 'kh' ? 'កែព័ត៌មាន Bakong KHQR' : 'Edit Bakong Settings')}
          </button>
        </div>
      </div>

      {showEditor && (
        <div style={{
          marginTop: '14px',
          backgroundColor: '#ffffff',
          border: '1px solid #e5e5e5',
          borderRadius: '14px',
          padding: '16px 18px'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '12px',
            marginBottom: '14px'
          }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>
                {language === 'kh' ? 'Bakong Account ID (សម្រាប់បង្កើត KHQR)' : 'Bakong Account ID (KHQR)'}
              </label>
              <input
                type="text"
                value={settings.bakongAccountId}
                onChange={(e) => setSettings({ ...settings, bakongAccountId: e.target.value })}
                placeholder="chanmonyroth_hout@bkrt"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.85rem',
                  fontWeight: '700',
                  fontFamily: 'monospace'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>
                {language === 'kh' ? 'ឈ្មោះគណនី (Account Name)' : 'Account Name'}
              </label>
              <input
                type="text"
                value={settings.accountName}
                onChange={(e) => setSettings({ ...settings, accountName: e.target.value })}
                placeholder="CHANMONYROTH HOUT"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.85rem',
                  fontWeight: '700'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>
                {language === 'kh' ? 'Bakong Developer Token (សម្រាប់ពិនិត្យ Status ស្វ័យប្រវត្តិ)' : 'Bakong API Token (Optional for Auto-Check)'}
              </label>
              <input
                type="password"
                value={settings.bakongToken || ''}
                onChange={(e) => setSettings({ ...settings, bakongToken: e.target.value })}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.85rem',
                  fontFamily: 'monospace'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: '9px 18px',
                backgroundColor: '#111111',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '700',
                fontSize: '0.82rem',
                cursor: saving ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Check size={15} />
              <span>{saving ? (language === 'kh' ? 'កំពុងរក្សាទុក...' : 'Saving...') : (language === 'kh' ? 'រក្សាទុក' : 'Save Settings')}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentQrManager;
