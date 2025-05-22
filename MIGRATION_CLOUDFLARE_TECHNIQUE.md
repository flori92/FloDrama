# Documentation Technique : Migration de Firebase vers Cloudflare

## Vue d'ensemble

Cette documentation détaille la migration complète de l'application FloDrama de Firebase vers Cloudflare, incluant l'authentification, la base de données, le stockage et les API.

## Architecture Cloudflare

### Ressources Cloudflare

| Service | Nom/URL | Identifiant | Description |
|---------|---------|-------------|-------------|
| **Workers** | flodrama-api-prod.florifavi.workers.dev | - | API principale |
| **Workers** | flodrama-scraper.florifavi.workers.dev | - | Service de scraping automatisé |
| **D1** | flodrama-db | 39a4a8fd-f1fd-49ab-abcc-290fd473a311 | Base de données SQL |
| **R2** | flodrama-storage | - | Stockage d'objets |
| **KV** | FLODRAMA_METADATA | 7388919bd83241cfab509b44f819bb2f | Métadonnées et cache |

### Compte Cloudflare

- **ID Compte** : 42fc982266a2c31b942593b18097e4b3
- **Email** : florifavi@gmail.com
- **Token Stream** : mGa7n-h-E9RJi3q9IGfpwF1JjPQx57hhRxQuGC0a
- **Domaine Stream** : customer-ehlynuge6dnzfnfd.cloudflarestream.com

## Structure du code

### Services Cloudflare

La migration a impliqué la création de plusieurs services Cloudflare pour remplacer les fonctionnalités Firebase :

1. **CloudflareApp.js** - Point d'entrée principal et initialisation
2. **CloudflareAuth.js** - Service d'authentification
3. **CloudflareDB.js** - Service de base de données
4. **CloudflareStorage.js** - Service de stockage
5. **CloudflareConfig.js** - Configuration et constantes

### Équivalences Firebase → Cloudflare

| Fonctionnalité Firebase | Équivalent Cloudflare | Description |
|-------------------------|------------------------|-------------|
| Firebase Auth | CloudflareAuth | Authentification par email/mot de passe |
| Firestore | CloudflareDB | Base de données pour les données utilisateur |
| Firebase Storage | CloudflareStorage | Stockage des fichiers utilisateur |
| Firebase Config | CloudflareConfig | Configuration de l'application |

## Détails de l'implémentation

### Authentification (CloudflareAuth.js)

Le service d'authentification Cloudflare implémente :
- Connexion par email/mot de passe
- Gestion des tokens JWT
- Persistance de session via localStorage
- Événements de changement d'état d'authentification

```javascript
// Exemple d'utilisation
import { getAuth, signInWithEmailAndPassword } from "./Cloudflare/CloudflareAuth";

const auth = getAuth();
const userCredential = await signInWithEmailAndPassword(email, password);
```

### Base de données (CloudflareDB.js)

Le service de base de données Cloudflare implémente :
- Opérations CRUD sur les collections et documents
- API compatible avec Firestore pour faciliter la migration
- Gestion des erreurs et des timeouts

```javascript
// Exemple d'utilisation
import { db, doc, getDoc, setDoc } from "./Cloudflare/CloudflareDB";

const userDoc = await getDoc(doc(db, "Users", userId));
await setDoc(doc(db, "MyList", userId), { movies: [] });
```

### Stockage (CloudflareStorage.js)

Le service de stockage Cloudflare implémente :
- Téléchargement de fichiers vers R2
- Génération d'URL présignées
- Suivi de progression des téléchargements
- Gestion des métadonnées

```javascript
// Exemple d'utilisation
import { uploadFile, getFileURL } from "./Cloudflare/CloudflareStorage";

const url = await uploadFile(file, `profiles/${userId}/avatar`, progressCallback);
```

## Modifications des composants

### Pages d'authentification

- **SignIn.jsx** et **SignUp.jsx** : Adaptés pour utiliser CloudflareAuth
- Gestion des erreurs améliorée
- Support de l'authentification OAuth (Google) via l'API Cloudflare

### Profil utilisateur

- **Profile.jsx** : Adapté pour utiliser CloudflareAuth et CloudflareStorage
- Téléchargement de photos de profil vers R2
- Mise à jour du profil via l'API Cloudflare

### Listes utilisateur

- **UserMovieSection.jsx** : Adapté pour utiliser CloudflareDB
- Récupération et mise à jour des listes utilisateur via l'API Cloudflare

## Hooks personnalisés

Les hooks suivants ont été adaptés pour utiliser l'API Cloudflare :
- **useUpdateMylist.jsx**
- **useUpdateLikedMovies.jsx**
- **useUpdateWatchedMovies.jsx**

## Sécurité

- Utilisation de tokens JWT pour l'authentification
- Validation des entrées côté serveur
- Gestion sécurisée des fichiers utilisateur
- Protection contre les attaques CSRF

## Performances

- Réduction de la taille du bundle JS (suppression des dépendances Firebase)
- Temps de réponse améliorés grâce à la proximité des Workers Cloudflare
- Optimisation des requêtes API

## Prochaines étapes

1. **Monitoring** : Configurer des alertes et tableaux de bord pour surveiller les performances
2. **Cache** : Implémenter un système de cache plus avancé pour les données fréquemment accédées
3. **Tests** : Développer des tests automatisés pour les nouveaux services Cloudflare
4. **CI/CD** : Intégrer le déploiement des Workers dans le pipeline CI/CD

## Conclusion

La migration de Firebase vers Cloudflare a permis de moderniser l'architecture de FloDrama tout en conservant les fonctionnalités existantes. L'application est maintenant plus performante, plus sécurisée et plus facile à maintenir.
