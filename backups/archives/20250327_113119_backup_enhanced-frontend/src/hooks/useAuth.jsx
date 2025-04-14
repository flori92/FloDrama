import { useState, useEffect, createContext, useContext } from 'react';

// Contexte d'authentification
const AuthContext = createContext({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: () => {},
  logout: () => {},
  register: () => {},
  error: null
});

// Provider d'authentification
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Vérification de l'état d'authentification au chargement
  useEffect(() => {
    // Simuler une vérification d'authentification
    const checkAuth = async () => {
      try {
        // Vérifier si un token existe dans le localStorage
        const token = localStorage.getItem('auth_token');
        
        if (token) {
          // Simuler un utilisateur authentifié
          setUser({
            id: 'user-123',
            name: 'Utilisateur Test',
            email: 'user@example.com',
            avatar: 'https://via.placeholder.com/150',
            preferences: {
              theme: 'dark',
              notifications: true
            }
          });
        }
      } catch (err) {
        console.error('Erreur lors de la vérification de l\'authentification:', err);
        setError('Impossible de vérifier l\'authentification');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Fonction de connexion
  const login = async (email, password) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simuler une connexion réussie
      const user = {
        id: 'user-123',
        name: 'Utilisateur Test',
        email: email,
        avatar: 'https://via.placeholder.com/150',
        preferences: {
          theme: 'dark',
          notifications: true
        }
      };
      
      // Stocker le token dans le localStorage
      localStorage.setItem('auth_token', 'fake-jwt-token');
      
      setUser(user);
      return user;
    } catch (err) {
      console.error('Erreur lors de la connexion:', err);
      setError('Identifiants invalides');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction de déconnexion
  const logout = () => {
    localStorage.removeItem('auth_token');
    setUser(null);
  };

  // Fonction d'inscription
  const register = async (name, email, password) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simuler une inscription réussie
      const user = {
        id: 'user-' + Date.now(),
        name: name,
        email: email,
        avatar: 'https://via.placeholder.com/150',
        preferences: {
          theme: 'dark',
          notifications: true
        }
      };
      
      // Stocker le token dans le localStorage
      localStorage.setItem('auth_token', 'fake-jwt-token');
      
      setUser(user);
      return user;
    } catch (err) {
      console.error('Erreur lors de l\'inscription:', err);
      setError('Impossible de créer un compte');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        isAuthenticated: !!user, 
        isLoading, 
        login, 
        logout, 
        register, 
        error 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook personnalisé pour utiliser le contexte d'authentification
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth doit être utilisé à l\'intérieur d\'un AuthProvider');
  }
  
  return context;
};

export default useAuth;
