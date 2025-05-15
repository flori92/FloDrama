// Auth utilitaire minimal pour JWT (à compléter avec une vraie lib JWT si besoin)
export async function verifyJWT(token: string, secret: string): Promise<any | null> {
  // Décodage et vérification simplifiée (à remplacer par une vraie lib JWT pour la prod)
  try {
    const [header, payload, signature] = token.split('.');
    if (!header || !payload || !signature) return null;
    // Décodage base64url
    const json = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    // Pas de vérification de signature ici (POC)
    return json;
  } catch {
    return null;
  }
}

import { createJWT } from './jwt';

/**
 * Recherche ou crée un utilisateur à partir d'un provider OAuth (Google), puis génère un JWT.
 * @param userInfo { email, display_name, avatar_url, provider, provider_id }
 * @param env L'environnement Cloudflare Workers
 * @returns { jwt, user }
 */
export async function getOrCreateUserAndJWT(userInfo: {
  email: string,
  display_name: string,
  avatar_url?: string,
  provider: string,
  provider_id: string
}, env: any) {
  // Recherche par provider_id OU email
  let user = await env.DB.prepare(
    `SELECT * FROM users WHERE provider = ? AND provider_id = ? OR email = ? LIMIT 1`
  ).bind(userInfo.provider, userInfo.provider_id, userInfo.email).first();
  if (!user) {
    // Création utilisateur
    const id = crypto.randomUUID();
    await env.DB.prepare(
      `INSERT INTO users (id, email, display_name, avatar_url, provider, provider_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
    ).bind(id, userInfo.email, userInfo.display_name, userInfo.avatar_url || '', userInfo.provider, userInfo.provider_id).run();
    user = { id, ...userInfo };
  }
  // Génération du JWT
  const jwt = await createJWT(user, env);
  return { jwt, user };
}

export function extractBearerToken(request: Request): string | null {
  const auth = request.headers.get('Authorization');
  if (auth && auth.startsWith('Bearer ')) {
    return auth.substring(7);
  }
  return null;
}
