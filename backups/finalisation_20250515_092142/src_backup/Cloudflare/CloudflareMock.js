/**
 * CloudflareMock.js
 * 
 * Ce fichier fournit une implémentation locale des fonctionnalités d'authentification
 * pour permettre la démonstration de FloDrama sans dépendre d'une API externe.
 */

// Stockage local simulé
const localUserStorage = {
  users: {},
  sessions: {},
  // Données de démonstration pour les films asiatiques
  movies: [
    {
      id: 1,
      title: "Parasite",
      overview: "Toute la famille de Ki-taek est au chômage. Elle s'intéresse au train de vie de la richissime famille Park. Mais un incident se produit et les deux familles se retrouvent mêlées, sans le savoir, à une bien étrange histoire...",
      poster_path: "/images/parasite.jpg",
      backdrop_path: "/images/backdrop_parasite.jpg",
      release_date: "2019-05-30",
      genre_ids: [18, 53, 35],
      vote_average: 8.5,
      original_language: "ko"
    },
    {
      id: 2,
      title: "Old Boy",
      overview: "Oh Dae-Soo est enferme pendant 15 ans sans savoir pourquoi. A sa sortie, il n'a que 5 jours pour trouver la raison de cet enfermement.",
      poster_path: "/images/oldboy.jpg",
      backdrop_path: "/images/backdrop_oldboy.jpg",
      release_date: "2003-11-21",
      genre_ids: [18, 53, 9648],
      vote_average: 8.4,
      original_language: "ko"
    },
    {
      id: 3,
      title: "Devdas",
      overview: "De retour dans son pays après dix ans d'études en Angleterre, Devdas a hâte de retrouver Paro, son amie d'enfance, qui n'a jamais cessé de l'aimer.",
      poster_path: "/images/devdas.jpg",
      backdrop_path: "/images/backdrop_devdas.jpg",
      release_date: "2002-07-12",
      genre_ids: [10749, 18, 10402],
      vote_average: 7.6,
      original_language: "hi"
    }
  ],
  // Données de démonstration pour les dramas
  dramas: [
    {
      id: 101,
      name: "Squid Game",
      overview: "Des personnes en difficulté financière sont invitées à participer à une mystérieuse compétition de survie. Participant à une série de jeux traditionnels pour enfants, mais avec des conséquences mortelles, ils risquent leur vie pour une énorme récompense.",
      poster_path: "/images/squid_game.jpg",
      backdrop_path: "/images/backdrop_squid_game.jpg",
      first_air_date: "2021-09-17",
      genre_ids: [10759, 9648, 18],
      vote_average: 7.8,
      original_language: "ko"
    },
    {
      id: 102,
      name: "Crash Landing on You",
      overview: "Une héritière sud-coréenne atterrit accidentellement en Corée du Nord après un accident de parapente. Elle y rencontre un officier de l'armée qui décide de l'aider à se cacher.",
      poster_path: "/images/crash_landing.jpg",
      backdrop_path: "/images/backdrop_crash_landing.jpg",
      first_air_date: "2019-12-14",
      genre_ids: [10765, 10749, 18],
      vote_average: 8.9,
      original_language: "ko"
    },
    {
      id: 103,
      name: "Itaewon Class",
      overview: "Dans un quartier en pleine mutation de Séoul, un ex-détenu et ses amis se battent pour réaliser leurs rêves tout en luttant contre un empire commercial impitoyable.",
      poster_path: "/images/itaewon_class.jpg",
      backdrop_path: "/images/backdrop_itaewon_class.jpg",
      first_air_date: "2020-01-31",
      genre_ids: [18],
      vote_average: 8.2,
      original_language: "ko"
    }
  ],
  // Données de démonstration pour les animés
  animes: [
    {
      id: 201,
      name: "Attack on Titan",
      overview: "Dans un monde ravagé par des titans mangeurs d'homme depuis plus d'un siècle, les rares survivants de l'Humanité n'ont d'autre choix pour survivre que de se barricader dans une cité-forteresse.",
      poster_path: "/images/attack_on_titan.jpg",
      backdrop_path: "/images/backdrop_attack_on_titan.jpg",
      first_air_date: "2013-04-07",
      genre_ids: [16, 10759, 10765],
      vote_average: 8.7,
      original_language: "ja",
      original_title: "進撃の巨人"
    },
    {
      id: 202,
      name: "Demon Slayer",
      overview: "Le Japon, au début du siècle dernier. Tanjirô, un jeune vendeur de charbon, mène une vie paisible dans les montagnes. Jusqu'au jour tragique où, après une courte absence, il retrouve son village et sa famille dévastés par un démon.",
      poster_path: "/images/demon_slayer.jpg",
      backdrop_path: "/images/backdrop_demon_slayer.jpg",
      first_air_date: "2019-04-06",
      genre_ids: [16, 10759, 10765],
      vote_average: 8.8,
      original_language: "ja",
      original_title: "鬼滅の刃"
    }
  ],
  // Données de démonstration pour les films bollywood
  bollywood: [
    {
      id: 301,
      title: "3 Idiots",
      overview: "Deux amis entreprennent un voyage pour retrouver leur camarade d'université disparu. Ils se remémorent leur passage à l'université et comment leur ami les a inspirés à penser différemment.",
      poster_path: "/images/3_idiots.jpg",
      backdrop_path: "/images/backdrop_3_idiots.jpg",
      release_date: "2009-12-25",
      genre_ids: [35, 18],
      vote_average: 8.4,
      original_language: "hi"
    },
    {
      id: 302,
      title: "Kabhi Khushi Kabhie Gham",
      overview: "Yashvardhan Raichand est un homme d'affaires richissime et respectueux des traditions. Son fils aîné, Rahul, qu'il a adopté, tombe amoureux d'Anjali, une jeune femme d'un milieu modeste.",
      poster_path: "/images/kabhi_khushi.jpg",
      backdrop_path: "/images/backdrop_kabhi_khushi.jpg",
      release_date: "2001-12-14",
      genre_ids: [10749, 18, 10402],
      vote_average: 7.5,
      original_language: "hi"
    }
  ],
  // Données utilisateur
  userData: {}
};

