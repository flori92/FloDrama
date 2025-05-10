import React from "react";
import { useNavigate } from "react-router-dom";
import useUpdateWatchedMovies from "./useUpdateWatchedMovies";

function usePlayMovie() {
  const { addToWatchedMovies } = useUpdateWatchedMovies();
  const navigate = useNavigate();

  const playMovie = (movie, from) => {
    // Ajouter le film à l'historique des films regardés
    addToWatchedMovies(movie);
    
    // Si le film a une URL de streaming et l'indicateur streaming_url_for_player
    if (movie.streaming_url && movie.streaming_url_for_player) {
      // Passer l'URL de streaming au composant Play via l'état
      navigate(`/play/${movie.id}`, { 
        replace: true, 
        state: { 
          From: from,
          streamingUrl: movie.streaming_url,
          movieData: movie // Passer toutes les données du film pour éviter une requête supplémentaire
        } 
      });
    } else {
      // Comportement standard sans URL de streaming spécifique
      navigate(`/play/${movie.id}`, { replace: true, state: { From: from } });
    }
  };

  return { playMovie };
}

export default usePlayMovie;
