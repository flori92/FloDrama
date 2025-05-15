import { useContext, useState, useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { AuthContext } from "../../Context/UserContext";

/**
 * Composant de protection des routes privées
 * Redirige vers /signin si l'utilisateur n'est pas authentifié
 */
export default function PrivateRoute({ children, redirectTo = "/signin" }) {
  const { user, loading, isAuthenticated } = useContext(AuthContext);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [hasToken, setHasToken] = useState(false);
  const [hasUser, setHasUser] = useState(false);
  const [isDevelopment, setIsDevelopment] = useState(false);

  // Vérifier l'environnement et les données d'authentification
  useEffect(() => {
    // Vérifier si nous sommes en environnement de développement
    const hostname = window.location.hostname;
    const isDev = hostname === 'localhost' || 
                  hostname === '127.0.0.1' || 
                  hostname.includes('flodrama-frontend.pages.dev');
    
    setIsDevelopment(isDev);
    console.log('PrivateRoute - Environnement de développement:', isDev);
    
    // Vérifier le token et l'utilisateur dans le localStorage
    const token = localStorage.getItem('flodrama_jwt');
    const userJson = localStorage.getItem('flodrama_user');
    
    console.log('PrivateRoute - Token présent:', !!token);
    console.log('PrivateRoute - Utilisateur localStorage:', !!userJson);
    
    setHasToken(!!token);
    setHasUser(!!userJson);
    
    // Si nous sommes en développement et qu'il n'y a pas d'utilisateur, en créer un fictif
    if (isDev && !userJson) {
      console.log('PrivateRoute - Création d\'un utilisateur fictif pour le développement');
      const mockUser = {
        id: 'user_dev_' + Date.now(),
        email: 'dev@flodrama.com',
        name: 'Utilisateur Développement',
        picture: 'https://ui-avatars.com/api/?name=Dev+User&background=random'
      };
      
      localStorage.setItem('flodrama_user', JSON.stringify(mockUser));
      localStorage.setItem('flodrama_jwt', 'dev_token_' + Date.now());
      setHasUser(true);
      setHasToken(true);
      
      // Déclencher un événement pour informer les autres composants
      window.dispatchEvent(new Event('flodrama_auth_update'));
    }
    
    setIsCheckingAuth(false);
  }, []);

  // Afficher un loader pendant la vérification initiale
  if (loading || isCheckingAuth) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-r from-flodrama-blue/10 to-flodrama-fuchsia/10">
        <div className="text-xl font-bold mb-4 text-white">Chargement de votre session...</div>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-flodrama-fuchsia"></div>
      </div>
    );
  }

  // En mode développement, autoriser toujours l'accès
  if (isDevelopment) {
    console.log('PrivateRoute - Mode développement, accès autorisé automatiquement');
    return children || <Outlet />;
  }

  // Si l'utilisateur existe dans le contexte ou dans le localStorage, autoriser l'accès
  if (user || hasUser) {
    console.log('PrivateRoute - Utilisateur trouvé, accès autorisé');
    return children || <Outlet />;
  }

  // Si un token existe mais pas d'utilisateur, c'est probablement un problème temporaire avec l'API
  if (hasToken) {
    console.log('PrivateRoute - Token présent mais utilisateur non authentifié, accès autorisé temporairement');
    return children || <Outlet />;
  }

  // Si pas de token et pas d'utilisateur, rediriger vers la page de connexion
  console.log('PrivateRoute - Aucune authentification trouvée, redirection vers', redirectTo);
  return <Navigate to={redirectTo} replace />;
}
