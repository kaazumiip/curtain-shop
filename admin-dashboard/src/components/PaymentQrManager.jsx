import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { QrCode, Upload, Check, X, Trash2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const PaymentQrManager = () => {
  const { language } = useLanguage();
  const [settings, setSettings] = useState({
    accountName: 'LIM SITHA',
    merchantId: '14463116',
    bakongQrUrl: '',
    acledaAccountNumber: ''
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
        setSettings(prev => ({ ...prev, ...res.data }));
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
            backgroundColor: settings.bakongQrUrl ? '#16a34a' : '#f59e0b',
            color: '#ffffff',
            padding: '3px 10px',
            borderRadius: '50px',
            fontWeight: '700'
          }}>
            {settings.bakongQrUrl
              ? (language === 'kh' ? 'មានរូប QR រួចរាល់ ✓' : 'QR Image Active ✓')
              : (language === 'kh' ? 'សូមដាក់រូប Bakong QR' : 'Upload Bakong QR')}
          </span>

          <span style={{ fontSize: '0.78rem', color: '#475569', fontWeight: '600' }}>
            • {settings.accountName} (ID: {settings.merchantId})
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <label style={{
            backgroundColor: '#E1232E',
            color: '#ffffff',
            padding: '7px 14px',
            borderRadius: '8px',
            fontSize: '0.8rem',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <Upload size={14} />
            <span>
              {uploading
                ? (language === 'kh' ? 'កំពុងបង្ហោះ...' : 'Uploading...')
                : (settings.bakongQrUrl
                    ? (language === 'kh' ? 'ប្តូររូប Bakong QR' : 'Change QR Image')
                    : (language === 'kh' ? '+ ដាក់រូប Bakong / ABA QR' : '+ Upload Bakong / ABA QR'))}
            </span>
            <input type="file" accept="image/*" onChange={handleQrUpload} hidden />
          </label>

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
            {showEditor ? <><X size={14} /> {language === 'kh' ? 'បិទ' : 'Close'}</> : (language === 'kh' ? 'កែព័ត៌មានគណនី' : 'Edit Info')}
          </button>
        </div>
      </div>

      {/* Preview of current QR if uploaded */}
      {settings.bakongQrUrl && !showEditor && (
        <div style={{
          marginTop: '12px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '12px',
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '8px 14px'
        }}>
          <img
            src={settings.bakongQrUrl}
            alt="Bakong KHQR"
            style={{ width: '48px', height: '48px', objectFit: 'contain', borderRadius: '6px', border: '1px solid #eee' }}
          />
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: '800', color: '#0f172a' }}>
              {language === 'kh' ? 'រូបភាព QR កំពុងបង្ហាញលើទំព័រទូទាត់ប្រាក់' : 'QR Image Active on Checkout Page'}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
              {language === 'kh'
                ? 'អតិថិជនអាចចុច "ទាញយករូប QR" រួចបញ្ចូលក្នុងកន្លែង Scan QR របស់ ABA ឬ ACLEDA'
                : 'Customers can download this QR to upload inside ABA or ACLEDA Scan QR'}
            </div>
          </div>
          <button
            type="button"
            onClick={handleRemoveQr}
            title="Remove QR"
            style={{
              border: 'none',
              background: '#fee2e2',
              color: '#dc2626',
              borderRadius: '8px',
              padding: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}

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
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px',
            marginBottom: '14px'
          }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>
                {language === 'kh' ? 'ឈ្មោះគណនី (Account Name)' : 'Account Name'}
              </label>
              <input
                type="text"
                value={settings.accountName}
                onChange={(e) => setSettings({ ...settings, accountName: e.target.value })}
                placeholder="LIM SITHA"
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
                {language === 'kh' ? 'លេខសម្គាល់ ABA / Bakong ID' : 'ABA Merchant / Account ID'}
              </label>
              <input
                type="text"
                value={settings.merchantId}
                onChange={(e) => setSettings({ ...settings, merchantId: e.target.value })}
                placeholder="14463116"
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
                {language === 'kh' ? 'លេខគណនី / ទូរស័ព្ទ ACLEDA (បើមាន)' : 'ACLEDA Account / Phone (Optional)'}
              </label>
              <input
                type="text"
                value={settings.acledaAccountNumber || ''}
                onChange={(e) => setSettings({ ...settings, acledaAccountNumber: e.target.value })}
                placeholder={language === 'kh' ? 'ឧ. 089 902 001' : 'e.g. 089 902 001'}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.85rem',
                  fontWeight: '600'
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
