import React, { useState, useRef, useEffect } from 'react';
import { Play, Plus, ThumbsUp, ThumbsDown, Info } from 'lucide-react';
import { motion } from 'framer-motion';

interface ContentCardProps {
  id: string | number;
  title: string;
  image: string;
  year?: string | number;
  match?: number;
  rating?: string;
  duration?: string;
  description?: string;
  videoPreview?: string;
  isInList?: boolean;
  onAddToList?: (id: string | number) => void;
}

const ContentCard: React.FC<ContentCardProps> = ({
  id,
  title,
  image,
  year,
  match,
  rating,
  duration,
  description,
  videoPreview,
  isInList: initialIsInList = false,
  onAddToList,
}) => {
  const [isHovering, setIsHovering] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [isInList, setIsInList] = useState(initialIsInList);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Gestion de la prévisualisation vidéo
  useEffect(() => {
    if (isHovering && videoPreview && videoRef.current && !isVideoPlaying) {
      // Délai avant démarrage de la vidéo (pour éviter les déclenchements accidentels)
      videoTimeoutRef.current = setTimeout(() => {
        setIsVideoLoading(true);
        const playPromise = videoRef.current?.play();
        
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setIsVideoPlaying(true);
              setIsVideoLoading(false);
            })
            .catch(error => {
              console.error('Erreur de lecture vidéo', error);
              setIsVideoLoading(false);
            });
        }
      }, 800);
    } else if (!isHovering && videoRef.current) {
      if (videoTimeoutRef.current) {
        clearTimeout(videoTimeoutRef.current);
        videoTimeoutRef.current = null;
      }
      
      if (isVideoPlaying) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
        setIsVideoPlaying(false);
      }
    }
    
    return () => {
      if (videoTimeoutRef.current) {
        clearTimeout(videoTimeoutRef.current);
      }
    };
  }, [isHovering, videoPreview, isVideoPlaying]);
  
  const handleAddToList = () => {
    setIsInList(!isInList);
    onAddToList?.(id);
  };
  
  return (
    <motion.div
      className="relative w-[200px] shrink-0"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.5 }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      whileHover={{
        scale: 1.05,
        y: -5,
        zIndex: 10,
        transition: { type: "spring", stiffness: 400, damping: 20 }
      }}
    >
      {/* Affiche */}
      <div className="relative overflow-hidden rounded-md aspect-[2/3] bg-black/20 shadow-lg">
        {/* Prévisualisation vidéo */}
        {videoPreview && (
          <video
            ref={videoRef}
            src={videoPreview}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
              isVideoPlaying ? 'opacity-100' : 'opacity-0'
            }`}
            muted
            loop
            playsInline
          />
        )}
        
        {/* Image statique */}
        <img
          src={image}
          alt={title}
          className={`w-full h-full object-cover transition-opacity duration-500 ${
            isVideoPlaying ? 'opacity-0' : 'opacity-100'
          }`}
        />
        
        {/* Indicateur de chargement vidéo */}
        {isVideoLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <div className="w-6 h-6 border-2 border-t-transparent border-white rounded-full animate-spin" />
          </div>
        )}
        
        {/* Superposition au survol avec détails et boutons */}
        <AnimatedOverlay 
          isVisible={isHovering} 
          title={title}
          year={year}
          match={match}
          rating={rating}
          duration={duration}
          description={description}
          isInList={isInList}
          isLiked={isLiked}
          isDisliked={isDisliked}
          onPlay={() => console.log(`Lecture de ${title}`)}
          onAddToList={handleAddToList}
          onLike={() => setIsLiked(!isLiked)}
          onDislike={() => setIsDisliked(!isDisliked)}
          onMoreInfo={() => console.log(`Plus d'infos sur ${title}`)}
        />
      </div>
      
      {/* Titre (visible uniquement lorsque non survolé) */}
      <motion.div
        className="px-1 py-2 font-['SF_Pro_Display',-apple-system,BlinkMacSystemFont,'Segoe_UI',Roboto,'Helvetica_Neue',Arial,sans-serif]"
        animate={{ opacity: isHovering ? 0 : 1 }}
        transition={{ duration: 0.2 }}
      >
        <h3 className="text-white font-medium text-sm truncate">{title}</h3>
      </motion.div>
    </motion.div>
  );
};

