import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { Login } from './components/auth/Login'
import { Signup } from './components/auth/Signup'
import { ResetPassword } from './components/auth/ResetPassword'
import { VerifyEmail } from './components/auth/VerifyEmail'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'

interface ProtectedRouteProps {
  children: React.ReactNode;
  isAuthenticated: boolean;
}

// Simple protected route component
const ProtectedRoute = ({ children, isAuthenticated }: ProtectedRouteProps) => {
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

function MainApp() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('accessToken'));
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!token);
  
  // Handle login success
  const handleLoginSuccess = (newToken: string) => {
    setToken(newToken);
    setIsAuthenticated(true);
  };
  
  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    setToken(null);
    setIsAuthenticated(false);
  };
  
  // Update App.tsx to accept token and logout handler
  const appProps = {
    token,
    onLogout: handleLogout
  };
  
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={
          isAuthenticated ? <Navigate to="/" /> : <Login onLoginSuccess={handleLoginSuccess} />
        } />
        <Route path="/signup" element={
          isAuthenticated ? <Navigate to="/" /> : <Signup />
        } />
        <Route path="/reset-password" element={
          isAuthenticated ? <Navigate to="/" /> : <ResetPassword />
        } />
        <Route path="/verify-email" element={
          isAuthenticated ? <Navigate to="/" /> : <VerifyEmail />
        } />
        <Route path="/" element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <App {...appProps} />
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MainApp />
  </React.StrictMode>,
)