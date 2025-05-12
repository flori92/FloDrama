import React, { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../../Context/UserContext";
import { imageUrl, imageUrl2 } from "../../Constants/Constance";
import { determineContentType } from "../../Cloudflare/CloudflareConfig";

function RowPost(props) {
  const [isHover, setIsHover] = useState(false);
  const { User } = useContext(AuthContext);
  const [windowSize, setWindowSize] = useState(window.innerWidth);

  // Fonction globale sécurisée pour traiter tous les cas de notes invalides
  const ensureValidRating = (value) => {
    try {
      // Si la valeur est undefined ou null, retourner la valeur par défaut
      if (value === undefined || value === null) {
        return 3.5;
      }
      
      // Si c'est déjà un nombre, le traiter
      if (typeof value === 'number') {
        // Vérifier si c'est un nombre valide (pas NaN)
        if (isNaN(value)) {
          return 3.5;
        }
        // Convertir à une échelle de 5 étoiles si nécessaire (TMDB utilise une échelle de 10)
        return value > 5 ? value / 2 : value;
      }
      
      // Si c'est une chaîne, essayer de la convertir en nombre
      if (typeof value === 'string') {
        const parsedValue = parseFloat(value);
        if (isNaN(parsedValue)) {
          return 3.5;
        }
        return parsedValue > 5 ? parsedValue / 2 : parsedValue;
      }
      
      // Pour tout autre type, retourner la valeur par défaut
      return 3.5;
    } catch (error) {
      console.error("Erreur lors de la validation de la note:", error);
      return 3.5;
    }
  };

  // Fonction qui extrait et nettoie la note d'un objet film/série
  const getRating = (item) => {
    try {
      if (!item || typeof item !== 'object') {
        return 3.5;
      }

      // Essayer d'obtenir rating d'abord
      if (item.rating !== undefined) {
        return ensureValidRating(item.rating);
      }
      
      // Essayer ensuite vote_average (divisé par 2 si nécessaire)
      if (item.vote_average !== undefined) {
        return ensureValidRating(item.vote_average / 2);
      }
      
      // Valeur par défaut si aucune note n'est trouvée
      return 3.5;
    } catch (error) {
      console.error("Erreur lors de l'extraction de la note:", error);
      return 3.5;
    }
  };

  // Fonction pour formater la note en toute sécurité pour l'affichage
  const formatRating = (item) => {
    try {
      const rating = getRating(item);
      // Vérifier que rating est bien un nombre avant d'appeler toFixed
      if (typeof rating === 'number' && !isNaN(rating)) {
        return rating.toFixed(1);
      }
      return "3.5";
    } catch (error) {
      console.error("Erreur lors du formatage de la note:", error);
      return "3.5";
    }
  };

  // Fonction pour obtenir l'URL de l'image
  const getImageUrl = (obj) => {
    try {
      if (!obj) {
        return '/assets/poster-placeholder.jpg';
      }
      
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
  
  // Fonction pour déterminer le type de contenu et construire l'URL de détail
  const getDetailUrl = (obj) => {
    try {
      if (!obj || !obj.id) {
        return '#';
      }
      
      // Si le type est explicitement défini dans l'objet
      if (obj.content_type) {
        return `/${obj.content_type}/${obj.id}`;
      }
      
      // Utiliser la fonction de détermination du type de contenu
      const contentType = determineContentType(obj);
      return `/${contentType}/${obj.id}`;
    } catch (error) {
      console.error("Erreur lors de la détermination de l'URL de détail:", error);
      return '#';
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
  
  // Sécuriser l'accès à props.movies
  const safeMovies = Array.isArray(props.movies) ? props.movies : [];

  return (
    <div className="row_post">
      <h2 className="text-white font-medium md:text-xl pl-12 pt-4">
        {props.title || ""}
      </h2>
      <div className="flex overflow-x-scroll pl-12 py-4 scrollbar-hide">
        {safeMovies.map((obj, index) => {
          // Ignorer les items invalides
          if (!obj || typeof obj !== 'object') {
            return null;
          }
          
          return (
            <div
              key={obj.id || index}
              className="flex-shrink-0 mr-4 relative"
              onMouseEnter={() => setIsHover(true)}
              onMouseLeave={() => setIsHover(false)}
            >
              <Link to={getDetailUrl(obj)}>
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
                <div className="flex items-center">
                  <span className="text-yellow-400 text-xs mr-1">★</span>
                  <span className="text-white text-xs">{formatRating(obj)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default RowPost;
