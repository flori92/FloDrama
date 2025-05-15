import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../../Context/UserContext";
import useApi from "../../../hooks/useApi";
import MovieGrid from "../MovieGrid/MovieGrid";

/**
 * Composant qui affiche des recommandations personnalisées basées sur l'historique de visionnage
 * @param {Object} props - Propriétés du composant
 * @param {number} props.limit - Nombre maximum de recommandations à afficher
 * @returns {JSX.Element} - Composant de recommandations
 */
const RecommendationSection = ({ limit = 12 }) => {
  const { user } = useContext(AuthContext);
  const [recommendations, setRecommendations] = useState([]);
  const [processingRecommendations, setProcessingRecommendations] = useState(false);

  // Récupérer l'historique de visionnage de l'utilisateur
  const { 
    data: history, 
    loading: historyLoading, 
    error: historyError 
  } = useApi(
    'getUserHistory',
    [user?.id],
    { skip: !user?.id }
  );

  // Fonction pour générer des recommandations basées sur l'historique
  const generateRecommendations = async (history) => {
    if (!history || !Array.isArray(history) || history.length === 0) {
      return [];
    }

    setProcessingRecommendations(true);

    try {
      // Extraire les catégories et genres les plus regardés
      const categories = {};
      const genres = {};

      history.forEach(item => {
        // Comptabiliser les catégories
        const category = item.content_type || 'anime';
        categories[category] = (categories[category] || 0) + 1;

        // Comptabiliser les genres
        if (item.genres && Array.isArray(item.genres)) {
          item.genres.forEach(genre => {
            genres[genre] = (genres[genre] || 0) + 1;
          });
        }
      });

      // Déterminer la catégorie la plus regardée
      let topCategory = 'anime';
      let maxCount = 0;
      Object.entries(categories).forEach(([category, count]) => {
        if (count > maxCount) {
          maxCount = count;
          topCategory = category;
        }
      });

      // Récupérer les recommandations basées sur la catégorie la plus regardée
      const trendingItems = await useApi('getTrending', [topCategory, limit * 2]).data;
      
      // Filtrer pour éviter les doublons avec l'historique
      const historyIds = new Set(history.map(item => item.id));
      const filteredRecommendations = trendingItems?.filter(item => !historyIds.has(item.id)) || [];
      
      return filteredRecommendations.slice(0, limit);
    } catch (error) {
      console.error("Erreur lors de la génération des recommandations:", error);
      return [];
    } finally {
      setProcessingRecommendations(false);
    }
  };

  // Générer des recommandations lorsque l'historique est chargé
  useEffect(() => {
    if (history && !historyLoading && !historyError) {
      generateRecommendations(history).then(recs => {
        setRecommendations(recs);
      });
    }
  }, [history, historyLoading, historyError]);

  // Ne rien afficher si l'utilisateur n'est pas connecté ou s'il n'y a pas d'historique
  if (!user || (history && history.length === 0) || !recommendations.length) {
    return null;
  }

  return (
    <div className="recommendation-section my-8">
      <MovieGrid
        title="Recommandations pour vous"
        movies={recommendations}
        isLoading={historyLoading || processingRecommendations}
        error={historyError}
        emptyMessage="Regardez plus de contenu pour obtenir des recommandations personnalisées"
      />
    </div>
  );
};

export default RecommendationSection;
