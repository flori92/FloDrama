// Service de récupération des contenus depuis les données générées par GitHub Actions
import axios from 'axios'

// Importation des données statiques (générées par GitHub Actions)
import metadata from '../data/metadata.json'
import carousels from '../data/carousels.json'
import heroBanners from '../data/hero_banners.json'

// Types de contenu supportés
export type ContentType = 'drama' | 'anime' | 'bollywood' | 'film'

// Interface pour les éléments de contenu
export interface ContentItem {
  id: string
  title: string
  original_title?: string
  poster: string
  year: number
  rating: number
  language: string
  source?: string
  type?: ContentType
}

// Interface pour les détails complets d'un contenu
export interface ContentDetail extends ContentItem {
  url: string
  description: string
  synopsis: string
  genres: string[]
  tags: string[]
  actors: string[]
  director?: string
  episode_count?: number
  duration?: number
  status?: string
  release_date?: string
  streaming_urls: {
    quality: string
    url: string
    size: string
  }[]
  trailers: {
    title: string
    url: string
    thumbnail: string
  }[]
  images: {
    url: string
    type: string
    width: number
    height: number
  }[]
  subtitles: {
    language: string
    url: string
  }[]
  related_content?: string[]
  user_ratings?: {
    average: number
    count: number
  }
  popularity_score?: number
  is_premium?: boolean
}

// Interface pour les carrousels
export interface Carousel {
  title: string
  type: string
  items: ContentItem[]
}

// Interface pour les résultats de recherche avec scraping intelligent
export interface SearchResponse {
  results: ContentItem[]
  message?: string
  requestId?: string
  status?: 'pending' | 'processing' | 'completed'
  resultsCount?: number
}

// Interface pour les demandes de contenu
export interface ContentRequest {
  id: string
  userId: string
  query: string
  status: 'pending' | 'processing' | 'completed'
  createdAt: string
  updatedAt: string
  resultsCount: number
}

/**
 * Récupère les contenus d'une catégorie spécifique
 * @param category Type de contenu (drama, anime, bollywood, film)
 * @param token Token d'authentification (optionnel)
 * @returns Liste des contenus de la catégorie
 */
