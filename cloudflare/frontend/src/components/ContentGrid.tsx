/**
 * Composant de grille de contenu pour FloDrama
 * 
 * Ce composant affiche une grille de cartes de contenu avec gestion des recommandations,
 * adapté pour l'architecture Cloudflare.
 */

import React, { useState } from 'react';
import ContentCard from './ContentCard';
import { ContentItem, ContentType } from '../services/apiService';
import recommendationService from '../services/recommendationService';

interface ContentGridProps {
  title: string;
  items: ContentItem[];
  userId?: string;
  contentType?: ContentType;
  isLoading?: boolean;
  onRefresh?: () => void;
}

const ContentGrid: React.FC<ContentGridProps> = ({
  title,
  items,
  userId,
  contentType,
  isLoading = false,
  onRefresh
}) => {
  // État local pour les interactions utilisateur
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set());
  const [dislikedItems, setDislikedItems] = useState<Set<string>>(new Set());
  const [favoriteItems, setFavoriteItems] = useState<Set<string>>(new Set());

  // Gestionnaire pour "J'aime"
  const handleLike = async (id: string) => {
    if (!userId) {
      return;
    }
    
    // Mise à jour de l'état local
    const newLikedItems = new Set(likedItems);
    const newDislikedItems = new Set(dislikedItems);
    
    if (newLikedItems.has(id)) {
      newLikedItems.delete(id);
    } else {
      newLikedItems.add(id);
      newDislikedItems.delete(id); // Retirer des "Je n'aime pas" si présent
    }
    
    setLikedItems(newLikedItems);
    setDislikedItems(newDislikedItems);
    
    // Mise à jour des préférences utilisateur
    try {
      await recommendationService.updateUserPreferences(userId, {
        favoriteGenres: [], // À compléter avec les genres du contenu
      });
      
      // Rafraîchir les recommandations si nécessaire
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour des préférences:', error);
    }
  };

  // Gestionnaire pour "Je n'aime pas"
  const handleDislike = async (id: string) => {
    if (!userId) {
      return;
    }
    
    // Mise à jour de l'état local
    const newLikedItems = new Set(likedItems);
    const newDislikedItems = new Set(dislikedItems);
    
    if (newDislikedItems.has(id)) {
      newDislikedItems.delete(id);
    } else {
      newDislikedItems.add(id);
      newLikedItems.delete(id); // Retirer des "J'aime" si présent
    }
    
    setLikedItems(newLikedItems);
    setDislikedItems(newDislikedItems);
    
    // Mise à jour des préférences utilisateur
    try {
      await recommendationService.updateUserPreferences(userId, {
        // Mise à jour des préférences basée sur le dislike
      });
      
      // Rafraîchir les recommandations si nécessaire
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour des préférences:', error);
    }
  };

  // Gestionnaire pour les favoris
  const handleAddToFavorites = async (id: string) => {
    if (!userId) {
      return;
    }
    
    // Mise à jour de l'état local
    const newFavoriteItems = new Set(favoriteItems);
    
    if (newFavoriteItems.has(id)) {
      newFavoriteItems.delete(id);
    } else {
      newFavoriteItems.add(id);
    }
    
    setFavoriteItems(newFavoriteItems);
    
    // Mise à jour des préférences utilisateur
    try {
      await recommendationService.updateUserPreferences(userId, {
        favorites: Array.from(newFavoriteItems),
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour des favoris:', error);
    }
  };

  // Fonction pour filtrer ou trier les contenus en fonction du type
  const getFilteredItems = () => {
    if (!contentType) {
      return items;
    }
    
    // Exemple d'utilisation du contentType pour filtrer ou trier
    return items.map(item => ({
      ...item,
      category: item.category || contentType // Utiliser contentType comme catégorie par défaut si non définie
    }));
  };

  const displayItems = getFilteredItems();

  return (
    <div className="mb-10">
      {/* En-tête de section */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-white text-2xl font-bold">{title}</h2>
        
        {onRefresh && (
          <button 
            onClick={onRefresh}
            className="flex items-center text-white hover:text-flo-blue font-semibold transition-colors"
            disabled={isLoading}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 mr-1 ${isLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Actualiser
          </button>
        )}
      </div>
      
      {/* État de chargement */}
      {isLoading && (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-flo-blue"></div>
        </div>
      )}
      
      {/* Grille de contenu */}
      {!isLoading && displayItems.length === 0 && (
        <div className="flex justify-center items-center h-64">
          <p className="text-white text-lg">Aucun contenu disponible</p>
        </div>
      )}
      
      {!isLoading && displayItems.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {displayItems.map((item) => (
            <ContentCard
              key={item.id}
              item={item}
              onLike={userId ? handleLike : undefined}
              onDislike={userId ? handleDislike : undefined}
              onAddToFavorites={userId ? handleAddToFavorites : undefined}
              isLiked={likedItems.has(item.id)}
              isDisliked={dislikedItems.has(item.id)}
              isFavorite={favoriteItems.has(item.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ContentGrid;
