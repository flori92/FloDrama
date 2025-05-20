# Script de migration - Service d'authentification FloDrama

## Contexte

Ce document décrit la procédure à suivre pour migrer le service d'authentification (`flodrama-backend.florifavi.workers.dev`) vers l'API principale (`flodrama-api-prod.florifavi.workers.dev`).

## Prérequis

1. Accès à la console Cloudflare
2. Sources du Worker d'authentification actuel
3. Sources du Worker de l'API principale
4. Variables d'environnement configurées

## Étapes de migration

### 1. Préparation de l'API principale

```bash
# Création du répertoire pour les fonctionnalités d'authentification
mkdir -p /chemin/vers/api-principale/src/handlers/auth
```

### 2. Transfert des fichiers sources

```bash
# Copier les fichiers d'authentification
cp /Users/floriace/FLO_DRAMA/FloDrama/New-FloDrama/backend/auth/src/handlers/auth*.ts /chemin/vers/api-principale/src/handlers/auth/
cp /Users/floriace/FLO_DRAMA/FloDrama/New-FloDrama/backend/auth/src/utils/auth.ts /chemin/vers/api-principale/src/utils/
cp /Users/floriace/FLO_DRAMA/FloDrama/New-FloDrama/backend/auth/src/utils/jwt.ts /chemin/vers/api-principale/src/utils/
```

### 3. Mise à jour des routes

Dans le fichier principal de l'API (`index.ts` ou équivalent), ajouter :

```typescript
import { handleAuthRequest } from './handlers/auth/auth';

// Dans la fonction de routage
router.all('/api/auth/*', (request: Request, env: Env, ctx: ExecutionContext) => {
  return handleAuthRequest(request, env, ctx);
});
```

### 4. Configuration des variables d'environnement

Vérifier que toutes les variables d'environnement nécessaires sont configurées sur le Worker de l'API principale :

```bash
# Utiliser wrangler pour ajouter les variables d'environnement
npx wrangler secret put GOOGLE_CLIENT_ID --name flodrama-api-prod
npx wrangler secret put GOOGLE_CLIENT_SECRET --name flodrama-api-prod
npx wrangler secret put GOOGLE_REDIRECT_URI --name flodrama-api-prod
npx wrangler secret put JWT_SECRET --name flodrama-api-prod
npx wrangler secret put SESSION_SECRET --name flodrama-api-prod
npx wrangler secret put FRONTEND_URL --name flodrama-api-prod
```

### 5. Test de la migration

1. Déployer les changements sur l'API principale sans décommissionner le service d'authentification existant
2. Tester les endpoints d'authentification sur l'API principale :
   - `/api/auth/google` (redirection vers Google)
   - `/api/auth/google/callback` (traitement du callback)
   - `/api/auth/login` (connexion par email)
   - `/api/auth/profile` (récupération du profil)

### 6. Mise à jour progressive du frontend

Une fois les tests réussis, mettre à jour le frontend pour utiliser la nouvelle API:

```javascript
// Dans src/config/api.config.js
export const API_BASE_URL = 'https://flodrama-api-prod.florifavi.workers.dev';
```

### 7. Décommissionnement du service d'authentification

Une fois que tout fonctionne correctement :

```bash
# Option 1: Désactiver le Worker sans le supprimer
npx wrangler publish --name flodrama-backend --delete

# Option 2: Configurer une redirection vers la nouvelle API
# Modifier le Worker pour qu'il redirige toutes les requêtes vers l'API principale
```

## Rollback en cas de problème

Si des problèmes surviennent lors de la migration :

1. Revenir à l'ancienne configuration du frontend
2. Documenter les problèmes rencontrés
3. Résoudre les problèmes et réessayer la migration

## Calendrier suggéré

- **Jour 1** : Préparation et transfert des fichiers
- **Jour 2** : Configuration et déploiement sur l'API principale
- **Jour 3** : Tests et validation
- **Jour 4** : Migration progressive du frontend
- **Jour 5** : Décommissionnement du service d'authentification

## Liste de contrôle finale

- [ ] Tous les endpoints d'authentification fonctionnent sur l'API principale
- [ ] Le frontend est configuré pour utiliser la nouvelle API
- [ ] Les bases de données sont correctement migrées (si nécessaire)
- [ ] Documentation mise à jour
- [ ] Ancien service décommissionné ou configuré pour rediriger
