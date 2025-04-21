// Version stub temporaire de useAuth.ts pour permettre la compilation
import React from 'react';

export interface User {
  id: string;
  username: string;
  email: string;
  token: string;
  language: string;
  theme: 'light' | 'dark';
  notifications: boolean;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<User>) => Promise<void>;
}

// Hook stub simplifié
export function useAuth(): AuthContextType {
  return {
    user: null,
    isLoading: false,
    error: null,
    login: async () => {},
    logout: () => {},
    updateUser: async () => {}
  };
}

// Provider stub simplifié sans JSX
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  return children as React.ReactElement;
};

export default useAuth;
