import React, { useState, useEffect, useContext } from "react";
import { API_KEY, imageUrl } from "../../Constants/Constance";
import axios from "../../axios";
import { PopUpContext } from "../../Context/moviePopUpContext";
import { Fade } from "react-reveal";
import StarRatings from "react-star-ratings";
import MoviePopUp from "../PopUp/MoviePopUp";
import usePlayMovie from "../../CustomHooks/usePlayMovie";

function Banner(props) {
  const { showModal, setShowModal } = useContext(PopUpContext);
  const { playMovie } = usePlayMovie();

  const [movie, setMovie] = useState([]);
  const [moviePopupInfo, setMoviePopupInfo] = useState({});
  const [urlId, setUrlId] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showImage, setShowImage] = useState(true);
  const [heroMovies, setHeroMovies] = useState([]);
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const videoRef = React.useRef(null);

  const getWindowSize = () => {
    const { innerWidth: width } = window;
    return {
      width,
    };
  };

  const [windowSeize, setWindowSeize] = useState(getWindowSize());

  // Fonction pour charger les films du hero banner
  const loadHeroMovies = async () => {
    try {
      // Vérifier si nous devons utiliser l'API Cloudflare (par défaut: oui)
      const useCloudflareApi = props.useCloudflareApi !== false;

      if (useCloudflareApi) {
        // Utiliser l'API Cloudflare avec fetch
        const response = await fetch(props.url);
        const data = await response.json();

        // Extraire les données selon le format de l'API Cloudflare
        const results = data.data || data.results || data;

        // Filtrer pour ne garder que les films avec trailer_url
        const moviesWithTrailers = results.filter((movie) => movie.trailer_url);

        if (moviesWithTrailers.length > 0) {
          // Prendre les 5 premiers films avec trailers pour la rotation
          setHeroMovies(moviesWithTrailers.slice(0, 5));
          // Définir le premier film comme film actuel
          setMovie(moviesWithTrailers[0]);
          console.log("Films pour le hero banner:", moviesWithTrailers.slice(0, 5));
        } else {
          // Fallback si aucun film n'a de trailer
          setMovie(results[0]);
          console.log("Aucun film avec trailer disponible");
        }
      } else {
        // Ancienne méthode avec axios pour la compatibilité
        const response = await axios.get(props.url);
        setMovie(response.data.results[0]);
        setHeroMovies(response.data.results.slice(0, 5));
      }
    } catch (error) {
      console.error("Erreur lors du chargement du hero banner:", error);
    }
  };

  // Fonction pour passer au film suivant dans le hero banner
  const rotateHeroMovie = () => {
    if (heroMovies.length > 1) {
      // Réinitialiser l'état de lecture
      setIsPlaying(false);
      setShowImage(true);

      // Passer au film suivant
      const nextIndex = (currentHeroIndex + 1) % heroMovies.length;
      setCurrentHeroIndex(nextIndex);
      setMovie(heroMovies[nextIndex]);

      // Démarrer la prévisualisation après un délai
      setTimeout(() => {
        if (heroMovies[nextIndex].trailer_url) {
          startPreview(heroMovies[nextIndex]);
        }
      }, 5000);
    }
  };

  // Fonction pour démarrer la prévisualisation
  const startPreview = (movieData) => {
    if (movieData.trailer_url) {
      const videoId = extractYoutubeId(movieData.trailer_url);
      if (videoId) {
        setUrlId({ key: videoId });
        setIsPlaying(true);

        // Transition fluide de l'image à la vidéo
        setTimeout(() => {
          setShowImage(false);
        }, 1000);
      }
    }
  };

  useEffect(() => {
    // Charger les films du hero banner
    loadHeroMovies();

    // Configurer la rotation automatique des films
    const rotationInterval = setInterval(() => {
      rotateHeroMovie();
    }, 30000); // Rotation toutes les 30 secondes

    // Nettoyer l'intervalle lors du démontage du composant
    return () => {
      clearInterval(rotationInterval);
    };
  }, []);

  useEffect(() => {
    // Démarrer la prévisualisation après un délai lorsque le film change
    if (movie && movie.trailer_url) {
      const previewTimer = setTimeout(() => {
        startPreview(movie);
      }, 5000); // Démarrer la prévisualisation après 5 secondes

      return () => {
        clearTimeout(previewTimer);
      };
    }
  }, [movie]);

  const handleWindowResize = () => {
    setWindowSeize(getWindowSize());
  };

  useEffect(() => {
    window.addEventListener("resize", handleWindowResize);

    return () => {
      window.removeEventListener("resize", handleWindowResize);
    };
  }, []);

  // Fonction utilitaire pour extraire l'ID YouTube d'une URL
  const extractYoutubeId = (url) => {
    if (!url) return null;

    // Regex pour extraire l'ID YouTube de différents formats d'URL
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);

    if (match && match[2].length === 11) {
      return match[2];
    } else {
      return null;
    }
  };

  const handleMoviePopup = (movieInfo) => {
    setMoviePopupInfo(movieInfo);
    setShowModal(true);

    // Récupérer l'ID de la vidéo YouTube pour la bande-annonce
    if (movieInfo.trailer_url) {
      const videoId = extractYoutubeId(movieInfo.trailer_url);
      if (videoId) {
        setUrlId({ key: videoId });
      }
    } else {
      // Si pas de trailer_url, essayer de récupérer la bande-annonce via l'API FloDrama
      fetch(
        `${baseUrl}/api/videos/${movieInfo.media_type}/${movieInfo.id}`
      )
        .then((response) => response.json())
        .then((data) => {
          if (data.results && data.results.length > 0) {
            setUrlId(data.results[0]);
          }
        })
        .catch((error) => {
          console.error("Erreur lors de la récupération de la bande-annonce:", error);
        });
    }
  }

  return (
    <>
      <div className="relative bg-black h-[70vh] sm:h-[90vh] md:h-[95vh] lg:h-[98vh] text-white flex flex-col justify-between overflow-hidden">
        {/* Couche 1: Image de fond (toujours visible) */}
        {showImage && (
          <div 
            className="absolute inset-0 bg-center bg-cover transition-opacity duration-1000"
            style={{
              backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.5)), url(${movie.backdrop_path ? imageUrl + movie.backdrop_path : ''})`
            }}
          />
        )}
        
        {/* Couche 2: Vidéo de prévisualisation (apparaît après un délai) */}
        {isPlaying && urlId && (
          <div className={`absolute inset-0 transition-opacity duration-1000 ${showImage ? 'opacity-0' : 'opacity-100'}`}>
            <div className="relative w-full h-full">
              <iframe
                className="absolute inset-0 w-full h-full"
                src={`//www.youtube.com/embed/${urlId.key}?autoplay=1&controls=0&showinfo=0&rel=0&loop=1&playlist=${urlId.key}&modestbranding=1${isMuted ? '&mute=1' : ''}`}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
              
              {/* Dégradé en bas de la vidéo pour une meilleure lisibilité du texte */}
              <div className="absolute bottom-0 left-0 right-0 h-2/3 bg-gradient-to-t from-black to-transparent pointer-events-none"></div>
              
              {/* Dégradé sur les côtés pour un effet cinématique */}
              <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-black opacity-20 pointer-events-none"></div>
            </div>
          </div>
        )}
        
        {/* Contrôles de la vidéo (apparaissent uniquement pendant la lecture) */}
        {isPlaying && (
          <div className="absolute top-4 right-4 flex space-x-2 z-10">
            <button 
              onClick={() => setIsMuted(!isMuted)}
              className="bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full p-2 transition-all duration-300"
            >
              {isMuted ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              )}
            </button>
          </div>
        )}
        
        {/* Indicateurs de navigation (style Netflix/Disney+) */}
        {heroMovies.length > 1 && (
          <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
            {heroMovies.map((_, index) => (
              <div 
                key={index}
                className={`h-1 rounded-full transition-all duration-300 ${index === currentHeroIndex ? 'w-8 bg-white' : 'w-2 bg-gray-500'}`}
                onClick={() => {
                  setCurrentHeroIndex(index);
                  setMovie(heroMovies[index]);
                  setIsPlaying(false);
                  setShowImage(true);
                  setTimeout(() => {
                    if (heroMovies[index].trailer_url) {
                      startPreview(heroMovies[index]);
                    }
                  }, 3000);
                }}
              />
            ))}
          </div>
        )}
        
        {/* Contenu informatif (titre, description, boutons) */}
        <div className="relative z-10 pt-20 sm:pt-32 md:pt-36 lg:pt-52 px-4 lg:px-10 xl:px-12 h-full flex flex-col justify-end pb-32">
          <Fade bottom>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-shadow-lg">
              {movie.title || movie.name || movie.original_name}
            </h1>
          </Fade>

          <Fade bottom>
            <div className="flex items-center mt-3">
              <StarRatings
                rating={movie.rating || movie.vote_average / 2 || 3.5}
                starRatedColor="#FCD34D"
                numberOfStars={5}
                name="rating"
                starDimension={windowSeize.width < 640 ? "15px" : "20px"}
                starSpacing="0px"
              />
              <h1 className="ml-2 text-xs sm:text-sm text-gray-300">
                {(movie.rating || movie.vote_average / 2 || 3.5).toFixed(1)}/5
              </h1>
              {movie.year && (
                <span className="ml-4 text-sm sm:text-base text-gray-300 border border-gray-600 px-2 py-0.5 rounded">
                  {movie.year}
                </span>
              )}
              {movie.original_language && (
                <span className="ml-2 text-xs sm:text-sm text-gray-400 uppercase">
                  {movie.original_language}
                </span>
              )}
            </div>
          </Fade>

          <Fade bottom>
            <div className="mt-6 w-full sm:w-9/12 md:w-8/12 lg:w-6/12 xl:w-5/12 text-sm sm:text-base lg:text-lg text-gray-300 text-shadow">
              {movie.overview}
            </div>
          </Fade>

          <Fade bottom>
            <div className="mt-8 flex">
              {movie.id ? (
                <>
                  <button
                    onClick={() => {
                      // Utiliser l'URL de streaming si disponible, sinon utiliser le comportement par défaut
                      if (movie.streaming_url) {
                        // Créer un objet avec l'URL de streaming pour le lecteur
                        const movieWithStreamingUrl = {
                          ...movie,
                          streaming_url_for_player: true // Indicateur pour le lecteur
                        };
                        playMovie(movieWithStreamingUrl);
                      } else {
                        playMovie(movie);
                      }
                    }}
                    className="bg-white flex items-center shadow-2xl mb-3 mr-3 text-base sm:text-xl font-semibold text-black hover:bg-opacity-80 transition duration-300 py-2 sm:py-2 px-10 sm:px-14 rounded-md"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-6 h-6 mr-2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z"
                      />
                    </svg>
                    Regarder
                  </button>
                  <button
                    onClick={() => handleMoviePopup(movie)}
                    className="bg-[#33333380] flex items-center shadow-2xl mb-3 text-base sm:text-xl font-semibold text-white hover:bg-white hover:text-black transition duration-300 py-2 px-8 rounded-md"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 items-center mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Plus d'infos
                  </button>
                </>
              ) : (
                <>
                  <button className="animate-pulse bg-neutral-900 transition duration-500 ease-in-out shadow-2xl flex items-center mb-3 mr-3 text-base sm:text-xl font-semibold text-neutral-500 py-2 sm:py-2 px-10 sm:px-14 rounded-md">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-5 items-center mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Regarder
                  </button>
                  <button className="animate-pulse bg-neutral-900 flex items-center shadow-2xl mb-3 text-base sm:text-xl font-semibold text-neutral-500 transition duration-500 ease-in-out py-2 px-8 rounded-md">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 items-center mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Plus d'infos
                  </button>
                </>
              )}
            </div>
          </Fade>
        </div>
      </div>

      {showModal ? <MoviePopUp data1={moviePopupInfo} data2={urlId} /> : null}
    </>
  );
}

export default Banner;
