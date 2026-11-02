import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Plus, Trash2, Image as ImageIcon, CheckCircle, ChevronDown, ChevronUp, Package, Upload, Sparkles } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const PRESET_COLORS = [
  { label: 'ពណ៌មាស (Gold)', value: 'ពណ៌មាស (Gold)', dot: '#d4af37' },
  { label: 'ពណ៌ប្រាក់ (Silver)', value: 'ពណ៌ប្រាក់ (Silver)', dot: '#94a3b8' },
  { label: 'ពណ៌ខ្មៅ (Black)', value: 'ពណ៌ខ្មៅ (Black)', dot: '#1e293b' },
  { label: 'ពណ៌ស (White)', value: 'ពណ៌ស (White)', dot: '#f8fafc' },
  { label: 'ពណ៌ឈើ (Wood)', value: 'ពណ៌ឈើ (Wood)', dot: '#92400e' },
  { label: 'ពណ៌ស្ពាន់ (Bronze)', value: 'ពណ៌ស្ពាន់ (Bronze)', dot: '#b45309' }
];

const HardwareManager = ({ isCompact }) => {
  const { t } = useLanguage();
  const [hardware, setHardware] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadingPole, setUploadingPole] = useState(false);
  const [uploadingRing, setUploadingRing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
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
      return alert('សូមដាក់ឈ្មោះពណ៌ដង និងកងជាមុនសិន (ឧ. ពណ៌មាស)!');
    }
    if (!newSet.poleImageUrl && !newSet.ringImageUrl) {
      return alert('សូមបង្ហោះរូបភាពយ៉ាងហោចណាស់ ១ សន្លឹក (រូបដង ឬ រូបកង)!');
    }
    try {
      await api.post('/hardware', {
        name: newSet.name.trim(),
        poleImageUrl: newSet.poleImageUrl || '',
        ringImageUrl: newSet.ringImageUrl || ''
      });
      setNewSet({ name: '', poleImageUrl: '', ringImageUrl: '' });
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
    return <div style={{ padding: '40px', textAlign: 'center', letterSpacing: '1px' }}>{t('loading')}</div>;
  }

  return (
    <div>
      {/* Header Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          flexWrap: 'wrap',
          gap: '12px'
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '10px', color: '#0f172a' }}>
            <Package size={22} color="#0284c7" />
            <span>កន្លែងរៀបចំឈុត ដង និងកងវាំងនន (បញ្ចូលតែម្ដង ប្រើបានគ្រប់វាំងនន)</span>
            <span style={{ fontSize: '0.78rem', backgroundColor: '#e0f2fe', padding: '3px 12px', borderRadius: '50px', color: '#0369a1', fontWeight: '800' }}>
              មាន {hardware.length} ឈុត
            </span>
          </h2>
          <p style={{ color: '#475569', fontSize: '0.84rem', marginTop: '6px', marginBottom: 0 }}>
            💡 នៅពេលអ្នកបន្ថែមឈុតពណ៌ <strong>ដង និងកង</strong> នៅទីនេះ វានឹងបង្ហាញឱ្យអតិថិជនជ្រើសរើសដោយស្វ័យប្រវត្តិនៅគ្រប់ផលិតផល <strong>វាំងនន</strong> និង <strong>ដក់</strong> ទាំងអស់ ដោយមិនបាច់បញ្ចូលម្ដងមួយៗឡើយ។
          </p>
        </div>

        <button
          type="button"
          style={{
            border: '1px solid #bae6fd',
            background: '#ffffff',
            color: '#0284c7',
            cursor: 'pointer',
            padding: '7px 14px',
            borderRadius: '10px',
            fontWeight: '700',
            fontSize: '0.8rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          {isExpanded ? <>បង្រួមទុក <ChevronUp size={16} /></> : <>បើកមើល / បន្ថែម <ChevronDown size={16} /></>}
        </button>
      </div>

      {isExpanded && (
        <div style={{ marginTop: '22px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', alignItems: 'start' }}>
          {/* Easy 3-Step Add Form */}
          <div style={{
            backgroundColor: '#ffffff',
            border: '2px solid #bae6fd',
            borderRadius: '18px',
            padding: '20px',
            boxShadow: '0 6px 20px rgba(2, 132, 199, 0.06)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>
              <Sparkles size={18} color="#0284c7" />
              <h3 style={{ fontSize: '0.98rem', fontWeight: '800', margin: 0, color: '#0f172a' }}>
                បន្ថែមឈុតពណ៌ដង និងកងថ្មី (៣ ជំហានងាយៗ)
              </h3>
            </div>

            {/* Step 1: Name + Quick Preset Chips */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '800', color: '#1e293b', marginBottom: '8px' }}>
                ១. ជ្រើសរើស ឬ វាយឈ្មោះពណ៌៖
              </label>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                {PRESET_COLORS.map((preset) => {
                  const isSelected = newSet.name === preset.value;
                  return (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => setNewSet(prev => ({ ...prev, name: preset.value }))}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '5px 10px',
                        borderRadius: '50px',
                        border: isSelected ? '2px solid #0284c7' : '1px solid #e2e8f0',
                        backgroundColor: isSelected ? '#e0f2fe' : '#f8fafc',
                        color: isSelected ? '#0369a1' : '#334155',
                        fontSize: '0.76rem',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      <span style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        backgroundColor: preset.dot,
                        border: '1px solid rgba(0,0,0,0.2)'
                      }} />
                      {preset.label}
                    </button>
                  );
                })}
              </div>

              <input
                placeholder="ឬវាយឈ្មោះពណ៌ផ្ទាល់ខ្លួននៅទីនេះ (ឧ. ពណ៌មាសក្រមៅ)..."
                value={newSet.name}
                onChange={(e) => setNewSet({ ...newSet, name: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  outline: 'none',
                  fontSize: '0.88rem',
                  fontWeight: '600',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Step 2: Upload Pole & Ring Photos */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '800', color: '#1e293b', marginBottom: '8px' }}>
                ២. ដាក់រូបដង និង រូបកង (ដាក់ទាំង ២ ក៏បាន ឬ តែ ១ ក៏បាន)៖
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {/* Pole Upload Box */}
                <div style={{
                  border: newSet.poleImageUrl ? '2px solid #0284c7' : '2px dashed #cbd5e1',
                  borderRadius: '12px',
                  padding: '10px',
                  textAlign: 'center',
                  backgroundColor: '#f8fafc',
                  position: 'relative'
                }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: '800', color: '#0f172a', marginBottom: '6px' }}>
                    📏 រូបដងវាំងនន (Pole)
                  </div>
                  <label style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '95px',
                    borderRadius: '8px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    cursor: 'pointer',
                    overflow: 'hidden'
                  }}>
                    {newSet.poleImageUrl ? (
                      <img src={newSet.poleImageUrl} alt="Pole" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: '#64748b' }}>
                        <Upload size={20} color="#0284c7" />
                        <span style={{ fontSize: '0.74rem', fontWeight: '700', color: '#0284c7' }}>
                          {uploadingPole ? 'កំពុងបង្ហោះ...' : '+ ចុចជ្រើសរើសរូបដង'}
                        </span>
                      </div>
                    )}
                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'pole')} hidden />
                  </label>
                  {newSet.poleImageUrl && (
                    <button
                      type="button"
                      onClick={() => setNewSet(prev => ({ ...prev, poleImageUrl: '' }))}
                      style={{ marginTop: '6px', fontSize: '0.72rem', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '700' }}
                    >
                      លុបរូបដងចេញ
                    </button>
                  )}
                </div>

                {/* Ring Upload Box */}
                <div style={{
                  border: newSet.ringImageUrl ? '2px solid #0284c7' : '2px dashed #cbd5e1',
                  borderRadius: '12px',
                  padding: '10px',
                  textAlign: 'center',
                  backgroundColor: '#f8fafc',
                  position: 'relative'
                }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: '800', color: '#0f172a', marginBottom: '6px' }}>
                    ⭕ រូបកងវាំងនន (Ring)
                  </div>
                  <label style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '95px',
                    borderRadius: '8px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    cursor: 'pointer',
                    overflow: 'hidden'
                  }}>
                    {newSet.ringImageUrl ? (
                      <img src={newSet.ringImageUrl} alt="Ring" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: '#64748b' }}>
                        <Upload size={20} color="#0284c7" />
                        <span style={{ fontSize: '0.74rem', fontWeight: '700', color: '#0284c7' }}>
                          {uploadingRing ? 'កំពុងបង្ហោះ...' : '+ ចុចជ្រើសរើសរូបកង'}
                        </span>
                      </div>
                    )}
                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'ring')} hidden />
                  </label>
                  {newSet.ringImageUrl && (
                    <button
                      type="button"
                      onClick={() => setNewSet(prev => ({ ...prev, ringImageUrl: '' }))}
                      style={{ marginTop: '6px', fontSize: '0.72rem', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '700' }}
                    >
                      លុបរូបកងចេញ
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Step 3: Save Button */}
            <button
              type="button"
              onClick={handleAddSet}
              disabled={uploadingPole || uploadingRing}
              style={{
                width: '100%',
                backgroundColor: '#0284c7',
                color: '#ffffff',
                border: 'none',
                padding: '12px',
                borderRadius: '10px',
                fontWeight: '800',
                cursor: (uploadingPole || uploadingRing) ? 'not-allowed' : 'pointer',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)'
              }}
            >
              {(uploadingPole || uploadingRing) ? t('uploading') : <><Plus size={18} /> ៣. រក្សាទុកឈុតដង និងកងនេះ</>}
            </button>
          </div>

          {/* Right Side: Saved Hardware Sets List */}
          <div>
            <div style={{ fontSize: '0.88rem', fontWeight: '800', color: '#334155', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>ឈុតដង និងកងដែលកំពុងប្រើប្រាស់ ({hardware.length})៖</span>
              <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: '700' }}>✓ ភ្ជាប់ទៅគ្រប់វាំងននដោយស្វ័យប្រវត្តិ</span>
            </div>

            {hardware.length === 0 ? (
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                border: '1px dashed #cbd5e1',
                padding: '35px 20px',
                textAlign: 'center',
                color: '#64748b',
                fontSize: '0.86rem'
              }}>
                មិនទាន់មានឈុតដង និងកងនៅឡើយទេ។ សូមបន្ថែមនៅប្រអប់ខាងឆ្វេង!
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '14px' }}>
                {hardware.map(set => (
                  <div
                    key={set._id}
                    style={{
                      backgroundColor: '#ffffff',
                      borderRadius: '16px',
                      border: '1px solid #e2e8f0',
                      padding: '14px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <CheckCircle color="#16a34a" size={16} />
                        <span style={{ fontSize: '0.9rem', fontWeight: '800', color: '#0f172a' }}>{set.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDelete(set._id)}
                        title="លុបឈុតនេះ"
                        style={{
                          border: '1px solid #fee2e2',
                          background: '#fef2f2',
                          color: '#ef4444',
                          cursor: 'pointer',
                          padding: '5px 8px',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.72rem',
                          fontWeight: '700'
                        }}
                      >
                        <Trash2 size={13} /> លុប
                      </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div style={{ textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: '10px', padding: '6px', border: '1px solid #f1f5f9' }}>
                        <div style={{ height: '65px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRadius: '6px', backgroundColor: '#fff' }}>
                          {set.poleImageUrl ? (
                            <img src={set.poleImageUrl} alt="ដង" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                          ) : (
                            <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>គ្មានរូបដង</span>
                          )}
                        </div>
                        <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#475569', marginTop: '4px', display: 'block' }}>ដង (Pole)</span>
                      </div>

                      <div style={{ textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: '10px', padding: '6px', border: '1px solid #f1f5f9' }}>
                        <div style={{ height: '65px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRadius: '6px', backgroundColor: '#fff' }}>
                          {set.ringImageUrl ? (
                            <img src={set.ringImageUrl} alt="កង" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                          ) : (
                            <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>គ្មានរូបកង</span>
                          )}
                        </div>
                        <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#475569', marginTop: '4px', display: 'block' }}>កង (Ring)</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HardwareManager;
