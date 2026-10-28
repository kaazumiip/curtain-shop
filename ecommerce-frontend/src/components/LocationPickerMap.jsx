import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  MapPin, 
  Crosshair, 
  Maximize2, 
  Minimize2, 
  Search, 
  Check, 
  X,
  Plus,
  Minus,
  Loader2
} from 'lucide-react';

// Custom sleek marker icon using SVG
const createCustomIcon = () => {
  return L.divIcon({
    className: 'custom-delivery-pin',
    html: `
      <div style="
        position: relative;
        transform: translate(-50%, -100%);
        display: flex;
        flex-direction: column;
        align-items: center;
        pointer-events: none;
      ">
        <div style="
          background-color: #000;
          color: #fff;
          padding: 4px 10px;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 700;
          white-space: nowrap;
          box-shadow: 0 4px 16px rgba(0,0,0,0.3);
          margin-bottom: 5px;
          letter-spacing: 0.5px;
          border: 1px solid rgba(255,255,255,0.2);
          display: flex;
          align-items: center;
          gap: 4px;
        ">
          <span>📍</span> ទីតាំងដឹកជញ្ជូន
        </div>
        <svg width="36" height="44" viewBox="0 0 24 30" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 4px 8px rgba(0,0,0,0.35));">
          <path d="M12 0C5.37258 0 0 5.37258 0 12C0 19.5 12 30 12 30C12 30 24 19.5 24 12C24 5.37258 18.6274 0 12 0Z" fill="#111827"/>
          <circle cx="12" cy="11" r="5" fill="#22C55E"/>
        </svg>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0]
  });
};

const LocationPickerMap = ({ onLocationSelected, initialAddress = '' }) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [locating, setLocating] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [coords, setCoords] = useState({ lat: 11.5564, lng: 104.9282 }); // Default: Phnom Penh
  const [detectedAddress, setDetectedAddress] = useState(initialAddress);

  // Reverse Geocode using OpenStreetMap Nominatim
  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { 'Accept-Language': 'km,en', 'User-Agent': 'SreyThaCurtain/1.0' } }
      );
      const data = await response.json();
      if (data && data.display_name) {
        const addr = data.address || {};
        const road = addr.road || addr.suburb || addr.neighbourhood || addr.village || '';
        const city = addr.city || addr.town || addr.county || addr.state || 'Phnom Penh';
        const formatted = road ? `${road}, ${city}` : data.display_name.split(',').slice(0, 3).join(',');
        
        setDetectedAddress(formatted);
        if (onLocationSelected) {
          onLocationSelected({
            lat,
            lng,
            fullAddress: formatted,
            city: city,
            osmData: data
          });
        }
      } else {
        const fallback = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        setDetectedAddress(fallback);
        if (onLocationSelected) {
          onLocationSelected({ lat, lng, fullAddress: fallback });
        }
      }
    } catch (err) {
      console.warn('Geocoding error:', err);
      const fallback = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      setDetectedAddress(fallback);
      if (onLocationSelected) {
        onLocationSelected({ lat, lng, fullAddress: fallback });
      }
    }
  };

  // Search Address / Landmark
  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const query = encodeURIComponent(`${searchQuery.trim()}, Cambodia`);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`,
        { headers: { 'Accept-Language': 'km,en', 'User-Agent': 'SreyThaCurtain/1.0' } }
      );
      const data = await response.json();
      if (data && data.length > 0) {
        const result = data[0];
        const newLat = parseFloat(result.lat);
        const newLng = parseFloat(result.lon);
        
        setCoords({ lat: newLat, lng: newLng });
        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.flyTo([newLat, newLng], 16, { duration: 1.2 });
          markerRef.current.setLatLng([newLat, newLng]);
        }
        reverseGeocode(newLat, newLng);
      } else {
        alert(`មិនអាចរកឃើញ "${searchQuery}" ឡើយ។ សូមសាកល្បងឈ្មោះផ្លូវ ឬតំបន់ផ្សេងទៀត។`);
      }
    } catch (err) {
      console.error('Search error:', err);
      alert('មានបញ្ហាក្នុងការស្វែងរកទីតាំង សូមព្យាយាមម្តងទៀត។');
    } finally {
      setSearching(false);
    }
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [coords.lat, coords.lng],
      zoom: 15,
      zoomControl: false
    });
    mapInstanceRef.current = map;

    // High quality standard tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Draggable custom marker
    const marker = L.marker([coords.lat, coords.lng], {
      icon: createCustomIcon(),
      draggable: true
    }).addTo(map);
    markerRef.current = marker;

    // Marker Drag End
    marker.on('dragend', (e) => {
      const { lat, lng } = e.target.getLatLng();
      setCoords({ lat, lng });
      reverseGeocode(lat, lng);
    });

    // Map Click
    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      marker.setLatLng([lat, lng]);
      setCoords({ lat, lng });
      reverseGeocode(lat, lng);
    });

    reverseGeocode(coords.lat, coords.lng);

    return () => {
      map.remove();
    };
  }, []);

  // Handle Fullscreen state change (body lock & map resize)
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    // Leaflet requires invalidateSize when container dimensions change
    const timer = setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 200);

    return () => {
      clearTimeout(timer);
      document.body.style.overflow = '';
    };
  }, [isFullscreen]);

  // Handle Escape key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Use Browser Geolocation (Current Location)
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('កម្មវិធីរុករករបស់អ្នកមិនគាំទ្រការចាប់ទីតាំង (Geolocation) ឡើយ');
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCoords({ lat: latitude, lng: longitude });

        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.flyTo([latitude, longitude], 17, { duration: 1.5 });
          markerRef.current.setLatLng([latitude, longitude]);
        }

        reverseGeocode(latitude, longitude);
        setLocating(false);
      },
      (error) => {
        setLocating(false);
        console.warn('Geolocation error:', error);
        alert('សូមអនុញ្ញាតបើក Location (GPS) ក្នុង Browser របស់អ្នកដើម្បីចាប់ទីតាំងស្វ័យប្រវត្តិ។');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomOut();
    }
  };

  return (
    <div style={{ marginTop: '15px', marginBottom: '25px' }}>
      {/* Embedded View Header */}
      {!isFullscreen && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '10px',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: '700' }}>
            <MapPin size={17} color="#16a34a" />
            <span>ជ្រើសរើសទីតាំងលើផែនទី (ចុច ឬទាញ Marker)</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={locating}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '50px',
                border: '1px solid #16a34a',
                backgroundColor: '#f0fdf4',
                color: '#15803d',
                fontSize: '0.78rem',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontFamily: "'Poppins', 'Noto Sans Khmer', 'Kdam Thmor Pro', sans-serif"
              }}
              title="កំណត់ទីតាំងបច្ចុប្បន្នរបស់អ្នក"
            >
              {locating ? <Loader2 size={14} className="spin-anim" /> : <Crosshair size={14} />}
              <span>{locating ? 'កំពុងចាប់ទីតាំង...' : 'ទីតាំងបច្ចុប្បន្ន'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsFullscreen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '50px',
                border: '1px solid #000',
                backgroundColor: '#000',
                color: '#fff',
                fontSize: '0.78rem',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontFamily: "'Poppins', 'Noto Sans Khmer', 'Kdam Thmor Pro', sans-serif"
              }}
              title="ពង្រីកផែនទីពេញអេក្រង់"
            >
              <Maximize2 size={13} />
              <span>ពេញអេក្រង់</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Container (Switches between Normal and Fullscreen Overlay) */}
      <div 
        style={isFullscreen ? {
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 999999,
          backgroundColor: '#fff',
          display: 'flex',
          flexDirection: 'column'
        } : {
          position: 'relative',
          width: '100%',
          height: '260px',
          borderRadius: '16px',
          overflow: 'hidden',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
        }}
      >
        {/* Fullscreen Top Header Bar */}
        {isFullscreen && (
          <div style={{
            padding: '12px 20px',
            backgroundColor: '#ffffff',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '15px',
            flexWrap: 'wrap',
            boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
            zIndex: 1000
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: '#f0fdf4',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#16a34a'
              }}>
                <MapPin size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '800', color: '#0f172a' }}>
                  ជ្រើសរើសទីតាំងដឹកជញ្ជូន
                </h3>
                <p style={{ margin: 0, fontSize: '0.72rem', color: '#64748b' }}>
                  ចុចលើផែនទី ឬទាញ Marker 📍 ដើម្បីកំណត់ទីតាំងជាក់ស្តែង
                </p>
              </div>
            </div>

            {/* Address Search Bar */}
            <form 
              onSubmit={handleSearch}
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: '50px',
                padding: '4px 6px 4px 14px',
                maxWidth: '420px',
                flex: '1 1 280px'
              }}
            >
              <Search size={15} color="#94a3b8" style={{ marginRight: '8px' }} />
              <input
                type="text"
                placeholder="ស្វែងរកឈ្មោះផ្លូវ ឬតំបន់ (ឧទាហរណ៍: Toul Kork, BKK1)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  border: 'none',
                  backgroundColor: 'transparent',
                  outline: 'none',
                  fontSize: '0.82rem',
                  width: '100%',
                  color: '#1e293b',
                  fontFamily: "'Poppins', 'Noto Sans Khmer', 'Kdam Thmor Pro', sans-serif"
                }}
              />
              <button
                type="submit"
                disabled={searching}
                style={{
                  backgroundColor: '#000',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '50px',
                  padding: '6px 14px',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontFamily: "'Poppins', 'Noto Sans Khmer', 'Kdam Thmor Pro', sans-serif"
                }}
              >
                {searching ? <Loader2 size={13} className="spin-anim" /> : 'ស្វែងរក'}
              </button>
            </form>

            {/* Top Action Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={locating}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  borderRadius: '50px',
                  border: '1px solid #16a34a',
                  backgroundColor: '#16a34a',
                  color: '#fff',
                  fontSize: '0.8rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(22, 163, 74, 0.25)',
                  fontFamily: "'Poppins', 'Noto Sans Khmer', 'Kdam Thmor Pro', sans-serif"
                }}
              >
                {locating ? <Loader2 size={15} className="spin-anim" /> : <Crosshair size={15} />}
                <span>{locating ? 'កំពុងចាប់ទីតាំង...' : 'ទីតាំងបច្ចុប្បន្ន'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsFullscreen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  borderRadius: '50px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: '#f1f5f9',
                  color: '#334155',
                  fontSize: '0.8rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  fontFamily: "'Poppins', 'Noto Sans Khmer', 'Kdam Thmor Pro', sans-serif"
                }}
                title="បិទ Fullscreen (ESC)"
              >
                <Minimize2 size={15} />
                <span>បង្រួមវិញ</span>
              </button>
            </div>
          </div>
        )}

        {/* Map Canvas (Leaflet) */}
        <div 
          ref={mapContainerRef} 
          style={{ 
            width: '100%', 
            height: isFullscreen ? 'calc(100vh - 150px)' : '100%',
            flex: isFullscreen ? 1 : 'unset'
          }} 
        />

        {/* Floating Controls Inside Map (Zoom & Quick GPS) */}
        <div style={{
          position: 'absolute',
          right: '14px',
          top: isFullscreen ? '85px' : '14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          zIndex: 500
        }}>
          {/* Zoom Buttons */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#ffffff',
            borderRadius: '10px',
            boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
            overflow: 'hidden',
            border: '1px solid #e2e8f0'
          }}>
            <button
              type="button"
              onClick={handleZoomIn}
              style={{
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                background: '#fff',
                cursor: 'pointer',
                borderBottom: '1px solid #f1f5f9',
                color: '#0f172a'
              }}
              title="ពង្រីក (Zoom In)"
            >
              <Plus size={18} />
            </button>
            <button
              type="button"
              onClick={handleZoomOut}
              style={{
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                background: '#fff',
                cursor: 'pointer',
                color: '#0f172a'
              }}
              title="បង្រួម (Zoom Out)"
            >
              <Minus size={18} />
            </button>
          </div>

          {/* Quick GPS button inside map */}
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={locating}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#16a34a',
              cursor: 'pointer'
            }}
            title="ទៅកាន់ទីតាំងបច្ចុប្បន្ន"
          >
            {locating ? <Loader2 size={18} className="spin-anim" /> : <Crosshair size={18} />}
          </button>

          {/* Quick Fullscreen toggle icon button on map */}
          {!isFullscreen && (
            <button
              type="button"
              onClick={() => setIsFullscreen(true)}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#0f172a',
                cursor: 'pointer'
              }}
              title="ពង្រីកពេញអេក្រង់"
            >
              <Maximize2 size={16} />
            </button>
          )}
        </div>

        {/* Embedded view bottom address badge */}
        {!isFullscreen && (
          <div style={{
            position: 'absolute',
            bottom: '10px',
            left: '10px',
            right: '10px',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(6px)',
            padding: '7px 14px',
            borderRadius: '10px',
            fontSize: '0.74rem',
            color: '#1e293b',
            boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
            zIndex: 500,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ fontWeight: '700', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              📍 {detectedAddress || 'កំពុងកំណត់អាសយដ្ឋាន...'}
            </span>
            <span style={{ fontSize: '0.68rem', color: '#64748b', flexShrink: 0, marginLeft: '10px', fontWeight: '600' }}>
              {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
            </span>
          </div>
        )}

        {/* Fullscreen Bottom Confirmation Floating Bar */}
        {isFullscreen && (
          <div style={{
            padding: '16px 24px',
            backgroundColor: '#ffffff',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '20px',
            boxShadow: '0 -4px 20px rgba(0,0,0,0.06)',
            zIndex: 1000,
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', flex: 1, minWidth: '220px' }}>
              <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '700' }}>
                អាសយដ្ឋានដែលបានជ្រើសរើស
              </span>
              <div style={{ fontSize: '0.95rem', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={18} color="#16a34a" style={{ flexShrink: 0 }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {detectedAddress || 'សូមចុចលើផែនទីដើម្បីជ្រើសរើស...'}
                </span>
              </div>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                កូអរដោនេ: {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setIsFullscreen(false)}
                style={{
                  padding: '12px 24px',
                  borderRadius: '50px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#fff',
                  color: '#475569',
                  fontWeight: '700',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  fontFamily: "'Poppins', 'Noto Sans Khmer', 'Kdam Thmor Pro', sans-serif"
                }}
              >
                ថយក្រោយ
              </button>

              <button
                type="button"
                onClick={() => setIsFullscreen(false)}
                style={{
                  padding: '12px 30px',
                  borderRadius: '50px',
                  border: 'none',
                  backgroundColor: '#000000',
                  color: '#ffffff',
                  fontWeight: '800',
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
                  fontFamily: "'Poppins', 'Noto Sans Khmer', 'Kdam Thmor Pro', sans-serif"
                }}
              >
                <Check size={18} color="#22c55e" />
                <span>បញ្ជាក់ទីតាំងនេះ</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationPickerMap;
