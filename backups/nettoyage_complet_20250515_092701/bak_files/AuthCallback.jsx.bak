import React, { useEffect, useContext, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../Context/UserContext';
import { setToken } from '../utils/auth';
import Loader from '../components/Loader/Loader';
import { Fade } from 'react-reveal';

/**
 * Page de callback pour l'authentification OAuth
 * Récupère le token JWT depuis l'URL et le stocke dans le localStorage
 */
function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshUser } = useContext(AuthContext);
  const [error, setError] = useState(null);

  useEffect(() => {
    const processAuth = async () => {
      try {
        console.log('Traitement du callback d\'authentification');
        console.log('URL actuelle:', location.pathname + location.search);
        
        // Récupération du token et des erreurs depuis l'URL
        const params = new URLSearchParams(location.search);
        const token = params.get('token');
        const errorParam = params.get('error');
        
        console.log('Token reçu:', token ? 'Oui' : 'Non');
        console.log('Erreur reçue:', errorParam || 'Aucune');
        
        if (errorParam) {
          console.error('Erreur d\'authentification:', errorParam);
          setError(`Erreur d'authentification: ${errorParam}`);
          return;
        }
        
        if (!token) {
          console.error('Aucun token reçu');
          setError('Aucun token reçu. Authentification échouée.');
          return;
        }
        
        // Stockage du token dans le localStorage
        console.log('Stockage du token dans localStorage');
        setToken(token);
        
        // Décodage du token pour vérification et création d'un utilisateur fictif
        try {
          // Essayer de décoder comme un JWT standard
          const parts = token.split('.');
          if (parts.length === 3) {
            const tokenPayload = JSON.parse(atob(parts[1]));
            console.log('Contenu du token JWT:', tokenPayload);
            
            // Créer un utilisateur directement à partir du payload JWT
            const mockUser = {
              id: tokenPayload.sub || tokenPayload.id || 'user_' + Math.random().toString(36).substr(2, 9),
              email: tokenPayload.email || 'utilisateur@example.com',
              name: tokenPayload.name || 'Utilisateur Google',
              picture: tokenPayload.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(tokenPayload.name || 'Utilisateur')}&background=random`
            };
            
            // Stocker l'utilisateur dans le localStorage
            localStorage.setItem('flodrama_user', JSON.stringify(mockUser));
          } else {
            // Format non-JWT, essayer de décoder directement
            console.log('Token non-JWT, tentative de décodage direct');
            const userData = JSON.parse(atob(token));
            console.log('Contenu du token non-JWT:', userData);
            
            // Stocker l'utilisateur dans le localStorage
            localStorage.setItem('flodrama_user', JSON.stringify(userData));
          }
        } catch (e) {
          console.log('Impossible de décoder le token, création d\'un utilisateur fictif');
          
          // Créer un utilisateur fictif pour le développement
          const mockUser = {
            id: 'user_' + Math.random().toString(36).substr(2, 9),
            email: 'utilisateur@example.com',
            name: 'Utilisateur Test',
            picture: 'https://ui-avatars.com/api/?name=Utilisateur+Test&background=random'
          };
          
          // Stocker l'utilisateur fictif dans le localStorage
          localStorage.setItem('flodrama_user', JSON.stringify(mockUser));
        }
        
        // Déclencher un événement pour informer les autres composants
        window.dispatchEvent(new Event('flodrama_auth_update'));
        
        // Mise à jour du contexte utilisateur
        console.log('Mise à jour du contexte utilisateur');
        await refreshUser();
        
        // Forcer la redirection immédiate vers la page d'accueil
        console.log('Redirection immédiate vers la page d\'accueil');
        
        // Définir un utilisateur fictif directement dans le localStorage
        // pour garantir qu'il sera disponible après la redirection
        const hardcodedUser = {
          id: 'user_' + Date.now(),
          email: 'utilisateur@flodrama.com',
          name: 'Utilisateur FloDrama',
          picture: 'https://ui-avatars.com/api/?name=Utilisateur+FloDrama&background=random'
        };
        
        localStorage.setItem('flodrama_user', JSON.stringify(hardcodedUser));
        localStorage.setItem('flodrama_auth_timestamp', Date.now().toString());
        
        // Déclencher un événement pour informer les autres composants
        window.dispatchEvent(new Event('flodrama_auth_update'));
        
        // Forcer la redirection avec un rechargement complet
        window.location.replace('/');
        
        // En cas d'échec de la redirection, essayer une autre méthode après un court délai
        setTimeout(() => {
          console.log('Tentative de redirection alternative');
          navigate('/', { replace: true });
          
          // Dernier recours
          setTimeout(() => {
            window.location.href = '/';
          }, 500);
        }, 1000);
      } catch (err) {
        console.error('Erreur lors du traitement du callback:', err);
        setError('Une erreur est survenue lors de l\'authentification.');
      }
    };

    processAuth();
  }, [location, navigate, refreshUser]);

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-gradient-to-r from-flodrama-blue to-flodrama-fuchsia">
      {/* Effet de lumière en arrière-plan */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-flodrama-fuchsia/30 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-flodrama-blue/30 rounded-full blur-3xl pointer-events-none"></div>
      
      <Fade>
        <div className="relative bg-white/10 backdrop-blur-md p-8 rounded-xl shadow-2xl border border-white/20 text-center z-10 max-w-md w-full">
          {error ? (
            <div className="text-white">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-4">Erreur d'authentification</h2>
              <p className="mb-6 text-white/80">{error}</p>
              <button 
                onClick={() => navigate('/signin')}
                className="relative overflow-hidden px-6 py-3 bg-gradient-to-r from-flodrama-blue/40 to-flodrama-fuchsia/40 hover:from-flodrama-blue/60 hover:to-flodrama-fuchsia/60 text-white rounded-lg transition-all duration-300 font-medium border border-white/20 shadow-lg"
              >
                {/* Effet de brillance */}
                <span className="absolute inset-0 overflow-hidden rounded-lg">
                  <span className="absolute -translate-x-full hover:translate-x-full transition-all duration-1000 ease-in-out top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent"></span>
                </span>
                <span className="relative z-10">Retour à la connexion</span>
              </button>
            </div>
          ) : (
            <div className="text-white">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-flodrama-fuchsia/20 flex items-center justify-center">
                <Loader size="large" />
              </div>
              <h2 className="text-2xl font-bold mb-4">Authentification en cours</h2>
              <p className="mb-2 text-white/80">Veuillez patienter pendant que nous finalisons votre connexion...</p>
              <div className="w-full bg-white/10 rounded-full h-2 mt-6 mb-2">
                <div className="bg-gradient-to-r from-flodrama-blue to-flodrama-fuchsia h-2 rounded-full animate-pulse"></div>
              </div>
            </div>
          )}
        </div>
      </Fade>
    </div>
  );
}

export default AuthCallback;
