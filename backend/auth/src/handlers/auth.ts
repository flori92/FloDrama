import { queryDB } from '../utils/db';
import { jsonResponse, errorResponse } from '../utils/response';

export async function handleAuthRequest(request: Request, url: URL, env: any) {
  if (request.method === 'POST') {
    const { email, password_hash } = await request.json();
    const users = await queryDB(env, "SELECT * FROM users WHERE email = ? AND password_hash = ?", [email, password_hash]);
    if (users.length === 1) {
      // Ici, il faudrait générer un JWT ou une session
      return jsonResponse({ data: { user: users[0], token: 'A_GENERER' }, error: null });
    } else {
      return errorResponse('Identifiants invalides', 401);
    }
  }
  return errorResponse('Méthode non supportée', 405);
}
