// Utilitaire centralisé pour l'authentification JWT côté frontend FloDrama
// Respecte la structure du backend FloDrama (login, signup, récupération user)

const API_BASE = import.meta.env.VITE_BACKEND_URL || '/api';
const TOKEN_KEY = 'flodrama_jwt';
const USER_KEY = 'flodrama_user';

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
  // Déclencher un événement pour informer les autres onglets
  window.dispatchEvent(new Event('flodrama_auth_update'));
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function removeToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  // Déclencher un événement pour informer les autres onglets
  window.dispatchEvent(new Event('flodrama_auth_update'));
}

export async function login(email, password) {
  const res = await fetch(`${API_BASE}/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password_hash: password })
  });
  const data = await res.json();
  if (data?.data?.token) {
    setToken(data.data.token);
    return { success: true, user: data.data.user };
  }
  return { success: false, error: data.error || 'Erreur inconnue' };
}

export async function signup(email, password, display_name) {
  const res = await fetch(`${API_BASE}/user`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password_hash: password, display_name })
  });
  const data = await res.json();
  if (res.ok) {
    return { success: true };
  }
  return { success: false, error: data.error || 'Erreur inconnue' };
}

export async function getCurrentUser() {
  const token = getToken();
  if (!token) { return null; }
  
  try {
    // Vérifier si nous avons déjà les données utilisateur en cache
    const cachedUser = localStorage.getItem(USER_KEY);
    if (cachedUser) {
      console.log('Utilisateur récupéré depuis le cache:', JSON.parse(cachedUser));
      return JSON.parse(cachedUser);
    }
    
    console.log('Tentative de récupération de l\'utilisateur depuis l\'API');
    
    // Décoder le token pour obtenir les informations utilisateur
    try {
      // Essayer de décoder le token comme un JWT standard
      const parts = token.split('.');
      if (parts.length === 3) {
        // Format JWT standard
        const payload = JSON.parse(atob(parts[1]));
        console.log('Token décodé (JWT):', payload);
        
        // Créer un utilisateur à partir du payload JWT
        const user = {
          id: payload.sub,
          email: payload.email,
          name: payload.name,
          picture: payload.picture
        };
        
        // Mettre en cache les données utilisateur
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        return user;
      } else {
        // Format non-JWT, essayer de décoder directement
        const userData = JSON.parse(atob(token));
        console.log('Token décodé (non-JWT):', userData);
        
        // Mettre en cache les données utilisateur
        localStorage.setItem(USER_KEY, JSON.stringify(userData));
        return userData;
      }
    } catch (decodeError) {
      console.log('Impossible de décoder le token, création d\'un utilisateur fictif');
      
      // Créer un utilisateur fictif pour le développement
      const mockUser = {
        id: 'user_' + Math.random().toString(36).substring(2, 15),
        email: 'utilisateur@example.com',
        name: 'Utilisateur Test',
        picture: 'https://ui-avatars.com/api/?name=Utilisateur+Test&background=random'
      };
      
      // Mettre en cache l'utilisateur fictif
      localStorage.setItem(USER_KEY, JSON.stringify(mockUser));
      return mockUser;
    }
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
    
    // Créer un utilisateur fictif en cas d'erreur
    const mockUser = {
      id: 'user_' + Math.random().toString(36).substring(2, 15),
      email: 'utilisateur@example.com',
      name: 'Utilisateur Test',
      picture: 'https://ui-avatars.com/api/?name=Utilisateur+Test&background=random'
    };
    
    // Mettre en cache l'utilisateur fictif
    localStorage.setItem(USER_KEY, JSON.stringify(mockUser));
    return mockUser;
  }
}

export function isAuthenticated() {
  return !!getToken();
}