export async function getCategoryContent(category: ContentType, token?: string): Promise<ContentItem[]> {
  try {
    // En mode développement ou sans connexion, utiliser les données locales
    if (process.env.NODE_ENV === 'development' || !navigator.onLine) {
      // Importer dynamiquement les données de la catégorie
      const categoryData = await import(`../data/content/${category}/index.json`)
      return categoryData.items || []
    }
    
    // En production avec connexion, utiliser l'API
    const response = await axios.get(`/api/content?category=${category}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
    return response.data
  } catch (error) {
    console.error(`Erreur lors de la récupération des contenus ${category}:`, error)
    // Fallback sur les données locales en cas d'erreur
    try {
      const categoryData = await import(`../data/content/${category}/index.json`)
      return categoryData.items || []
    } catch {
      return []
    }
  }
}

/**
 * Récupère les détails d'un contenu spécifique
 * @param contentId Identifiant du contenu
 * @param token Token d'authentification (optionnel)
 * @returns Détails complets du contenu
 */
export async function getContentDetail(contentId: string, token?: string): Promise<ContentDetail | null> {
  try {
    // Extraire la source et l'ID réel
    const [source, id] = contentId.split('-')
    
    // Déterminer le type de contenu en fonction de la source
    let contentType: ContentType | undefined
    
    // Parcourir les sources dans les métadonnées pour trouver le type
    for (const sourceInfo of metadata.sources) {
      if (sourceInfo.name === source) {
        contentType = sourceInfo.type as ContentType
        break
      }
    }
    
    if (!contentType) {
      throw new Error(`Type de contenu non trouvé pour la source: ${source}`)
    }
    
    // En mode développement ou sans connexion, utiliser les données locales
    if (process.env.NODE_ENV === 'development' || !navigator.onLine) {
      // Importer dynamiquement les données de la source
      const sourceData = await import(`../data/content/${contentType}/${source}.json`)
      // Trouver l'élément correspondant à l'ID
      const item = sourceData.find((item: any) => item.id === contentId)
      return item || null
    }
    
    // En production avec connexion, utiliser l'API
    const response = await axios.get(`/api/content/${contentId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
    return response.data
  } catch (error) {
    console.error(`Erreur lors de la récupération du contenu ${contentId}:`, error)
    return null
  }
}

/**
 * Récupère les carrousels pour la page d'accueil
 * @returns Liste des carrousels configurés
 */
export function getCarousels(): Record<string, Carousel> {
  return carousels
}

/**
 * Récupère les bannières pour le composant HeroBanner
 * @returns Liste des bannières à afficher
 */
export function getHeroBanners(): { banners: ContentItem[] } {
  return heroBanners
}

/**
 * Recherche des contenus dans toutes les catégories
 * @param query Terme de recherche
 * @param userId Identifiant de l'utilisateur (pour les demandes de contenu)
 * @param token Token d'authentification (optionnel)
 * @returns Résultat de recherche avec possibilité de scraping intelligent
 */
export async function searchContent(query: string, userId?: string, token?: string): Promise<SearchResponse> {
  if (!query.trim()) return { results: [] }
  
  try {
    // En mode développement ou sans connexion, utiliser les données locales
    if (process.env.NODE_ENV === 'development' || !navigator.onLine) {
      const results: ContentItem[] = []
      const types: ContentType[] = ['drama', 'anime', 'bollywood', 'film']
      
      // Rechercher dans chaque type de contenu
      for (const type of types) {
        try {
          const categoryData = await import(`../data/content/${type}/index.json`)
          const typeResults = (categoryData.items || []).filter((item: ContentItem) => 
            item.title.toLowerCase().includes(query.toLowerCase()) ||
            (item.original_title && item.original_title.toLowerCase().includes(query.toLowerCase()))
          )
          results.push(...typeResults)
        } catch (e) {
          console.warn(`Impossible de charger les données pour ${type}`, e)
        }
      }
      
      // Si aucun résultat n'est trouvé, simuler une demande de scraping ciblé
      if (results.length === 0 && userId) {
        const requestId = `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
        return {
          results: [],
          message: `Aucun résultat trouvé pour "${query}". Nous allons rechercher ce contenu pour vous.`,
          requestId,
          status: 'pending',
          resultsCount: 0
        }
      }
      
      return { results }
    }
    
    // En production avec connexion, utiliser l'API
    const response = await axios.get(`/api/search`, {
      params: { 
        q: query,
        userId: userId || undefined
      },
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
    
    return response.data
  } catch (error) {
    console.error(`Erreur lors de la recherche de contenus:`, error)
    return { results: [] }
  }
}

/**
 * Récupère le statut d'une demande de contenu
 * @param requestId Identifiant de la demande
 * @param token Token d'authentification (optionnel)
 * @returns Statut de la demande
 */
export async function getContentRequestStatus(requestId: string, token?: string): Promise<ContentRequest | null> {
  try {
    const response = await axios.get(`/api/content-request/${requestId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
    return response.data
  } catch (error) {
    console.error(`Erreur lors de la récupération du statut de la demande:`, error)
    return null
  }
}

/**
 * Récupère les notifications d'un utilisateur
 * @param userId Identifiant de l'utilisateur
 * @param token Token d'authentification
 * @returns Liste des notifications
 */
export async function getUserNotifications(userId: string, token: string): Promise<any[]> {
  try {
    const response = await axios.get(`/api/notifications/${userId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  } catch (error) {
    console.error(`Erreur lors de la récupération des notifications:`, error)
    return []
  }
}

/**
 * Marque une notification comme lue
 * @param notificationId Identifiant de la notification
 * @param userId Identifiant de l'utilisateur
 * @param token Token d'authentification
 * @returns Statut de l'opération
 */
export async function markNotificationAsRead(notificationId: string, userId: string, token: string): Promise<boolean> {
  try {
    await axios.post(`/api/notifications/${notificationId}/read`, { userId }, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return true
  } catch (error) {
    console.error(`Erreur lors du marquage de la notification comme lue:`, error)
    return false
  }
}

/**
 * Récupère les contenus recommandés pour un utilisateur
 * @param userId Identifiant de l'utilisateur
 * @param token Token d'authentification
 * @returns Liste des contenus recommandés
 */
export async function getRecommendedContent(userId: string, token: string): Promise<ContentItem[]> {
  try {
    // En production, utiliser l'API
    const response = await axios.get(`/api/recommendations/${userId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  } catch (error) {
    console.error(`Erreur lors de la récupération des recommandations:`, error)
    
    // Fallback sur les contenus populaires
    const popularItems: ContentItem[] = []
    const types: ContentType[] = ['drama', 'anime', 'bollywood', 'film']
    
    // Récupérer quelques éléments populaires de chaque type
    for (const type of types) {
      try {
        const categoryData = await import(`../data/content/${type}/index.json`)
        const topItems = (categoryData.items || [])
          .sort((a: ContentItem, b: ContentItem) => b.rating - a.rating)
          .slice(0, 3)
        popularItems.push(...topItems)
      } catch (e) {
        console.warn(`Impossible de charger les données pour ${type}`, e)
      }
    }
    
    return popularItems
  }
}
