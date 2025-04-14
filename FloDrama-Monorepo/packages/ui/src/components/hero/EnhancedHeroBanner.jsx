import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Info, Plus, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getBackdropUrl } from '../../config/aws-config';

/**
 * Bannière héroïque améliorée pour FloDrama
 * Affiche un contenu en vedette avec des animations et des informations détaillées
 */
const EnhancedHeroBanner = ({
  item,
  onPlay,
  onAddToWatchlist,
  onInfo,
  isInWatchlist = false
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  
  // Gérer le chargement de l'image
  const handleImageLoad = () => {
    setImageLoaded(true);
  };
  
  // Gérer l'erreur de chargement de l'image
  const handleImageError = () => {
    setImageFailed(true);
    
    // Essayer de charger l'image depuis l'URL de secours
    if (item && item.id) {
      const imgElement = document.getElementById(`hero-backdrop-${item.id}`);
      if (imgElement) {
        imgElement.src = getBackdropUrl(item.id);
      }
    }
  };
  
  // Si pas d'élément, ne rien afficher
  if (!item) return null;
  
  // URL de l'image d'arrière-plan
  const backdropUrl = item.backdropUrl || (item.id ? getBackdropUrl(item.id) : '');
  
  // Limiter la description à 200 caractères
  const truncatedSynopsis = item.synopsis && item.synopsis.length > 200
    ? `${item.synopsis.substring(0, 200)}...`
    : item.synopsis;
  
  return (
    <div
      className="enhanced-hero-banner"
      style={{
        position: 'relative',
        width: '100%',
        height: '80vh',
        maxHeight: '700px',
        minHeight: '500px',
        overflow: 'hidden',
        marginBottom: '30px'
      }}
    >
      {/* Image d'arrière-plan */}
      {!imageFailed ? (
        <motion.img
          id={`hero-backdrop-${item.id}`}
          src={backdropUrl}
          alt={item.title}
          onLoad={handleImageLoad}
          onError={handleImageError}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ 
            opacity: imageLoaded ? 1 : 0,
            scale: 1,
            transition: { duration: 1.2, ease: 'easeOut' }
          }}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: 0
          }}
        />
      ) : (
        <div
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: '#1a1a1a',
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: 0
          }}
        />
      )}
      
      {/* Overlay dégradé */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'linear-gradient(to right, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 30%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0.3) 100%), linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 30%, rgba(0,0,0,0.2) 60%, rgba(0,0,0,0) 100%)',
          zIndex: 1
        }}
      />
      
      {/* Contenu */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ 
          opacity: 1, 
          y: 0,
          transition: { duration: 0.8, delay: 0.3 }
        }}
        style={{
          position: 'absolute',
          bottom: '10%',
          left: '5%',
          width: '50%',
          zIndex: 2,
          color: 'white'
        }}
      >
        {/* Titre */}
        <h1
          style={{
            fontSize: '3rem',
            fontWeight: 'bold',
            marginBottom: '1rem',
            textShadow: '0 2px 4px rgba(0,0,0,0.5)'
          }}
        >
          {item.title}
        </h1>
        
        {/* Sous-titre / Titre original */}
        {item.originalTitle && item.originalTitle !== item.title && (
          <h2
            style={{
              fontSize: '1.5rem',
              fontWeight: 'normal',
              marginBottom: '1rem',
              opacity: 0.8,
              textShadow: '0 1px 2px rgba(0,0,0,0.5)'
            }}
          >
            {item.originalTitle}
          </h2>
        )}
        
        {/* Métadonnées */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '1rem'
          }}
        >
          {/* Année */}
          {item.year && (
            <span style={{ fontSize: '1.1rem' }}>{item.year}</span>
          )}
          
          {/* Séparateur */}
          {item.year && (
            <span style={{ opacity: 0.5 }}>•</span>
          )}
          
          {/* Note */}
          {item.rating && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#FFD700' }}>{item.rating}</span>
              <span style={{ opacity: 0.5 }}>/ 10</span>
            </div>
          )}
          
          {/* Séparateur */}
          {item.rating && (
            <span style={{ opacity: 0.5 }}>•</span>
          )}
          
          {/* Durée */}
          {item.duration && (
            <span style={{ fontSize: '1.1rem' }}>
              {item.type === 'drama' && item.episodes 
                ? `${item.episodes} épisodes`
                : `${item.duration} min`}
            </span>
          )}
        </div>
        
        {/* Genres */}
        {item.genres && item.genres.length > 0 && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.5rem',
              marginBottom: '1.5rem'
            }}
          >
            {item.genres.map((genre, index) => (
              <span
                key={index}
                style={{
                  padding: '0.3rem 0.8rem',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  borderRadius: '4px',
                  fontSize: '0.9rem'
                }}
              >
                {genre}
              </span>
            ))}
          </div>
        )}
        
        {/* Synopsis */}
        {truncatedSynopsis && (
          <p
            style={{
              fontSize: '1.1rem',
              lineHeight: '1.5',
              marginBottom: '2rem',
              textShadow: '0 1px 2px rgba(0,0,0,0.5)'
            }}
          >
            {truncatedSynopsis}
          </p>
        )}
        
        {/* Boutons d'action */}
        <div
          style={{
            display: 'flex',
            gap: '1rem'
          }}
        >
          {/* Bouton Regarder */}
          <Link to={`/watch/${item.id}`} style={{ textDecoration: 'none' }}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.8rem 1.5rem',
                backgroundColor: '#E50914',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '1.1rem',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
              onClick={(e) => {
                if (onPlay) {
                  e.preventDefault();
                  onPlay(item);
                }
              }}
            >
              <Play size={20} />
              Regarder
            </motion.button>
          </Link>
          
          {/* Bouton Plus d'infos */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.8rem 1.5rem',
              backgroundColor: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
            onClick={() => onInfo && onInfo(item)}
          >
            <Info size={20} />
            Plus d'infos
          </motion.button>
          
          {/* Bouton Ajouter/Retirer de la liste */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '48px',
              height: '48px',
              backgroundColor: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              cursor: 'pointer'
            }}
            onClick={() => onAddToWatchlist && onAddToWatchlist(item)}
          >
            {isInWatchlist ? <Check size={24} /> : <Plus size={24} />}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default EnhancedHeroBanner;
