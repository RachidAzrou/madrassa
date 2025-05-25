import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Componenten
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Students from './components/Students';
import Teachers from './components/Teachers';
import Classes from './components/Classes';
import Settings from './components/Settings';

// Electron API typedefinitie
window.electronAPI = window.electronAPI || {
  getAppInfo: () => Promise.resolve({ appName: 'MyMadrassa Web Version', version: '1.0.0' }),
  getDatabaseConnection: () => Promise.resolve({ success: true }),
  executeQuery: () => Promise.resolve({ success: true, data: [] })
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [appInfo, setAppInfo] = useState(null);
  const [dbConnected, setDbConnected] = useState(false);

  useEffect(() => {
    // Haal app info op van Electron (indien beschikbaar)
    window.electronAPI.getAppInfo()
      .then(info => {
        console.log('App info:', info);
        setAppInfo(info);
      })
      .catch(err => console.error('Kon app info niet ophalen:', err));

    // Controleer database verbinding
    window.electronAPI.getDatabaseConnection()
      .then(result => {
        console.log('Database verbinding:', result);
        setDbConnected(result.success);
      })
      .catch(err => console.error('Kon geen database verbinding maken:', err));

    // Controleer of de gebruiker al is ingelogd
    const authStatus = localStorage.getItem('isAuthenticated');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (credentials) => {
    // In een echte app zou dit een API-aanroep doen
    if (credentials.email === 'admin@mymadrassa.be' && credentials.password === 'admin123') {
      setIsAuthenticated(true);
      localStorage.setItem('isAuthenticated', 'true');
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('isAuthenticated');
  };

  // Beveiligde route component
  const ProtectedRoute = ({ children }) => {
    if (!isAuthenticated) {
      return <Navigate to="/login" />;
    }
    return children;
  };

  return (
    <Router>
      <div className="app">
        {isAuthenticated && (
          <>
            <Sidebar />
            <div className="content-container">
              <Header onLogout={handleLogout} appInfo={appInfo} />
              <main className="main-content">
                <Routes>
                  <Route path="/" element={
                    <ProtectedRoute>
                      <Dashboard dbConnected={dbConnected} />
                    </ProtectedRoute>
                  } />
                  <Route path="/students" element={
                    <ProtectedRoute>
                      <Students />
                    </ProtectedRoute>
                  } />
                  <Route path="/teachers" element={
                    <ProtectedRoute>
                      <Teachers />
                    </ProtectedRoute>
                  } />
                  <Route path="/classes" element={
                    <ProtectedRoute>
                      <Classes />
                    </ProtectedRoute>
                  } />
                  <Route path="/settings" element={
                    <ProtectedRoute>
                      <Settings appInfo={appInfo} />
                    </ProtectedRoute>
                  } />
                </Routes>
              </main>
            </div>
          </>
        )}
        {!isAuthenticated && (
          <Routes>
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        )}
      </div>
    </Router>
  );
}

export default App;