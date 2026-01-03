import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  signup: (email: string, password: string) => Promise<{ error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// API base URL - use environment variable or default to local
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const CURRENT_USER_KEY = 'budget_app_current_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const storedUser = localStorage.getItem(CURRENT_USER_KEY);
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        // Verify user still exists in database
        verifyUser(parsedUser.id).then((isValid) => {
          if (isValid) {
            setUser(parsedUser);
          } else {
            localStorage.removeItem(CURRENT_USER_KEY);
          }
          setIsLoading(false);
        });
      } catch {
        localStorage.removeItem(CURRENT_USER_KEY);
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  const verifyUser = async (userId: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}/api/users/${userId}`);
      return response.ok;
    } catch {
      return false;
    }
  };

  const login = async (email: string, password: string): Promise<{ error?: string }> => {
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        return { error: error.error || 'Failed to login' };
      }

      const data = await response.json();
      const loggedInUser = { id: data.user.id, email: data.user.email };
      
      // Store user
      setUser(loggedInUser);
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(loggedInUser));
      
      return {};
    } catch (error: any) {
      return { error: error.message || 'Failed to login' };
    }
  };

  const signup = async (email: string, password: string): Promise<{ error?: string }> => {
    try {
      const response = await fetch(`${API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        return { error: error.error || 'Failed to create account' };
      }

      const data = await response.json();
      const loggedInUser = { id: data.user.id, email: data.user.email };
      
      // Store user
      setUser(loggedInUser);
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(loggedInUser));
      
      return {};
    } catch (error: any) {
      return { error: error.message || 'Failed to create account' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(CURRENT_USER_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
