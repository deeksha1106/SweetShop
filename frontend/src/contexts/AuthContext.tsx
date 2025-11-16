'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { authApi } from '@/utils/api';
import toast from 'react-hot-toast';

interface User {
  id: number;
  email: string;
  role: 'user' | 'admin';
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, role?: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
  isAdmin: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = Cookies.get('auth_token');
      if (savedToken) {
        setToken(savedToken);
        try {
          const result: any = await authApi.getProfile(savedToken);
          if (result?.success) {
            setUser(result.data.user);
          } else {
            // Invalid token, remove it
            Cookies.remove('auth_token');
            setToken(null);
          }
        } catch (error) {
          console.error('Auth initialization error:', error);
          Cookies.remove('auth_token');
          setToken(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      const result: any = await authApi.login(email, password);

      if (result?.success) {
        const { user: userData, token: userToken } = result.data;
        setUser(userData);
        setToken(userToken);
        Cookies.set('auth_token', userToken, { expires: 1 }); // 1 day
        toast.success(`Welcome back, ${userData.email}!`);
        return true;
      } else {
        toast.error(result?.message || 'Login failed');
        return false;
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.response?.data?.message || 'Login failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, role?: string): Promise<boolean> => {
    try {
      setLoading(true);
      const result: any = await authApi.register(email, password, role);

      if (result?.success) {
        const { user: userData, token: userToken } = result.data;
        setUser(userData);
        setToken(userToken);
        Cookies.set('auth_token', userToken, { expires: 1 }); // 1 day
        toast.success(`Welcome to Sweet Shop, ${userData.email}!`);
        return true;
      } else {
        toast.error(result?.message || 'Registration failed');
        return false;
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.response?.data?.message || 'Registration failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    Cookies.remove('auth_token');
    toast.success('Logged out successfully');
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    register,
    logout,
    loading,
    isAdmin: user?.role === 'admin',
    isAuthenticated: !!user && !!token,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
