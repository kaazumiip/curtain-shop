import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from '../api/axios';
import { ChevronLeft, ShoppingBag, ArrowRight, Heart } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const ProductDetail = ({ onAddToCart, favorites, onToggleFavorite }) => {
  const { id } = useParams();
  const { t, language } = useLanguage();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColorName, setSelectedColorName] = useState(null);
  const [selectedPoleColor, setSelectedPoleColor] = useState('Gold');
  const [selectedCascadeStyle, setSelectedCascadeStyle] = useState(null);
  const [totalPrice, setTotalPrice] = useState(0);
  const [fabricMeters, setFabricMeters] = useState("1");
  const [customWidth, setCustomWidth] = useState("1");
  const [customHeight, setCustomHeight] = useState("2.5");
  const [quantity, setQuantity] = useState(1);
  const galleryRef = React.useRef(null);

  const [hardwareOptions, setHardwareOptions] = useState([]);
  const [loadingHardware, setLoadingHardware] = useState(true);

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
        
        // Process Hardware from Library
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

  useEffect(() => {
    if (!product) return;
    let basePrice = Number(product.price);
    
    if (['Curtain', 'Valance', 'Accessories'].includes(product.category)) {
      const w = parseFloat(customWidth) || 0;
      const h = parseFloat(customHeight) || 0;
      if (product.category === 'Accessories') {
        if (product.subCategory?.toLowerCase() === 'pole') {
          setTotalPrice((basePrice * w * quantity).toFixed(2));
        } else {
          setTotalPrice((basePrice * quantity).toFixed(2));
        }
      } else {
        // Curtains and Valances are area based * quantity
        setTotalPrice((basePrice * w * h * quantity).toFixed(2));
      }
    } else if (product.category === 'Fabric') {
      const meters = parseFloat(fabricMeters) || 0;
      setTotalPrice((basePrice * meters * quantity).toFixed(2));
    } else if (selectedSize) {
      setTotalPrice((Number(selectedSize.price) * quantity).toFixed(2));
    } else {
      setTotalPrice((basePrice * quantity).toFixed(2));
    }
  }, [product, selectedSize, fabricMeters, customWidth, customHeight, quantity]);

  if (loading) return <div style={{ padding: '100px', textAlign: 'center', letterSpacing: '4px' }}>LOADING PRODUCT...</div>;
  if (!product) return <div style={{ padding: '100px', textAlign: 'center' }}>Item not found.</div>;

  return (
    <div style={{ padding: '40px 0' }}>
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#999', textDecoration: 'none', fontSize: '0.8rem', marginBottom: '40px' }}>
        <ChevronLeft size={16} />
        {t('back_to_collection')}
      </Link>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'start' }} className="mobile-stack">
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
          <p style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '10px' }}>
            £{totalPrice}
            {['Curtain', 'Valance', 'Accessories'].includes(product.category) && (
              <span style={{ fontSize: '0.9rem', color: '#999', fontWeight: '500', marginLeft: '10px' }}>
                (£{Number(product.price).toFixed(2)} / {
                  product.category === 'Accessories' 
                    ? (product.subCategory?.toLowerCase() === 'pole' ? 'meter' : 'unit')
                    : 'm²'
                })
              </span>
            )}
            {product.category === 'Fabric' && (
              <span style={{ fontSize: '0.9rem', color: '#999', fontWeight: '500', marginLeft: '10px' }}>
                (£{Number(product.price).toFixed(2)} / meter)
              </span>
            )}
          </p>
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
              <label style={{ fontSize: '0.7rem', fontWeight: '800', display: 'block', marginBottom: '10px' }}>
                {t('meters_needed') || 'Meters Needed'}
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
                <span style={{ fontWeight: '700', fontSize: '0.9rem' }}>Meters</span>
              </div>
            </div>
          )}

          {(['Curtain', 'Valance'].includes(product.category) || (product.category === 'Accessories' && product.subCategory?.toLowerCase() === 'pole')) && (
            <div style={{ marginBottom: '40px' }}>
              <label style={{ fontSize: '0.7rem', fontWeight: '800', display: 'block', marginBottom: '15px' }}>
                {t('custom_dimensions') || 'Enter Dimensions (Meters)'}
              </label>
              <div style={{ display: 'flex', gap: '20px' }}>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '0.6rem', color: '#999', textTransform: 'uppercase', display: 'block', marginBottom: '5px' }}>
                    {product.subCategory?.toLowerCase() === 'pole' ? 'Length (m)' : 'Width (m)'}
                  </span>
                  <input 
                    type="number" 
                    min="0.1" 
                    step="0.1"
                    value={customWidth}
                    onChange={(e) => setCustomWidth(e.target.value)}
                    style={{ width: '100%', padding: '15px', borderRadius: '15px', border: '1px solid #eee', outline: 'none', fontWeight: '800', textAlign: 'center' }}
                  />
                </div>
                {product.subCategory?.toLowerCase() !== 'pole' && (
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: '0.6rem', color: '#999', textTransform: 'uppercase', display: 'block', marginBottom: '5px' }}>Height (m)</span>
                    <input 
                      type="number" 
                      min="0.1" 
                      step="0.1"
                      value={customHeight}
                      onChange={(e) => setCustomHeight(e.target.value)}
                      style={{ width: '100%', padding: '15px', borderRadius: '15px', border: '1px solid #eee', outline: 'none', fontWeight: '800', textAlign: 'center' }}
                    />
                  </div>
                )}
              </div>
              <p style={{ fontSize: '0.6rem', color: '#999', marginTop: '10px' }}>
                {product.subCategory?.toLowerCase() === 'pole' 
                  ? `* Price: £${product.price}/m × ${parseFloat(customWidth)||0}m ${quantity > 1 ? `× ${quantity} units` : ''}` 
                  : `* Price: £${product.price}/m² × ${( (parseFloat(customWidth)||0) * (parseFloat(customHeight)||0) ).toFixed(2)}m² ${quantity > 1 ? `× ${quantity} units` : ''}`
                }
              </p>
            </div>
          )}

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
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  style={{ 
                    width: '40px', 
                    height: '40px', 
                    borderRadius: '12px', 
                    border: 'none', 
                    backgroundColor: '#fff', 
                    cursor: 'pointer',
                    fontSize: '1.2rem',
                    fontWeight: '700'
                  }}
                >-</button>
                <input 
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
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
                  onClick={() => setQuantity(quantity + 1)}
                  style={{ 
                    width: '40px', 
                    height: '40px', 
                    borderRadius: '12px', 
                    border: 'none', 
                    backgroundColor: '#fff', 
                    cursor: 'pointer',
                    fontSize: '1.2rem',
                    fontWeight: '700'
                  }}
                >+</button>
              </div>
              <span style={{ fontSize: '0.8rem', color: '#666', fontWeight: '600' }}>Units</span>
            </div>
          </div>


          {(product.category === 'Curtain' || product.category === 'Valance') && (
            <div style={{ marginBottom: '40px' }}>
              <label style={{ fontSize: '0.7rem', fontWeight: '800', display: 'block', marginBottom: '15px' }}>{t('pole_ring_color')}</label>
              <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                {(hardwareOptions.length > 0 ? hardwareOptions : [
                  { name: 'Gold', color: '#d4af37' }, 
                  { name: 'Silver', color: '#c0c0c0' }, 
                  { name: 'Black', color: '#000000' }
                ]).map(item => (
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
                      {item.imageUrl && (
                        <img src={item.imageUrl} style={{ width: '65px', height: '65px', borderRadius: '12px', objectFit: 'contain', border: '1px solid #eee' }} alt="Ring" title="Ring" />
                      )}
                      {item.poleImageUrl && (
                        <img src={item.poleImageUrl} style={{ width: '65px', height: '65px', borderRadius: '12px', objectFit: 'contain', border: '1px solid #eee' }} alt="Pole" title="Pole" />
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
              className="btn-add" 
              onClick={() => onAddToCart({
                ...product,
                selectedSize: ['Curtain', 'Valance', 'Accessories'].includes(product.category)
                  ? (product.subCategory?.toLowerCase() === 'pole' ? { name: `${customWidth}m × ${quantity} Units` } : (product.category === 'Accessories' ? { name: `${quantity} Units` } : { name: `${customWidth}m x ${customHeight}m × ${quantity} Units` }))
                  : (product.category === 'Fabric' ? { name: `${fabricMeters}m × ${quantity} Units` } : (selectedSize ? { name: `${selectedSize.name} × ${quantity} Units` } : { name: `${quantity} Units` })),
                selectedColorName,
                fabricMeters: product.category === 'Fabric' ? (parseFloat(fabricMeters) || 0) : null,
                customWidth: (['Curtain', 'Valance'].includes(product.category) || (product.category === 'Accessories' && product.subCategory?.toLowerCase() === 'pole')) ? (parseFloat(customWidth) || 0) : null,
                customHeight: (['Curtain', 'Valance'].includes(product.category)) ? (parseFloat(customHeight) || 0) : null,
                quantity: quantity,
                poleColor: ['Curtain', 'Valance'].includes(product.category) ? (hardwareOptions.find(rc => rc.name === selectedPoleColor) || { name: selectedPoleColor }) : null,
                cascadeStyle: product.category === 'Valance' ? selectedCascadeStyle : null,
                totalPrice
              })}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '20px', borderRadius: 'var(--radius)' }}
            >
              <ShoppingBag size={20} />
              {t('add_to_cart')}
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
    </div>
  );
};

export default ProductDetail;
