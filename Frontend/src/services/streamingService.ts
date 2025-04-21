import axios from 'axios';

/**
 * Récupère l'URL de streaming sécurisé pour un contenu donné.
 * @param contentId Identifiant du contenu à streamer
 * @param token Jeton d'authentification (optionnel)
 * @returns URL du flux vidéo
 */
export async function getStreamingUrl(contentId: string, token?: string): Promise<string> {
  const response = await axios.get(`/api/content/${contentId}/stream`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  return response.data.url;
}