// Génération d'un token JWT simulé
const generateMockToken = (user) => {
  return `mock_token_${user.uid}_${Date.now()}`;
};

// Génération d'un ID utilisateur unique
const generateUid = () => {
  return `user_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
};

// Fonction pour simuler un délai réseau
const simulateNetworkDelay = async () => {
  return new Promise(resolve => setTimeout(resolve, 500));
};

/**
 * Simule l'inscription d'un utilisateur
 */
export const mockRegister = async (email, password) => {
  await simulateNetworkDelay();
  
  // Vérifier si l'email existe déjà
  if (Object.values(localUserStorage.users).some(user => user.email === email)) {
    throw new Error("Cet email est déjà utilisé");
  }
  
  // Créer un nouvel utilisateur
  const uid = generateUid();
  const user = {
    uid,
    email,
    password, // En production, le mot de passe serait haché
    createdAt: new Date().toISOString(),
    photoURL: null,
    displayName: email.split('@')[0]
  };
  
  // Stocker l'utilisateur
  localUserStorage.users[uid] = user;
  
  // Générer un token
  const token = generateMockToken(user);
  localUserStorage.sessions[token] = uid;
  
  // Retourner les informations d'authentification
  return {
    user: {
      uid,
      email,
      photoURL: user.photoURL,
      displayName: user.displayName
    },
    token
  };
};

/**
 * Simule la connexion d'un utilisateur
 */
export const mockLogin = async (email, password) => {
  await simulateNetworkDelay();
  
  // Rechercher l'utilisateur par email
  const user = Object.values(localUserStorage.users).find(u => u.email === email);
  
  // Vérifier si l'utilisateur existe et si le mot de passe correspond
  if (!user || user.password !== password) {
    throw new Error("Email ou mot de passe incorrect");
  }
  
  // Générer un token
  const token = generateMockToken(user);
  localUserStorage.sessions[token] = user.uid;
  
  // Retourner les informations d'authentification
  return {
    user: {
      uid: user.uid,
      email: user.email,
      photoURL: user.photoURL,
      displayName: user.displayName
    },
    token
  };
};

/**
 * Simule la vérification d'un token
 */
export const mockVerifyToken = async (token) => {
  await simulateNetworkDelay();
  
  // Vérifier si le token existe
  const uid = localUserStorage.sessions[token];
  if (!uid) {
    throw new Error("Token invalide ou expiré");
  }
  
  // Récupérer l'utilisateur
  const user = localUserStorage.users[uid];
  if (!user) {
    throw new Error("Utilisateur non trouvé");
  }
  
  // Retourner les informations utilisateur
  return {
    user: {
      uid: user.uid,
      email: user.email,
      photoURL: user.photoURL,
      displayName: user.displayName
    }
  };
};

/**
 * Simule la déconnexion d'un utilisateur
 */
export const mockLogout = async (token) => {
  await simulateNetworkDelay();
  
  // Supprimer la session
  delete localUserStorage.sessions[token];
  
  return { success: true };
};

/**
 * Simule la mise à jour du profil utilisateur
 */
export const mockUpdateProfile = async (uid, userData) => {
  await simulateNetworkDelay();
  
  // Vérifier si l'utilisateur existe
  const user = localUserStorage.users[uid];
  if (!user) {
    throw new Error("Utilisateur non trouvé");
  }
  
  // Mettre à jour les données utilisateur
  Object.assign(user, userData);
  
  // Retourner les informations utilisateur mises à jour
  return {
    user: {
      uid: user.uid,
      email: user.email,
      photoURL: user.photoURL,
      displayName: user.displayName
    }
  };
};

/**
 * Simule la création d'un compte de test
 */
export const mockCreateTestAccount = async () => {
  const email = `test_${Date.now()}@flodrama.com`;
  const password = `test${Math.floor(Math.random() * 10000)}`;
  
  await mockRegister(email, password);
  
  return { email, password };
};

/**
 * Fonctions pour gérer l'historique et les listes d'utilisateurs
 */

// Récupérer l'historique d'un utilisateur
export const mockGetUserHistory = async (uid) => {
  await simulateNetworkDelay();
  
  // Vérifier si l'utilisateur existe (cas spécial pour google-user-123)
  if (uid !== 'google-user-123' && !localUserStorage.users[uid]) {
    throw new Error(`L'utilisateur avec l'ID ${uid} n'existe pas`);
  }
  
  // Créer un historique par défaut si nécessaire
  if (!localUserStorage.userData[uid]) {
    localUserStorage.userData[uid] = {
      history: [],
      likedMovies: [],
      myList: []
    };
  }
  
  // Pour l'utilisateur Google, créer un historique spécifique s'il n'existe pas déjà
  if (uid === 'google-user-123' && !localUserStorage.userData[uid].history) {
    localUserStorage.userData[uid].history = [
      { ...localUserStorage.movies[0], viewedAt: new Date().toISOString() },
      { ...localUserStorage.dramas[0], viewedAt: new Date(Date.now() - 86400000).toISOString() },
      { ...localUserStorage.animes[0], viewedAt: new Date(Date.now() - 172800000).toISOString() }
    ];
    localUserStorage.userData[uid].likedMovies = [localUserStorage.movies[1], localUserStorage.bollywood[0]];
    localUserStorage.userData[uid].myList = [localUserStorage.movies[2], localUserStorage.dramas[1], localUserStorage.animes[1]];
  }
  
  return { history: localUserStorage.userData[uid]?.history || [] };
};

