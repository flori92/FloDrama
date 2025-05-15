import { queryDB } from '../utils/db';
import { jsonResponse, errorResponse } from '../utils/response';
import { requireAuth } from '../utils/auth-middleware';

export async function handleCommentsRequest(request: Request, url: URL, env: any) {
  if (request.method === 'GET') {
    // Récupérer les commentaires d'une vidéo (public)
    const video_id = url.searchParams.get('video_id');
    if (!video_id) return errorResponse('video_id requis', 400);
    const data = await queryDB(env, "SELECT * FROM comments WHERE video_id = ? ORDER BY created_at DESC", [video_id]);
    return jsonResponse({ data, error: null });
  }
  if (request.method === 'POST') {
    // Ajouter un commentaire (authentifié)
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;
    const user = auth.user;
    const { video_id, content } = await request.json();
    await queryDB(env, "INSERT INTO comments (id, user_id, video_id, content, created_at) VALUES (?, ?, ?, ?, datetime('now'))", [crypto.randomUUID(), user.id, video_id, content]);
    return jsonResponse({ data: 'Commentaire ajouté', error: null }, 201);
  }
  return errorResponse('Méthode non supportée', 405);
}
