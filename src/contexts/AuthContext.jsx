import React, { createContext, useContext, useState, useEffect } from 'react';

// Création du contexte d'authentification
const AuthContext = createContext();

// Hook personnalisé pour utiliser le contexte d'authentification
export const useAuth = () => useContext(AuthContext);

// Fournisseur du contexte d'authentification
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fonction de connexion
  const login = async (email, password) => {
    try {
      // Simulation d'une connexion réussie
      const user = { id: '123', email, name: 'Utilisateur Test', role: 'user' };
      localStorage.setItem('flodrama_user', JSON.stringify(user));
      setCurrentUser(user);
      return user;
    } catch (err) {
      setError("Échec de la connexion. Veuillez vérifier vos identifiants.");
      throw err;
    }
  };

  // Fonction de déconnexion
  const logout = () => {
    localStorage.removeItem('flodrama_user');
    setCurrentUser(null);
  };

  // Fonction d'inscription
  const signup = async (email, password, name) => {
    try {
      // Simulation d'une inscription réussie
      const user = { id: '123', email, name, role: 'user' };
      localStorage.setItem('flodrama_user', JSON.stringify(user));
      setCurrentUser(user);
      return user;
    } catch (err) {
      setError("Échec de l'inscription. Veuillez réessayer.");
      throw err;
    }
  };

  // Vérification de l'état d'authentification au chargement
  useEffect(() => {
    const checkAuth = () => {
      try {
        const storedUser = localStorage.getItem('flodrama_user');
        if (storedUser) {
          setCurrentUser(JSON.parse(storedUser));
        }
      } catch (err) {
        console.error("Erreur lors de la récupération des données d'authentification:", err);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Valeur du contexte
  const value = {
    currentUser,
    login,
    logout,
    signup,
    loading,
    error
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
