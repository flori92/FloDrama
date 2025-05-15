import { jsonResponse, errorResponse } from '../utils/response';
import { requireAuth } from '../utils/auth-middleware';

export async function handleUploadRequest(request: Request, url: URL, env: any) {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;
  const user = auth.user;

  // Contrôle de rôle admin (à renforcer selon ton modèle utilisateur)
  if (!user.role || user.role !== 'admin') {
    return errorResponse('Accès refusé', 403);
  }

  if (request.method === 'POST') {
    // Exemple : upload d'une vidéo via URL (Cloudflare Stream Direct Creator)
    const { video_url, title, description, category_id, image_url } = await request.json();

    // Ici, tu devrais appeler l’API Cloudflare Stream pour uploader la vidéo et récupérer son ID
    // Pour le POC, on simule la réponse :
    const streamId = 'MOCK_STREAM_ID';

    // Insérer la vidéo dans la base
    await env.DB.prepare(
      `INSERT INTO videos (id, title, description, category_id, image_url, video_url, is_trending, is_featured, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 0, 0, datetime('now'), datetime('now'))`
    ).bind(streamId, title, description, category_id, image_url, streamId).run();

    return jsonResponse({ data: { id: streamId }, error: null }, 201);
  }
  return errorResponse('Méthode non supportée', 405);
}
