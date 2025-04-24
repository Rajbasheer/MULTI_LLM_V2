import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { AuthLayout } from './AuthLayout';

export function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    // Get token from URL query parameters
    const searchParams = new URLSearchParams(location.search);
    const urlToken = searchParams.get('token');
    
    if (urlToken) {
      setToken(urlToken);
    } else {
      setError('Invalid or missing token. Please request a new password reset link.');
    }
  }, [location]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset error
    setError(null);
    
    // Basic validation
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    
    if (!token) {
      setError('Invalid or missing token. Please request a new password reset link.');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch('http://localhost:8000/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          new_password: password,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Password reset failed');
      }
      
      // Show success message
      setSuccess(true);
      
      // Clear form
      setPassword('');
      setConfirmPassword('');
      
      // Navigate to login page after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
      
    } catch (err: any) {
      setError(err.message || 'An error occurred during password reset');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <AuthLayout>
      <div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
          Reset Your Password
        </h2>
      </div>
      
      {error && (
        <div className="bg-red-900/30 border border-red-500 text-red-300 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      {success ? (
        <div className="text-center p-4">
          <div className="bg-green-900/30 border border-green-500 text-green-300 px-4 py-3 rounded relative mb-4">
            <p>Password reset successful! Redirecting to login page...</p>
          </div>
          <Link to="/login" className="text-indigo-400 hover:text-indigo-300">
            Go to login page
          </Link>
        </div>
      ) : (
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="password" className="sr-only">New Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-700 bg-gray-800 text-gray-300 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="New password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="sr-only">Confirm New Password</label>
              <input
                id="confirm-password"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-700 bg-gray-800 text-gray-300 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                isLoading ? 'bg-indigo-700' : 'bg-indigo-600 hover:bg-indigo-700'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
            >
              {isLoading ? 'Resetting password...' : 'Reset password'}
            </button>
          </div>
          
          <div className="text-center mt-4">
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 text-sm">
              Back to login
            </Link>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}