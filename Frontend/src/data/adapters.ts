/**
 * Adaptateurs pour convertir les données entre différents formats
 * Ces fonctions permettent de transformer les données du format du module vers le format attendu par les composants UI
 */

import { ContentItem as DataContentItem, Category as DataCategory } from './index';
import {
  ContentItem as UIContentItem,
  HeroContent as UIHeroContent,
  Category as UICategory,
  Source as UISource,
  Recommendation as UIRecommendation
} from '../../components/ui/types';

/**
 * Convertit un ContentItem du module en UIContentItem pour les composants UI
 */
export function toUIContentItem(item: DataContentItem): UIContentItem {
  return {
    id: item.id,
    title: item.title,
    subtitle: item.subtitle,
    description: item.description,
    imageUrl: item.image,
    videoPreviewUrl: item.videoUrl,
    year: item.releaseDate ? new Date(item.releaseDate).getFullYear() : 2025,
    rating: item.score || 0,
    duration: "1h30m", // Valeur par défaut
    category: item.category,
    tags: item.tags
  };
}

/**
 * Convertit un ContentItem du module en UIHeroContent pour le composant HeroBanner
 */
export function toUIHeroContent(item: DataContentItem): UIHeroContent {
  return {
    id: item.id,
    title: item.title,
    subtitle: item.subtitle,
    description: item.description,
    image: item.image,
    videoUrl: item.videoUrl
  };
}

/**
 * Convertit un Category du module en UICategory pour le composant CategorySection
 */
export function toUICategory(category: DataCategory): UICategory {
  return {
    ...category,
    image: `https://flodrama-content-1745269660.s3.amazonaws.com/images/categories/${category.id}.jpg`,
    sources: category.sources.map(source => ({
      ...source,
      url: `https://flodrama.com/category/${category.id}/source/${source.id}`
    })) as UISource[]
  };
}

/**
 * Convertit un ContentItem du module en UIRecommendation pour le composant PersonalizedRecommendations
 */
export function toUIRecommendation(item: DataContentItem): UIRecommendation {
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    image: item.image,
    category: item.category,
    source: item.tags?.[0],
    score: item.score || 0,
    popularity: Math.round((item.popularity || 0) * 10),
    releaseDate: item.releaseDate || `2025-${Math.floor(Math.random() * 12) + 1}-${Math.floor(Math.random() * 28) + 1}`
  };
}

/**
 * Convertit un tableau de ContentItem en tableau de UIContentItem
 */
export function toUIContentItems(items: DataContentItem[]): UIContentItem[] {
  return items.map(toUIContentItem);
}

/**
 * Convertit un tableau de Category en tableau de UICategory
 */
export function toUICategories(categories: DataCategory[]): UICategory[] {
  return categories.map(toUICategory);
}

/**
 * Convertit un tableau de ContentItem en tableau de UIRecommendation
 */
export function toUIRecommendations(items: DataContentItem[]): UIRecommendation[] {
  return items.map(toUIRecommendation);
}

// Réexporter les types UI pour faciliter l'utilisation
export type { UIContentItem, UIHeroContent, UICategory, UISource, UIRecommendation };
