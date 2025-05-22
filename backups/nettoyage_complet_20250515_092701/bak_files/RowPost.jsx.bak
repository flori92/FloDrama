import React, { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../../Context/UserContext";
import { imageUrl, imageUrl2 } from "../../Constants/Constance";
import { determineContentType, getFallbackData } from "../../Cloudflare/CloudflareConfig";
import { getFullUrl, handleApiResponse } from "../../Constants/FloDramaURLs";

function RowPost(props) {
  const [isHover, setIsHover] = useState(false);
  const { User } = useContext(AuthContext);
  const [windowSize, setWindowSize] = useState(window.innerWidth);
  const [loadedMovies, setLoadedMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

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

  // Fonction pour extraire le type de contenu et l'ID de l'URL
  const extractContentTypeFromUrl = (url) => {
    if (!url) {
      return null;
    }
    
    // Extraire le type de contenu de l'URL
    const segments = url.split('/');
    const apiIndex = segments.findIndex(s => s === 'api');
    
    if (apiIndex >= 0 && apiIndex + 1 < segments.length) {
      return segments[apiIndex + 1]; // anime, drama, film, bollywood
    }
    
    return null;
  };
  
  // Effet pour charger les données depuis l'URL si fournie
  useEffect(() => {
    // Si une URL est fournie et qu'il n'y a pas de données directes
    if (props.url && (!props.movies || props.movies.length === 0)) {
      setIsLoading(true);
      setError(null);
      
      // Utiliser l'URL complète si useCloudflareApi est activé
      const fetchUrl = props.useCloudflareApi ? getFullUrl(props.url) : props.url;
      const contentType = extractContentTypeFromUrl(props.url);
      
      console.log(`RowPost - Tentative de récupération des données pour '${props.title}' depuis: ${fetchUrl}`);
      console.log(`RowPost - Type de contenu détecté: ${contentType || 'inconnu'}`);
      
      // Essayer d'abord l'API principale avec des options spécifiques
      fetch(fetchUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        cache: 'no-store' // Éviter les problèmes de cache
      })
        .then(response => {
          console.log(`RowPost - Réponse de l'API pour '${props.title}':`, {
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries([...response.headers.entries()])
          });
          
          if (!response.ok) {
            throw new Error(`Erreur ${response.status}: ${response.statusText}`);
          }
          return response.json();
        })
        .then(data => {
          // Vérifier si les données sont dans un format attendu
          const movies = data.data || data.results || data;
          if (Array.isArray(movies)) {
            setLoadedMovies(movies);
          } else {
            console.error("Format de données inattendu:", data);
            setLoadedMovies([]);
          }
          setIsLoading(false);
        })
        .catch(err => {
          console.error(`Erreur lors du chargement des données pour ${props.title}:`, err);
          
          // Si l'API principale échoue, essayer les données de fallback
          if (contentType) {
            console.log(`RowPost - Erreur API principale pour '${props.title}':`, err);
            console.log(`RowPost - Tentative de récupération des données de fallback pour ${contentType}`);
            
            // Désactiver temporairement le mécanisme de fallback pour éviter les erreurs
            console.warn(`RowPost - Mécanisme de fallback désactivé temporairement pour '${props.title}'`);
            setError(`Impossible de charger les données pour ${props.title}. L'API est actuellement indisponible.`);
            setIsLoading(false);
            
            /* Désactivé temporairement pour éviter les erreurs
            getFallbackData(`/${contentType}`)
              .then(fallbackData => {
                console.log(`RowPost - Réponse de fallback pour '${props.title}':`, fallbackData);
                const fallbackMovies = fallbackData.data || fallbackData.results || fallbackData || [];
                if (Array.isArray(fallbackMovies) && fallbackMovies.length > 0) {
                  console.log(`RowPost - Données de fallback récupérées avec succès pour ${contentType}`);
                  setLoadedMovies(fallbackMovies);
                  setError(null);
                } else {
                  console.warn(`RowPost - Données de fallback invalides pour '${props.title}'`);
                  setError("Aucune donnée disponible pour le moment.");
                }
              })
              .catch(fallbackErr => {
                console.error(`RowPost - Erreur lors de la récupération des données de fallback pour '${props.title}':`, fallbackErr);
                setError("Impossible de charger le contenu. Veuillez réessayer plus tard.");
              })
              .finally(() => {
                setIsLoading(false);
              });
            */
          } else {
            console.error(`RowPost - Type de contenu non détecté pour '${props.title}', impossible d'utiliser le fallback`);
            setError(err.message);
            setIsLoading(false);
          }
        });
    }
  }, [props.url, props.movies, props.useCloudflareApi]);

  useEffect(() => {
    const handleResize = () => {
      setWindowSize(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);
  
  // Utiliser les films chargés depuis l'URL ou les films fournis directement
  const safeMovies = Array.isArray(props.movies) ? props.movies : 
                     Array.isArray(loadedMovies) ? loadedMovies : [];

  return (
    <div className="row_post">
      <h2 className="text-white font-medium md:text-xl pl-12 pt-4">
        {props.title || ""}
      </h2>
      
      {isLoading && (
        <div className="flex justify-center items-center h-60 w-full">
          <p className="text-white">Chargement...</p>
        </div>
      )}
      
      {error && (
        <div className="flex justify-center items-center h-60 w-full">
          <p className="text-red-500">Erreur: {error}</p>
        </div>
      )}
      
      {!isLoading && !error && safeMovies.length === 0 && (
        <div className="flex justify-center items-center h-60 w-full">
          <p className="text-white">Aucun contenu disponible</p>
        </div>
      )}
      
      {!isLoading && !error && safeMovies.length > 0 && (
        <div className="flex overflow-x-scroll pl-12 py-4 scrollbar-hide">
          {safeMovies
            .filter(item => {
              // Vérification complète pour s'assurer que l'item est valide
              return item && typeof item === 'object' && (item.id || item._id);
            })
            .map((obj, index) => {
              // Vérification supplémentaire pour s'assurer que l'objet a un titre ou un nom
              const title = obj.title || obj.name || 'Film sans titre';
              const detailUrl = getDetailUrl(obj);
              const imageSource = getImageUrl(obj);
              const rating = formatRating(obj);
              
              return (
                <div
                  key={obj.id || obj._id || index}
                  className="flex-shrink-0 mr-4 relative"
                  onMouseEnter={() => setIsHover(true)}
                  onMouseLeave={() => setIsHover(false)}
                >
                  <Link to={detailUrl}>
                    <img
                      className="w-40 h-60 object-cover rounded-md cursor-pointer transition-transform duration-300 hover:scale-105"
                      src={imageSource}
                      alt={title}
                      onError={(e) => {
                        console.log("Erreur de chargement d'image pour:", title);
                        e.target.src = '/assets/poster-placeholder.jpg';
                      }}
                    />
                  </Link>
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black to-transparent">
                    <h3 className="text-white text-sm font-medium truncate">
                      {title}
                    </h3>
                    <div className="flex items-center">
                      <span className="text-yellow-400 text-xs mr-1">★</span>
                      <span className="text-white text-xs">{rating}</span>
                    </div>
                  </div>
                </div>
              );
            })
          }
        </div>
      )}
    </div>
  );
}

export default RowPost;
