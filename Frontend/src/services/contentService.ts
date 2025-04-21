// Service de récupération des contenus depuis l'API AWS (catégorie, détail, trailer)
import axios from 'axios'

export async function getCategoryContent(category: string, token: string) {
  // Endpoint AWS réel à adapter si besoin
  const response = await axios.get(`/api/content?category=${category}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data; // Tableau d'objets contenus (avec trailerUrl si dispo)
}

export async function getContentDetail(contentId: string, token: string) {
  // Endpoint AWS réel à adapter si besoin
  const response = await axios.get(`/api/content/${contentId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data; // Détail du contenu (incluant trailerUrl)
}
