import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthLayout } from './AuthLayout';

interface LoginProps {
  onLoginSuccess: (token: string) => void;
}

export function Login({ onLoginSuccess }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Login failed');
      }

      // Store token in localStorage
      localStorage.setItem('token', data.access_token);
      
      // Call the success handler with the token
      onLoginSuccess(data.access_token);
      
      // Navigate to app
      navigate('/');
    } catch (err: any) {
      if (err.message.includes('Email not verified')) {
        setError('Your email has not been verified. Please check your inbox or request a new verification link.');
      } else {
        setError(err.message || 'An error occurred during login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8000/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: resetEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to send password reset email');
      }

      setResetSent(true);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };
 

  

  return (
    <AuthLayout>
      <div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
          {showForgotPassword ? 'Reset Your Password' : 'Sign in to your account'}
        </h2>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-500 text-red-300 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {!showForgotPassword ? (
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="username" className="sr-only">Username</label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-700 bg-gray-800 text-gray-300 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-700 bg-gray-800 text-gray-300 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-700 bg-gray-800 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-300">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="font-medium text-indigo-400 hover:text-indigo-300"
              >
                Forgot your password?
              </button>
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
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
          
          <div className="text-center mt-4">
            <p className="text-sm text-gray-400">
              Don't have an account?{' '}
              <Link to="/signup" className="text-indigo-400 hover:text-indigo-300">
                Sign up
              </Link>
            </p>
          </div>
        </form>
      ) : (
        <div>
          {resetSent ? (
            <div className="text-center p-4">
              <p className="text-green-400 mb-4">
                Password reset link has been sent to your email!
              </p>
              <button
                onClick={() => {
                  setShowForgotPassword(false);
                  setResetSent(false);
                }}
                className="text-indigo-400 hover:text-indigo-300"
              >
                Back to login
              </button>
            </div>
          ) : (
            <form className="mt-8 space-y-6" onSubmit={handleForgotPassword}>
              <div>
                <label htmlFor="reset-email" className="sr-only">Email address</label>
                <input
                  id="reset-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-700 bg-gray-800 text-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Email address"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                    isLoading ? 'bg-indigo-700' : 'bg-indigo-600 hover:bg-indigo-700'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                >
                  {isLoading ? 'Sending...' : 'Send reset link'}
                </button>
              </div>

              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(false)}
                  className="text-indigo-400 hover:text-indigo-300 text-sm"
                >
                  Back to login
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </AuthLayout>
  );
}