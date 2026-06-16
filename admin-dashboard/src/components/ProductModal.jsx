import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { X, Image as ImageIcon, Plus, Trash2, ChevronRight, Settings, Info, Package } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const ProductModal = ({ product, isOpen, onClose, onSave }) => {
  const { t } = useLanguage();
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    nameKh: '',
    description: '',
    descriptionKh: '',
    price: '',
    category: 'Curtain',
    stock: 0,
    images: [], // Array of {url, color}
    customOptions: {
      hasHeaderOptions: false,
      ringPricePerPiece: 0.5,
      ringColors: [],
      sizeOptions: [],
      colorOptions: [],
      cascadeOptions: [],
      hardwareColor: ''
    },
    subCategory: ''
  });
  const [newRingColor, setNewRingColor] = useState({ name: '', imageUrl: '', poleImageUrl: '' });
  const [newProductColor, setNewProductColor] = useState({ name: '', imageUrl: '', swatchUrl: '' });
  const [newCascadeStyle, setNewCascadeStyle] = useState({ name: '', imageUrl: '' });
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (product) {
      const initialData = { ...product };
      // Handle legacy imageUrl if images array is empty
      if (product.imageUrl && (!product.images || product.images.length === 0)) {
        initialData.images = [{ url: product.imageUrl, color: '' }];
      }
      setFormData(initialData);
    } else {
      setFormData({
        name: '',
        nameKh: '',
        description: '',
        descriptionKh: '',
        price: '',
        category: 'Curtain',
        stock: 0,
        images: [],
        customOptions: {
          hasHeaderOptions: false,
          ringPricePerPiece: 0.5,
          ringColors: [],
          sizeOptions: [],
          colorOptions: [],
          cascadeOptions: [],
          hardwareColor: ''
        },
        subCategory: ''
      });
    }
  }, [product, isOpen]);
  
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true);
    } else if (e.type === "dragleave") {
      setIsDragging(false);
    }
  };

  const handleDrop = (e, uploadType) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const fakeEvent = { target: { files: [file] } };
      
      switch(uploadType) {
        case 'main': handleImageUpload(fakeEvent); break;
        case 'productColor': handleProductColorImageUpload(fakeEvent); break;
        case 'ringColor': handleRingImageUpload(fakeEvent); break;
        case 'cascadeStyle': handleCascadeImageUpload(fakeEvent); break;
        default: break;
      }
    }
  };

  const removeProductColor = (index) => {
    // This is now handled by removeGalleryImage
  };


  const handleRingImageUpload = async (e, type = 'ring') => {
    const file = e.target.files[0];
    if (!file) return;
    const data = new FormData();
    data.append('image', file);
    try {
      setUploading(true);
      const res = await api.post('/products/upload', data);
      if (type === 'ring') {
        setNewRingColor({ ...newRingColor, imageUrl: res.data.imageUrl });
      } else {
        setNewRingColor({ ...newRingColor, poleImageUrl: res.data.imageUrl });
      }
    } catch (err) {
      alert(`${type === 'ring' ? 'Ring' : 'Pole'} photo failed to upload.`);
    } finally {
      setUploading(false);
    }
  };

  const addRingColor = () => {
    if (!newRingColor.name || (!newRingColor.imageUrl && !newRingColor.poleImageUrl)) {
      return alert('Name and at least one image required');
    }
    setFormData({
      ...formData,
      customOptions: {
        ...formData.customOptions,
        ringColors: [...formData.customOptions.ringColors, newRingColor]
      }
    });
    setNewRingColor({ name: '', imageUrl: '', poleImageUrl: '' });
  };

  const removeRingColor = (index) => {
    const updated = [...formData.customOptions.ringColors];
    updated.splice(index, 1);
    setFormData({
      ...formData,
      customOptions: { ...formData.customOptions, ringColors: updated }
    });
  };

  const handleCascadeImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const data = new FormData();
    data.append('image', file);
    try {
      setUploading(true);
      const res = await api.post('/products/upload', data);
      setNewCascadeStyle({ ...newCascadeStyle, imageUrl: res.data.imageUrl });
    } catch (err) {
      alert('Cascade style photo failed to upload.');
    } finally {
      setUploading(false);
    }
  };

  const addCascadeStyle = () => {
    if (!newCascadeStyle.name || !newCascadeStyle.imageUrl) return alert('Name and Image required for cascade style');
    setFormData({
      ...formData,
      customOptions: {
        ...formData.customOptions,
        cascadeOptions: [...formData.customOptions.cascadeOptions, newCascadeStyle]
      }
    });
    setNewCascadeStyle({ name: '', imageUrl: '' });
  };

  const removeCascadeStyle = (index) => {
    const updated = [...formData.customOptions.cascadeOptions];
    updated.splice(index, 1);
    setFormData({
      ...formData,
      customOptions: { ...formData.customOptions, cascadeOptions: updated }
    });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const data = new FormData();
    data.append('image', file);

    try {
      setUploading(true);
      const res = await api.post('/products/upload', data);
      setFormData({ 
        ...formData, 
        images: [...(formData.images || []), { url: res.data.imageUrl, color: '' }]
      });
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Photo failed to upload.');
    } finally {
      setUploading(false);
    }
  };

  const removeGalleryImage = (index) => {
    const updated = [...formData.images];
    updated.splice(index, 1);
    setFormData({ ...formData, images: updated });
  };

  const updateImageColor = (index, color) => {
    const updated = [...formData.images];
    updated[index].color = color;
    setFormData({ ...formData, images: updated });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div style={modalStyles.overlay}>
      <div style={modalStyles.container} className="social-modal-container">
        {/* Header - Social Media Style */}
        <div style={modalStyles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={modalStyles.backBtn} onClick={onClose}>
              <X size={20} />
            </div>
            <h2 style={modalStyles.headerTitle}>
              {product ? t('edit_product') : t('new_product')}
            </h2>
          </div>
          <button 
            onClick={handleSubmit} 
            style={modalStyles.publishBtn}
          >
            {product ? t('update_product') : t('add_product')}
          </button>
        </div>

        <div style={modalStyles.content} className="social-modal-content">
          {/* Left Column - Media Preview & Color Tagging */}
          <div style={{ ...modalStyles.mediaSection, flexDirection: 'column', justifyContent: 'flex-start', padding: '20px' }} className="social-modal-media">
            <h4 style={{ ...modalStyles.sectionTitle, marginBottom: '15px', alignSelf: 'flex-start' }}>Product Gallery</h4>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', 
              gap: '15px', 
              width: '100%',
              overflowY: 'auto',
              maxHeight: '100%'
            }}>
              {formData.images?.map((img, idx) => (
                <div key={idx} style={{ position: 'relative', border: '1px solid #eee', borderRadius: '12px', padding: '8px', backgroundColor: '#fff' }}>
                  <img 
                    src={img.url} 
                    style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '8px' }} 
                  />
                  <input 
                    placeholder="Tag color..."
                    value={img.color}
                    onChange={(e) => updateImageColor(idx, e.target.value)}
                    style={{ ...modalStyles.minimalInput, fontSize: '0.65rem', padding: '5px', marginTop: '8px' }}
                  />
                  <button 
                    onClick={() => removeGalleryImage(idx)}
                    style={{ ...modalStyles.removeBtn, top: '-8px', right: '-8px' }}
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
              
              <label style={{ ...modalStyles.addVariationCard, width: '100%', height: '145px', margin: '0' }}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={(e) => handleDrop(e, 'main')}
              >
                <Plus size={24} />
                <span style={{ fontSize: '0.6rem', marginTop: '5px' }}>Add Photo</span>
                <input type="file" onChange={handleImageUpload} hidden accept="image/*" />
              </label>
            </div>

            {uploading && (
              <div style={modalStyles.uploadingOverlay}>
                <div className="spinner"></div>
                <span>Uploading...</span>
              </div>
            )}
          </div>

          {/* Right Column - Information */}
          <div style={modalStyles.infoSection} className="social-modal-info">
            <div style={modalStyles.formScroll}>
              {/* DETAILS SECTION */}
              <div style={{ padding: '20px', borderBottom: '1px solid #efefef' }}>
                <h4 style={{ ...modalStyles.sectionTitle, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Info size={16} />
                  {t('basic_info')}
                </h4>
                
                <div style={modalStyles.inputGroup}>
                  <label style={modalStyles.label}>Category</label>
                  <select 
                    style={modalStyles.minimalSelect}
                    value={formData.category}
                    onChange={(e) => {
                      const newCategory = e.target.value;
                      let update = { ...formData, category: newCategory };
                      if (newCategory === 'Accessories' && !formData.subCategory) {
                        update.subCategory = 'Pole';
                      }
                      setFormData(update);
                    }}
                  >
                    <option value="Curtain">{t('curtain')}</option>
                    <option value="Valance">{t('valance')}</option>
                    <option value="Fabric">{t('fabric')}</option>
                    <option value="Bed Sheet">{t('bed_sheet')}</option>
                    <option value="Pillow Case">{t('pillow_case')}</option>
                    <option value="Accessories">{t('accessories')}</option>
                  </select>
                </div>
                
                {formData.category === 'Accessories' && (
                  <div style={modalStyles.inputGroup}>
                    <label style={modalStyles.label}>{t('sub_category')}</label>
                    <select 
                      style={modalStyles.minimalSelect}
                      value={formData.subCategory}
                      onChange={(e) => setFormData({...formData, subCategory: e.target.value})}
                    >
                      <option value="Pole">{t('pole')}</option>
                      <option value="Ring">{t('ring')}</option>
                      <option value="Bracket">{t('bracket')}</option>
                      <option value="Hook">{t('hook')}</option>
                      <option value="Tassel">{t('tassel')}</option>
                      <option value="Other">{t('other')}</option>
                    </select>
                  </div>
                )}

                <div style={modalStyles.inputGroup}>
                  <label style={modalStyles.label}>Product Name</label>
                  <input 
                    style={modalStyles.minimalInput}
                    placeholder="e.g. Luxurious Velvet"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                
                <div style={modalStyles.inputGroup}>
                  <label style={modalStyles.label}>{t('product_name_kh')}</label>
                  <input 
                    style={{ ...modalStyles.minimalInput, fontFamily: "'Kantumruy Pro', sans-serif" }}
                    placeholder="ឧទាហរណ៍៖ វាំងននសូត្រ"
                    value={formData.nameKh}
                    onChange={(e) => setFormData({...formData, nameKh: e.target.value})}
                  />
                </div>
                
                <div style={modalStyles.inputGroup}>
                  <label style={modalStyles.label}>Description (Optional)</label>
                  <textarea 
                    style={modalStyles.descInput}
                    placeholder="Add product description..."
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                </div>

                <div style={modalStyles.inputGroup}>
                  <label style={modalStyles.label}>{t('description_kh')} (Optional)</label>
                  <textarea 
                    style={{ ...modalStyles.descInput, fontFamily: "'Kantumruy Pro', sans-serif" }}
                    placeholder="បន្ថែមការពិពណ៌នា..."
                    value={formData.descriptionKh}
                    onChange={(e) => setFormData({...formData, descriptionKh: e.target.value})}
                  />
                </div>

                <div style={modalStyles.inputGroup}>
                  <label style={modalStyles.label}>
                    {formData.category === 'Fabric' ? 'Price (£) per 1m' : 'Price (£)'}
                  </label>
                  <input 
                    type="number"
                    style={modalStyles.minimalInput}
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                  />
                </div>

                <div style={modalStyles.inputGroup}>
                  <label style={modalStyles.label}>Stock Quantity</label>
                  <input 
                    type="number"
                    style={modalStyles.minimalInput}
                    value={formData.stock}
                    onChange={(e) => setFormData({...formData, stock: e.target.value})}
                  />
                </div>

                {formData.category === 'Fabric' && (
                  <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#eef9ff', borderRadius: '8px', fontSize: '0.7rem', color: '#0070b3', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <Info size={14} />
                    <span>For fabrics, enter the price for <strong>exactly 1 meter</strong>. The shop will auto-calculate the total based on customer choice.</span>
                  </div>
                )}
              </div>

              {/* VARIATIONS SECTION */}
              <div style={{ padding: '20px' }}>
                <h4 style={{ ...modalStyles.sectionTitle, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Package size={16} />
                  {t('product_variations')}
                </h4>

                {/* Deriving colors from Gallery images instead of a separate list */}
                <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '12px', fontSize: '0.8rem', color: '#666' }}>
                  <Info size={14} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
                  Colors tagged in the <strong>Product Gallery</strong> (left) will automatically appear as color options for customers.
                </div>


                {/* Curtain/Valance Specific Hook Options */}
                {(formData.category === 'Curtain' || formData.category === 'Valance') && (
                  <div style={modalStyles.toggleSection}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                      <span style={modalStyles.sectionTitle}>{t('pole_ring_color')}</span>
                      <span style={{ fontSize: '0.6rem', color: '#0070b3', backgroundColor: '#eef9ff', padding: '4px 8px', borderRadius: '4px' }}>LIBRARY SYNC ACTIVE</span>
                    </div>
                    
                    <p style={{ fontSize: '0.75rem', color: '#666', lineHeight: '1.5' }}>
                      Hardware options (Poles & Rings) are automatically pulled from your **Hardware Library**. To add a new color set, go to the **Hardware** tab in the dashboard.
                    </p>

                    <div style={{ marginTop: '20px', padding: '15px', border: '1px dashed #ccc', borderRadius: '12px' }}>
                      <h5 style={{ fontSize: '0.75rem', marginBottom: '10px' }}>Override / Custom Options (Optional)</h5>
                      <p style={{ fontSize: '0.65rem', color: '#999', marginBottom: '15px' }}>Use this ONLY if you want to add unique hardware that isn't in your global library for this specific product.</p>
                      
                      <div style={{ ...modalStyles.variationGrid, gridTemplateColumns: '1fr' }}>
                        {formData.customOptions.ringColors?.map((rc, idx) => (
                          <div key={idx} style={{ ...modalStyles.variationCard, width: '100%', flexDirection: 'row', justifyContent: 'space-between', padding: '10px', backgroundColor: '#fff', border: '1px solid #eee' }}>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                              <img src={rc.imageUrl || 'https://via.placeholder.com/40?text=No+Ring'} style={{ ...modalStyles.variationThumb, width: '30px', height: '30px' }} />
                              <img src={rc.poleImageUrl || 'https://via.placeholder.com/40?text=No+Pole'} style={{ ...modalStyles.variationThumb, width: '30px', height: '30px' }} />
                              <span style={{ ...modalStyles.variationName, fontSize: '0.75rem' }}>{rc.name}</span>
                            </div>
                            <button onClick={() => removeRingColor(idx)} style={{ ...modalStyles.removeBtn, position: 'static' }}>
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}
                      </div>

                      <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #eee' }}>
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                          <label style={{ ...modalStyles.addVariationCard, flex: 1, height: '60px' }}>
                            {newRingColor.imageUrl ? <img src={newRingColor.imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '0.6rem' }}>+ Ring</span>}
                            <input type="file" onChange={(e) => handleRingImageUpload(e, 'ring')} hidden accept="image/*" />
                          </label>
                          <label style={{ ...modalStyles.addVariationCard, flex: 1, height: '60px' }}>
                            {newRingColor.poleImageUrl ? <img src={newRingColor.poleImageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '0.6rem' }}>+ Pole</span>}
                            <input type="file" onChange={(e) => handleRingImageUpload(e, 'pole')} hidden accept="image/*" />
                          </label>
                        </div>
                        <div style={modalStyles.addVariationForm}>
                          <input 
                            placeholder="Custom Color Name" 
                            style={modalStyles.minimalInput}
                            value={newRingColor.name}
                            onChange={(e) => setNewRingColor({...newRingColor, name: e.target.value})}
                          />
                          <button onClick={addRingColor} style={modalStyles.addBtn}>Add</button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Valance Specific Cascade Styles */}
                {formData.category === 'Valance' && (
                  <div style={{ ...modalStyles.toggleSection, marginTop: '20px' }}>
                    <h4 style={{ ...modalStyles.sectionTitle, marginBottom: '15px' }}>{t('cascade_style')}</h4>
                    <div style={modalStyles.variationGrid}>
                      {formData.customOptions.cascadeOptions?.map((cs, idx) => (
                        <div key={idx} style={modalStyles.variationCard}>
                          <img src={cs.imageUrl} style={modalStyles.variationThumb} />
                          <span style={modalStyles.variationName}>{cs.name}</span>
                          <button onClick={() => removeCascadeStyle(idx)} style={modalStyles.removeBtn}>
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                      <label 
                        style={modalStyles.addVariationCard}
                        onDragOver={handleDrag}
                        onDragLeave={handleDrag}
                        onDrop={(e) => handleDrop(e, 'cascadeStyle')}
                      >
                        <Plus size={20} />
                        <input type="file" onChange={handleCascadeImageUpload} hidden accept="image/*" />
                      </label>
                    </div>
                    {newCascadeStyle.imageUrl && (
                      <div style={modalStyles.addVariationForm}>
                        <input 
                          placeholder="Style Name" 
                          style={modalStyles.minimalInput}
                          value={newCascadeStyle.name}
                          onChange={(e) => setNewCascadeStyle({...newCascadeStyle, name: e.target.value})}
                        />
                        <button onClick={addCascadeStyle} style={modalStyles.addBtn}>Add</button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const modalStyles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.85)',
    backdropFilter: 'blur(10px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
    padding: '20px'
  },
  container: {
    backgroundColor: '#ffffff',
    width: '100%',
    maxWidth: '900px',
    height: '600px',
    borderRadius: '16px',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: '0 50px 100px rgba(0,0,0,0.5)'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 20px',
    borderBottom: '1px solid #efefef',
    height: '60px'
  },
  headerTitle: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#000'
  },
  backBtn: {
    cursor: 'pointer',
    color: '#000',
    display: 'flex',
    alignItems: 'center'
  },
  publishBtn: {
    color: '#000',
    fontWeight: '700',
    fontSize: '0.9rem',
    background: 'none',
    border: 'none',
    cursor: 'pointer'
  },
  content: {
    flex: 1,
    display: 'flex',
    overflow: 'hidden'
  },
  mediaSection: {
    flex: 1.2,
    backgroundColor: '#fafafa',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRight: '1px solid #efefef',
    position: 'relative'
  },
  imageContainer: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  mainImage: {
    width: '100%',
    height: '100%',
    objectFit: 'contain'
  },
  uploadPlaceholder: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    cursor: 'pointer'
  },
  selectBtn: {
    marginTop: '20px',
    backgroundColor: '#0095f6',
    color: '#fff',
    padding: '8px 16px',
    borderRadius: '8px',
    fontSize: '0.85rem',
    fontWeight: '600'
  },
  changeImageBtn: {
    position: 'absolute',
    bottom: '20px',
    right: '20px',
    backgroundColor: 'rgba(0,0,0,0.6)',
    color: '#fff',
    padding: '8px 12px',
    borderRadius: '8px',
    fontSize: '0.75rem',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer'
  },
  infoSection: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  formScroll: {
    flex: 1,
    overflowY: 'auto',
    paddingBottom: '40px'
  },
  inputGroup: {
    marginBottom: '20px'
  },
  label: {
    display: 'block',
    fontSize: '0.7rem',
    color: '#8e8e8e',
    marginBottom: '8px'
  },
  descInput: {
    width: '100%',
    minHeight: '80px',
    border: '1px solid #efefef',
    borderRadius: '8px',
    padding: '12px',
    fontSize: '0.85rem',
    outline: 'none',
    resize: 'vertical'
  },
  row: {
    display: 'flex',
    gap: '15px',
    marginBottom: '20px'
  },
  minimalSelect: {
    width: '100%',
    padding: '10px',
    border: '1px solid #efefef',
    borderRadius: '8px',
    fontSize: '0.85rem',
    outline: 'none',
    backgroundColor: '#fff'
  },
  minimalInput: {
    width: '100%',
    padding: '10px',
    border: '1px solid #efefef',
    borderRadius: '8px',
    fontSize: '0.85rem',
    outline: 'none'
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px'
  },
  sectionTitle: {
    fontSize: '0.9rem',
    fontWeight: '600',
    color: '#000'
  },
  variationGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px'
  },
  variationCard: {
    width: '80px',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '5px'
  },
  variationThumb: {
    width: '80px',
    height: '80px',
    objectFit: 'cover',
    borderRadius: '8px',
    border: '1px solid #efefef'
  },
  variationName: {
    fontSize: '0.65rem',
    color: '#666',
    textAlign: 'center'
  },
  addVariationCard: {
    width: '80px',
    height: '80px',
    border: '1px dashed #ccc',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#ccc'
  },
  removeBtn: {
    position: 'absolute',
    top: '-5px',
    right: '-5px',
    backgroundColor: '#ff4d4d',
    color: '#fff',
    border: 'none',
    borderRadius: '50%',
    width: '20px',
    height: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer'
  },
  addVariationForm: {
    marginTop: '15px',
    display: 'flex',
    gap: '10px'
  },
  addBtn: {
    backgroundColor: '#000',
    color: '#fff',
    border: 'none',
    padding: '0 15px',
    borderRadius: '8px',
    fontSize: '0.75rem',
    cursor: 'pointer'
  },
  sizeList: {
    marginBottom: '15px'
  },
  sizeItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 0',
    borderBottom: '1px solid #fafafa',
    fontSize: '0.85rem'
  },
  sizeForm: {
    display: 'flex',
    gap: '5px'
  },
  miniInput: {
    flex: 1,
    padding: '8px',
    border: '1px solid #efefef',
    borderRadius: '6px',
    fontSize: '0.75rem',
    outline: 'none'
  },
  miniAddBtn: {
    backgroundColor: '#000',
    color: '#fff',
    border: 'none',
    padding: '8px',
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center'
  },
  toggleSection: {
    marginTop: '30px',
    padding: '15px',
    backgroundColor: '#fafafa',
    borderRadius: '12px'
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.8)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    fontSize: '0.8rem',
    color: '#0095f6'
  }
};

export default ProductModal;

