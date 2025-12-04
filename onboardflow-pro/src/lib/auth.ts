export interface User {
  fullName: string;
  email: string;
  mobile: string;
  password: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
}

export const getAuthState = (): AuthState => {
  const token = localStorage.getItem("auth_token");
  const user = localStorage.getItem("kyc_user");
  
  return {
    isAuthenticated: !!token && !!user,
    user: user ? JSON.parse(user) : null,
  };
};
// Type definition for User
export interface  User {
  name: string;
  email: string;
  password: string;
  mobile: string;
}

// Type definition for User
export interface User {
  name: string;
  email: string;
  password: string;
  mobile: string;
}

// Backend API base URL
const API_BASE_URL = 'http://localhost:5000';

// Fetch current user data using token
export const fetchUserData = async (): Promise<{ success: boolean; user?: any; error?: string }> => {
  console.log('[FETCH-USER] Fetching user data...');
  
  const token = localStorage.getItem('auth_token');
  
  if (!token) {
    console.log('[FETCH-USER] No token found');
    return { success: false, error: 'No token found' };
  }
  
  try {
    console.log('[FETCH-USER] Sending request with token...');
    
    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    console.log('[FETCH-USER] Response status:', response.status);
    
    const data = await response.json();
    console.log('[FETCH-USER] Response data:', data);
    
    if (!response.ok) {
      console.error('[FETCH-USER] Failed to fetch user:', data.message);
      
      if (response.status === 401) {
        // Token is invalid, clear it
        localStorage.removeItem('auth_token');
        localStorage.removeItem('kyc_user');
      }
      
      return { success: false, error: data.message || 'Failed to fetch user data' };
    }
    
    console.log('[FETCH-USER] User data fetched successfully');
    
    // Update localStorage with fresh user data
    localStorage.setItem('kyc_user', JSON.stringify(data.user));
    
    return { success: true, user: data.user };
    
  } catch (error) {
    console.error('[FETCH-USER] Exception:', error);
    return { success: false, error: 'Network error' };
  }
};

// Frontend signup function
export const signup = async (user: User): Promise<{ success: boolean; error?: string; token?: string; userData?: any }> => {
  console.log('[SIGNUP] Starting signup process...');
  console.log('[SIGNUP] User data:', { 
    email: user.email, 
    mobile: user.mobile,
    name: user.name 
  });

  try {
    // Prepare request body matching backend expectations
    const requestBody = {
      name: user.name,
      email: user.email,
      password: user.password,
      phone: user.mobile // Map 'mobile' to 'phone' for backend
    };

    console.log('[SIGNUP] Sending request to backend...');
    console.log('[SIGNUP] Request body:', { ...requestBody, password: '***' }); // Hide password in logs

    // Make API call to backend - Update the URL to match your backend server
    const response = await fetch('http://localhost:5000/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('[SIGNUP] Response status:', response.status);
    
    const data = await response.json();
    console.log('[SIGNUP] Response data:', data);

    if (!response.ok) {
      console.error('[SIGNUP] Signup failed:', data.message || data.error);
      
      // Handle specific error cases
      if (response.status === 400) {
        return { success: false, error: data.message || "User already exists" };
      }
      
      return { success: false, error: data.message || data.error || "Signup failed" };
    }

    // Successful signup
    console.log('[SIGNUP] Signup successful!');
    console.log('[SIGNUP] User ID:', data.user?.id);
    console.log('[SIGNUP] Token received:', data.token ? 'Yes' : 'No');

    // Store token and user data (using in-memory or state management instead of localStorage)
    // You should pass this to your React state or context
    const userData = {
      id: data.user.id,
      name: data.user.name,
      email: data.user.email,
      phone: data.user.phone
    };

    console.log('[SIGNUP] User data to store:', userData);

    return { 
      success: true, 
      token: data.token,
      userData: userData
    };

  } catch (error) {
    console.error('[SIGNUP] Exception occurred:', error);
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error('[SIGNUP] Network error - backend may be unreachable');
      return { success: false, error: "Network error. Please check your connection." };
    }
    
    return { success: false, error: "Failed to create account. Please try again." };
  }
};



// Login function
export const login = async (email: string, password: string): Promise<{ success: boolean; error?: string; token?: string; userData?: any }> => {
  console.log('[LOGIN] Starting login process...');
  console.log('[LOGIN] Email:', email);

  try {
    const requestBody = {
      email,
      password
    };

    console.log('[LOGIN] Sending request to backend...');

    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('[LOGIN] Response status:', response.status);
    
    const data = await response.json();
    console.log('[LOGIN] Response data:', data);

    if (!response.ok) {
      console.error('[LOGIN] Login failed:', data.message || data.error);
      return { success: false, error: data.message || data.error || "Login failed" };
    }

    console.log('[LOGIN] Login successful!');
    console.log('[LOGIN] User ID:', data.user?.id);
    console.log('[LOGIN] Token received:', data.token ? 'Yes' : 'No');

    // Store token and user data
    if (data.token) {
      localStorage.setItem('auth_token', data.token);
    }
    if (data.user) {
      localStorage.setItem('kyc_user', JSON.stringify(data.user));
    }

    console.log('[LOGIN] User data stored successfully');

    return { 
      success: true, 
      token: data.token,
      userData: data.user
    };

  } catch (error) {
    console.error('[LOGIN] Exception occurred:', error);
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error('[LOGIN] Network error - backend may be unreachable');
      return { success: false, error: "Network error. Please check your connection." };
    }
    
    return { success: false, error: "Login failed. Please try again." };
  }
};

// Logout function
export const logout = (): void => {
  console.log('[LOGOUT] Logging out user...');
  
  // Clear all auth data from localStorage
  localStorage.removeItem('auth_token');
  localStorage.removeItem('kyc_user');
  
  console.log('[LOGOUT] User logged out successfully');
};