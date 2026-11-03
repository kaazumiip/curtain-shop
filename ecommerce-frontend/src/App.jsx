import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Link } from 'react-router-dom';
import axios from './api/axios';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Shop from './pages/Shop';
import SearchResults from './pages/SearchResults';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderStatus from './pages/OrderStatus';
import OrderFinish from './pages/OrderFinish';
import OrderCancel from './pages/OrderCancel';
import MyOrders from './pages/MyOrders';
import Favorites from './pages/Favorites';
import ChatWidget from './components/ChatWidget';
import About from './pages/About';
import { CheckCircle } from 'lucide-react';
import { LanguageProvider } from './context/LanguageContext';
import './styles/Store.css';

const Toast = ({ message, visible }) => (
  <div style={{
    position: 'fixed',
    bottom: '24px',
    left: '50%',
    maxWidth: 'calc(100vw - 32px)',
    backgroundColor: '#0f172a',
    color: '#fff',
    padding: '12px 22px',
    borderRadius: '50px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
    zIndex: 9999,
    transform: visible ? 'translate(-50%, 0)' : 'translate(-50%, 150%)',
    opacity: visible ? 1 : 0,
    transition: 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    pointerEvents: 'none'
  }}>
    <CheckCircle size={18} color="#22c55e" style={{ flexShrink: 0 }} />
    <span style={{ fontSize: '0.8rem', fontWeight: '700', letterSpacing: '0.5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{message.toUpperCase()}</span>
  </div>
);

// Component to handle page-level animations on route change
const AnimatedRoutes = ({ products, addToCart, cart, removeFromCart, updateQuantity, clearCart, favorites, toggleFavorite }) => {
  const location = useLocation();
  
  // Scroll to top on each route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div key={location.pathname} className="page-transition">
      <Routes location={location}>
        <Route path="/" element={<Home products={products} onAddToCart={addToCart} favorites={favorites} onToggleFavorite={toggleFavorite} />} />
        <Route path="/shop" element={<Shop products={products} onAddToCart={addToCart} favorites={favorites} onToggleFavorite={toggleFavorite} />} />
        <Route path="/search" element={<SearchResults products={products} onAddToCart={addToCart} favorites={favorites} onToggleFavorite={toggleFavorite} />} />
        <Route path="/product/:id" element={<ProductDetail onAddToCart={addToCart} favorites={favorites} onToggleFavorite={toggleFavorite} />} />
        <Route path="/favorites" element={<Favorites favorites={favorites} onToggleFavorite={toggleFavorite} onAddToCart={addToCart} />} />
        <Route path="/cart" element={<Cart cart={cart} onRemoveFromCart={removeFromCart} onUpdateQuantity={updateQuantity} />} />
        <Route path="/checkout" element={<Checkout cart={cart} onOrderPlaced={clearCart} />} />
        <Route path="/order-status" element={<OrderStatus />} />
        <Route path="/order-finish" element={<OrderFinish />} />
        <Route path="/order-cancel" element={<OrderCancel />} />
        <Route path="/about" element={<About />} />
        <Route path="/my-orders" element={<MyOrders />} />
      </Routes>
      <ChatWidget />
    </div>
  );
};

function App() {
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('srey_tha_cart');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem('srey_tha_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ message: '', visible: false });

  // Persist cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('srey_tha_cart', JSON.stringify(cart));
    } catch (e) {
      console.error('Failed to save cart to localStorage', e);
    }
  }, [cart]);

  // Persist favorites to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('srey_tha_favorites', JSON.stringify(favorites));
    } catch (e) {
      console.error('Failed to save favorites to localStorage', e);
    }
  }, [favorites]);

  const triggerToast = (message) => {
    setToast({ message, visible: true });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await axios.get('/products');
      setProducts(res.data);
    } catch (err) {
      console.error('Error fetching boutique items:', err);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (productOrItems) => {
    if (Array.isArray(productOrItems)) {
      if (productOrItems.length === 0) return;
      const newItems = productOrItems.map(p => ({
        ...p,
        selectedSize: p.selectedSize || (p.customOptions?.sizeOptions?.length > 0 ? p.customOptions.sizeOptions[0] : null),
        selectedColor: p.selectedColor || null,
        poleColor: p.poleColor || (p.customOptions?.ringColors?.length > 0 ? p.customOptions.ringColors[0].name : 'Gold'),
        totalPrice: p.totalPrice || p.price
      }));
      setCart(prev => [...prev, ...newItems]);
      triggerToast(`បានដាក់ ${newItems.length} ទំហំបង្អួចចូលកន្ត្រកទំនិញជោគជ័យ!`);
    } else {
      const cartItem = {
        ...productOrItems,
        selectedSize: productOrItems.selectedSize || (productOrItems.customOptions?.sizeOptions?.length > 0 ? productOrItems.customOptions.sizeOptions[0] : null),
        selectedColor: productOrItems.selectedColor || null,
        poleColor: productOrItems.poleColor || (productOrItems.customOptions?.ringColors?.length > 0 ? productOrItems.customOptions.ringColors[0].name : 'Gold'),
        totalPrice: productOrItems.totalPrice || productOrItems.price
      };
      setCart(prev => [...prev, cartItem]);
      triggerToast(`${productOrItems.name} added to cart`);
    }
  };

  const removeFromCart = (index) => {
    const updated = [...cart];
    updated.splice(index, 1);
    setCart(updated);
  };

  const toggleFavorite = (product) => {
    const isFavorite = favorites.some(f => f._id === product._id);
    if (isFavorite) {
      setFavorites(favorites.filter(f => f._id !== product._id));
      triggerToast(`${product.name} removed from favorites`);
    } else {
      setFavorites([...favorites, product]);
      triggerToast(`${product.name} added to favorites`);
    }
  };

  const updateQuantity = (index, newQuantity) => {
    const updated = [...cart];
    const item = updated[index];
    item.quantity = newQuantity;
    
    if (item.category === 'Accessories') {
      if (item.subCategory?.toLowerCase() === 'pole') {
        item.totalPrice = (Number(item.price) * (parseFloat(item.customWidth) || 0) * newQuantity).toFixed(2);
        item.selectedSize = { name: `${item.customWidth}m × ${newQuantity} Units` };
      } else {
        item.totalPrice = (Number(item.price) * newQuantity).toFixed(2);
        item.selectedSize = { name: `${newQuantity} Units` };
      }
    } else if (item.category === 'Curtain' || item.category === 'Valance') {
      const w = parseFloat(item.customWidth) || 0;
      const h = parseFloat(item.customHeight) || 0;
      const excess = h > 2.5 ? (h - 2.5) : 0;
      item.totalPrice = (Number(item.price) * w * (1 + excess) * newQuantity).toFixed(2);
      item.selectedSize = { name: `${item.windowLabel || ''}: ${w}m × ${h}m × ${newQuantity} គ្រឿង` };
    } else if (item.category === 'Fabric') {
      const m = parseFloat(item.fabricMeters) || 0;
      item.totalPrice = (Number(item.price) * m * newQuantity).toFixed(2);
      item.selectedSize = { name: `${m}m × ${newQuantity} Units` };
    } else {
      item.totalPrice = (Number(item.price) * newQuantity).toFixed(2);
    }
    
    setCart(updated);
  };

  const clearCart = () => setCart([]);

  return (
    <LanguageProvider>
      <Router>
        <div className="store-container">
          <Navbar 
            products={products}
            cartCount={cart.length} 
            favoriteCount={favorites.length}
            searchQuery={searchQuery} 
            setSearchQuery={setSearchQuery} 
          />
          
          <main>
            <AnimatedRoutes 
              products={products}
              addToCart={addToCart}
              cart={cart}
              removeFromCart={removeFromCart}
              updateQuantity={updateQuantity}
              clearCart={clearCart}
              favorites={favorites}
              toggleFavorite={toggleFavorite}
            />
          </main>
  
          <footer className="editorial-footer">
            {/* Column 1: Product Types */}
            <div>
              <h4 className="editorial-footer-heading">ប្រភេទផលិតផល</h4>
              <div className="editorial-footer-list">
                <Link to="/shop?category=All">ទាំងអស់</Link>
                <Link to="/shop?category=Curtain">វាំងនន</Link>
                <Link to="/shop?category=Valance">ដក់</Link>
                <Link to="/shop?category=Fabric">ក្រណាត់ម៉ែត្រ</Link>
                <Link to="/shop?category=Bed%20Sheet">កម្រាលពូក</Link>
                <Link to="/shop?category=Pillow%20Case">ស្រោមខ្នើយ</Link>
                <Link to="/shop?category=Accessories">គ្រឿងបន្លាស់</Link>
              </div>
            </div>

            {/* Column 2: Information */}
            <div>
              <h4 className="editorial-footer-heading">ព័ត៌មានទូទៅ</h4>
              <div className="editorial-footer-list">
                <Link to="/about">អំពីយើង</Link>
                <Link to="/my-orders">ការបញ្ជាទិញរបស់ខ្ញុំ</Link>
                <Link to="/order-status">តាមដានការបញ្ជាទិញ</Link>
                <a href="https://t.me/sreythacurtain" target="_blank" rel="noreferrer">ទំនាក់ទំនងតាម Telegram</a>
              </div>
            </div>
          </footer>
        </div>
        <Toast message={toast.message} visible={toast.visible} />
      </Router>
    </LanguageProvider>
  );
}

export default App;
