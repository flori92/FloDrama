# FloDrama Backend (Cloudflare Worker)

## Lancer en local

1. Installer les dépendances :
   ```bash
   npm install
   ```
2. Lancer le Worker :
   ```bash
   npx wrangler dev
   ```
3. Initialiser la base D1 :
   ```bash
   npx wrangler d1 execute flodrama --file=./migrations/d1-init.sql
   ```

## Déployer sur Cloudflare

```bash
npx wrangler publish
```

## Configuration
- Renseigner le bon `database_id` dans `wrangler.toml` (voir Cloudflare D1 dashboard).
- Adapter les handlers dans `/src/handlers/` pour chaque ressource (anime, film, etc.).

## Structure
- `/src/handlers/` : endpoints REST (un fichier par ressource)
- `/src/utils/` : utilitaires (DB, réponses, logger, auth, validation)
- `/src/models/` : modèles TypeScript
- `/migrations/` : scripts SQL pour D1

---

## Authentification JWT & Sécurisation des endpoints

## Authentification OAuth Google (backend)

### Variables d'environnement à définir
- `GOOGLE_CLIENT_ID` : ID client OAuth Google
- `GOOGLE_CLIENT_SECRET` : Secret client OAuth Google
- `GOOGLE_REDIRECT_URI` : URI de callback (ex : `https://flodrama.example.com/api/auth/google/callback`)
- `FRONTEND_OAUTH_REDIRECT` : URL de redirection frontend après succès (ex : `https://flodrama.example.com/oauth-callback`)

### Endpoints backend
- `GET /api/auth/google` : Redirige l'utilisateur vers Google pour authentification
- `GET /api/auth/google/callback` : Callback Google, échange le code, crée/utilise l'utilisateur, génère un JWT, redirige vers le frontend

### Flow OAuth Google
1. Le frontend ouvre `/api/auth/google` (nouvelle fenêtre ou redirection)
2. L'utilisateur s'authentifie sur Google
3. Google redirige vers `/api/auth/google/callback` (backend)
4. Le backend échange le code contre un token Google, récupère l'email, crée/utilise l'utilisateur, génère un JWT FloDrama
5. Le backend redirige vers `FRONTEND_OAUTH_REDIRECT?token=...`
6. Le frontend récupère le JWT, le stocke et connecte l'utilisateur

### Sécurité
- Les secrets Google doivent être stockés dans l'interface Cloudflare (jamais commités)
- Le JWT généré a une durée de validité (par défaut 7 jours)
- Le flow est compatible avec les exigences OAuth2 et Cloudflare Workers


## Upload vidéo (Cloudflare Stream/R2)
- Endpoint protégé, réservé à l’admin.
- POST `/api/upload` avec `{ video_url, title, description, category_id, image_url }`
- La vidéo est uploadée sur Cloudflare Stream et référencée dans la base (pour le POC, l’ID vidéo est simulé).


- Les endpoints sensibles (listes, historique, ajout de commentaires, etc.) sont protégés par un middleware d’authentification (`requireAuth`).
- Le token JWT doit être envoyé dans l’en-tête HTTP `Authorization: Bearer <token>`.
- Exemple d’utilisation dans un handler :

```typescript
import { requireAuth } from '../utils/auth-middleware';

export async function handleListRequest(request: Request, url: URL, env: any) {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth; // erreur d’auth
  const user = auth.user;
  // ...
}
```

- Le JWT est vérifié côté backend (POC, à renforcer pour la prod).
- Si le token est invalide ou absent, une réponse 401 est retournée.

---

**Pour toute question ou évolution, voir la documentation technique dans `/Documentation_FloDrama.md` côté monorepo.**
