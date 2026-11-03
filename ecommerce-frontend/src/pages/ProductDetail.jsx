import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from '../api/axios';
import { ChevronLeft, ShoppingBag, ArrowRight, Heart, Plus, Trash2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import BookMeasurementModal from '../components/BookMeasurementModal';

const ProductDetail = ({ onAddToCart, favorites, onToggleFavorite }) => {
  const { id } = useParams();
  const { t, language } = useLanguage();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMeasurementOpen, setIsMeasurementOpen] = useState(false);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColorName, setSelectedColorName] = useState(null);
  const [selectedPoleColor, setSelectedPoleColor] = useState('Gold');
  const [selectedCascadeStyle, setSelectedCascadeStyle] = useState(null);
  const [totalPrice, setTotalPrice] = useState(0);
  const [fabricMeters, setFabricMeters] = useState("1");
  const [customWidth, setCustomWidth] = useState("1");
  const [customHeight, setCustomHeight] = useState("2.5");
  const [quantity, setQuantity] = useState(1);
  const [windowSizes, setWindowSizes] = useState([
    { id: 1, label: 'បង្អួចទី ១', width: '1.5', height: '2.5', quantity: 1 }
  ]);
  const galleryRef = React.useRef(null);

  const addWindowSize = () => {
    const nextIdx = windowSizes.length + 1;
    setWindowSizes(prev => [
      ...prev,
      { id: Date.now(), label: `បង្អួចទី ${nextIdx}`, width: '1.5', height: '2.5', quantity: 1 }
    ]);
  };

  const removeWindowSize = (id) => {
    if (windowSizes.length <= 1) return;
    setWindowSizes(prev => prev.filter(w => w.id !== id));
  };

  const updateWindowSize = (id, field, value) => {
    setWindowSizes(prev => prev.map(w => w.id === id ? { ...w, [field]: value } : w));
  };

  const [hardwareOptions, setHardwareOptions] = useState([]);
  const [loadingHardware, setLoadingHardware] = useState(true);

  const combinedHardwareOptions = React.useMemo(() => {
    const customList = product?.customOptions?.ringColors || [];
    const merged = [...hardwareOptions];
    customList.forEach(customItem => {
      if (customItem?.name && !merged.some(m => m.name === customItem.name)) {
        merged.push(customItem);
      }
    });
    return merged.length > 0 ? merged : [
      { name: 'Gold', color: '#d4af37' },
      { name: 'Silver', color: '#c0c0c0' },
      { name: 'Black', color: '#000000' }
    ];
  }, [hardwareOptions, product]);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`/products/${id}`);
        setProduct(res.data);
        setTotalPrice(res.data.price);

        if (res.data.customOptions?.sizeOptions?.length > 0) {
          setSelectedSize(res.data.customOptions.sizeOptions[0]);
        }
        if (res.data.customOptions?.cascadeOptions?.length > 0) {
          setSelectedCascadeStyle(res.data.customOptions.cascadeOptions[0]);
        }
      } catch (err) {
        console.error('Error fetching product:', err);
      } finally {
        setLoading(false);
      }
    };

    const fetchHardware = async () => {
      try {
        setLoadingHardware(true);
        const res = await axios.get('/hardware');
        
        // Process Hardware from Library + Product Custom Ring/Pole Colors
        const libraryHardware = res.data.map(h => ({
          name: h.name,
          imageUrl: h.ringImageUrl,
          poleImageUrl: h.poleImageUrl
        }));

        setHardwareOptions(libraryHardware);
        if (libraryHardware.length > 0) {
          setSelectedPoleColor(libraryHardware[0].name);
        }
      } catch (err) {
        console.error('Error fetching hardware:', err);
        // Fallback to defaults if API fails
        setHardwareOptions([
          { name: 'Gold', color: '#d4af37' },
          { name: 'Silver', color: '#c0c0c0' },
          { name: 'Black', color: '#000000' }
        ]);
      } finally {
        setLoadingHardware(false);
      }
    };

    fetchProduct();
    fetchHardware();
  }, [id]);

  const totalWindowsSubtotal = React.useMemo(() => {
    if (!product) return 0;
    const basePrice = Number(product.price) || 0;
    const isPole = product.category === 'Accessories' && product.subCategory?.toLowerCase() === 'pole';

    return windowSizes.reduce((sum, w) => {
      const widthVal = parseFloat(w.width) || 0;
      const heightVal = parseFloat(w.height) || 0;
      const q = Math.max(1, parseInt(w.quantity) || 1);
      const itemCost = isPole
        ? (basePrice * widthVal * q)
        : (basePrice * widthVal * heightVal * q);
      return sum + itemCost;
    }, 0);
  }, [product, windowSizes]);

  const totalWindowsQuantity = React.useMemo(() => {
    return windowSizes.reduce((sum, w) => sum + (Math.max(1, parseInt(w.quantity) || 1)), 0);
  }, [windowSizes]);

  useEffect(() => {
    if (!product) return;
    let basePrice = Number(product.price);
    
    if (['Curtain', 'Valance'].includes(product.category) || (product.category === 'Accessories' && product.subCategory?.toLowerCase() === 'pole')) {
      setTotalPrice(totalWindowsSubtotal.toFixed(2));
    } else if (product.category === 'Fabric') {
      const meters = parseFloat(fabricMeters) || 0;
      setTotalPrice((basePrice * meters * quantity).toFixed(2));
    } else if (selectedSize) {
      setTotalPrice((Number(selectedSize.price) * quantity).toFixed(2));
    } else {
      setTotalPrice((basePrice * quantity).toFixed(2));
    }
  }, [product, selectedSize, fabricMeters, quantity, totalWindowsSubtotal]);

  if (loading) return <div style={{ padding: '100px', textAlign: 'center', letterSpacing: '4px' }}>LOADING PRODUCT...</div>;
  if (!product) return <div style={{ padding: '100px', textAlign: 'center' }}>Item not found.</div>;

  return (
    <div style={{ padding: '24px 16px 80px', maxWidth: '1240px', margin: '0 auto', boxSizing: 'border-box' }}>
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#999', textDecoration: 'none', fontSize: '0.8rem', marginBottom: '28px' }}>
        <ChevronLeft size={16} />
        {t('back_to_collection')}
      </Link>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', alignItems: 'start' }} className="mobile-stack">
        <div style={{ 
          backgroundColor: '#f9f9f9', 
          borderRadius: '24px', 
          overflow: 'hidden', 
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          gap: '15px'
        }}>
          {/* Main Display Gallery */}
          <div 
            ref={galleryRef}
            className="no-scrollbar mobile-gallery-height"
            style={{ 
              width: '100%',
              height: '550px',
              overflowX: 'auto',
              display: 'flex',
              scrollSnapType: 'x mandatory',
              WebkitOverflowScrolling: 'touch',
              scrollBehavior: 'smooth'
            }}
          >
            {(product.images && product.images.length > 0 ? product.images : [{ url: product.imageUrl || 'https://via.placeholder.com/600x800?text=No+Image', color: '' }]).map((img, idx) => (
              <img 
                key={idx}
                src={img.url} 
                alt={`${product.name} - ${idx}`} 
                style={{ 
                  minWidth: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  scrollSnapAlign: 'start',
                  transition: 'opacity 0.3s ease',
                  backgroundColor: '#f9f9f9'
                }} 
              />
            ))}
          </div>

          {/* Indicator Dots */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: '8px', 
            padding: '10px' 
          }}>
            {(product.images || []).map((_, i) => (
              <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#000', opacity: 0.2 }}></div>
            ))}
          </div>

          {['Curtain', 'Valance', 'Accessories'].includes(product.category) && (
            <div style={{ 
              position: 'absolute', 
              bottom: '50px', 
              left: '20px', 
              backgroundColor: 'rgba(255,255,255,0.9)', 
              padding: '12px 20px', 
              borderRadius: '50px',
              fontSize: '0.7rem',
              fontWeight: '800',
              boxShadow: '0 10px 30px rgba(0,0,0,0.05)'
            }}>
              {t('pole_included')}
            </div>
          )}
        </div>

        <div>
          <span style={{ fontSize: '0.7rem', letterSpacing: '3px', color: 'var(--accent-pink)', fontWeight: '700', textTransform: 'uppercase' }}>
            {t(product.category.toLowerCase().replace(' ', '_'))}
          </span>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '20px 0' }}>
            <h1 className="serif" style={{ fontSize: '2.5rem', margin: 0 }}>
              {language === 'kh' && product.nameKh ? product.nameKh : product.name}
            </h1>
            <button 
              onClick={() => onToggleFavorite(product)}
              style={{ background: 'none', border: 'none', padding: '10px', cursor: 'pointer', transition: 'transform 0.2s ease' }}
            >
              <Heart 
                size={32} 
                color={favorites.some(f => f._id === product._id) ? '#ff4d4d' : '#ccc'} 
                fill={favorites.some(f => f._id === product._id) ? '#ff4d4d' : 'transparent'} 
              />
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '12px' }}>
            <span style={{ fontSize: '1.65rem', fontWeight: '900', color: Number(product.originalPrice) > Number(product.price) ? '#dc2626' : '#0f172a' }}>
              ${totalPrice}
            </span>

            {Number(product.originalPrice) > Number(product.price) && (
              <>
                <span style={{ fontSize: '1.1rem', color: '#94a3b8', textDecoration: 'line-through', fontWeight: '600' }}>
                  ${Number(product.originalPrice).toFixed(2)}
                </span>
                <span style={{ backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '3px 10px', borderRadius: '50px', fontSize: '0.75rem', fontWeight: '800' }}>
                  បញ្ចុះតម្លៃ -{Math.round(((Number(product.originalPrice) - Number(product.price)) / Number(product.originalPrice)) * 100)}%
                </span>
              </>
            )}

            {['Curtain', 'Valance', 'Accessories'].includes(product.category) && (
              <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: '600' }}>
                (${Number(product.price).toFixed(2)} / {
                  product.category === 'Accessories' 
                    ? (product.subCategory?.toLowerCase() === 'pole' ? 'ម៉ែត្រ' : 'គ្រឿង')
                    : 'm²'
                })
              </span>
            )}
            {product.category === 'Fabric' && (
              <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: '600' }}>
                (${Number(product.price).toFixed(2)} / ម៉ែត្រ)
              </span>
            )}
          </div>

          {/* Stock Status Indicator */}
          <div style={{ marginBottom: '14px' }}>
            {Number(product.stock) > 0 ? (
              <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: '50px', backgroundColor: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', fontSize: '0.78rem', fontWeight: '700' }}>
                ក្នុងស្តុក៖ {product.stock} {t('in_stock')}
              </span>
            ) : (
              <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: '50px', backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', fontSize: '0.78rem', fontWeight: '800' }}>
                អស់ពីស្តុក (Out of Stock)
              </span>
            )}
          </div>
          {selectedSize && !['Curtain', 'Valance', 'Accessories'].includes(product.category) && <p style={{ fontSize: '0.8rem', color: '#666', marginBottom: '10px' }}>Size: {selectedSize.name}</p>}
          
          <div style={{ width: '100%', height: '1px', backgroundColor: '#f0f0f0', marginBottom: '30px', marginTop: '30px' }}></div>
          
          <p style={{ color: '#666', lineHeight: '1.8', marginBottom: '30px', fontSize: '1rem' }}>
            {(language === 'kh' && product.descriptionKh) ? product.descriptionKh : (product.description || t('default_desc'))}
          </p>

          {/* Derived Colors from Images */}
          {product.images?.some(img => img.color) && (
            <div style={{ marginBottom: '40px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: '800', display: 'block', marginBottom: '20px', letterSpacing: '1px', textTransform: 'uppercase' }}>
                {t('product_color')}
              </label>
              <div 
                className="no-scrollbar"
                style={{ 
                  display: 'flex', 
                  gap: '20px', 
                  overflowX: 'auto', 
                  paddingBottom: '10px',
                  scrollSnapType: 'x mandatory',
                  WebkitOverflowScrolling: 'touch'
                }}
              >
                {/* Unique Colors Derived from Image Tags */}
                {[...new Set(product.images.map(img => img.color).filter(c => c))].map((colorName, idx) => (
                  <div 
                    key={idx}
                    onClick={() => {
                      setSelectedColorName(colorName);
                      // Scroll to first image of this color
                      const colorIdx = product.images.findIndex(img => img.color === colorName);
                      if (colorIdx !== -1 && galleryRef.current) {
                        const width = galleryRef.current.offsetWidth;
                        galleryRef.current.scrollTo({
                          left: colorIdx * width,
                          behavior: 'smooth'
                        });
                      }
                    }}
                    style={{ 
                      flexShrink: 0,
                      width: '80px',
                      cursor: 'pointer',
                      scrollSnapAlign: 'start'
                    }}
                  >
                    <div style={{ 
                      width: '80px', 
                      height: '80px', 
                      borderRadius: '50%', 
                      overflow: 'hidden',
                      border: selectedColorName === colorName ? '3px solid #000' : '1px solid #eee',
                      transition: 'all 0.3s ease',
                      padding: '3px',
                      backgroundColor: '#fff'
                    }}>
                      <img 
                        src={product.images.find(img => img.color === colorName)?.url} 
                        style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '50%' }} 
                        alt={colorName} 
                      />
                    </div>
                    <p style={{ 
                      fontSize: '0.6rem', 
                      textAlign: 'center', 
                      marginTop: '8px', 
                      fontWeight: selectedColorName === colorName ? '800' : '500',
                      color: selectedColorName === colorName ? '#000' : '#999',
                      textTransform: 'uppercase',
                      letterSpacing: '1px'
                    }}>{colorName}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {product.category === 'Fabric' && (
            <div style={{ marginBottom: '30px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: '800', display: 'block', marginBottom: '10px' }}>
                {language === 'kh' ? 'ចំនួនម៉ែត្រដែលត្រូវការ' : (t('meters_needed') || 'Meters Needed')}
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <input 
                  type="number" 
                  min="0.1" 
                  step="0.1"
                  value={fabricMeters}
                  onChange={(e) => setFabricMeters(e.target.value)}
                  style={{ 
                    padding: '15px', 
                    borderRadius: '15px', 
                    border: '1px solid #eee', 
                    width: '100px',
                    textAlign: 'center',
                    fontWeight: '800',
                    outline: 'none'
                  }}
                />
                <span style={{ fontWeight: '700', fontSize: '0.9rem' }}>{language === 'kh' ? 'ម៉ែត្រ' : 'Meters'}</span>
              </div>
            </div>
          )}

          {(['Curtain', 'Valance'].includes(product.category) || (product.category === 'Accessories' && product.subCategory?.toLowerCase() === 'pole')) && (
            <div style={{ marginBottom: '40px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '800', margin: 0, color: '#0f172a' }}>
                  {language === 'kh' ? 'បញ្ជីទំហំតាមបង្អួចនីមួយៗ' : 'Window Dimensions List'}
                </label>
                <button
                  type="button"
                  onClick={addWindowSize}
                  style={{
                    backgroundColor: '#0f172a',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '6px 14px',
                    fontSize: '0.78rem',
                    fontWeight: '700',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer'
                  }}
                >
                  <Plus size={14} />
                  <span>{language === 'kh' ? '+ បន្ថែមទំហំបង្អួចមួយទៀត' : '+ Add Another Window'}</span>
                </button>
              </div>

              {/* Window Cards List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {windowSizes.map((win, idx) => {
                  const widthVal = parseFloat(win.width) || 0;
                  const heightVal = parseFloat(win.height) || 0;
                  const q = Math.max(1, parseInt(win.quantity) || 1);
                  const isPole = product.category === 'Accessories' && product.subCategory?.toLowerCase() === 'pole';
                  const winCost = isPole
                    ? (Number(product.price) * widthVal * q).toFixed(2)
                    : (Number(product.price) * widthVal * heightVal * q).toFixed(2);
                  const area = (widthVal * heightVal).toFixed(2);

                  return (
                    <div
                      key={win.id}
                      style={{
                        backgroundColor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '16px',
                        padding: '16px',
                        position: 'relative'
                      }}
                    >
                      {/* Window Header Row */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '0.78rem', backgroundColor: '#0f172a', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontWeight: '800' }}>
                            #{idx + 1}
                          </span>
                          <input
                            value={win.label}
                            onChange={(e) => updateWindowSize(win.id, 'label', e.target.value)}
                            placeholder={`បង្អួចទី ${idx + 1}`}
                            style={{
                              border: 'none',
                              background: 'transparent',
                              fontWeight: '700',
                              fontSize: '0.88rem',
                              color: '#0f172a',
                              outline: 'none',
                              width: '180px'
                            }}
                          />
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '0.92rem', fontWeight: '800', color: '#0f172a' }}>
                            ${winCost}
                          </span>
                          {windowSizes.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeWindowSize(win.id)}
                              title="លុបទំហំនេះ"
                              style={{
                                border: 'none',
                                background: '#fee2e2',
                                color: '#ef4444',
                                borderRadius: '6px',
                                padding: '4px 8px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center'
                              }}
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Inputs Row: Width, Height, Quantity */}
                      <div style={{ display: 'grid', gridTemplateColumns: isPole ? '1fr 1fr' : '1fr 1fr 1fr', gap: '12px' }}>
                        <div>
                          <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '700', display: 'block', marginBottom: '4px' }}>
                            {isPole ? (language === 'kh' ? 'ប្រវែង (ម៉ែត្រ)' : 'Length (m)') : (language === 'kh' ? 'ទទឹង (ម៉ែត្រ)' : 'Width (m)')}
                          </span>
                          <input
                            type="number"
                            min="0.1"
                            step="0.1"
                            value={win.width}
                            onChange={(e) => updateWindowSize(win.id, 'width', e.target.value)}
                            style={{
                              width: '100%',
                              padding: '10px',
                              borderRadius: '10px',
                              border: '1px solid #cbd5e1',
                              backgroundColor: '#fff',
                              textAlign: 'center',
                              fontWeight: '700',
                              fontSize: '0.9rem',
                              outline: 'none',
                              boxSizing: 'border-box'
                            }}
                          />
                        </div>

                        {!isPole && (
                          <div>
                            <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '700', display: 'block', marginBottom: '4px' }}>
                              {language === 'kh' ? 'កម្ពស់ (ម៉ែត្រ)' : 'Height (m)'}
                            </span>
                            <input
                              type="number"
                              min="0.1"
                              step="0.1"
                              value={win.height}
                              onChange={(e) => updateWindowSize(win.id, 'height', e.target.value)}
                              style={{
                                width: '100%',
                                padding: '10px',
                                borderRadius: '10px',
                                border: '1px solid #cbd5e1',
                                backgroundColor: '#fff',
                                textAlign: 'center',
                                fontWeight: '700',
                                fontSize: '0.9rem',
                                outline: 'none',
                                boxSizing: 'border-box'
                              }}
                            />
                          </div>
                        )}

                        <div>
                          <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '700', display: 'block', marginBottom: '4px' }}>
                            {language === 'kh' ? 'ចំនួន (គ្រឿង)' : 'Qty'}
                          </span>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            backgroundColor: '#fff',
                            borderRadius: '10px',
                            border: '1px solid #cbd5e1',
                            height: '42px',
                            overflow: 'hidden'
                          }}>
                            <button
                              type="button"
                              onClick={() => updateWindowSize(win.id, 'quantity', Math.max(1, (win.quantity || 1) - 1))}
                              style={{ width: '32px', height: '100%', border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: '800' }}
                            >-</button>
                            <input
                              type="number"
                              min="1"
                              value={win.quantity}
                              onChange={(e) => updateWindowSize(win.id, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                              style={{ width: '100%', border: 'none', background: 'transparent', textAlign: 'center', fontWeight: '800', outline: 'none', fontSize: '0.88rem' }}
                            />
                            <button
                              type="button"
                              onClick={() => updateWindowSize(win.id, 'quantity', (win.quantity || 1) + 1)}
                              style={{ width: '32px', height: '100%', border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: '800' }}
                            >+</button>
                          </div>
                        </div>
                      </div>

                      {/* Item sub-calc note */}
                      <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '8px' }}>
                        {isPole
                          ? `* ${widthVal}m × $${product.price}/m ${q > 1 ? `× ${q} គ្រឿង` : ''} = $${winCost}`
                          : `* ${widthVal}m × ${heightVal}m = ${area}m² × $${product.price}/m² ${q > 1 ? `× ${q} គ្រឿង` : ''} = $${winCost}`
                        }
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Subtotal Summary of all windows */}
              <div style={{
                marginTop: '12px',
                padding: '12px 16px',
                backgroundColor: '#f1f5f9',
                borderRadius: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '8px'
              }}>
                <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#334155' }}>
                  {language === 'kh' ? `សរុបទាំងអស់៖ ${windowSizes.length} បង្អួច (${totalWindowsQuantity} គ្រឿង)` : `Total: ${windowSizes.length} Windows (${totalWindowsQuantity} Units)`}
                </span>
                <span style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a' }}>
                  ${totalWindowsSubtotal.toFixed(2)}
                </span>
              </div>

              {/* Free Home Measurement Booking Button */}
              <div style={{ marginTop: '14px', padding: '12px 16px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <span style={{ fontSize: '0.8rem', color: '#334155', fontWeight: '600' }}>
                  មិនច្បាស់ទំហំបង្អួចមែនទេ?
                </span>
                <button
                  type="button"
                  onClick={() => setIsMeasurementOpen(true)}
                  style={{
                    backgroundColor: '#0f172a',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '50px',
                    padding: '7px 16px',
                    fontSize: '0.76rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    fontFamily: "'Poppins', 'Noto Sans Khmer', 'Kdam Thmor Pro', sans-serif"
                  }}
                >
                  ណាត់ជាងចុះវាស់វែងដល់ផ្ទះ (ឥតគិតថ្លៃ) &gt;
                </button>
              </div>
            </div>
          )}

          {/* Standalone Quantity Selector for non-Curtain products */}
          {!['Curtain', 'Valance'].includes(product.category) && !(product.category === 'Accessories' && product.subCategory?.toLowerCase() === 'pole') && (
            <div style={{ marginBottom: '40px' }}>
              <label style={{ fontSize: '0.7rem', fontWeight: '800', display: 'block', marginBottom: '15px', letterSpacing: '1px', textTransform: 'uppercase' }}>
                {t('quantity') || 'Quantity'}
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  backgroundColor: '#f9f9f9', 
                  borderRadius: '15px', 
                  padding: '5px' 
                }}>
                  <button 
                    type="button"
                    disabled={Number(product.stock) <= 0}
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    style={{ 
                      width: '40px', 
                      height: '40px', 
                      borderRadius: '12px', 
                      border: 'none', 
                      backgroundColor: '#fff', 
                      cursor: Number(product.stock) <= 0 ? 'not-allowed' : 'pointer',
                      fontSize: '1.2rem',
                      fontWeight: '700'
                    }}
                  >-</button>
                  <input 
                    type="number"
                    disabled={Number(product.stock) <= 0}
                    value={quantity}
                    onChange={(e) => {
                      const maxStock = Math.max(1, Number(product.stock) || 1);
                      setQuantity(Math.min(maxStock, Math.max(1, parseInt(e.target.value) || 1)));
                    }}
                    style={{ 
                      width: '60px', 
                      border: 'none', 
                      background: 'none', 
                      textAlign: 'center', 
                      fontWeight: '800',
                      fontSize: '1.1rem'
                    }}
                  />
                  <button 
                    type="button"
                    disabled={Number(product.stock) <= 0 || quantity >= Number(product.stock)}
                    onClick={() => setQuantity(Math.min(Math.max(1, Number(product.stock) || 1), quantity + 1))}
                    style={{ 
                      width: '40px', 
                      height: '40px', 
                      borderRadius: '12px', 
                      border: 'none', 
                      backgroundColor: '#fff', 
                      cursor: (Number(product.stock) <= 0 || quantity >= Number(product.stock)) ? 'not-allowed' : 'pointer',
                      fontSize: '1.2rem',
                      fontWeight: '700'
                    }}
                  >+</button>
                </div>
                <span style={{ fontSize: '0.8rem', color: '#666', fontWeight: '600' }}>{language === 'kh' ? 'គ្រឿង' : 'Units'}</span>
              </div>
            </div>
          )}


          {(product.category === 'Curtain' || product.category === 'Valance') && (
            <div style={{ marginBottom: '40px' }}>
              <label style={{ fontSize: '0.7rem', fontWeight: '800', display: 'block', marginBottom: '15px' }}>{t('pole_ring_color')}</label>
              <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                {combinedHardwareOptions.map(item => (
                  <button 
                    key={item.name}
                    onClick={() => setSelectedPoleColor(item.name)}
                    style={{ 
                      minWidth: '150px', 
                      padding: '15px 10px', 
                      borderRadius: '18px', 
                      border: selectedPoleColor === item.name ? '2px solid black' : '1px solid #eee', 
                      background: 'white', 
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '12px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', gap: '10px' }}>
                      {item.poleImageUrl && (
                        <img src={item.poleImageUrl} style={{ width: '65px', height: '65px', borderRadius: '12px', objectFit: 'contain', border: '1px solid #eee' }} alt="ដង" title="ដង (Pole)" />
                      )}
                      {item.imageUrl && (
                        <img src={item.imageUrl} style={{ width: '65px', height: '65px', borderRadius: '12px', objectFit: 'contain', border: '1px solid #eee' }} alt="កង" title="កង (Ring)" />
                      )}
                      {!item.imageUrl && !item.poleImageUrl && (
                        <div style={{ 
                          width: '65px', 
                          height: '65px', 
                          borderRadius: '50%', 
                          backgroundColor: item.color || '#eee',
                          border: '1px solid rgba(0,0,0,0.1)'
                        }}></div>
                      )}
                    </div>
                    <span style={{ fontSize: '0.65rem', fontWeight: selectedPoleColor === item.name ? '800' : '500', marginTop: '4px' }}>{item.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {product.category === 'Valance' && product.customOptions?.cascadeOptions?.length > 0 && (
            <div style={{ marginBottom: '30px' }}>
              <label style={{ fontSize: '0.7rem', fontWeight: '800', display: 'block', marginBottom: '15px' }}>{t('cascade_style')}</label>
              <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                {product.customOptions.cascadeOptions.map((cs, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setSelectedCascadeStyle(cs)}
                    style={{ 
                      flex: 1,
                      minWidth: '100px',
                      border: selectedCascadeStyle?.name === cs.name ? '2px solid black' : '1px solid #eee', 
                      padding: '10px', 
                      borderRadius: '12px', 
                      background: 'white', 
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <img src={cs.imageUrl} style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }} />
                    <span style={{ fontSize: '0.65rem', fontWeight: selectedCascadeStyle?.name === cs.name ? '800' : '500' }}>{cs.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}


          <div style={{ display: 'flex', gap: '15px' }}>
            <button 
              type="button"
              disabled={Number(product.stock) <= 0}
              className="btn-add" 
              onClick={() => {
                if (Number(product.stock) <= 0) return;

                if (['Curtain', 'Valance'].includes(product.category) || (product.category === 'Accessories' && product.subCategory?.toLowerCase() === 'pole')) {
                  const isPole = product.category === 'Accessories' && product.subCategory?.toLowerCase() === 'pole';
                  const itemsToAdd = windowSizes.map((w, idx) => {
                    const widthVal = parseFloat(w.width) || 0;
                    const heightVal = parseFloat(w.height) || 0;
                    const q = Math.max(1, parseInt(w.quantity) || 1);
                    const itemCost = isPole
                      ? (Number(product.price) * widthVal * q).toFixed(2)
                      : (Number(product.price) * widthVal * heightVal * q).toFixed(2);

                    return {
                      ...product,
                      windowLabel: w.label || `បង្អួចទី ${idx + 1}`,
                      selectedSize: isPole
                        ? { name: `${w.label || `បង្អួចទី ${idx + 1}`}: ${widthVal}m × ${q} គ្រឿង` }
                        : { name: `${w.label || `បង្អួចទី ${idx + 1}`}: ${widthVal}m × ${heightVal}m × ${q} គ្រឿង` },
                      selectedColorName,
                      customWidth: widthVal,
                      customHeight: isPole ? null : heightVal,
                      quantity: q,
                      poleColor: ['Curtain', 'Valance'].includes(product.category) ? (combinedHardwareOptions.find(rc => rc.name === selectedPoleColor) || { name: selectedPoleColor }) : null,
                      cascadeStyle: product.category === 'Valance' ? selectedCascadeStyle : null,
                      totalPrice: itemCost
                    };
                  });
                  onAddToCart(itemsToAdd);
                } else {
                  onAddToCart({
                    ...product,
                    selectedSize: product.category === 'Fabric' ? { name: `${fabricMeters}m × ${quantity} គ្រឿង` } : (selectedSize ? { name: `${selectedSize.name} × ${quantity} គ្រឿង` } : { name: `${quantity} គ្រឿង` }),
                    selectedColorName,
                    fabricMeters: product.category === 'Fabric' ? (parseFloat(fabricMeters) || 0) : null,
                    quantity: quantity,
                    totalPrice
                  });
                }
              }}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                padding: '20px',
                borderRadius: 'var(--radius)',
                opacity: Number(product.stock) <= 0 ? 0.5 : 1,
                cursor: Number(product.stock) <= 0 ? 'not-allowed' : 'pointer'
              }}
            >
              <ShoppingBag size={20} />
              {Number(product.stock) <= 0 
                ? 'អស់ពីស្តុក (Out of Stock)' 
                : (['Curtain', 'Valance'].includes(product.category) || (product.category === 'Accessories' && product.subCategory?.toLowerCase() === 'pole'))
                  ? (windowSizes.length > 1 
                      ? (language === 'kh' ? `ដាក់ចូលកន្ត្រកទាំងអស់ (${windowSizes.length} បង្អួច) — $${totalWindowsSubtotal.toFixed(2)}` : `Add All to Cart (${windowSizes.length} Windows) — $${totalWindowsSubtotal.toFixed(2)}`)
                      : (language === 'kh' ? `ដាក់ចូលកន្ត្រក — $${totalWindowsSubtotal.toFixed(2)}` : `Add to Cart — $${totalWindowsSubtotal.toFixed(2)}`))
                  : t('add_to_cart')
              }
            </button>
          </div>
          
          <Link 
            to="/cart"
            className="btn-proceed"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '12px', 
              padding: '20px',
              marginTop: '15px',
              backgroundColor: '#fff',
              border: '1px solid #000',
              color: '#000',
              textDecoration: 'none',
              borderRadius: 'var(--radius)',
              fontWeight: '700',
              fontSize: '0.9rem',
              transition: 'all 0.3s ease',
              width: '100%',
              boxSizing: 'border-box'
            }}
          >
            {t('proceed_to_cart')}
            <ArrowRight size={20} />
          </Link>
          
          <div style={{ marginTop: '40px', fontSize: '0.7rem', color: '#999', display: 'grid', gap: '10px' }}>
            {product.category !== 'Fabric' && <p>• {t('hand_finished')}</p>}
            <p>• {t('premium_light')}</p>
            {product.category !== 'Fabric' && <p>• {t('custom_sizing')}</p>}
          </div>
        </div>
      </div>

      <BookMeasurementModal
        isOpen={isMeasurementOpen}
        onClose={() => setIsMeasurementOpen(false)}
      />
    </div>
  );
};

export default ProductDetail;
