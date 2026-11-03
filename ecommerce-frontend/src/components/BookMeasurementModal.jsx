import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import axios from '../api/axios';
import LocationPickerMap from './LocationPickerMap';

const BookMeasurementModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    phone2: '',
    preferredDate: '',
    windowNotes: '',
    address: '',
    additionalAddress: '',
    latitude: null,
    longitude: null,
    googleMapsUrl: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen || typeof document === 'undefined') return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await axios.post('/orders/book-measurement', formData);
      setSubmitted(true);
    } catch (err) {
      console.error('Failed to book measurement:', err);
      alert('បរាជ័យក្នុងការផ្ញើសំណើ សូមព្យាយាមម្តងទៀត។');
    } finally {
      setSubmitting(false);
    }
  };

  const resetAndClose = () => {
    setSubmitted(false);
    setFormData({
      name: '',
      phone: '',
      preferredDate: '',
      windowNotes: '',
      address: '',
      additionalAddress: '',
      latitude: null,
      longitude: null,
      googleMapsUrl: ''
    });
    onClose();
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 14px',
    borderRadius: '10px',
    border: '1px solid #e4e4e7',
    fontSize: '0.88rem',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: "'Poppins', 'Noto Sans Khmer', 'Kdam Thmor Pro', sans-serif"
  };

  return createPortal(
    <div
      onClick={resetAndClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.55)',
        zIndex: 100000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '12px'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#ffffff',
          width: '100%',
          maxWidth: '580px',
          maxHeight: '92vh',
          overflowY: 'auto',
          borderRadius: '20px',
          padding: '24px 20px',
          boxSizing: 'border-box',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.25)',
          fontFamily: "'Poppins', 'Noto Sans Khmer', 'Kdam Thmor Pro', sans-serif"
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: '#0f172a' }}>
              ណាត់ជាងចុះវាស់វែងដល់ផ្ទះ (ឥតគិតថ្លៃ)
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: '#64748b' }}>
              បំពេញព័ត៌មានខាងក្រោម ក្រុមជាងយើងនឹងទាក់ទងទៅវាស់ទំហំបង្អួចដល់ទីតាំងផ្ទាល់
            </p>
          </div>
          <button
            type="button"
            onClick={resetAndClose}
            style={{
              background: '#f4f4f5',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              fontSize: '1rem',
              fontWeight: '800',
              cursor: 'pointer',
              color: '#0f172a'
            }}
          >
            ✕
          </button>
        </div>

        {submitted ? (
          <div style={{ textAlign: 'center', padding: '35px 15px' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: '#dcfce7',
                color: '#16a34a',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.6rem',
                fontWeight: '900',
                marginBottom: '16px'
              }}
            >
              ✓
            </div>
            <h4 style={{ fontSize: '1.2rem', fontWeight: '800', margin: '0 0 8px 0', color: '#0f172a' }}>
              សំណើណាត់វាស់វែងត្រូវបានផ្ញើជោគជ័យ!
            </h4>
            <p style={{ fontSize: '0.88rem', color: '#64748b', lineHeight: '1.6', marginBottom: '24px' }}>
              ក្រុមការងារ ស្រីថា វាំងនន បានទទួលសំណើរបស់លោកអ្នកតាមរយៈ Telegram ហើយនឹងទាក់ទងទៅតាមលេខទូរស័ព្ទឆាប់ៗនេះ។
            </p>
            <button
              type="button"
              onClick={resetAndClose}
              style={{
                backgroundColor: '#000000',
                color: '#ffffff',
                border: 'none',
                borderRadius: '50px',
                padding: '10px 28px',
                fontSize: '0.85rem',
                fontWeight: '800',
                cursor: 'pointer'
              }}
            >
              បិទផ្ទាំងនេះ
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', marginBottom: '6px', color: '#334155' }}>
                  ឈ្មោះរបស់អ្នក *
                </label>
                <input
                  required
                  placeholder="បញ្ចូលឈ្មោះ..."
                  style={inputStyle}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            </div>

            <div className="responsive-inputs-2col">
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', marginBottom: '6px', color: '#334155' }}>
                  លេខទូរស័ព្ទ (Telegram) *
                </label>
                <input
                  required
                  type="tel"
                  placeholder="012 345 678"
                  style={inputStyle}
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', marginBottom: '6px', color: '#64748b' }}>
                  លេខទូរស័ព្ទទី ២ (ជាជម្រើស)
                </label>
                <input
                  type="tel"
                  placeholder="098 765 432 (បើមាន)"
                  style={inputStyle}
                  value={formData.phone2}
                  onChange={(e) => setFormData({ ...formData, phone2: e.target.value })}
                />
              </div>
            </div>

            <div className="responsive-inputs-2col">
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', marginBottom: '6px', color: '#334155' }}>
                  ថ្ងៃ និងម៉ោងណាត់វាស់វែង
                </label>
                <input
                  placeholder="ឧ. ថ្ងៃស្អែក ម៉ោង 9 ព្រឹក"
                  style={inputStyle}
                  value={formData.preferredDate}
                  onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', marginBottom: '6px', color: '#334155' }}>
                  ចំនួនបង្អួច / ប្រភេទវាំងនន
                </label>
                <input
                  placeholder="ឧ. បង្អួច 3 ផ្ទាំង (វាំងនន និងដក់)"
                  style={inputStyle}
                  value={formData.windowNotes}
                  onChange={(e) => setFormData({ ...formData, windowNotes: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', marginBottom: '6px', color: '#334155' }}>
                ជ្រើសរើសទីតាំងលើផែនទី ឬវាយអាសយដ្ឋាន *
              </label>
              <LocationPickerMap
                initialAddress={formData.address}
                onLocationSelected={(loc) => {
                  setFormData((prev) => ({
                    ...prev,
                    address: loc.fullAddress || prev.address,
                    latitude: loc.lat,
                    longitude: loc.lng,
                    googleMapsUrl: `https://www.google.com/maps?q=${loc.lat},${loc.lng}`
                  }));
                }}
              />
              <input
                required
                placeholder="អាសយដ្ឋានផ្លូវ / សង្កាត់ / ខណ្ឌ..."
                style={{ ...inputStyle, marginTop: '8px' }}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
              <input
                placeholder="លេខផ្ទះ / បុរី / ចំណាំទីតាំងបន្ថែម..."
                style={{ ...inputStyle, marginTop: '8px' }}
                value={formData.additionalAddress}
                onChange={(e) => setFormData({ ...formData, additionalAddress: e.target.value })}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              style={{
                marginTop: '6px',
                width: '100%',
                padding: '14px',
                borderRadius: '50px',
                backgroundColor: '#000000',
                color: '#ffffff',
                border: 'none',
                fontSize: '0.9rem',
                fontWeight: '800',
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.65 : 1,
                fontFamily: "'Poppins', 'Noto Sans Khmer', 'Kdam Thmor Pro', sans-serif"
              }}
            >
              {submitting ? 'កំពុងផ្ញើសំណើ...' : 'បញ្ជាក់ការណាត់ជាងចុះវាស់វែង'}
            </button>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
};

export default BookMeasurementModal;

