import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Play, Plus, Check, ThumbsUp, ThumbsDown, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAssetUrl } from '../../api/metadata';
import { getPosterUrl } from '../../utils/demo-images';
import { useWatchlist } from '../../hooks/useWatchlist';
import { useRatings } from '../../hooks/useRatings';

/**
 * Carte de contenu inspirée du style Apple TV+ pour FloDrama
 * @param {Object} item - Élément à afficher
 * @param {boolean} showInfo - Afficher les informations supplémentaires
 * @param {number} index - Index pour l'animation
 */
const AppleStyleCard = ({ item, showInfo = true, index = 0 }) => {
  const [showOverlay, setShowOverlay] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { isInWatchlist, toggleWatchlist } = useWatchlist();
  const { isLiked, isDisliked, likeContent, dislikeContent } = useRatings();
  const [isInList, setIsInList] = useState(false);
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const previewTimeoutRef = useRef(null);
  const cardRef = useRef(null);
  
  // Vérifier si l'élément est dans la liste au chargement
  useEffect(() => {
    if (item && item.id) {
      setIsInList(isInWatchlist(item.id));
      setLiked(isLiked(item.id));
      setDisliked(isDisliked(item.id));
    }
  }, [item, isInWatchlist, isLiked, isDisliked]);
  
  // Nettoyer le timeout lors du démontage
  useEffect(() => {
    return () => {
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current);
      }
    };
  }, []);
  
  if (!item) return null;
  
  // Gérer l'ajout/suppression de la liste
  const handleWatchlistToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (item) {
      const added = toggleWatchlist(item);
      setIsInList(added);
    }
  };
  
  // Gérer le like
  const handleLike = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (item) {
      likeContent(item.id);
      setLiked(!liked);
      if (disliked) setDisliked(false);
    }
  };
  
  // Gérer le dislike
  const handleDislike = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (item) {
      dislikeContent(item.id);
      setDisliked(!disliked);
      if (liked) setLiked(false);
    }
  };
  
  // Déterminer le type de contenu pour la route
  const getContentType = () => {
    if (item.type) {
      return item.type.toLowerCase();
    }
    
    if (item.section === 'dramas') return 'drama';
    if (item.section === 'movies') return 'movie';
    if (item.section === 'bollywood') return 'bollywood';
    if (item.section === 'anime') return 'anime';
    
    // Déterminer le type en fonction du titre ou d'autres propriétés
    if (item.title && (
      item.title.includes('Anime') || 
      item.title.includes('アニメ') || 
      (item.genres && item.genres.includes('Anime'))
    )) {
      return 'anime';
    }
    
    if (item.title && (
      item.title.includes('Bollywood') || 
      (item.country && item.country === 'Inde')
    )) {
      return 'bollywood';
    }
    
    return 'drama';
  };

  // Obtenir l'URL de l'image (avec fallback vers l'image générée dynamiquement)
  const getImageUrl = () => {
    if (imageError) {
      return getPosterUrl(item);
    }
    
    try {
      // Si l'élément a une URL d'image directe
      if (item.image && (item.image.startsWith('http://') || item.image.startsWith('https://'))) {
        return item.image;
      }
      
      // Essayer d'abord d'utiliser l'URL de l'asset
      const imagePath = item.poster || item.backdrop || item.image;
      const assetUrl = getAssetUrl(imagePath);
      
      // Vérifier si l'URL est valide
      if (assetUrl && !assetUrl.includes('undefined') && !assetUrl.includes('null')) {
        return assetUrl;
      }
    } catch (error) {
      console.warn('Erreur lors du chargement de l\'image depuis les assets:', error);
    }
    
    // Fallback vers l'image générée dynamiquement
    return getPosterUrl(item);
  };

  // Gérer l'entrée de la souris
  const handleMouseEnter = () => {
    setShowOverlay(true);
    
    // Afficher la prévisualisation après un court délai
    previewTimeoutRef.current = setTimeout(() => {
      setShowPreview(true);
    }, 500);
  };
  
  // Gérer la sortie de la souris
  const handleMouseLeave = () => {
    setShowOverlay(false);
    setShowPreview(false);
    
    // Nettoyer le timeout
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current);
      previewTimeoutRef.current = null;
    }
  };

  // Animations pour la carte
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, delay: index * 0.05 }
    },
    hover: { 
      scale: 1.05,
      boxShadow: "0px 10px 30px -5px rgba(0, 0, 0, 0.3)",
      transition: { duration: 0.3 }
    }
  };
  
  // Animation pour la prévisualisation
  const previewVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.3 }
    }
  };

  return (
    <motion.div
      ref={cardRef}
      className="relative"
      initial="hidden"
      animate="visible"
      whileHover="hover"
      variants={cardVariants}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Link to={`/${getContentType()}/${item.id}`}>
        <div className="relative overflow-hidden rounded-xl">
          {/* Image principale */}
          <img 
            src={getImageUrl()} 
            alt={item.title || "Contenu FloDrama"}
            className="w-full aspect-video object-cover rounded-xl transition-all duration-500"
            loading="lazy"
            onError={(e) => {
              // En cas d'erreur, utiliser l'image générée dynamiquement
              setImageError(true);
              e.target.src = getPosterUrl(item);
            }}
          />
          
          {/* Overlay au survol */}
          <AnimatePresence>
            {showOverlay && (
              <motion.div 
                className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col justify-end p-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {/* Titre et boutons */}
                <div className="flex justify-between items-end">
                  <div className="flex-1">
                    <h3 className="text-sm font-bold truncate">{item.title}</h3>
                    {item.year && (
                      <p className="text-xs text-gray-300">{item.year}</p>
                    )}
                  </div>
                  <div className="flex space-x-1">
                    <button 
                      className={`p-1.5 rounded-full ${isInList ? 'bg-fuchsia-600 text-white' : 'bg-white/20 text-white hover:bg-white/30'}`}
                      onClick={handleWatchlistToggle}
                      aria-label={isInList ? "Retirer de ma liste" : "Ajouter à ma liste"}
                    >
                      {isInList ? <Check size={14} /> : <Plus size={14} />}
                    </button>
                    <button 
                      className="p-1.5 rounded-full bg-fuchsia-600 text-white"
                      aria-label="Lire"
                    >
                      <Play size={14} fill="white" />
                    </button>
                  </div>
                </div>
                
                {/* Prévisualisation */}
                <AnimatePresence>
                  {showPreview && (
                    <motion.div 
                      className="mt-2"
                      variants={previewVariants}
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                    >
                      {/* Informations supplémentaires */}
                      <div className="flex items-center text-xs space-x-2 mb-1">
                        {item.rating && (
                          <div className="flex items-center">
                            <Star size={12} className="text-yellow-400 mr-0.5" />
                            <span>{item.rating}</span>
                          </div>
                        )}
                        {item.duration && (
                          <span>{item.duration}</span>
                        )}
                        {item.releaseYear && (
                          <span>{item.releaseYear}</span>
                        )}
                      </div>
                      
                      {/* Genres */}
                      {item.genres && item.genres.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {item.genres.slice(0, 2).map((genre, idx) => (
                            <span 
                              key={idx} 
                              className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded"
                            >
                              {genre}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      {/* Actions */}
                      <div className="flex justify-between mt-2">
                        <div className="flex space-x-2">
                          <button 
                            className={`p-1 ${liked ? 'text-green-400' : 'text-gray-400 hover:text-white'}`}
                            onClick={handleLike}
                            aria-label="J'aime"
                          >
                            <ThumbsUp size={14} />
                          </button>
                          <button 
                            className={`p-1 ${disliked ? 'text-red-400' : 'text-gray-400 hover:text-white'}`}
                            onClick={handleDislike}
                            aria-label="Je n'aime pas"
                          >
                            <ThumbsDown size={14} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Link>
    </motion.div>
  );
};

export default AppleStyleCard;
