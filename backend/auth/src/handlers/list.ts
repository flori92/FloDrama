import { queryDB } from '../utils/db';
import { jsonResponse, errorResponse } from '../utils/response';
import { requireAuth } from '../utils/auth-middleware';

export async function handleListRequest(request: Request, url: URL, env: any) {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;
  const user = auth.user;

  if (request.method === 'GET') {
    const data = await queryDB(env, "SELECT * FROM lists WHERE user_id = ?", [user.id]);
    return jsonResponse({ data, error: null });
  }
  if (request.method === 'POST') {
    const { name } = await request.json();
    await queryDB(env, "INSERT INTO lists (id, user_id, name) VALUES (?, ?, ?)", [crypto.randomUUID(), user.id, name]);
    return jsonResponse({ data: 'Liste créée', error: null }, 201);
  }
  return errorResponse('Méthode non supportée', 405);
}
