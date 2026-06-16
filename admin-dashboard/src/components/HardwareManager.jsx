import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Plus, Trash2, Image as ImageIcon, CheckCircle, ChevronDown, ChevronUp, Package } from 'lucide-react';

const cardStyles = {
  uploadArea: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '60px',
    border: '1px dashed #bddbff',
    borderRadius: '10px',
    cursor: 'pointer',
    backgroundColor: '#fff',
    overflow: 'hidden'
  },
  displayFrame: {
    width: '50px',
    height: '50px',
    borderRadius: '8px',
    overflow: 'hidden',
    border: '1px solid #eee'
  },
  preview: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  input: {
    padding: '10px',
    borderRadius: '8px',
    border: '1px solid #d0e8ff',
    outline: 'none',
    fontSize: '0.8rem'
  }
};

const HardwareManager = ({ isCompact }) => {
  const [hardware, setHardware] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [newSet, setNewSet] = useState({ name: '', ringImageUrl: '', poleImageUrl: '' });

  useEffect(() => {
    fetchHardware();
  }, []);

  const fetchHardware = async () => {
    try {
      setLoading(true);
      const res = await api.get('/hardware');
      setHardware(res.data);
    } catch (err) {
      console.error('Error fetching hardware:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    const data = new FormData();
    data.append('image', file);
    try {
      setUploading(true);
      const res = await api.post('/products/upload', data);
      if (type === 'ring') {
        setNewSet({ ...newSet, ringImageUrl: res.data.imageUrl });
      } else {
        setNewSet({ ...newSet, poleImageUrl: res.data.imageUrl });
      }
    } catch (err) {
      alert('Photo failed to upload.');
    } finally {
      setUploading(false);
    }
  };

  const handleAddSet = async () => {
    if (!newSet.name || !newSet.ringImageUrl || !newSet.poleImageUrl) {
      return alert('Please provide a name and both images.');
    }
    try {
      await api.post('/hardware', newSet);
      setNewSet({ name: '', ringImageUrl: '', poleImageUrl: '' });
      fetchHardware();
    } catch (err) {
      alert('Failed to save hardware set: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this hardware set?')) {
      try {
        await api.delete(`/hardware/${id}`);
        fetchHardware();
      } catch (err) {
        alert('Delete failed.');
      }
    }
  };

  if (loading && !isCompact) return <div style={{ padding: '50px', textAlign: 'center', letterSpacing: '2px' }}>LOADING HARDWARE...</div>;

  return (
    <div>
      <div 
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '10px', color: '#003e6b' }}>
            <Package size={20} />
            Global Hardware Library
            <span style={{ fontSize: '0.7rem', backgroundColor: '#d0e8ff', padding: '2px 8px', borderRadius: '50px', color: '#005fa3' }}>
              {hardware.length} Sets
            </span>
          </h2>
          <p style={{ color: '#547ea0', fontSize: '0.75rem', marginTop: '4px' }}>Manage pole and ring options for all Curtains & Valances.</p>
        </div>
        <button style={{ border: 'none', background: 'none', color: '#005fa3', cursor: 'pointer' }}>
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
      </div>

      {isExpanded && (
        <div style={{ marginTop: '25px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {/* Add New Card */}
          <div style={{ 
            backgroundColor: '#fff', 
            border: '2px dashed #d0e8ff', 
            borderRadius: '16px', 
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '15px'
          }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: '700' }}>Add New Hardware Color</h3>
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <label style={cardStyles.uploadArea}>
                  {newSet.ringImageUrl ? <img src={newSet.ringImageUrl} style={cardStyles.preview} /> : <ImageIcon size={18} color="#accce8" />}
                  <input type="file" onChange={(e) => handleImageUpload(e, 'ring')} hidden />
                </label>
                <span style={{ fontSize: '0.55rem', color: '#999', marginTop: '5px', display: 'block' }}>Ring Image</span>
              </div>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <label style={cardStyles.uploadArea}>
                  {newSet.poleImageUrl ? <img src={newSet.poleImageUrl} style={cardStyles.preview} /> : <ImageIcon size={18} color="#accce8" />}
                  <input type="file" onChange={(e) => handleImageUpload(e, 'pole')} hidden />
                </label>
                <span style={{ fontSize: '0.55rem', color: '#999', marginTop: '5px', display: 'block' }}>Pole Image</span>
              </div>
            </div>

            <input 
              placeholder="Color Name (e.g. Copper)" 
              value={newSet.name}
              onChange={(e) => setNewSet({ ...newSet, name: e.target.value })}
              style={cardStyles.input}
            />

            <button 
              onClick={handleAddSet}
              disabled={uploading}
              style={{ 
                backgroundColor: '#005fa3', 
                color: '#fff', 
                border: 'none', 
                padding: '10px', 
                borderRadius: '8px', 
                fontWeight: '700', 
                cursor: 'pointer',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {uploading ? 'UPLOADING...' : <><Plus size={16} /> SAVE SET</>}
            </button>
          </div>

          {/* Existing Sets */}
          {hardware.map(set => (
            <div key={set._id} style={{ 
              backgroundColor: '#fff', 
              borderRadius: '16px', 
              border: '1px solid #e1f0ff',
              padding: '18px',
              position: 'relative',
              boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{set.name}</span>
                <button onClick={() => handleDelete(set._id)} style={{ border: 'none', background: 'none', color: '#ff4d4d', cursor: 'pointer', opacity: 0.6 }}>
                  <Trash2 size={14} />
                </button>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <div style={cardStyles.displayFrame}>
                  <img src={set.ringImageUrl} style={cardStyles.preview} />
                </div>
                <div style={cardStyles.displayFrame}>
                  <img src={set.poleImageUrl} style={cardStyles.preview} />
                </div>
                <div style={{ flex: 1, textAlign: 'right' }}>
                  <CheckCircle color="#2ecc71" size={16} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HardwareManager;
