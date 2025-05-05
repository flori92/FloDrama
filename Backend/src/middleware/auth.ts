/**
 * Middleware d'authentification pour Cloudflare Workers
 */
import { logger } from '../utils/logger';

interface JwtPayload {
  userId: string;
  role: string;
}

interface AuthUser {
  userId: string;
  role: string;
}

interface AuthRequest extends Request {
  user?: AuthUser;
}

/**
 * Vérifie l'authentification JWT pour Cloudflare Workers
 * 
 * @param request - La requête à authentifier
 * @param env - L'environnement Cloudflare Workers
 * @returns Une promesse qui résout avec la requête authentifiée ou rejette avec une erreur
 */
export async function authenticateJWT(request: Request, env: any): Promise<AuthRequest> {
  const authRequest = request.clone() as AuthRequest;
  const authHeader = request.headers.get('Authorization');

  if (!authHeader) {
    throw new Error('Token d\'authentification manquant');
  }

  try {
    const token = authHeader.split(' ')[1];
    const secret = env.JWT_SECRET || 'votre-secret-par-defaut';

    // Utilisation de la Web Crypto API pour vérifier le token
    // Note: Dans un environnement de production, utilisez la bibliothèque jose
    // importée via npm et utilisez jose.jwtVerify()
    
    // Simulation de vérification JWT (à remplacer par jose.jwtVerify)
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    const decoded = JSON.parse(jsonPayload) as JwtPayload;
    
    // Ajouter les informations de l'utilisateur à la requête
    authRequest.user = {
      userId: decoded.userId,
      role: decoded.role
    };

    return authRequest;
  } catch (error) {
    logger.error('Erreur d\'authentification:', error);
    throw new Error('Token invalide ou expiré');
  }
}

/**
 * Vérifie les rôles utilisateur
 * 
 * @param roles - Liste des rôles autorisés
 * @param request - La requête authentifiée
 * @returns true si l'utilisateur a un rôle autorisé, sinon false
 */
export function checkRole(roles: string[], request: AuthRequest): boolean {
  if (!request.user || !request.user.role) {
    return false;
  }

  return roles.includes(request.user.role);
}

/**
 * Middleware complet d'authentification et autorisation
 * 
 * @param request - La requête à authentifier
 * @param env - L'environnement Cloudflare Workers
 * @param roles - Liste optionnelle des rôles autorisés
 * @returns Une promesse qui résout avec la requête authentifiée ou rejette avec une erreur
 */
export async function auth(request: Request, env: any, roles?: string[]): Promise<AuthRequest> {
  const authRequest = await authenticateJWT(request, env);
  
  if (roles && roles.length > 0) {
    if (!checkRole(roles, authRequest)) {
      throw new Error('Privilèges insuffisants');
    }
  }
  
  return authRequest;
}
