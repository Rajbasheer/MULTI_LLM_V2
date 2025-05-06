import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface UserProfile {
  id: string;
  username: string;
  email: string;
  tokens_remaining: number;
  tokens_total: number;
  created_at: string;
  last_login: string;
  payment_method?: {
    type: string;
    last_four: string;
    expiry: string;
  };
}

export default function UserProfilePage() {
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form states
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');

  // UI states
  const [activeSection, setActiveSection] = useState('profile');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return document.documentElement.classList.contains('dark');
  });

  // Handler to go back to main application
  const handleBack = () => {
    navigate('/');
  };

  // Fetch user profile on component mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
        const response = await fetch('http://localhost:8000/user/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch user profile');
        }
        
        const data = await response.json();
        setUserProfile(data);
        setEmail(data.email);
      } catch (err) {
        console.error('Error fetching user profile:', err);
        setError('Failed to load user profile. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserProfile();
  }, []);

  // Update email handler
  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:8000/user/update-email', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to update email');
      }
      
      setSuccess('Email updated successfully!');
      
      // Update local user profile
      if (userProfile) {
        setUserProfile({
          ...userProfile,
          email
        });
      }
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err: any) {
      console.error('Error updating email:', err);
      setError(err.message || 'Failed to update email. Please try again.');
    }
  };

  // Update password handler
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    // Validate password match
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    
    // Validate password length
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:8000/user/update-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to update password');
      }
      
      setSuccess('Password updated successfully!');
      
      // Clear form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err: any) {
      console.error('Error updating password:', err);
      setError(err.message || 'Failed to update password. Please try again.');
    }
  };

  // Update payment method handler
  const handleUpdatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    // Simple validation
    if (cardNumber.length < 16) {
      setError('Please enter a valid card number');
      return;
    }
    
    if (cardExpiry.length < 5) {
      setError('Please enter a valid expiry date (MM/YY)');
      return;
    }
    
    if (cardCvc.length < 3) {
      setError('Please enter a valid CVC');
      return;
    }
    
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:8000/user/update-payment', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          card_number: cardNumber,
          expiry: cardExpiry,
          cvc: cardCvc
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to update payment method');
      }
      
      setSuccess('Payment method updated successfully!');
      
      // Update local user profile with new payment info
      if (userProfile) {
        setUserProfile({
          ...userProfile,
          payment_method: {
            type: 'card',
            last_four: cardNumber.slice(-4),
            expiry: cardExpiry
          }
        });
      }
      
      // Clear form
      setCardNumber('');
      setCardExpiry('');
      setCardCvc('');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err: any) {
      console.error('Error updating payment method:', err);
      setError(err.message || 'Failed to update payment method. Please try again.');
    }
  };

  // Buy more tokens handler
  const handleBuyTokens = async (tokenAmount: number) => {
    setError(null);
    setSuccess(null);
    
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:8000/user/buy-tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount: tokenAmount })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to purchase tokens');
      }
      
      setSuccess(`Successfully purchased ${tokenAmount.toLocaleString()} tokens!`);
      
      // Update local user profile with new token amount
      if (userProfile) {
        setUserProfile({
          ...userProfile,
          tokens_remaining: userProfile.tokens_remaining + tokenAmount
        });
      }
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err: any) {
      console.error('Error purchasing tokens:', err);
      setError(err.message || 'Failed to purchase tokens. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-screen ${
        isDarkMode ? 'bg-[#343541]' : 'bg-gray-100'
      }`}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${
      isDarkMode ? 'bg-[#343541] text-white' : 'bg-gray-100 text-gray-800'
    }`}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back button */}
        <div className="mb-6 flex items-center">
          <button 
            onClick={handleBack}
            className={`flex items-center ${
              isDarkMode 
                ? 'text-gray-300 hover:text-white' 
                : 'text-gray-600 hover:text-gray-900'
            } transition-colors`}
          >
            <ArrowLeft size={20} className="mr-2" />
            <span>Back to Chat</span>
          </button>
        </div>
        
        <h1 className="text-3xl font-bold mb-6">User Profile</h1>
        
        {/* Token info card */}
        <div className={`mb-8 p-6 rounded-lg shadow-md ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h2 className="text-xl font-semibold mb-2">Token Balance</h2>
              <div className="flex items-baseline">
                <span className={`text-3xl font-bold ${
                  isDarkMode ? 'text-purple-400' : 'text-purple-600'
                }`}>
                  {userProfile?.tokens_remaining.toLocaleString() || 0}
                </span>
                <span className={`ml-2 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  tokens remaining
                </span>
              </div>
            </div>
            <div className="mt-4 md:mt-0 flex space-x-2">
              <button 
                onClick={() => handleBuyTokens(10000)}
                className={`px-4 py-2 rounded-md ${
                  isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
                } transition-colors`}
              >
                + 10K
              </button>
              <button 
                onClick={() => handleBuyTokens(50000)}
                className={`px-4 py-2 rounded-md ${
                  isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
                } transition-colors`}
              >
                + 50K
              </button>
              <button 
                onClick={() => handleBuyTokens(100000)}
                className="px-4 py-2 rounded-md bg-purple-600 hover:bg-purple-700 text-white transition-colors"
              >
                + 100K
              </button>
            </div>
          </div>
          
          {/* Token usage bar */}
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-600">
              <div 
                className="bg-purple-600 h-2.5 rounded-full" 
                style={{ width: `${userProfile ? (userProfile.tokens_remaining / userProfile.tokens_total) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
        </div>
        
        {/* Alert messages */}
        {error && (
          <div className={`mb-6 p-4 rounded-md flex items-center ${
            isDarkMode ? 'bg-red-900/30 border border-red-500 text-red-300' : 'bg-red-100 border border-red-400 text-red-700'
          }`}>
            <AlertCircle className="mr-2 flex-shrink-0" size={18} />
            <span>{error}</span>
          </div>
        )}
        
        {success && (
          <div className={`mb-6 p-4 rounded-md flex items-center ${
            isDarkMode ? 'bg-green-900/30 border border-green-500 text-green-300' : 'bg-green-100 border border-green-400 text-green-700'
          }`}>
            <CheckCircle className="mr-2 flex-shrink-0" size={18} />
            <span>{success}</span>
          </div>
        )}
        
        {/* Section tabs */}
        <div className="flex border-b mb-6 overflow-x-auto">
          <button
            onClick={() => setActiveSection('profile')}
            className={`px-4 py-2 font-medium ${
              activeSection === 'profile'
                ? `border-b-2 border-purple-500 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`
                : isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveSection('password')}
            className={`px-4 py-2 font-medium ${
              activeSection === 'password'
                ? `border-b-2 border-purple-500 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`
                : isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Password
          </button>
          <button
            onClick={() => setActiveSection('payment')}
            className={`px-4 py-2 font-medium ${
              activeSection === 'payment'
                ? `border-b-2 border-purple-500 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`
                : isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Payment
          </button>
        </div>
        
        {/* Section content */}
        <div className={`p-6 rounded-lg shadow-md ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          {/* Profile section */}
          {activeSection === 'profile' && (
            <form onSubmit={handleUpdateEmail}>
              <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
              
              <div className="mb-4">
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Username
                </label>
                <input
                  type="text"
                  value={userProfile?.username || ''}
                  className={`w-full px-4 py-2 rounded-md border focus:outline-none ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white focus:ring-2 focus:ring-purple-500' 
                      : 'bg-gray-100 border-gray-300 text-gray-800 focus:ring-2 focus:ring-purple-500'
                  }`}
                  disabled
                />
                <p className={`mt-1 text-sm ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  Username cannot be changed
                </p>
              </div>
              
              <div className="mb-6">
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full px-4 py-2 rounded-md border focus:outline-none ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white focus:ring-2 focus:ring-purple-500' 
                      : 'bg-white border-gray-300 text-gray-800 focus:ring-2 focus:ring-purple-500'
                  }`}
                  required
                />
              </div>
              
              <button
                type="submit"
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors"
              >
                Update Email
              </button>
            </form>
          )}
          
          {/* Password section */}
          {activeSection === 'password' && (
            <form onSubmit={handleUpdatePassword}>
              <h2 className="text-xl font-semibold mb-4">Change Password</h2>
              
              <div className="mb-4">
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className={`w-full px-4 py-2 rounded-md border focus:outline-none ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white focus:ring-2 focus:ring-purple-500' 
                      : 'bg-white border-gray-300 text-gray-800 focus:ring-2 focus:ring-purple-500'
                  }`}
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={`w-full px-4 py-2 rounded-md border focus:outline-none ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white focus:ring-2 focus:ring-purple-500' 
                      : 'bg-white border-gray-300 text-gray-800 focus:ring-2 focus:ring-purple-500'
                  }`}
                  required
                  minLength={8}
                />
              </div>
              
              <div className="mb-6">
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full px-4 py-2 rounded-md border focus:outline-none ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white focus:ring-2 focus:ring-purple-500' 
                      : 'bg-white border-gray-300 text-gray-800 focus:ring-2 focus:ring-purple-500'
                  }`}
                  required
                />
              </div>
              
              <button
                type="submit"
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors"
              >
                Update Password
              </button>
            </form>
          )}
          
          {/* Payment section */}
          {activeSection === 'payment' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Payment Methods</h2>
              
              {userProfile?.payment_method ? (
                <div className={`mb-6 p-4 rounded-md ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                }`}>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className={`text-sm ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-500'
                      }`}>
                        Current Payment Method
                      </p>
                      <p className="mt-1 font-medium">
                        {userProfile.payment_method.type === 'card' ? 'Credit Card' : 'Payment Method'} ending in {userProfile.payment_method.last_four}
                      </p>
                      <p className={`mt-1 text-sm ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        Expires: {userProfile.payment_method.expiry}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className={`mb-6 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  No payment method on file.
                </p>
              )}
              
              <form onSubmit={handleUpdatePayment}>
                <h3 className="text-lg font-medium mb-4">
                  {userProfile?.payment_method ? 'Update Payment Method' : 'Add Payment Method'}
                </h3>
                
                <div className="mb-4">
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Card Number
                  </label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, ''))}
                    className={`w-full px-4 py-2 rounded-md border focus:outline-none ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white focus:ring-2 focus:ring-purple-500' 
                        : 'bg-white border-gray-300 text-gray-800 focus:ring-2 focus:ring-purple-500'
                    }`}
                    placeholder="1234 5678 9012 3456"
                    maxLength={16}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Expiry Date
                    </label>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        if (value.length <= 4) {
                          if (value.length <= 2) {
                            setCardExpiry(value);
                          } else {
                            setCardExpiry(`${value.slice(0, 2)}/${value.slice(2)}`);
                          }
                        }
                      }}
                      className={`w-full px-4 py-2 rounded-md border focus:outline-none ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white focus:ring-2 focus:ring-purple-500' 
                          : 'bg-white border-gray-300 text-gray-800 focus:ring-2 focus:ring-purple-500'
                      }`}
                      placeholder="MM/YY"
                      maxLength={5}
                      required
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      CVC
                    </label>
                    <input
                      type="text"
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, ''))}
                      className={`w-full px-4 py-2 rounded-md border focus:outline-none ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white focus:ring-2 focus:ring-purple-500' 
                          : 'bg-white border-gray-300 text-gray-800 focus:ring-2 focus:ring-purple-500'
                      }`}
                      placeholder="123"
                      maxLength={4}
                      required
                    />
                  </div>
                </div>
                
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors"
                >
                  {userProfile?.payment_method ? 'Update Card' : 'Add Card'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}