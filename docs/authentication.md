# Système d'Authentification FloDrama

## Architecture d'Authentification

Le système d'authentification de FloDrama utilise une architecture hybride avec MongoDB Atlas comme solution principale et un stockage local comme solution de secours pour garantir une expérience utilisateur fluide même en cas de problèmes de connectivité.

### Composants Principaux

#### Backend (MongoDB Atlas)
- **Modèle Utilisateur** : Schéma complet avec gestion des rôles, préférences, favoris et historique
- **Contrôleurs d'Authentification** : Inscription, connexion, gestion de profil
- **Middleware JWT** : Protection des routes et autorisation basée sur les rôles
- **Routes API** : Endpoints RESTful pour toutes les fonctionnalités d'authentification

#### Frontend (Client)
- **Module auth.js** : Orchestration de l'authentification avec gestion des états
- **Module auth-storage.js** : Stockage local pour la résilience
- **Module auth-api.js** : Communication avec l'API backend
- **Module auth-ui.js** : Interface utilisateur pour l'authentification

## Flux d'Authentification

1. **Inscription**
   - L'utilisateur remplit le formulaire d'inscription
   - Les données sont envoyées à l'API MongoDB Atlas
   - En cas de succès, un token JWT est généré et stocké
   - En cas d'échec, le système utilise le stockage local

2. **Connexion**
   - L'utilisateur saisit ses identifiants
   - Les données sont vérifiées via l'API MongoDB Atlas
   - En cas de succès, un token JWT est généré et stocké
   - En cas d'échec, le système tente une connexion locale

3. **Vérification de Session**
   - Au chargement de l'application, le token JWT est vérifié
   - Si valide, l'utilisateur reste connecté
   - Si invalide ou expiré, l'utilisateur est déconnecté

4. **Déconnexion**
   - Le token JWT est supprimé
   - Les données locales sont effacées

## Modèle de Données Utilisateur

```javascript
{
  name: String,               // Nom complet de l'utilisateur
  email: String,              // Email unique
  password: String,           // Mot de passe haché avec bcrypt
  role: String,               // 'user', 'premium', 'admin'
  createdAt: Date,            // Date de création du compte
  lastLogin: Date,            // Dernière connexion
  preferences: {
    theme: String,            // 'dark', 'light'
    language: String,         // 'fr', 'en', etc.
    notifications: Boolean,   // Préférences de notification
    subtitles: Boolean        // Préférences de sous-titres
  },
  favorites: [ObjectId],      // Liste des contenus favoris
  watchHistory: [{
    contentId: ObjectId,      // ID du contenu
    progress: Number,         // Progression (0-100)
    lastWatched: Date         // Dernière visualisation
  }]
}
```

## Sécurité

- **Hachage des Mots de Passe** : Utilisation de bcrypt pour le hachage sécurisé
- **Authentification JWT** : Tokens signés avec une clé secrète
- **Validation des Entrées** : Vérification côté serveur et client
- **Protection CSRF** : Mesures contre les attaques CSRF
- **Expiration des Sessions** : Durée de vie configurable des tokens

## Fallback Local

En cas d'indisponibilité de l'API MongoDB Atlas, le système utilise un mécanisme de fallback local qui :

1. Stocke les données utilisateur dans le localStorage
2. Permet l'inscription et la connexion hors ligne
3. Synchronise les données avec le backend lorsque la connexion est rétablie

## Configuration

La configuration du système d'authentification se fait via le fichier `.env` :

```
# MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
MONGODB_PASSWORD=your_secure_password

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

# API
API_URL=http://localhost:8090/api
```

## Démarrage du Serveur Backend

Pour démarrer le serveur backend avec MongoDB Atlas :

```bash
npm run start:backend
```

Pour initialiser la base de données avec des données de test :

```bash
npm run start:backend:init
```
