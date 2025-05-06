import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UserProfilePage from './auth/UserProfilePage';

// Container component to handle authentication checks
export default function ProfilePage() {
  const navigate = useNavigate();
  
  // Check authentication on component mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    
    // If no token, redirect to login
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);
  
  return <UserProfilePage />;
}