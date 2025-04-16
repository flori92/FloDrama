/**
 * Module de stockage pour l'authentification
 * 
 * Ce module gère le stockage local des données d'authentification
 * et sert de fallback en cas d'indisponibilité de l'API MongoDB Atlas
 */

// Clés de stockage local
const STORAGE_KEYS = {
  USER: 'flodrama_user',
  TOKEN: 'flodrama_token',
  FAVORITES: 'flodrama_favorites',
  PREFERENCES: 'flodrama_preferences',
  WATCH_HISTORY: 'flodrama_watch_history',
  REGISTERED_USERS: 'flodrama_registered_users'
};

/**
 * Sauvegarde un utilisateur dans le stockage local
 * @param {Object} user - Données de l'utilisateur à sauvegarder
 * @returns {Object} Données de l'utilisateur sauvegardées
 */
const saveUser = (user) => {
  if (!user) return null;
  
  // Créer une copie des données utilisateur sans le mot de passe
  const { password, ...userDataWithoutPassword } = user;
  
  // Sauvegarder dans le stockage local
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userDataWithoutPassword));
  
  return userDataWithoutPassword;
};

/**
 * Récupère l'utilisateur depuis le stockage local
 * @returns {Object|null} Données de l'utilisateur ou null si aucun utilisateur n'est stocké
 */
const getUser = () => {
  const userData = localStorage.getItem(STORAGE_KEYS.USER);
  return userData ? JSON.parse(userData) : null;
};

/**
 * Supprime l'utilisateur du stockage local
 */
const clearUser = () => {
  localStorage.removeItem(STORAGE_KEYS.USER);
  localStorage.removeItem(STORAGE_KEYS.TOKEN);
};

/**
 * Met à jour les données de l'utilisateur dans le stockage local
 * @param {Object} userData - Nouvelles données utilisateur
 * @returns {Object} Données utilisateur mises à jour
 */
const updateUser = (userData) => {
  if (!userData) return null;
  
  // Récupérer les données utilisateur actuelles
  const currentUser = getUser();
  
  if (!currentUser) {
    return saveUser(userData);
  }
  
  // Fusionner les données actuelles avec les nouvelles données
  const updatedUser = { ...currentUser, ...userData };
  
  // Sauvegarder les données mises à jour
  return saveUser(updatedUser);
};

/**
 * Fonction simple de hachage pour les mots de passe
 * Note: Cette fonction n'est pas sécurisée et est utilisée uniquement pour le stockage local
 * @param {string} password - Mot de passe à hacher
 * @returns {string} Mot de passe haché
 */
const simpleHash = (password) => {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convertir en entier 32 bits
  }
  return hash.toString(16);
};

/**
 * Enregistre un nouvel utilisateur dans le stockage local
 * @param {Object} userData - Données du nouvel utilisateur
 * @returns {Object} Données de l'utilisateur enregistré
 */
const registerUser = (userData) => {
  if (!userData || !userData.email || !userData.password || !userData.name) {
    throw new Error('Données utilisateur invalides');
  }
  
  // Récupérer les utilisateurs existants
  const existingUsers = getRegisteredUsers();
  
  // Vérifier si l'email est déjà utilisé
  if (existingUsers.some(user => user.email === userData.email)) {
    throw new Error('Cet email est déjà utilisé');
  }
  
  // Créer un nouvel utilisateur avec un ID unique
  const newUser = {
    id: Date.now().toString(),
    name: userData.name,
    email: userData.email,
    hashedPassword: simpleHash(userData.password),
    role: 'user',
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    favorites: [],
    preferences: {
      theme: 'dark',
      language: 'fr',
      notifications: true,
      subtitles: true
    },
    watchHistory: []
  };
  
  // Ajouter l'utilisateur à la liste des utilisateurs enregistrés
  existingUsers.push(newUser);
  localStorage.setItem(STORAGE_KEYS.REGISTERED_USERS, JSON.stringify(existingUsers));
  
  // Sauvegarder l'utilisateur comme utilisateur actuel
  const { hashedPassword, ...userWithoutPassword } = newUser;
  return saveUser(userWithoutPassword);
};

/**
 * Connecte un utilisateur existant
 * @param {string} email - Email de l'utilisateur
 * @param {string} password - Mot de passe de l'utilisateur
 * @returns {Object} Données de l'utilisateur connecté
 */
const loginUser = (email, password) => {
  if (!email || !password) {
    throw new Error('Email et mot de passe requis');
  }
  
  // Récupérer les utilisateurs existants
  const existingUsers = getRegisteredUsers();
  
  // Trouver l'utilisateur par email
  const user = existingUsers.find(user => user.email === email);
  
  if (!user) {
    throw new Error('Utilisateur non trouvé');
  }
  
  // Vérifier le mot de passe
  if (user.hashedPassword !== simpleHash(password)) {
    throw new Error('Mot de passe incorrect');
  }
  
  // Mettre à jour la date de dernière connexion
  user.lastLogin = new Date().toISOString();
  
  // Mettre à jour l'utilisateur dans la liste des utilisateurs enregistrés
  const userIndex = existingUsers.findIndex(u => u.id === user.id);
  existingUsers[userIndex] = user;
  localStorage.setItem(STORAGE_KEYS.REGISTERED_USERS, JSON.stringify(existingUsers));
  
  // Sauvegarder l'utilisateur comme utilisateur actuel
  const { hashedPassword, ...userWithoutPassword } = user;
  return saveUser(userWithoutPassword);
};

