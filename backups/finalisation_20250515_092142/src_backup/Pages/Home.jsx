import React from "react";
import { useEffect, useState, useContext } from "react";
import Banner from "../components/Banner/Banner";
import Footer from "../components/Footer/Footer";
import RowPost from "../components/RowPost/RowPost";
import MovieGrid from "../components/MovieGrid/MovieGrid";
import {
  dramas,
  animes,
  films,
  bollywood,
  featured, // réactivé car utilisé dans le composant
  TRENDING_ENDPOINTS,
  RECENT_ENDPOINTS,
  handleApiResponse,
  getFullUrl
} from "../Constants/FloDramaURLs";
import { fetchAggregatedContent } from "../utils/fetchAggregatedContent";
import { API_BASE_URL } from "../Cloudflare/CloudflareConfig";
import { AuthContext } from "../Context/UserContext";

function Home() {
  const { user } = useContext(AuthContext);
  const [watchedMovies, setWatchedMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Ne charger l'historique que si l'utilisateur est connecté
    if (user && user.id) {
      setIsLoading(true);
      // Utiliser la nouvelle API Cloudflare pour récupérer l'historique
      fetch(`${API_BASE_URL}/api/users/${user.id}/history`)
        .then(response => handleApiResponse(response))
        .then(data => {
          setWatchedMovies(data);
          setIsLoading(false);
        })
        .catch(err => {
          console.error("Erreur lors de la récupération de l'historique:", err);
          setError(err.message);
          setIsLoading(false);
        });
    } else {
      // Si l'utilisateur n'est pas connecté, ne pas charger l'historique
      setWatchedMovies([]);
      setIsLoading(false);
    }
  }, [user]);

  if (error) {
    console.warn("Erreur non bloquante lors du chargement de l'historique:", error);
    // Ne pas bloquer le rendu en cas d'erreur sur l'historique
  }

  // État pour stocker les données des films pour la grille
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [recentMovies, setRecentMovies] = useState([]);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [recentLoading, setRecentLoading] = useState(true);
  const [trendingError, setTrendingError] = useState(null);
  const [recentError, setRecentError] = useState(null);

  // Agrégation des tendances globales (toutes catégories)
  useEffect(() => {
    setTrendingLoading(true);
    fetchAggregatedContent(TRENDING_ENDPOINTS, { limit: 24, handleApiResponse })
      .then(data => {
        setTrendingMovies(data);
        setTrendingLoading(false);
      })
      .catch(err => {
        console.error("Erreur lors de l'agrégation des tendances:", err);
        setTrendingError(err.message);
        setTrendingLoading(false);
      });
  }, []);

  // Agrégation des ajouts récents globaux (toutes catégories)
  useEffect(() => {
    setRecentLoading(true);
    fetchAggregatedContent(RECENT_ENDPOINTS, { limit: 24, handleApiResponse })
      .then(data => {
        setRecentMovies(data);
        setRecentLoading(false);
      })
      .catch(err => {
        console.error("Erreur lors de l'agrégation des ajouts récents:", err);
        setRecentError(err.message);
        setRecentLoading(false);
      });
  }, []);

  return (
    <div>
      {/* Banner réactivé en utilisant l'endpoint anime/trending qui fonctionne */}
      <Banner url={getFullUrl(featured)} useCloudflareApi={true} />
      
      <div className="w-full px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Section Tendances avec MovieGrid */}
        <MovieGrid 
          title="En Tendance" 
          movies={trendingMovies}
          isLoading={trendingLoading}
          error={trendingError}
        />
        
        {/* Section Dramas avec RowPost */}
        <RowPost 
          title="Dramas Asiatiques" 
          islarge 
          url={dramas} 
          key={dramas}
          useCloudflareApi={true}
        />
        
        {/* Section Historique conditionnelle */}
        {!isLoading && watchedMovies && watchedMovies.length > 0 && (
          <RowPost
            title="Historique"
            movieData={watchedMovies}
            key={"Historique"}
            useCloudflareApi={true}
          />
        )}
        
        {/* Section Animes avec RowPost */}
        <RowPost
          title="Animes"
          islarge
          url={animes}
          key={animes}
          useCloudflareApi={true}
        />
        
        {/* Section Films avec RowPost */}
        <RowPost
          title="Films"
          url={films}
          key={films}
          useCloudflareApi={true}
        />
        
        {/* Section Bollywood avec RowPost */}
        <RowPost 
          title="Bollywood" 
          url={bollywood} 
          key={bollywood}
          useCloudflareApi={true}
        />
        
        {/* Section Ajouts Récents avec MovieGrid */}
        <MovieGrid 
          title="Ajouts Récents" 
          movies={recentMovies}
          isLoading={recentLoading}
          error={recentError}
        />
      </div>
      
      <Footer />
    </div>
  );
}

export default Home;
