import { extractBearerToken, verifyJWT } from './auth';
import { jsonResponse, errorResponse } from './response';

// Middleware d'authentification pour les handlers sensibles
export async function requireAuth(request: Request, env: any): Promise<{user: any}|Response> {
  const token = extractBearerToken(request);
  if (!token) {
    return errorResponse('Token manquant', 401);
  }
  // À remplacer par une clé secrète stockée dans les variables d'env
  const user = await verifyJWT(token, env.JWT_SECRET || 'secret');
  if (!user) {
    return errorResponse('Token invalide', 401);
  }
  return { user };
}
