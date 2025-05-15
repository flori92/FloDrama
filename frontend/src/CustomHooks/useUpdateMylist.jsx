import React, { useContext, useState } from "react";
import { AuthContext } from "../../Context/UserContext";
import toast, { Toaster } from "react-hot-toast";
import { handleApiResponse } from "../../Constants/FloDramaURLs";
import { API_BASE_URL } from "../../Cloudflare/CloudflareConfig";

function useUpdateMylist() {
  const { User } = useContext(AuthContext);
  const [isMyListUpdates, setisMyListUpdates] = useState(false);
  

  const notify = () => {
    toast.success("  Contenu ajouté à Ma Liste  ");
  };
  
  const alertError = (message) => {
    toast.error(message);
  };

  const addToMyList = async (movie) => {
    if (!User || !User.uid) {
      alertError("Vous devez être connecté pour ajouter à votre liste");
      return;
    }
    
    try {
      // Préparer les données pour l'API Cloudflare
      const content = {
        content_id: movie.id,
        content_type: movie.media_type || determineContentType(movie)
      };
      
      // Appel à l'API Cloudflare
      const response = await fetch(`${API_BASE_URL}/api/users/${User.uid}/favorites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(content)
      });
      
      const data = await handleApiResponse(response);
      console.log("Contenu ajouté à Ma Liste", data);
      notify();
      setisMyListUpdates(true);
    } catch (error) {
      console.error("Erreur lors de l'ajout à Ma Liste:", error);
      alertError(error.message || "Erreur lors de l'ajout à Ma Liste");
    }
  };

  const removeFromMyList = async (movie) => {
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
      const response = await fetch(`${API_BASE_URL}/api/users/${User.uid}/favorites?content_id=${content.content_id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      await handleApiResponse(response);
      toast.success("Contenu retiré de Ma Liste");
      setisMyListUpdates(true);
    } catch (error) {
      console.error("Erreur lors du retrait de Ma Liste:", error);
      alertError(error.message || "Erreur lors du retrait de Ma Liste");
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

  const PopupMessage = (
    <Toaster
      toastOptions={{
        style: {
          padding: "1.5rem",
          backgroundColor: "#f4fff4",
          borderLeft: "6px solid lightgreen",
        },
      }}
    />
  );

  return { addToMyList, removeFromMyList, PopupMessage, isMyListUpdates };
}

export default useUpdateMylist;