// Récupérer les films aimés d'un utilisateur
export const mockGetUserLikedMovies = async (uid) => {
  await simulateNetworkDelay();
  
  // Vérifier si l'utilisateur existe (cas spécial pour google-user-123)
  if (uid !== 'google-user-123' && !localUserStorage.users[uid]) {
    throw new Error(`L'utilisateur avec l'ID ${uid} n'existe pas`);
  }
  
  // Créer une structure de données par défaut si nécessaire
  if (!localUserStorage.userData[uid]) {
    localUserStorage.userData[uid] = {
      history: [],
      likedMovies: [],
      myList: []
    };
  }
  
  // Pour l'utilisateur Google, créer une liste par défaut s'il n'existe pas déjà
  if (uid === 'google-user-123' && !localUserStorage.userData[uid].likedMovies) {
    localUserStorage.userData[uid].likedMovies = [localUserStorage.movies[1], localUserStorage.bollywood[0]];
  }
  
  return { likedMovies: localUserStorage.userData[uid]?.likedMovies || [] };
};

// Récupérer la liste personnelle d'un utilisateur
export const mockGetUserList = async (uid) => {
  await simulateNetworkDelay();
  
  // Vérifier si l'utilisateur existe (cas spécial pour google-user-123)
  if (uid !== 'google-user-123' && !localUserStorage.users[uid]) {
    throw new Error(`L'utilisateur avec l'ID ${uid} n'existe pas`);
  }
  
  // Créer une structure de données par défaut si nécessaire
  if (!localUserStorage.userData[uid]) {
    localUserStorage.userData[uid] = {
      history: [],
      likedMovies: [],
      myList: []
    };
  }
  
  // Pour l'utilisateur Google, créer une liste par défaut s'il n'existe pas déjà
  if (uid === 'google-user-123' && !localUserStorage.userData[uid].myList) {
    localUserStorage.userData[uid].myList = [localUserStorage.movies[2], localUserStorage.dramas[1], localUserStorage.animes[1]];
  }
  
  return { myList: localUserStorage.userData[uid]?.myList || [] };
};

