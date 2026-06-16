import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import OrderDetails from './pages/OrderDetails';
import { LanguageProvider } from './context/LanguageContext';
import './styles/Dashboard.css';

function App() {
  return (
    <LanguageProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/order/:id" element={<OrderDetails />} />
        </Routes>
      </Router>
    </LanguageProvider>
  );
}

export default App;
