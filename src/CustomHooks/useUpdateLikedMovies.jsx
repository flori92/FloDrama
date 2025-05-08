import React, { useContext, useState } from "react";
import { AuthContext } from "../Context/UserContext";
import toast, { Toaster } from "react-hot-toast";
import { handleApiResponse } from "../Constants/FloDramaURLs";

function useUpdateLikedMovies() {
  const { User } = useContext(AuthContext);
  const [Error, setError] = useState(false);
  const API_BASE_URL = 'https://flodrama-api.florifavi.workers.dev';

  const notify = () => {
    toast.success("  Contenu ajouté aux Favoris  ");
  };
  
  const removeNotify = () => {
    toast.success("  Contenu retiré des Favoris  ");
  };
  
  const alertError = (message) => {
    toast.error(message);
  };

  const addToLikedMovies = async (movie) => {
    if (!User || !User.uid) {
      alertError("Vous devez être connecté pour ajouter aux favoris");
      return;
    }
    
    try {
      // Préparer les données pour l'API Cloudflare
      const content = {
        content_id: movie.id,
        content_type: movie.media_type || determineContentType(movie),
        is_liked: true // Marqueur spécifique pour les favoris
      };
      
      // Appel à l'API Cloudflare
      const response = await fetch(`${API_BASE_URL}/api/users/${User.uid}/favorites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(content)
      });
      
      await handleApiResponse(response);
      notify();
    } catch (error) {
      console.error("Erreur lors de l'ajout aux favoris:", error);
      alertError(error.message || "Erreur lors de l'ajout aux favoris");
      setError(true);
    }
  };

  const removeFromLikedMovies = async (movie) => {
    if (!User || !User.uid) {
      return;
    }
    
    try {
      // Préparer les données pour l'API Cloudflare
      const content = {
        content_id: movie.id,
        content_type: movie.media_type || determineContentType(movie)
      };
      
      // Appel à l'API Cloudflare (utilise la méthode DELETE via un paramètre)
      const response = await fetch(`${API_BASE_URL}/api/users/${User.uid}/favorites?content_id=${content.content_id}&is_liked=true`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      await handleApiResponse(response);
      removeNotify();
    } catch (error) {
      console.error("Erreur lors du retrait des favoris:", error);
      alertError(error.message || "Erreur lors du retrait des favoris");
      setError(true);
    }
  };
  
  // Helper pour déterminer le type de contenu
  const determineContentType = (movie) => {
    if (movie.first_air_date) { return 'drama'; }
    if (movie.release_date) { return 'film'; }
    if (movie.original_title && movie.original_title.includes('anime')) { return 'anime'; }
    if (movie.original_language === 'hi') { return 'bollywood'; }
    return 'film'; // Par défaut
  };

  const LikedMoviePopupMessage = (
    <Toaster
      toastOptions={{
        style: {
          padding: "1.5rem",
          backgroundColor: Error ? "#fff4f4" : "#f4fff4",
          borderLeft: Error ? "6px solid red" : "6px solid lightgreen",
        },
      }}
    />
  );

  return { addToLikedMovies, removeFromLikedMovies, LikedMoviePopupMessage };
}

export default useUpdateLikedMovies;