// Récupérer les films populaires
export const mockGetPopularMovies = async () => {
  await simulateNetworkDelay();
  return { results: localUserStorage.movies };
};

// Récupérer les dramas populaires
export const mockGetPopularDramas = async () => {
  await simulateNetworkDelay();
  return { results: localUserStorage.dramas };
};

// Récupérer les animés populaires
export const mockGetPopularAnimes = async () => {
  await simulateNetworkDelay();
  return { results: localUserStorage.animes };
};

// Récupérer les films bollywood populaires
export const mockGetPopularBollywood = async () => {
  await simulateNetworkDelay();
  return { results: localUserStorage.bollywood };
};

/**
 * Initialise le stockage avec un utilisateur de démonstration
 */
export const initMockStorage = () => {
  // Créer un utilisateur de démonstration si aucun n'existe
  if (Object.keys(localUserStorage.users).length === 0) {
    const uid = generateUid();
    localUserStorage.users[uid] = {
      uid,
      email: 'demo@flodrama.com',
      password: 'demo123',
      createdAt: new Date().toISOString(),
      photoURL: '/images/FloDrama-avatar.png',
      displayName: 'Utilisateur Démo'
    };
    
    // Initialiser les données utilisateur
    localUserStorage.userData[uid] = {
      history: [localUserStorage.movies[0]],
      likedMovies: [localUserStorage.movies[1]],
      myList: [localUserStorage.movies[2]]
    };
    
    console.log('Utilisateur de démonstration créé: demo@flodrama.com / demo123');
  }
  
  // Préparer les données pour l'utilisateur Google
  const googleUid = 'google-user-123';
  localUserStorage.userData[googleUid] = {
    history: [
      { ...localUserStorage.movies[0], viewedAt: new Date().toISOString() },
      { ...localUserStorage.dramas[0], viewedAt: new Date(Date.now() - 86400000).toISOString() },
      { ...localUserStorage.animes[0], viewedAt: new Date(Date.now() - 172800000).toISOString() }
    ],
    likedMovies: [localUserStorage.movies[1], localUserStorage.bollywood[0]],
    myList: [localUserStorage.movies[2], localUserStorage.dramas[1], localUserStorage.animes[1]]
  };
};

// Initialiser le stockage au chargement du module
initMockStorage();
