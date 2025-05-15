import React, { useContext, useState } from "react";
import { AuthContext } from "../../Context/UserContext";
import toast, { Toaster } from "react-hot-toast";
import { handleApiResponse } from "../../Constants/FloDramaURLs";
import { API_BASE_URL } from "../../Cloudflare/CloudflareConfig";

function useUpdateWatchedMovies() {
  const { User } = useContext(AuthContext);
  const [Error, setError] = useState(false);
  

  const addNotify = () => {
    toast.success("  Contenu ajouté à l'historique  ");
  };
  
  const removeNotify = () => {
    toast.success("  Contenu retiré de l'historique  ");
  };
  
  const alertError = (message) => {
    toast.error(message);
  };
  
  const addToWatchedMovies = async (movie) => {
    if (!User || !User.uid) {
      return; // Silencieux pour l'historique (ajouté automatiquement)
    }
    
    try {
      // Préparer les données pour l'API Cloudflare
      const content = {
        content_id: movie.id,
        content_type: movie.media_type || determineContentType(movie),
        progress: movie.progress || 0 // Progression de visionnage (si disponible)
      };
      
      // Appel à l'API Cloudflare
      const response = await fetch(`${API_BASE_URL}/api/users/${User.uid}/history`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(content)
      });
      
      await handleApiResponse(response);
      // Notification optionnelle
      // addNotify();
    } catch (error) {
      console.error("Erreur lors de l'ajout à l'historique:", error);
      // Pas d'alerte visible pour l'utilisateur (processus en arrière-plan)
    }
  };

  const removeFromWatchedMovies = async (movie) => {
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
      const response = await fetch(`${API_BASE_URL}/api/users/${User.uid}/history?content_id=${content.content_id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      await handleApiResponse(response);
      removeNotify();
    } catch (error) {
      console.error("Erreur lors du retrait de l'historique:", error);
      alertError(error.message || "Erreur lors du retrait de l'historique");
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

  const removePopupMessage = (
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

  return { addToWatchedMovies, removeFromWatchedMovies, removePopupMessage };
}

export default useUpdateWatchedMovies;
