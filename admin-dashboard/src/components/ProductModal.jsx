import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import {
  X,
  Plus,
  Trash2,
  Info,
  Package,
  Check,
  ChevronRight,
  Eye,
  Heart,
  ShoppingBag,
  Image as ImageIcon,
  Upload
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const ProductModal = ({ product, isOpen, onClose, onSave }) => {
  const { t } = useLanguage();
  const [activeStep, setActiveStep] = useState(0);
  const [previewImgIdx, setPreviewImgIdx] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [showCustomHardware, setShowCustomHardware] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    nameKh: '',
    description: '',
    descriptionKh: '',
    price: '',
    originalPrice: '',
    category: 'Curtain',
    stock: 10,
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
  const [newCascadeStyle, setNewCascadeStyle] = useState({ name: '', imageUrl: '' });
  const [newSizeOption, setNewSizeOption] = useState({ name: '', price: '' });
  const [isDragging, setIsDragging] = useState(false);
  const [libraryHardware, setLibraryHardware] = useState([]);

  useEffect(() => {
    if (isOpen) {
      api.get('/hardware')
        .then(res => setLibraryHardware(res.data || []))
        .catch(() => setLibraryHardware([]));
    }
  }, [isOpen]);

  const steps = [
    { id: 0, label: t('step_general') },
    { id: 1, label: t('step_photos') },
    { id: 2, label: t('step_price_options') },
    { id: 3, label: t('step_description') }
  ];

  useEffect(() => {
    setActiveStep(0);
    setPreviewImgIdx(0);
    if (product) {
      const initialData = { ...product };
      const displayName = product.nameKh || product.name || '';
      const displayDesc = product.descriptionKh || product.description || '';
      initialData.name = displayName;
      initialData.nameKh = displayName;
      initialData.description = displayDesc;
      initialData.descriptionKh = displayDesc;

      if (product.imageUrl && (!product.images || product.images.length === 0)) {
        initialData.images = [{ url: product.imageUrl, color: '' }];
      }
      setFormData(initialData);
      setShowCustomHardware(Boolean(product.customOptions?.ringColors?.length > 0));
    } else {
      setFormData({
        name: '',
        nameKh: '',
        description: '',
        descriptionKh: '',
        price: '',
        category: 'Curtain',
        stock: 10,
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
      setShowCustomHardware(false);
    }
  }, [product, isOpen]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  };

  const handleDrop = (e, uploadType) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const fakeEvent = { target: { files: e.dataTransfer.files } };
      switch (uploadType) {
        case 'main': handleImageUpload(fakeEvent); break;
        case 'ringColor': handleRingImageUpload(fakeEvent); break;
        case 'cascadeStyle': handleCascadeImageUpload(fakeEvent); break;
        default: break;
      }
    }
  };

  // Upload multiple images at once
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    try {
      setUploading(true);
      const uploadedItems = [];
      for (const file of files) {
        const data = new FormData();
        data.append('image', file);
        const res = await api.post('/products/upload', data);
        uploadedItems.push({ url: res.data.imageUrl, color: '' });
      }
      setFormData(prev => ({
        ...prev,
        images: [...(prev.images || []), ...uploadedItems]
      }));
    } catch (err) {
      console.error('Upload failed:', err);
      alert(t('photo_upload_failed'));
    } finally {
      setUploading(false);
    }
  };

  // Replace single variant image
  const handleSingleImageReplace = async (e, index) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const data = new FormData();
      data.append('image', file);
      const res = await api.post('/products/upload', data);
      const updated = [...(formData.images || [])];
      updated[index] = { ...updated[index], url: res.data.imageUrl };
      setFormData({ ...formData, images: updated });
      setPreviewImgIdx(index);
    } catch (err) {
      alert(t('photo_upload_failed'));
    } finally {
      setUploading(false);
    }
  };

  const removeGalleryImage = (index) => {
    const updated = [...(formData.images || [])];
    updated.splice(index, 1);
    setFormData({ ...formData, images: updated });
    if (previewImgIdx >= updated.length) {
      setPreviewImgIdx(Math.max(0, updated.length - 1));
    }
  };

  const updateImageColor = (index, color) => {
    const updated = [...(formData.images || [])];
    updated[index].color = color;
    setFormData({ ...formData, images: updated });
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
      alert(type === 'ring' ? t('ring_upload_failed') : t('pole_upload_failed'));
    } finally {
      setUploading(false);
    }
  };

  const addRingColor = () => {
    if (!newRingColor.name || (!newRingColor.imageUrl && !newRingColor.poleImageUrl)) {
      return alert(t('name_required_alert'));
    }
    setFormData({
      ...formData,
      customOptions: {
        ...formData.customOptions,
        ringColors: [...(formData.customOptions?.ringColors || []), newRingColor]
      }
    });
    setNewRingColor({ name: '', imageUrl: '', poleImageUrl: '' });
  };

  const removeRingColor = (index) => {
    const updated = [...(formData.customOptions?.ringColors || [])];
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
      alert(t('cascade_upload_failed'));
    } finally {
      setUploading(false);
    }
  };

  const addCascadeStyle = () => {
    if (!newCascadeStyle.name || !newCascadeStyle.imageUrl) return alert(t('cascade_required_alert'));
    setFormData({
      ...formData,
      customOptions: {
        ...formData.customOptions,
        cascadeOptions: [...(formData.customOptions?.cascadeOptions || []), newCascadeStyle]
      }
    });
    setNewCascadeStyle({ name: '', imageUrl: '' });
  };

  const removeCascadeStyle = (index) => {
    const updated = [...(formData.customOptions?.cascadeOptions || [])];
    updated.splice(index, 1);
    setFormData({
      ...formData,
      customOptions: { ...formData.customOptions, cascadeOptions: updated }
    });
  };

  const addSizeOption = () => {
    if (!newSizeOption.name || !newSizeOption.price) return;
    const sizeObj = {
      name: newSizeOption.name,
      price: Number(newSizeOption.price),
      width: 1
    };
    setFormData({
      ...formData,
      customOptions: {
        ...formData.customOptions,
        sizeOptions: [...(formData.customOptions?.sizeOptions || []), sizeObj]
      }
    });
    setNewSizeOption({ name: '', price: '' });
  };

  const removeSizeOption = (index) => {
    const updated = [...(formData.customOptions?.sizeOptions || [])];
    updated.splice(index, 1);
    setFormData({
      ...formData,
      customOptions: { ...formData.customOptions, sizeOptions: updated }
    });
  };

  const getPriceLabel = () => {
    if (formData.category === 'Curtain' || formData.category === 'Valance') {
      return 'តម្លៃក្នុង ១ ម៉ែត្រទទឹង ($ / m width)';
    }
    if (formData.category === 'Fabric' || (formData.category === 'Accessories' && formData.subCategory === 'Pole')) {
      return t('price_meter');
    }
    return t('price_unit');
  };

  const getPriceHelperInfo = () => {
    if (formData.category === 'Curtain' || formData.category === 'Valance') {
      return 'សម្រាប់វាំងនន និងដក់ តម្លៃគិតតាម ១ ម៉ែត្រទទឹង (កម្ពស់ក្រោម ឬត្រឹម 2.5m មិនគិតបន្ថែមទេ)។ ប្រសិនបើកម្ពស់លើស 2.5m ប្រព័ន្ធនឹងគណនាបន្ថែមតាមចំនួនម៉ែត្រលើសដោយស្វ័យប្រវត្តិ។';
    }
    if (formData.category === 'Fabric') {
      return t('fabrics_calc_info');
    }
    if (formData.category === 'Accessories' && formData.subCategory === 'Pole') {
      return t('pole_calc_info');
    }
    return null;
  };

  const isStepCompleted = (stepIndex) => {
    if (stepIndex === 0) return Boolean((formData.nameKh || formData.name)?.trim());
    if (stepIndex === 1) return Boolean(formData.images?.length > 0);
    if (stepIndex === 2) return Boolean(Number(formData.price) > 0);
    if (stepIndex === 3) return Boolean((formData.descriptionKh || formData.description)?.trim());
    return false;
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    const finalName = (formData.nameKh || formData.name || '').trim();
    if (!finalName) {
      setActiveStep(0);
      return alert('សូមបញ្ចូលឈ្មោះផលិតផល!');
    }
    if (!formData.price && (!formData.customOptions?.sizeOptions || formData.customOptions.sizeOptions.length === 0)) {
      setActiveStep(2);
      return alert('សូមបញ្ចូលតម្លៃផលិតផល!');
    }
    const finalDesc = formData.descriptionKh || formData.description || '';
    onSave({
      ...formData,
      name: finalName,
      nameKh: finalName,
      description: finalDesc,
      descriptionKh: finalDesc
    });
  };

  if (!isOpen) return null;

  const helperInfo = getPriceHelperInfo();
  const activePreviewImage = formData.images?.[previewImgIdx]?.url || formData.images?.[0]?.url || '';
  const displayTitle = formData.nameKh || formData.name || t('product_name_placeholder');
  const displayPrice = formData.customOptions?.sizeOptions?.length > 0
    ? Math.min(...formData.customOptions.sizeOptions.map(s => Number(s.price) || 0)).toFixed(2)
    : Number(formData.price || 0).toFixed(2);

  return (
    <div style={styles.overlay}>
      <div style={styles.modalBox} className="wizard-modal-box">
        
        {/* 1. TOP HEADER BAR */}
        <div style={styles.topHeader} className="wizard-top-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={styles.brandBadge}>SREY THA</span>
            <div style={{ width: '1px', height: '20px', backgroundColor: '#e5e7eb' }} />
            <h2 style={styles.topTitle}>
              {product ? t('edit_product') : t('new_product')}
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <button type="button" onClick={onClose} style={styles.cancelBtn}>
              <X size={15} />
              <span>{t('cancel_btn')}</span>
            </button>
            <button type="button" onClick={handleSubmit} style={styles.saveTopBtn}>
              <Check size={16} />
              <span>{product ? t('update_product') : t('save_product_btn')}</span>
            </button>
          </div>
        </div>

        {/* 2. STEPPER NAVIGATION BAR */}
        <div style={styles.stepperBar} className="wizard-stepper-bar">
          {steps.map((step, idx) => {
            const isActive = activeStep === idx;
            const isDone = isStepCompleted(idx) && !isActive;
            return (
              <React.Fragment key={step.id}>
                <button
                  type="button"
                  onClick={() => setActiveStep(idx)}
                  style={{
                    ...styles.stepPill,
                    backgroundColor: isActive ? '#f0fdf4' : isDone ? '#ecfdf5' : '#fff',
                    borderColor: isActive ? '#16a34a' : isDone ? '#bbf7d0' : '#e5e7eb',
                    color: isActive ? '#15803d' : isDone ? '#16a34a' : '#6b7280',
                    fontWeight: isActive || isDone ? '700' : '500'
                  }}
                >
                  <span style={{
                    ...styles.stepDot,
                    backgroundColor: isDone ? '#16a34a' : isActive ? '#fff' : '#fff',
                    borderColor: isDone || isActive ? '#16a34a' : '#d1d5db',
                    color: isDone ? '#fff' : '#16a34a'
                  }}>
                    {isDone ? <Check size={10} strokeWidth={3} /> : (
                      isActive ? <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#16a34a' }} /> : null
                    )}
                  </span>
                  <span>{step.label}</span>
                </button>
                {idx < steps.length - 1 && (
                  <ChevronRight size={15} color="#d1d5db" style={{ flexShrink: 0 }} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* 3. MAIN SPLIT BODY */}
        <div style={styles.mainBody} className="wizard-main-body">
          
          {/* LEFT PANE: FORM STEPS */}
          <div style={styles.leftFormPane} className="wizard-left-pane">
            <div style={styles.formScrollArea} className="wizard-form-scroll">

              {/* ==================== STEP 0: GENERAL INFO ==================== */}
              {activeStep === 0 && (
                <div>
                  <div style={styles.sectionHeaderRow}>
                    <div style={styles.sectionIconBadge}><Info size={16} color="#4b5563" /></div>
                    <h3 style={styles.sectionHeading}>{t('step_general')}</h3>
                  </div>

                  {/* Row 1: Product Name */}
                  <div style={styles.formRow} className="wizard-form-row">
                    <div style={styles.rowLabelCol}>
                      <div style={styles.rowTitle}>{t('product_name_label')}</div>
                      <div style={styles.rowSub}>{t('product_name_sub')}</div>
                    </div>
                    <div style={styles.rowInputCol}>
                      <input
                        style={styles.textInput}
                        placeholder={t('product_name_placeholder')}
                        value={formData.nameKh || formData.name}
                        onChange={(e) => setFormData({
                          ...formData,
                          name: e.target.value,
                          nameKh: e.target.value
                        })}
                      />
                    </div>
                  </div>

                  {/* Row 2: Category & Sub-Category */}
                  <div style={styles.formRow} className="wizard-form-row">
                    <div style={styles.rowLabelCol}>
                      <div style={styles.rowTitle}>{t('category_label')}</div>
                      <div style={styles.rowSub}>{t('category_sub')}</div>
                    </div>
                    <div style={{ ...styles.rowInputCol, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <select
                        style={styles.selectInput}
                        value={formData.category}
                        onChange={(e) => {
                          const newCategory = e.target.value;
                          let update = { ...formData, category: newCategory };
                          if (newCategory === 'Accessories' && !formData.subCategory) {
                            update.subCategory = 'Pole';
                          } else if (newCategory !== 'Accessories') {
                            update.subCategory = '';
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

                      {formData.category === 'Accessories' && (
                        <select
                          style={styles.selectInput}
                          value={formData.subCategory}
                          onChange={(e) => setFormData({ ...formData, subCategory: e.target.value })}
                        >
                          <option value="Pole">{t('pole')}</option>
                          <option value="Ring">{t('ring')}</option>
                          <option value="Bracket">{t('bracket')}</option>
                          <option value="Hook">{t('hook')}</option>
                          <option value="Tassel">{t('tassel')}</option>
                          <option value="Other">{t('other')}</option>
                        </select>
                      )}
                    </div>
                  </div>

                  {/* Row 3: Quick Color Variants List (Just like screenshot!) */}
                  <div style={{ ...styles.formRow, borderBottom: 'none' }} className="wizard-form-row">
                    <div style={styles.rowLabelCol}>
                      <div style={styles.rowTitle}>{t('color_variants_label')}</div>
                      <div style={styles.rowSub}>{t('color_variants_sub')}</div>
                    </div>
                    <div style={styles.rowInputCol}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {formData.images?.map((img, idx) => (
                          <div key={idx} style={styles.variantRow}>
                            <img
                              src={img.url}
                              alt=""
                              onClick={() => setPreviewImgIdx(idx)}
                              style={{
                                width: '34px',
                                height: '34px',
                                borderRadius: '50%',
                                objectFit: 'cover',
                                border: previewImgIdx === idx ? '2px solid #16a34a' : '1px solid #e5e7eb',
                                cursor: 'pointer',
                                flexShrink: 0
                              }}
                            />
                            <input
                              style={styles.variantInput}
                              placeholder={t('tag_color_placeholder')}
                              value={img.color}
                              onChange={(e) => updateImageColor(idx, e.target.value)}
                            />
                            <label style={styles.iconActionBtn} title="ប្តូររូបភាព">
                              <Upload size={14} />
                              <input type="file" hidden accept="image/*" onChange={(e) => handleSingleImageReplace(e, idx)} />
                            </label>
                            <button
                              type="button"
                              onClick={() => removeGalleryImage(idx)}
                              style={{ ...styles.iconActionBtn, color: '#ef4444' }}
                              title="លុប"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}

                        <label style={styles.addVariantLink}>
                          <Plus size={15} />
                          <span>{uploading ? t('uploading') : t('add_color_variant')}</span>
                          <input type="file" multiple hidden accept="image/*" onChange={handleImageUpload} />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ==================== STEP 1: PRODUCT PICTURES ==================== */}
              {activeStep === 1 && (
                <div>
                  <div style={styles.sectionHeaderRow}>
                    <div style={styles.sectionIconBadge}><ImageIcon size={16} color="#4b5563" /></div>
                    <h3 style={styles.sectionHeading}>{t('product_gallery')}</h3>
                  </div>
                  <p style={{ fontSize: '0.92rem', color: '#6b7280', marginBottom: '20px' }}>
                    {t('gallery_color_hint')}
                  </p>

                  <div
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={(e) => handleDrop(e, 'main')}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(135px, 1fr))',
                      gap: '15px'
                    }}
                  >
                    {formData.images?.map((img, idx) => (
                      <div
                        key={idx}
                        onClick={() => setPreviewImgIdx(idx)}
                        style={{
                          position: 'relative',
                          border: previewImgIdx === idx ? '2px solid #16a34a' : '1px solid #e5e7eb',
                          borderRadius: '12px',
                          padding: '8px',
                          backgroundColor: '#fff',
                          cursor: 'pointer'
                        }}
                      >
                        <img
                          src={img.url}
                          alt=""
                          style={{ width: '100%', height: '110px', objectFit: 'cover', borderRadius: '8px' }}
                        />
                        <input
                          placeholder={t('tag_color_placeholder')}
                          value={img.color}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => updateImageColor(idx, e.target.value)}
                          style={{ ...styles.textInput, padding: '6px 8px', fontSize: '0.88rem', marginTop: '8px' }}
                        />
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); removeGalleryImage(idx); }}
                          style={styles.floatingRemoveBtn}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}

                    <label style={{
                      border: isDragging ? '2px dashed #16a34a' : '2px dashed #d1d5db',
                      borderRadius: '12px',
                      height: '165px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      backgroundColor: '#f9fafb',
                      color: '#6b7280',
                      gap: '8px'
                    }}>
                      <Plus size={26} color="#16a34a" />
                      <span style={{ fontSize: '0.88rem', fontWeight: '700', color: '#16a34a' }}>
                        {uploading ? t('uploading') : t('add_photo')}
                      </span>
                      <input type="file" multiple hidden accept="image/*" onChange={handleImageUpload} />
                    </label>
                  </div>
                </div>
              )}

              {/* ==================== STEP 2: PRICE & OPTIONS ==================== */}
              {activeStep === 2 && (
                <div>
                  <div style={styles.sectionHeaderRow}>
                    <div style={styles.sectionIconBadge}><Package size={16} color="#4b5563" /></div>
                    <h3 style={styles.sectionHeading}>{t('step_price_options')}</h3>
                  </div>

                  {/* Row 1: Price & Stock */}
                  <div style={styles.formRow} className="wizard-form-row">
                    <div style={styles.rowLabelCol}>
                      <div style={styles.rowTitle}>{getPriceLabel()}</div>
                      <div style={styles.rowSub}>{t('price_stock_sub')}</div>
                    </div>
                    <div style={styles.rowInputCol}>
                      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: '140px' }}>
                          <label style={styles.miniFieldLabel}>{getPriceLabel()} (តម្លៃលក់ $)</label>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            style={styles.textInput}
                            value={formData.price}
                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                          />
                        </div>
                        <div style={{ flex: 1, minWidth: '140px' }}>
                          <label style={styles.miniFieldLabel}>តម្លៃដើម មុនបញ្ចុះតម្លៃ ($)</label>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="ទុកទទេបើគ្មានបញ្ចុះតម្លៃ"
                            style={styles.textInput}
                            value={formData.originalPrice || ''}
                            onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                          />
                        </div>
                        <div style={{ width: '120px' }}>
                          <label style={styles.miniFieldLabel}>{t('stock_quantity')}</label>
                          <input
                            type="number"
                            style={styles.textInput}
                            value={formData.stock}
                            onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                          />
                        </div>
                      </div>

                      {helperInfo && (
                        <div style={{ marginTop: '12px', padding: '10px 12px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', fontSize: '0.88rem', color: '#15803d', display: 'flex', gap: '8px', alignItems: 'flex-start', lineHeight: '1.5' }}>
                          <Info size={15} style={{ flexShrink: 0, marginTop: '2px' }} />
                          <span>{helperInfo}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Row 2: Bed Sheet / Pillow Case Sizes */}
                  {(formData.category === 'Bed Sheet' || formData.category === 'Pillow Case') && (
                    <div style={styles.formRow} className="wizard-form-row">
                      <div style={styles.rowLabelCol}>
                        <div style={styles.rowTitle}>{t('size_options_title')}</div>
                        <div style={styles.rowSub}>{t('size_options_desc')}</div>
                      </div>
                      <div style={styles.rowInputCol}>
                        {formData.customOptions?.sizeOptions?.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                            {formData.customOptions.sizeOptions.map((sz, idx) => (
                              <div key={idx} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '6px 12px',
                                borderRadius: '8px',
                                backgroundColor: '#ecfdf5',
                                border: '1px solid #16a34a',
                                color: '#15803d',
                                fontSize: '0.92rem',
                                fontWeight: '700'
                              }}>
                                <span>{sz.name} (${Number(sz.price).toFixed(2)})</span>
                                <X size={13} style={{ cursor: 'pointer' }} onClick={() => removeSizeOption(idx)} />
                              </div>
                            ))}
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <input
                            placeholder={t('size_name_placeholder')}
                            style={{ ...styles.textInput, flex: 1 }}
                            value={newSizeOption.name}
                            onChange={(e) => setNewSizeOption({ ...newSizeOption, name: e.target.value })}
                          />
                          <input
                            type="number"
                            placeholder={t('size_price_placeholder')}
                            style={{ ...styles.textInput, width: '95px' }}
                            value={newSizeOption.price}
                            onChange={(e) => setNewSizeOption({ ...newSizeOption, price: e.target.value })}
                          />
                          <button type="button" onClick={addSizeOption} style={styles.greenActionBtn}>
                            <Plus size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Row 3: Curtain / Valance Hardware */}
                  {(formData.category === 'Curtain' || formData.category === 'Valance') && (
                    <div style={{ ...styles.formRow, borderBottom: formData.category === 'Valance' ? '1px dashed #e5e7eb' : 'none' }} className="wizard-form-row">
                      <div style={styles.rowLabelCol}>
                        <div style={styles.rowTitle}>{t('pole_ring_color')}</div>
                        <div style={styles.rowSub}>{t('hardware_sync_desc')}</div>
                      </div>
                      <div style={styles.rowInputCol}>
                        <div style={{ marginBottom: '10px' }}>
                          <span style={{ fontSize: '0.88rem', color: '#15803d', backgroundColor: '#ecfdf5', padding: '5px 12px', borderRadius: '50px', fontWeight: '700', border: '1px solid #bbf7d0', display: 'inline-block' }}>
                            ✓ ភ្ជាប់ឈុតដង និងកងពីបណ្ណាល័យរួចរាល់ ({libraryHardware.length} ឈុត)
                          </span>
                        </div>

                        {libraryHardware.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px', padding: '10px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                            {libraryHardware.map((hw) => (
                              <div key={hw._id} style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#fff', padding: '5px 10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.8rem', fontWeight: '700', color: '#1e293b' }}>
                                {hw.poleImageUrl && <img src={hw.poleImageUrl} alt="ដង" style={{ width: '24px', height: '24px', borderRadius: '4px', objectFit: 'contain', border: '1px solid #f1f5f9' }} />}
                                {hw.ringImageUrl && <img src={hw.ringImageUrl} alt="កង" style={{ width: '24px', height: '24px', borderRadius: '4px', objectFit: 'contain', border: '1px solid #f1f5f9' }} />}
                                <span>{hw.name}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => setShowCustomHardware(!showCustomHardware)}
                          style={{
                            background: '#f9fafb',
                            border: '1px dashed #d1d5db',
                            borderRadius: '8px',
                            padding: '8px 12px',
                            fontSize: '0.88rem',
                            color: '#374151',
                            cursor: 'pointer',
                            width: '100%',
                            textAlign: 'left',
                            fontWeight: '600'
                          }}
                        >
                          {showCustomHardware ? t('hide_custom_hardware') : t('show_custom_hardware')}
                        </button>

                        {showCustomHardware && (
                          <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '10px', border: '1px solid #e5e7eb' }}>
                            {formData.customOptions?.ringColors?.map((rc, idx) => (
                              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', backgroundColor: '#fff', borderRadius: '8px', marginBottom: '6px', border: '1px solid #eee' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  {rc.imageUrl && <img src={rc.imageUrl} alt="" style={{ width: '28px', height: '28px', borderRadius: '6px', objectFit: 'cover' }} />}
                                  {rc.poleImageUrl && <img src={rc.poleImageUrl} alt="" style={{ width: '28px', height: '28px', borderRadius: '6px', objectFit: 'cover' }} />}
                                  <span style={{ fontSize: '0.92rem', fontWeight: '600' }}>{rc.name}</span>
                                </div>
                                <Trash2 size={14} color="#ef4444" style={{ cursor: 'pointer' }} onClick={() => removeRingColor(idx)} />
                              </div>
                            ))}
                            <div style={{ display: 'flex', gap: '8px', marginTop: '8px', marginBottom: '8px' }}>
                              <label style={styles.miniUploadBox}>
                                {newRingColor.imageUrl ? <img src={newRingColor.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '6px' }} /> : <span>{t('ring_photo')}</span>}
                                <input type="file" hidden accept="image/*" onChange={(e) => handleRingImageUpload(e, 'ring')} />
                              </label>
                              <label style={styles.miniUploadBox}>
                                {newRingColor.poleImageUrl ? <img src={newRingColor.poleImageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '6px' }} /> : <span>{t('pole_photo')}</span>}
                                <input type="file" hidden accept="image/*" onChange={(e) => handleRingImageUpload(e, 'pole')} />
                              </label>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <input
                                placeholder={t('custom_color_name')}
                                style={{ ...styles.textInput, flex: 1 }}
                                value={newRingColor.name}
                                onChange={(e) => setNewRingColor({ ...newRingColor, name: e.target.value })}
                              />
                              <button type="button" onClick={addRingColor} style={styles.greenActionBtn}>{t('add')}</button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Row 4: Valance Cascade Style */}
                  {formData.category === 'Valance' && (
                    <div style={{ ...styles.formRow, borderBottom: 'none' }} className="wizard-form-row">
                      <div style={styles.rowLabelCol}>
                        <div style={styles.rowTitle}>{t('cascade_style')}</div>
                      </div>
                      <div style={styles.rowInputCol}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
                          {formData.customOptions?.cascadeOptions?.map((cs, idx) => (
                            <div key={idx} style={{ position: 'relative', width: '70px', textAlign: 'center' }}>
                              <img src={cs.imageUrl} alt="" style={{ width: '70px', height: '70px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #e5e7eb' }} />
                              <div style={{ fontSize: '1.02rem', marginTop: '4px' }}>{cs.name}</div>
                              <button type="button" onClick={() => removeCascadeStyle(idx)} style={styles.floatingRemoveBtn}>
                                <X size={10} />
                              </button>
                            </div>
                          ))}
                          <label style={{ width: '70px', height: '70px', border: '1px dashed #d1d5db', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                            <Plus size={18} color="#6b7280" />
                            <input type="file" hidden accept="image/*" onChange={handleCascadeImageUpload} />
                          </label>
                        </div>
                        {newCascadeStyle.imageUrl && (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <input
                              placeholder={t('style_name')}
                              style={{ ...styles.textInput, flex: 1 }}
                              value={newCascadeStyle.name}
                              onChange={(e) => setNewCascadeStyle({ ...newCascadeStyle, name: e.target.value })}
                            />
                            <button type="button" onClick={addCascadeStyle} style={styles.greenActionBtn}>{t('add')}</button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ==================== STEP 3: DESCRIPTION ==================== */}
              {activeStep === 3 && (
                <div>
                  <div style={styles.sectionHeaderRow}>
                    <div style={styles.sectionIconBadge}><Info size={16} color="#4b5563" /></div>
                    <h3 style={styles.sectionHeading}>{t('step_description')}</h3>
                  </div>

                  <div style={{ ...styles.formRow, borderBottom: 'none' }} className="wizard-form-row">
                    <div style={styles.rowLabelCol}>
                      <div style={styles.rowTitle}>{t('description_label')}</div>
                      <div style={styles.rowSub}>{t('description_placeholder')}</div>
                    </div>
                    <div style={styles.rowInputCol}>
                      <textarea
                        style={{
                          ...styles.textInput,
                          minHeight: '160px',
                          resize: 'vertical',
                          lineHeight: '1.6'
                        }}
                        placeholder={t('description_placeholder')}
                        value={formData.descriptionKh || formData.description}
                        onChange={(e) => setFormData({
                          ...formData,
                          description: e.target.value,
                          descriptionKh: e.target.value
                        })}
                      />
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* BOTTOM WIZARD FOOTER (Previous / Next) */}
            <div style={styles.bottomNavFooter} className="wizard-bottom-footer">
              <button
                type="button"
                disabled={activeStep === 0}
                onClick={() => setActiveStep(prev => Math.max(0, prev - 1))}
                style={{
                  ...styles.prevBtn,
                  opacity: activeStep === 0 ? 0.4 : 1,
                  cursor: activeStep === 0 ? 'not-allowed' : 'pointer'
                }}
              >
                {t('prev_step')}
              </button>

              {activeStep < steps.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setActiveStep(prev => Math.min(steps.length - 1, prev + 1))}
                  style={styles.nextBtn}
                >
                  {t('next_step')}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  style={styles.nextBtn}
                >
                  {product ? t('update_product') : t('save_product_btn')}
                </button>
              )}
            </div>
          </div>

          {/* RIGHT PANE: LIVE PRODUCT CARD PREVIEW */}
          <div style={styles.rightPreviewPane} className="wizard-preview-pane">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px', color: '#4b5563' }}>
              <Eye size={16} />
              <span style={{ fontSize: '0.98rem', fontWeight: '700' }}>{t('product_card_preview')}</span>
            </div>

            <div style={styles.previewCard}>
              {/* Image Preview Box */}
              <div style={styles.previewImgBox}>
                {activePreviewImage ? (
                  <img
                    src={activePreviewImage}
                    alt="Preview"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#9ca3af', gap: '8px' }}>
                    <ImageIcon size={36} strokeWidth={1.5} />
                    <span style={{ fontSize: '0.88rem' }}>{t('no_image_preview')}</span>
                  </div>
                )}

                {/* Heart Icon Top Right */}
                <div style={styles.previewHeartBtn}>
                  <Heart size={15} color="#ef4444" fill="#ef4444" />
                </div>

                {/* Pagination Dots */}
                {formData.images?.length > 1 && (
                  <div style={styles.previewDotsRow}>
                    {formData.images.map((_, i) => (
                      <div
                        key={i}
                        onClick={() => setPreviewImgIdx(i)}
                        style={{
                          width: '7px',
                          height: '7px',
                          borderRadius: '50%',
                          backgroundColor: previewImgIdx === i ? '#16a34a' : 'rgba(255,255,255,0.8)',
                          cursor: 'pointer',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Card Details */}
              <div style={{ padding: '16px 4px 4px' }}>
                <div style={{ fontSize: '1.02rem', color: '#9ca3af', textTransform: 'uppercase', fontWeight: '700', marginBottom: '4px' }}>
                  {formData.subCategory ? t(formData.subCategory.toLowerCase()) : t(formData.category.toLowerCase().replace(' ', '_'))}
                </div>
                <h4 style={{ fontSize: '1.22rem', fontWeight: '800', color: '#111827', margin: '0 0 10px 0' }}>
                  {displayTitle}
                </h4>

                {/* Decorative skeleton lines if no description, or short preview */}
                {formData.descriptionKh || formData.description ? (
                  <p style={{ fontSize: '0.88rem', color: '#6b7280', margin: '0 0 14px 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {formData.descriptionKh || formData.description}
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
                    <div style={{ height: '8px', width: '85%', backgroundColor: '#f3f4f6', borderRadius: '4px' }} />
                    <div style={{ height: '8px', width: '60%', backgroundColor: '#f3f4f6', borderRadius: '4px' }} />
                  </div>
                )}

                {/* Swatch circles & Sizes row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    {formData.images?.length > 0 ? (
                      formData.images.slice(0, 5).map((img, i) => (
                        <div
                          key={i}
                          onClick={() => setPreviewImgIdx(i)}
                          title={img.color || `រូបទី ${i + 1}`}
                          style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            padding: '2px',
                            border: previewImgIdx === i ? '2px solid #16a34a' : '1px solid #e5e7eb',
                            cursor: 'pointer'
                          }}
                        >
                          <img src={img.url} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                        </div>
                      ))
                    ) : (
                      ['#111827', '#dc2626', '#0284c7', '#1e3a8a'].map((c, i) => (
                        <div key={i} style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: c, opacity: 0.25 }} />
                      ))
                    )}
                  </div>

                  <div style={{ fontSize: '0.94rem', color: '#16a34a', fontWeight: '700' }}>
                    {Number(formData.stock) > 0 ? `${formData.stock} ${t('in_stock')}` : t('status_sold_out')}
                  </div>
                </div>

                {/* Price Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                    <span style={{ fontSize: '1.25rem', fontWeight: '900', color: '#111827' }}>
                      ${displayPrice}
                    </span>
                    {Number(formData.originalPrice) > Number(formData.price) && (
                      <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#9ca3af', textDecoration: 'line-through' }}>
                        ${Number(formData.originalPrice).toFixed(2)}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.88rem', color: '#f59e0b' }}>
                    ★★★★★ <span style={{ color: '#9ca3af', fontSize: '0.94rem' }}>({formData.images?.length || 1})</span>
                  </div>
                </div>

                {/* Action Bottom Row */}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#4b5563'
                  }}>
                    <ShoppingBag size={17} />
                  </div>
                  <div style={{
                    flex: 1,
                    height: '40px',
                    borderRadius: '8px',
                    backgroundColor: '#1f2937',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.92rem',
                    fontWeight: '700'
                  }}>
                    {t('buy_now_preview')}
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(17, 24, 39, 0.65)',
    backdropFilter: 'blur(6px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
    padding: 'clamp(8px, 2vw, 20px)',
    fontFamily: "'Poppins', 'Noto Sans Khmer', 'Kdam Thmor Pro', sans-serif"
  },
  modalBox: {
    backgroundColor: '#ffffff',
    width: '100%',
    maxWidth: '1120px',
    height: '88vh',
    maxHeight: '780px',
    borderRadius: '18px',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: '0 25px 70px rgba(0, 0, 0, 0.25)'
  },
  topHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 28px',
    borderBottom: '1px solid #f3f4f6',
    backgroundColor: '#fff'
  },
  brandBadge: {
    fontWeight: '900',
    fontSize: '1.02rem',
    color: '#16a34a',
    letterSpacing: '1px'
  },
  topTitle: {
    fontSize: '1.22rem',
    fontWeight: '700',
    color: '#111827',
    margin: 0
  },
  cancelBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    backgroundColor: '#fff',
    color: '#4b5563',
    fontSize: '0.92rem',
    fontWeight: '600',
    cursor: 'pointer',
    fontFamily: "'Poppins', 'Noto Sans Khmer', 'Kdam Thmor Pro', sans-serif"
  },
  saveTopBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 18px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#22c55e',
    color: '#fff',
    fontSize: '0.92rem',
    fontWeight: '700',
    cursor: 'pointer',
    fontFamily: "'Poppins', 'Noto Sans Khmer', 'Kdam Thmor Pro', sans-serif",
    boxShadow: 'none'
  },
  stepperBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 28px',
    borderBottom: '1px solid #f3f4f6',
    backgroundColor: '#fafafa',
    overflowX: 'auto'
  },
  stepPill: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '7px 14px',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    fontSize: '1.02rem',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'all 0.2s ease',
    fontFamily: "'Poppins', 'Noto Sans Khmer', 'Kdam Thmor Pro', sans-serif"
  },
  stepDot: {
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    border: '1.5px solid #d1d5db',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  mainBody: {
    flex: 1,
    display: 'flex',
    overflow: 'hidden'
  },
  leftFormPane: {
    flex: 1.45,
    display: 'flex',
    flexDirection: 'column',
    borderRight: '1px solid #f3f4f6',
    backgroundColor: '#fff',
    overflow: 'hidden'
  },
  formScrollArea: {
    flex: 1,
    overflowY: 'auto',
    padding: '28px 32px'
  },
  sectionHeaderRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '24px'
  },
  sectionIconBadge: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    backgroundColor: '#f3f4f6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  sectionHeading: {
    fontSize: '1.15rem',
    fontWeight: '700',
    color: '#111827',
    margin: 0
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1.5fr',
    gap: '24px',
    padding: '20px 0',
    borderBottom: '1px dashed #e5e7eb',
    alignItems: 'start'
  },
  rowLabelCol: {
    paddingRight: '10px'
  },
  rowTitle: {
    fontSize: '0.98rem',
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: '4px'
  },
  rowSub: {
    fontSize: '0.84rem',
    color: '#9ca3af',
    lineHeight: '1.4'
  },
  rowInputCol: {
    width: '100%'
  },
  textInput: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    backgroundColor: '#f9fafb',
    fontSize: '0.98rem',
    color: '#111827',
    outline: 'none',
    fontFamily: "'Poppins', 'Noto Sans Khmer', 'Kdam Thmor Pro', sans-serif"
  },
  selectInput: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    backgroundColor: '#f9fafb',
    fontSize: '0.98rem',
    color: '#111827',
    outline: 'none',
    cursor: 'pointer',
    fontFamily: "'Poppins', 'Noto Sans Khmer', 'Kdam Thmor Pro', sans-serif"
  },
  variantRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  variantInput: {
    flex: 1,
    padding: '9px 12px',
    borderRadius: '8px',
    border: '1px solid #f3f4f6',
    backgroundColor: '#f9fafb',
    fontSize: '0.94rem',
    outline: 'none',
    fontFamily: "'Poppins', 'Noto Sans Khmer', 'Kdam Thmor Pro', sans-serif"
  },
  iconActionBtn: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    backgroundColor: '#fff',
    color: '#6b7280',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0
  },
  addVariantLink: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    marginTop: '6px',
    color: '#16a34a',
    fontSize: '0.92rem',
    fontWeight: '700',
    cursor: 'pointer',
    padding: '8px',
    borderRadius: '8px',
    border: '1px dashed #bbf7d0',
    backgroundColor: '#f0fdf4'
  },
  bottomNavFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 32px',
    borderTop: '1px solid #f3f4f6',
    backgroundColor: '#fff'
  },
  prevBtn: {
    padding: '10px 28px',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    backgroundColor: '#fff',
    color: '#374151',
    fontSize: '0.94rem',
    fontWeight: '700',
    fontFamily: "'Poppins', 'Noto Sans Khmer', 'Kdam Thmor Pro', sans-serif"
  },
  nextBtn: {
    padding: '10px 34px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#22c55e',
    color: '#fff',
    fontSize: '0.94rem',
    fontWeight: '700',
    cursor: 'pointer',
    fontFamily: "'Poppins', 'Noto Sans Khmer', 'Kdam Thmor Pro', sans-serif",
    boxShadow: 'none'
  },
  rightPreviewPane: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: '28px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    overflowY: 'auto'
  },
  previewCard: {
    width: '100%',
    maxWidth: '320px',
    backgroundColor: '#fff',
    borderRadius: '18px',
    padding: '14px',
    boxShadow: '0 12px 35px rgba(0, 0, 0, 0.06)',
    border: '1px solid #f1f5f9'
  },
  previewImgBox: {
    width: '100%',
    height: '250px',
    borderRadius: '14px',
    backgroundColor: '#f3f4f6',
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  previewHeartBtn: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    backgroundColor: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 10px rgba(0,0,0,0.08)'
  },
  previewDotsRow: {
    position: 'absolute',
    bottom: '12px',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    gap: '6px',
    padding: '4px 8px',
    borderRadius: '20px',
    backgroundColor: 'rgba(0,0,0,0.2)'
  },
  floatingRemoveBtn: {
    position: 'absolute',
    top: '-6px',
    right: '-6px',
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    backgroundColor: '#ef4444',
    color: '#fff',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer'
  },
  miniFieldLabel: {
    display: 'block',
    fontSize: '0.94rem',
    color: '#6b7280',
    marginBottom: '6px',
    fontWeight: '600'
  },
  greenActionBtn: {
    padding: '0 14px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#16a34a',
    color: '#fff',
    fontWeight: '700',
    fontSize: '1.02rem',
    cursor: 'pointer',
    fontFamily: "'Poppins', 'Noto Sans Khmer', 'Kdam Thmor Pro', sans-serif"
  },
  miniUploadBox: {
    flex: 1,
    height: '52px',
    border: '1px dashed #d1d5db',
    borderRadius: '8px',
    backgroundColor: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.94rem',
    color: '#6b7280',
    cursor: 'pointer',
    overflow: 'hidden'
  }
};

export default ProductModal;
