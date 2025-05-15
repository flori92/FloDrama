import React from "react";
import { useEffect, useState, useContext } from "react";
import Banner from "../../components/Banner/Banner";
import Footer from "../../components/Footer/Footer";
import RowPost from "../../components/RowPost/RowPost";
import MovieGrid from "../../components/MovieGrid/MovieGrid";
import RecommendationSection from "../../components/Recommendations/RecommendationSection";
import {
  featured, // utilisé pour le banner
  getFullUrl
} from "../../Constants/FloDramaURLs";
import ApiService from "../../services/ApiService";
import useApi from "../../hooks/useApi";
import { AuthContext } from "../../Context/UserContext";

function Home() {
  const { user } = useContext(AuthContext);
  
  // Utilisation du hook useApi pour récupérer l'historique de visionnage
  const { 
    data: watchedMovies, 
    loading: isLoading, 
    error 
  } = useApi(
    'getUserHistory',
    [user?.id],
    { skip: !user?.id }
  );

  if (error) {
    console.warn("Erreur non bloquante lors du chargement de l'historique:", error);
    // Ne pas bloquer le rendu en cas d'erreur sur l'historique
  }

  // Utilisation du hook useApi pour récupérer les tendances globales
  const { 
    data: trendingMovies, 
    loading: trendingLoading, 
    error: trendingError 
  } = useApi('getTrending', ['all', 24]);

  // Utilisation du hook useApi pour récupérer les ajouts récents
  const { 
    data: recentMovies, 
    loading: recentLoading, 
    error: recentError 
  } = useApi('getRecent', ['all', 24]);

  return (
    <div>
      {/* Banner principal */}
      <Banner url={getFullUrl(featured)} useCloudflareApi={true} />
      
      <div className="w-full px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Section Tendances avec MovieGrid */}
        <MovieGrid 
          title="Tendances" 
          movies={trendingMovies} 
          isLoading={trendingLoading} 
          error={trendingError}
        />
        
        {/* Section Ajouts Récents avec MovieGrid */}
        <MovieGrid 
          title="Ajouts Récents" 
          movies={recentMovies}
          isLoading={recentLoading}
          error={recentError}
        />
        
        {/* Sections par catégorie avec RowPost - utilisation de l'API centralisée */}
        <RowPost 
          title="Animes populaires" 
          category="anime"
          useApiService={true}
        />
        
        <RowPost 
          title="Dramas populaires" 
          category="drama"
          useApiService={true}
        />
        
        <RowPost 
          title="Films populaires" 
          category="film"
          useApiService={true}
        />
        
        <RowPost 
          title="Bollywood populaires" 
          category="bollywood"
          useApiService={true}
        />
        
        {/* Section Historique (si l'utilisateur est connecté) */}
        {user && watchedMovies && watchedMovies.length > 0 && (
          <RowPost 
            title="Continuer à regarder" 
            movies={watchedMovies} 
            isLoading={isLoading} 
            error={error}
          />
        )}
        
        {/* Section Recommandations personnalisées */}
        {user && (
          <RecommendationSection limit={12} />
        )}
      </div>
      
      <Footer />
    </div>
  );
}

export default Home;
