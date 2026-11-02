import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Plus, Trash2, X, Upload, Check } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const PRESET_COLORS = [
  { label: 'ពណ៌មាស (Gold)', value: 'ពណ៌មាស (Gold)', dot: '#d4af37' },
  { label: 'ពណ៌ប្រាក់ (Silver)', value: 'ពណ៌ប្រាក់ (Silver)', dot: '#94a3b8' },
  { label: 'ពណ៌ខ្មៅ (Black)', value: 'ពណ៌ខ្មៅ (Black)', dot: '#111111' },
  { label: 'ពណ៌ស (White)', value: 'ពណ៌ស (White)', dot: '#ffffff' },
  { label: 'ពណ៌ឈើ (Wood)', value: 'ពណ៌ឈើ (Wood)', dot: '#854d0e' }
];

const HardwareManager = ({ isCompact }) => {
  const { t } = useLanguage();
  const [hardware, setHardware] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [uploadingPole, setUploadingPole] = useState(false);
  const [uploadingRing, setUploadingRing] = useState(false);
  const [newSet, setNewSet] = useState({ name: '', poleImageUrl: '', ringImageUrl: '' });

  useEffect(() => {
    fetchHardware();
  }, []);

  const fetchHardware = async () => {
    try {
      setLoading(true);
      const res = await api.get('/hardware');
      setHardware(res.data || []);
    } catch (err) {
      console.error('Error fetching hardware:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const data = new FormData();
    data.append('image', file);
    try {
      if (type === 'pole') setUploadingPole(true);
      else setUploadingRing(true);

      const res = await api.post('/products/upload', data);
      if (type === 'pole') {
        setNewSet(prev => ({ ...prev, poleImageUrl: res.data.imageUrl }));
      } else {
        setNewSet(prev => ({ ...prev, ringImageUrl: res.data.imageUrl }));
      }
    } catch (err) {
      alert(t('photo_upload_failed'));
    } finally {
      if (type === 'pole') setUploadingPole(false);
      else setUploadingRing(false);
    }
  };

  const handleAddSet = async () => {
    if (!newSet.name.trim()) {
      return alert('សូមជ្រើសរើស ឬ វាយឈ្មោះពណ៌ជាមុនសិន!');
    }
    if (!newSet.poleImageUrl && !newSet.ringImageUrl) {
      return alert('សូមដាក់រូបដង ឬ រូបកងយ៉ាងហោចណាស់ ១ សន្លឹក!');
    }
    try {
      await api.post('/hardware', {
        name: newSet.name.trim(),
        poleImageUrl: newSet.poleImageUrl || '',
        ringImageUrl: newSet.ringImageUrl || ''
      });
      setNewSet({ name: '', poleImageUrl: '', ringImageUrl: '' });
      setShowAddForm(false);
      fetchHardware();
    } catch (err) {
      alert(t('failed_save_product') + ': ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm(t('delete_hardware_confirm'))) {
      try {
        await api.delete(`/hardware/${id}`);
        fetchHardware();
      } catch (err) {
        alert(t('failed_delete_product'));
      }
    }
  };

  if (loading && !isCompact) {
    return <div style={{ padding: '20px', textAlign: 'center', fontSize: '0.8rem', color: '#888' }}>{t('loading')}</div>;
  }

  return (
    <div>
      {/* Minimalist Top Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.95rem', fontWeight: '800', color: '#111111', letterSpacing: '-0.2px' }}>
            ឈុតដង និងកងវាំងនន
          </span>
          <span style={{
            fontSize: '0.72rem',
            backgroundColor: '#111111',
            color: '#ffffff',
            padding: '2px 9px',
            borderRadius: '50px',
            fontWeight: '700'
          }}>
            {hardware.length} ឈុត
          </span>
          <span style={{ fontSize: '0.78rem', color: '#737373' }}>
            • ភ្ជាប់ទៅគ្រប់វាំងនន និង ដក់ ដោយស្វ័យប្រវត្តិ
          </span>
        </div>

        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          style={{
            backgroundColor: showAddForm ? '#ffffff' : '#111111',
            color: showAddForm ? '#111111' : '#ffffff',
            border: '1px solid #111111',
            padding: '7px 14px',
            borderRadius: '8px',
            fontSize: '0.8rem',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.15s ease'
          }}
        >
          {showAddForm ? <><X size={15} /> បិទ</> : <><Plus size={15} /> បន្ថែមដង និងកង</>}
        </button>
      </div>

      {/* Horizontal Minimalist Strip of Saved Hardware Sets */}
      <div style={{
        display: 'flex',
        gap: '10px',
        flexWrap: 'wrap',
        marginTop: '14px'
      }}>
        {hardware.length === 0 && !showAddForm && (
          <div style={{ fontSize: '0.8rem', color: '#888', padding: '6px 0' }}>
            មិនទាន់មានឈុតដង និងកងនៅឡើយទេ — ចុចប៊ូតុង <strong>"+ បន្ថែមដង និងកង"</strong> នៅខាងស្ដាំដើម្បីបង្កើត។
          </div>
        )}

        {hardware.map(set => (
          <div
            key={set._id}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              backgroundColor: '#ffffff',
              border: '1px solid #e5e5e5',
              borderRadius: '12px',
              padding: '7px 12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {set.poleImageUrl && (
                <div style={{ textAlign: 'center' }}>
                  <img
                    src={set.poleImageUrl}
                    alt="ដង"
                    title="ដង"
                    style={{ width: '36px', height: '36px', borderRadius: '6px', objectFit: 'cover', border: '1px solid #efefef', display: 'block' }}
                  />
                  <span style={{ fontSize: '0.6rem', color: '#737373', display: 'block', marginTop: '2px' }}>ដង</span>
                </div>
              )}
              {set.ringImageUrl && (
                <div style={{ textAlign: 'center' }}>
                  <img
                    src={set.ringImageUrl}
                    alt="កង"
                    title="កង"
                    style={{ width: '36px', height: '36px', borderRadius: '6px', objectFit: 'cover', border: '1px solid #efefef', display: 'block' }}
                  />
                  <span style={{ fontSize: '0.6rem', color: '#737373', display: 'block', marginTop: '2px' }}>កង</span>
                </div>
              )}
            </div>

            <span style={{ fontSize: '0.84rem', fontWeight: '700', color: '#111111' }}>
              {set.name}
            </span>

            <button
              type="button"
              onClick={() => handleDelete(set._id)}
              title="លុប"
              style={{
                border: 'none',
                background: 'transparent',
                color: '#a3a3a3',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Clean Minimalist Add Panel */}
      {showAddForm && (
        <div style={{
          marginTop: '14px',
          backgroundColor: '#ffffff',
          border: '1px solid #e5e5e5',
          borderRadius: '14px',
          padding: '16px 18px'
        }}>
          {/* Preset Color Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.76rem', color: '#666', fontWeight: '600', marginRight: '4px' }}>ជ្រើសរើសរហ័ស៖</span>
            {PRESET_COLORS.map((preset) => {
              const active = newSet.name === preset.value;
              return (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => setNewSet(prev => ({ ...prev, name: preset.value }))}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 10px',
                    borderRadius: '50px',
                    border: active ? '1.5px solid #111111' : '1px solid #e5e5e5',
                    backgroundColor: active ? '#111111' : '#ffffff',
                    color: active ? '#ffffff' : '#333333',
                    fontSize: '0.74rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  <span style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: preset.dot,
                    border: '1px solid rgba(0,0,0,0.2)'
                  }} />
                  {preset.label}
                </button>
              );
            })}
          </div>

          {/* Single Clean Row: Name Input + Pole Box + Ring Box + Save Button */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            flexWrap: 'wrap'
          }}>
            <input
              placeholder="ឈ្មោះពណ៌ (ឧ. ពណ៌មាស)..."
              value={newSet.name}
              onChange={(e) => setNewSet({ ...newSet, name: e.target.value })}
              style={{
                flex: '1 1 200px',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #d4d4d4',
                outline: 'none',
                fontSize: '0.85rem',
                fontWeight: '600'
              }}
            />

            {/* Pole Upload */}
            <label style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              height: '40px',
              borderRadius: '8px',
              border: newSet.poleImageUrl ? '1.5px solid #111111' : '1px dashed #bdbdbd',
              backgroundColor: '#fafafa',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: '700',
              color: '#111111',
              boxSizing: 'border-box'
            }}>
              {newSet.poleImageUrl ? (
                <>
                  <img src={newSet.poleImageUrl} alt="ដង" style={{ width: '26px', height: '26px', borderRadius: '4px', objectFit: 'cover' }} />
                  <span>រូបដង ✓</span>
                </>
              ) : (
                <>
                  <Upload size={14} />
                  <span>{uploadingPole ? 'កំពុងដាក់...' : '+ រូបដង'}</span>
                </>
              )}
              <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'pole')} hidden />
            </label>

            {/* Ring Upload */}
            <label style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              height: '40px',
              borderRadius: '8px',
              border: newSet.ringImageUrl ? '1.5px solid #111111' : '1px dashed #bdbdbd',
              backgroundColor: '#fafafa',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: '700',
              color: '#111111',
              boxSizing: 'border-box'
            }}>
              {newSet.ringImageUrl ? (
                <>
                  <img src={newSet.ringImageUrl} alt="កង" style={{ width: '26px', height: '26px', borderRadius: '4px', objectFit: 'cover' }} />
                  <span>រូបកង ✓</span>
                </>
              ) : (
                <>
                  <Upload size={14} />
                  <span>{uploadingRing ? 'កំពុងដាក់...' : '+ រូបកង'}</span>
                </>
              )}
              <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'ring')} hidden />
            </label>

            <button
              type="button"
              onClick={handleAddSet}
              disabled={uploadingPole || uploadingRing}
              style={{
                height: '40px',
                padding: '0 18px',
                backgroundColor: '#111111',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '700',
                fontSize: '0.82rem',
                cursor: (uploadingPole || uploadingRing) ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Check size={15} /> រក្សាទុក
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HardwareManager;
