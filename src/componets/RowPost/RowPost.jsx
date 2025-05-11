import React, { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../../Context/UserContext";
import { imageUrl, imageUrl2 } from "../../Constants/Constance";

function RowPost(props) {
  const [isHover, setIsHover] = useState(false);
  const { User } = useContext(AuthContext);
  const [windowSize, setWindowSize] = useState(window.innerWidth);

  // Fonction utilitaire pour garantir que les valeurs de notation sont valides
  const ensureValidRating = (rating) => {
    try {
      // Si la valeur est undefined ou null, retourner la valeur par défaut
      if (rating === undefined || rating === null) {
        return 3.5;
      }
      
      // Si c'est déjà un nombre, le traiter
      if (typeof rating === 'number') {
        // Vérifier si c'est un nombre valide (pas NaN)
        if (isNaN(rating)) {
          return 3.5;
        }
        // Convertir à une échelle de 5 étoiles si nécessaire (TMDB utilise une échelle de 10)
        return rating > 5 ? rating / 2 : rating;
      }
      
      // Si c'est une chaîne, essayer de la convertir en nombre
      if (typeof rating === 'string') {
        const parsedRating = parseFloat(rating);
        if (isNaN(parsedRating)) {
          return 3.5;
        }
        return parsedRating > 5 ? parsedRating / 2 : parsedRating;
      }
      
      // Pour tout autre type, retourner la valeur par défaut
      return 3.5;
    } catch (error) {
      console.error("Erreur lors du calcul de la note:", error);
      return 3.5;
    }
  };

  // Fonction pour obtenir l'URL de l'image
  const getImageUrl = (obj) => {
    try {
      if (!obj) return '/assets/poster-placeholder.jpg';
      
      // Essayer d'abord poster_path
      if (obj.poster_path && obj.poster_path.startsWith('/')) {
        return `${imageUrl}${obj.poster_path}`;
      }
      
      // Essayer ensuite poster_path sans le slash
      if (obj.poster_path) {
        return `${imageUrl}/${obj.poster_path}`;
      }
      
      // Essayer backdrop_path
      if (obj.backdrop_path && obj.backdrop_path.startsWith('/')) {
        return `${imageUrl}${obj.backdrop_path}`;
      }
      
      // Essayer backdrop_path sans le slash
      if (obj.backdrop_path) {
        return `${imageUrl}/${obj.backdrop_path}`;
      }
      
      // Essayer image_path
      if (obj.image_path) {
        return obj.image_path.startsWith('http') ? obj.image_path : `${imageUrl}/${obj.image_path}`;
      }
      
      // Essayer image
      if (obj.image) {
        return obj.image.startsWith('http') ? obj.image : `${imageUrl}/${obj.image}`;
      }
      
      // Utiliser l'image par défaut
      return '/assets/poster-placeholder.jpg';
    } catch (error) {
      console.error("Erreur lors de la récupération de l'URL de l'image:", error);
      return '/assets/poster-placeholder.jpg';
    }
  };
  
  // Fonction pour formater la note en toute sécurité
  const formatRating = (obj) => {
    try {
      if (!obj) return "3.5";
      
      let rating;
      if (typeof obj.rating === 'number' || typeof obj.rating === 'string') {
        rating = ensureValidRating(obj.rating);
      } else if (typeof obj.vote_average === 'number' || typeof obj.vote_average === 'string') {
        rating = ensureValidRating(obj.vote_average / 2);
      } else {
        rating = 3.5;
      }
      
      return typeof rating === 'number' ? rating.toFixed(1) : "3.5";
    } catch (error) {
      console.error("Erreur lors du formatage de la note:", error);
      return "3.5";
    }
  };

  useEffect(() => {
    const handleResize = () => {
      setWindowSize(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div className="row_post">
      <h2 className="text-white font-medium md:text-xl pl-12 pt-4">
        {props.title}
      </h2>
      <div className="flex overflow-x-scroll pl-12 py-4 scrollbar-hide">
        {props.movies &&
          props.movies.map((obj, index) => {
            if (!obj || typeof obj !== 'object') return null;
            
            return (
              <div
                key={obj.id || index}
                className="flex-shrink-0 mr-4 relative"
                onMouseEnter={() => setIsHover(true)}
                onMouseLeave={() => setIsHover(false)}
              >
                <Link to={obj.id ? `/play/${obj.id}` : '#'}>
                  <img
                    className="w-40 h-60 object-cover rounded-md cursor-pointer transition-transform duration-300 hover:scale-105"
                    src={getImageUrl(obj)}
                    alt={obj.title || obj.name || 'Film'}
                    onError={(e) => {
                      console.log("Erreur de chargement d'image pour:", obj);
                      e.target.src = '/assets/poster-placeholder.jpg';
                    }}
                  />
                </Link>
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black to-transparent">
                  <h3 className="text-white text-sm font-medium truncate">
                    {obj.title || obj.name || 'Film sans titre'}
                  </h3>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}

export default RowPost;
