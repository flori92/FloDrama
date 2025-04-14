import { useState, useEffect, createContext, useContext } from 'react';

interface User {
  id: string;
  username: string;
  email: string;
  token: string;
  preferences?: {
    language: string;
    theme: 'light' | 'dark';
    notifications: boolean;
  };
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Vérifier le token stocké au chargement
    const checkAuth = async () => {
      try {
        const storedToken = localStorage.getItem('flodrama_token');
        if (!storedToken) {
          setIsLoading(false);
          return;
        }

        const response = await fetch('/api/auth/verify', {
          headers: {
            'Authorization': `Bearer ${storedToken}`
          }
        });

        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          localStorage.removeItem('flodrama_token');
        }
      } catch (err) {
        console.error('Erreur de vérification d\'authentification:', err);
        setError('Erreur lors de la vérification de l\'authentification');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        throw new Error('Identifiants invalides');
      }

      const data = await response.json();
      localStorage.setItem('flodrama_token', data.token);
      setUser(data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de connexion');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('flodrama_token');
    setUser(null);
  };

  const updateUser = async (data: Partial<User>) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour du profil');
      }

      const updatedUser = await response.json();
      setUser(prev => prev ? { ...prev, ...updatedUser } : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de mise à jour');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, error, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export default useAuth;