/**
 * Met à jour le mot de passe de l'utilisateur
 * @param {string} currentPassword - Mot de passe actuel
 * @param {string} newPassword - Nouveau mot de passe
 * @returns {boolean} True si la mise à jour a réussi
 */
const updatePassword = (currentPassword, newPassword) => {
  if (!currentPassword || !newPassword) {
    throw new Error('Mot de passe actuel et nouveau mot de passe requis');
  }
  
  // Récupérer l'utilisateur actuel
  const currentUser = getUser();
  
  if (!currentUser) {
    throw new Error('Aucun utilisateur connecté');
  }
  
  // Récupérer les utilisateurs existants
  const existingUsers = getRegisteredUsers();
  
  // Trouver l'utilisateur par ID
  const userIndex = existingUsers.findIndex(user => user.id === currentUser.id);
  
  if (userIndex === -1) {
    throw new Error('Utilisateur non trouvé');
  }
  
  // Vérifier le mot de passe actuel
  if (existingUsers[userIndex].hashedPassword !== simpleHash(currentPassword)) {
    throw new Error('Mot de passe actuel incorrect');
  }
  
  // Mettre à jour le mot de passe
  existingUsers[userIndex].hashedPassword = simpleHash(newPassword);
  
  // Sauvegarder les utilisateurs mis à jour
  localStorage.setItem(STORAGE_KEYS.REGISTERED_USERS, JSON.stringify(existingUsers));
  
  return true;
};

/**
 * Récupère la liste des utilisateurs enregistrés
 * @returns {Array} Liste des utilisateurs enregistrés
 */
const getRegisteredUsers = () => {
  const users = localStorage.getItem(STORAGE_KEYS.REGISTERED_USERS);
  return users ? JSON.parse(users) : [];
};

/**
 * Ajoute un contenu aux favoris
 * @param {string|number} contentId - ID du contenu à ajouter
 * @returns {Array} Liste des favoris mise à jour
 */
const addToFavorites = (contentId) => {
  // Récupérer l'utilisateur actuel
  const user = getUser();
  
  if (!user) {
    throw new Error('Aucun utilisateur connecté');
  }
  
  // Initialiser les favoris si nécessaire
  if (!user.favorites) {
    user.favorites = [];
  }
  
  // Vérifier si le contenu est déjà dans les favoris
  if (!user.favorites.includes(contentId)) {
    user.favorites.push(contentId);
    
    // Mettre à jour l'utilisateur
    updateUser(user);
  }
  
  return user.favorites;
};

/**
 * Supprime un contenu des favoris
 * @param {string|number} contentId - ID du contenu à supprimer
 * @returns {Array} Liste des favoris mise à jour
 */
const removeFromFavorites = (contentId) => {
  // Récupérer l'utilisateur actuel
  const user = getUser();
  
  if (!user) {
    throw new Error('Aucun utilisateur connecté');
  }
  
  // Initialiser les favoris si nécessaire
  if (!user.favorites) {
    user.favorites = [];
    return user.favorites;
  }
  
  // Supprimer le contenu des favoris
  user.favorites = user.favorites.filter(id => id !== contentId);
  
  // Mettre à jour l'utilisateur
  updateUser(user);
  
  return user.favorites;
};

/**
 * Met à jour l'historique de visionnage
 * @param {string|number} contentId - ID du contenu
 * @param {number} progress - Progression du visionnage (0-100)
 * @returns {Array} Historique de visionnage mis à jour
 */
const updateWatchHistory = (contentId, progress) => {
  // Récupérer l'utilisateur actuel
  const user = getUser();
  
  if (!user) {
    throw new Error('Aucun utilisateur connecté');
  }
  
  // Initialiser l'historique si nécessaire
  if (!user.watchHistory) {
    user.watchHistory = [];
  }
  
  // Rechercher l'entrée existante
  const existingEntryIndex = user.watchHistory.findIndex(
    entry => entry.contentId === contentId
  );
  
  if (existingEntryIndex !== -1) {
    // Mettre à jour l'entrée existante
    user.watchHistory[existingEntryIndex].progress = progress;
    user.watchHistory[existingEntryIndex].lastWatched = new Date().toISOString();
  } else {
    // Ajouter une nouvelle entrée
    user.watchHistory.push({
      contentId,
      progress,
      lastWatched: new Date().toISOString()
    });
  }
  
  // Mettre à jour l'utilisateur
  updateUser(user);
  
  return user.watchHistory;
};

// Exporter les fonctions
export default {
  saveUser,
  getUser,
  clearUser,
  updateUser,
  simpleHash,
  registerUser,
  loginUser,
  updatePassword,
  getRegisteredUsers,
  addToFavorites,
  removeFromFavorites,
  updateWatchHistory
};
