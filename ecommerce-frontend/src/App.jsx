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
    bottom: '40px',
    right: '40px',
    backgroundColor: '#000',
    color: '#fff',
    padding: '15px 30px',
    borderRadius: '50px',
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
    zIndex: 9999,
    transform: visible ? 'translateY(0)' : 'translateY(150%)',
    opacity: visible ? 1 : 0,
    transition: 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    pointerEvents: 'none'
  }}>
    <CheckCircle size={20} color="var(--accent-pink)" />
    <span style={{ fontSize: '0.85rem', fontWeight: '700', letterSpacing: '1px' }}>{message.toUpperCase()}</span>
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
  const [cart, setCart] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ message: '', visible: false });

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

  const addToCart = (product) => {
    // Ensure defaults if added directly from grid
    const cartItem = {
      ...product,
      selectedSize: product.selectedSize || (product.customOptions?.sizeOptions?.length > 0 ? product.customOptions.sizeOptions[0] : null),
      selectedColor: product.selectedColor || null,
      poleColor: product.poleColor || (product.customOptions?.ringColors?.length > 0 ? product.customOptions.ringColors[0].name : 'Gold'),
      totalPrice: product.totalPrice || product.price
    };
    
    setCart([...cart, cartItem]);
    triggerToast(`${product.name} added to cart`);
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
      item.totalPrice = (Number(item.price) * w * h * newQuantity).toFixed(2);
      item.selectedSize = { name: `${w}m x ${h}m × ${newQuantity} Units` };
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
