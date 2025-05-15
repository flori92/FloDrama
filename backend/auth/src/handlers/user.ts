import { queryDB } from '../utils/db';
import { jsonResponse, errorResponse } from '../utils/response';

export async function handleUserRequest(request: Request, url: URL, env: any) {
  if (request.method === 'GET') {
    // Liste des utilisateurs (admin)
    const data = await queryDB(env, "SELECT id, email, display_name, avatar_url, created_at FROM users", []);
    return jsonResponse({ data, error: null });
  }
  if (request.method === 'POST') {
    // Création d'utilisateur (inscription)
    const { email, password_hash, display_name } = await request.json();
    try {
      await queryDB(env, "INSERT INTO users (id, email, password_hash, display_name) VALUES (?, ?, ?, ?)", [crypto.randomUUID(), email, password_hash, display_name]);
      return jsonResponse({ data: 'Utilisateur créé', error: null }, 201);
    } catch (e) {
      return errorResponse('Erreur lors de la création de l’utilisateur', 400);
    }
  }
  return errorResponse('Méthode non supportée', 405);
}
