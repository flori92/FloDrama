import { createContext, useState, useEffect } from "react";
import * as auth from '../utils/auth';

export const AuthContext = createContext(null);

// Exporter le provider pour une meilleure lisibilité
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fonction pour recharger l'utilisateur à partir du token
  const refreshUser = async () => {
    setLoading(true);
    const currentUser = await auth.getCurrentUser();
    setUser(currentUser);
    setLoading(false);
  };

  // Synchronisation automatique sur changement de token
  useEffect(() => {
    console.log('Initialisation du contexte utilisateur');
    const initUser = async () => {
      try {
        await refreshUser();
        console.log('Utilisateur initialisé avec succès');
      } catch (error) {
        console.error('Erreur lors de l\'initialisation de l\'utilisateur:', error);
      }
    };
    
    initUser();
    
    // Écouter les événements de stockage pour le multi-tab
    const onStorage = (e) => {
      if (e.key === 'flodrama_jwt') { 
        console.log('Changement de token détecté dans un autre onglet');
        refreshUser(); 
      }
    };
    
    // Écouter les événements personnalisés pour les mises à jour d'authentification
    const onAuthUpdate = () => {
      console.log('Événement de mise à jour d\'authentification reçu');
      refreshUser();
    };
    
    window.addEventListener('storage', onStorage);
    window.addEventListener('flodrama_auth_update', onAuthUpdate);
    
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('flodrama_auth_update', onAuthUpdate);
    };
  }, []);

  const login = async (email, password) => {
    const res = await auth.login(email, password);
    await refreshUser();
    return res;
  };

  const signup = async (email, password, display_name) => {
    return await auth.signup(email, password, display_name);
  };

  const logout = async () => {
    try {
      // Appeler l'API de déconnexion si un token existe
      const token = auth.getToken();
      if (token) {
        // Utiliser l'URL de base de l'API depuis les variables d'environnement
        const API_BASE = import.meta.env.VITE_BACKEND_URL || '/api';
        await fetch(`${API_BASE}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    } finally {
      // Supprimer le token et réinitialiser l'utilisateur
      auth.removeToken();
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, signup, logout, isAuthenticated: auth.isAuthenticated(), loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// Export par défaut pour maintenir la compatibilité
export default AuthProvider;
