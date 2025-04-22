// Authentication service for handling API calls to backend

const API_URL = 'http://localhost:8000';

interface LoginParams {
  username: string;
  password: string;
}

interface SignupParams {
  username: string;
  email: string;
  password: string;
}

interface ResetPasswordParams {
  token: string;
  new_password: string;
}

// Login user
export const login = async (credentials: LoginParams) => {
  const response = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to login');
  }
  
  const data = await response.json();
  
  // Store token in localStorage
  localStorage.setItem('accessToken', data.access_token);
  
  return data;
};

// Register user
export const signup = async (userData: SignupParams) => {
  const response = await fetch(`${API_URL}/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to register');
  }
  
  return response.json();
};

// Send verification email
export const sendVerificationEmail = async (email: string) => {
  const response = await fetch(`${API_URL}/auth/send-verification`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to send verification email');
  }
  
  return response.json();
};

// Verify email
export const verifyEmail = async (token: string) => {
  const response = await fetch(`${API_URL}/auth/verify-email?token=${token}`, {
    method: 'GET',
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to verify email');
  }
  
  return response.json();
};

// Send password reset email
export const forgotPassword = async (email: string) => {
  const response = await fetch(`${API_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to send password reset email');
  }
  
  return response.json();
};

// Reset password
export const resetPassword = async (params: ResetPasswordParams) => {
  const response = await fetch(`${API_URL}/auth/reset-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to reset password');
  }
  
  return response.json();
};

// Logout user
export const logout = () => {
  localStorage.removeItem('accessToken');
};

// Get current token
export const getToken = () => {
  return localStorage.getItem('accessToken');
};

// Check if user is authenticated
export const isAuthenticated = () => {
  return !!getToken();
};

// Update App.tsx to include a logout button
export const updateAppWithAuth = (App: React.ComponentType<any>) => {
  // Return a new component with authentication
  return (props: any) => {
    const handleLogout = () => {
      logout();
      // Redirect to login page
      window.location.href = '/login';
    };
    
    return <App {...props} onLogout={handleLogout} />;
  };
};