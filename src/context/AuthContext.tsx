import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

interface User {
  id: string;
  nama: string;
  email: string;
  role: string;
}

interface LoginResult {
  requires2FA: boolean;
  tempToken?: string;
  is2FASetup?: boolean;
  qrCodeUrl?: string;
  secret?: string;
  accessToken?: string;
  user?: User;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, pass: string) => Promise<LoginResult>;
  verify2FA: (tempToken: string, code: string, secret?: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  setAuthData: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const savedUser = localStorage.getItem('user_data');
      const token = localStorage.getItem('auth_token');
      
      if (savedUser && token) {
        try {
          setUser(JSON.parse(savedUser));
        } catch (err) {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user_data');
          setUser(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const setAuthData = (userData: User) => {
    setUser(userData);
  };

  const login = async (username: string, password: string): Promise<LoginResult> => {
    const response = await api.post('/auth/login', { username, password });
    return response.data;
  };

  const verify2FA = async (tempToken: string, code: string, secret?: string) => {
    const response = await api.post('/auth/verify-2fa', { tempToken, code, secret });
    const { accessToken, user: userData } = response.data;
    
    localStorage.setItem('auth_token', accessToken);
    localStorage.setItem('user_data', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      setUser(null);
      window.location.href = '/signin';
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      verify2FA, 
      logout, 
      isAuthenticated: !!user,
      setAuthData
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
