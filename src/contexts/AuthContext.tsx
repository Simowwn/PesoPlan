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

// Mock user storage for demo (will be replaced with Supabase)
const MOCK_USERS_KEY = 'budget_app_users';
const CURRENT_USER_KEY = 'budget_app_current_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const storedUser = localStorage.getItem(CURRENT_USER_KEY);
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<{ error?: string }> => {
    const users = JSON.parse(localStorage.getItem(MOCK_USERS_KEY) || '{}');
    const userRecord = users[email];
    
    if (!userRecord) {
      return { error: 'No account found with this email' };
    }
    
    if (userRecord.password !== password) {
      return { error: 'Invalid password' };
    }
    
    const loggedInUser = { id: userRecord.id, email };
    setUser(loggedInUser);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(loggedInUser));
    return {};
  };

  const signup = async (email: string, password: string): Promise<{ error?: string }> => {
    const users = JSON.parse(localStorage.getItem(MOCK_USERS_KEY) || '{}');
    
    if (users[email]) {
      return { error: 'An account with this email already exists' };
    }
    
    const newUser = {
      id: crypto.randomUUID(),
      password,
    };
    
    users[email] = newUser;
    localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users));
    
    const loggedInUser = { id: newUser.id, email };
    setUser(loggedInUser);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(loggedInUser));
    return {};
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
