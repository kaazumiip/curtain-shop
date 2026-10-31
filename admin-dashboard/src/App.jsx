import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import OrderDetails from './pages/OrderDetails';
import Login from './pages/Login';
import { LanguageProvider } from './context/LanguageContext';
import './styles/Dashboard.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('srey_tha_admin_auth') === 'true';
  });

  const handleLogout = () => {
    localStorage.removeItem('srey_tha_admin_auth');
    setIsAuthenticated(false);
  };

  return (
    <LanguageProvider>
      <Router>
        <Routes>
          <Route 
            path="/login" 
            element={
              isAuthenticated ? <Navigate to="/" replace /> : <Login onLoginSuccess={() => setIsAuthenticated(true)} />
            } 
          />
          <Route 
            path="/" 
            element={
              isAuthenticated ? <Dashboard onLogout={handleLogout} /> : <Navigate to="/login" replace />
            } 
          />
          <Route 
            path="/order/:id" 
            element={
              isAuthenticated ? <OrderDetails onLogout={handleLogout} /> : <Navigate to="/login" replace />
            } 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </LanguageProvider>
  );
}

export default App;
