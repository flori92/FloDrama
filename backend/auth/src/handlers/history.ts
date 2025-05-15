import { queryDB } from '../utils/db';
import { jsonResponse, errorResponse } from '../utils/response';
import { requireAuth } from '../utils/auth-middleware';

export async function handleHistoryRequest(request: Request, url: URL, env: any) {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;
  const user = auth.user;

  if (request.method === 'GET') {
    const data = await queryDB(env, "SELECT * FROM history WHERE user_id = ? ORDER BY watched_at DESC", [user.id]);
    return jsonResponse({ data, error: null });
  }
  if (request.method === 'POST') {
    const { video_id } = await request.json();
    await queryDB(env, "INSERT OR REPLACE INTO history (user_id, video_id, watched_at) VALUES (?, ?, datetime('now'))", [user.id, video_id]);
    return jsonResponse({ data: 'Historique mis à jour', error: null }, 201);
  }
  return errorResponse('Méthode non supportée', 405);
}
