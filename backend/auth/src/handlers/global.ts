import { queryDB } from '../utils/db';
import { jsonResponse } from '../utils/response';

export async function handleGlobalTrendingRequest(request: Request, url: URL, env: any) {
  // Agrégation multi-catégorie pour le trending
  const data = await queryDB(env, "SELECT * FROM videos WHERE is_trending = 1 ORDER BY created_at DESC LIMIT 24", []);
  return jsonResponse({ data, error: null });
}

export async function handleGlobalRecentRequest(request: Request, url: URL, env: any) {
  // Agrégation multi-catégorie pour les ajouts récents
  const data = await queryDB(env, "SELECT * FROM videos ORDER BY created_at DESC LIMIT 24", []);
  return jsonResponse({ data, error: null });
}
