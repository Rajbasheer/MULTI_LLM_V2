import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { AuthLayout } from './AuthLayout';

export function VerifyEmail() {
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(true);
  const [success, setSuccess] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    // Get token from URL query parameters
    const searchParams = new URLSearchParams(location.search);
    const token = searchParams.get('token');
    
    if (!token) {
      setError('Invalid or missing token. Please request a new verification link.');
      setIsVerifying(false);
      return;
    }
    
    const verifyEmail = async () => {
      try {
        const response = await fetch(`http://localhost:8000/auth/verify-email?token=${token}`, {
          method: 'GET',
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.detail || 'Email verification failed');
        }
        
        // Show success message
        setSuccess(true);
        
        // Navigate to login page after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
        
      } catch (err: any) {
        setError(err.message || 'An error occurred during email verification');
      } finally {
        setIsVerifying(false);
      }
    };
    
    verifyEmail();
  }, [location, navigate]);
  
  return (
    <AuthLayout>
      <div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
          Email Verification
        </h2>
      </div>
      
      {isVerifying ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : success ? (
        <div className="text-center p-4">
          <div className="bg-green-900/30 border border-green-500 text-green-300 px-4 py-3 rounded relative mb-4">
            <p>Your email has been successfully verified! Redirecting to login page...</p>
          </div>
          <Link to="/login" className="text-indigo-400 hover:text-indigo-300">
            Go to login page
          </Link>
        </div>
      ) : (
        <div className="text-center p-4">
          <div className="bg-red-900/30 border border-red-500 text-red-300 px-4 py-3 rounded relative mb-4">
            <p>{error || 'Email verification failed. Please try again or request a new verification link.'}</p>
          </div>
          <Link to="/login" className="text-indigo-400 hover:text-indigo-300">
            Go to login page
          </Link>
        </div>
      )}
    </AuthLayout>
  );
}