// Sous-composant pour l'overlay au survol
const AnimatedOverlay: React.FC<{
  isVisible: boolean;
  title: string;
  year?: string | number;
  match?: number;
  rating?: string;
  duration?: string;
  description?: string;
  isInList: boolean;
  isLiked: boolean;
  isDisliked: boolean;
  onPlay: () => void;
  onAddToList: () => void;
  onLike: () => void;
  onDislike: () => void;
  onMoreInfo: () => void;
}> = ({
  isVisible,
  title,
  year,
  match,
  rating,
  duration,
  description,
  isInList,
  isLiked,
  isDisliked,
  onPlay,
  onAddToList,
  onLike,
  onDislike,
  onMoreInfo,
}) => {
  return (
    <motion.div
      className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent p-3 flex flex-col justify-end font-['SF_Pro_Display',-apple-system,BlinkMacSystemFont,'Segoe_UI',Roboto,'Helvetica_Neue',Arial,sans-serif]"
      initial={{ opacity: 0 }}
      animate={{ opacity: isVisible ? 1 : 0 }}
      transition={{ duration: 0.2 }}
      style={{ pointerEvents: isVisible ? 'auto' : 'none' }}
    >
      {/* Métadonnées */}
      <div className="mb-2 flex items-center space-x-2 text-xs">
        {match && (
          <span className="text-green-500 font-medium">{match}% pertinent</span>
        )}
        {year && <span className="text-white/80">{year}</span>}
        {rating && (
          <span className="px-1 border border-white/30 text-white/80 text-xs">
            {rating}
          </span>
        )}
        {duration && <span className="text-white/80">{duration}</span>}
      </div>
      
      {/* Titre */}
      <h3 className="text-white font-medium text-sm mb-1">{title}</h3>
      
      {/* Description */}
      {description && (
        <p className="text-white/70 text-xs mb-3 line-clamp-2">{description}</p>
      )}
      
      {/* Boutons d'action */}
      <div className="flex items-center space-x-1">
        {/* Lecture */}
        <motion.button
          className="p-2 rounded-full bg-white text-black hover:bg-white/90"
          onClick={onPlay}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <Play className="w-4 h-4" />
        </motion.button>
        
        {/* Ajouter à ma liste */}
        <motion.button
          className={`p-2 rounded-full ${
            isInList
              ? 'bg-gradient-to-r from-blue-500 to-fuchsia-500 text-white'
              : 'border border-white/30 text-white hover:bg-white/10'
          }`}
          onClick={onAddToList}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <Plus className="w-4 h-4" />
        </motion.button>
        
        {/* J'aime */}
        <motion.button
          className={`p-2 rounded-full ${
            isLiked
              ? 'bg-gradient-to-r from-blue-500 to-fuchsia-500 text-white'
              : 'border border-white/30 text-white hover:bg-white/10'
          }`}
          onClick={onLike}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <ThumbsUp className="w-4 h-4" />
        </motion.button>
        
        {/* Je n'aime pas */}
        <motion.button
          className={`p-2 rounded-full ${
            isDisliked
              ? 'bg-gradient-to-r from-blue-500 to-fuchsia-500 text-white'
              : 'border border-white/30 text-white hover:bg-white/10'
          }`}
          onClick={onDislike}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <ThumbsDown className="w-4 h-4" />
        </motion.button>
        
        {/* Plus d'info */}
        <motion.button
          className="p-2 rounded-full border border-white/30 text-white hover:bg-white/10"
          onClick={onMoreInfo}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <Info className="w-4 h-4" />
        </motion.button>
      </div>
    </motion.div>
  );
};

export default ContentCard;
