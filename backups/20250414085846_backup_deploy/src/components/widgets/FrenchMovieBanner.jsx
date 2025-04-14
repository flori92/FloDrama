import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Plus, Info, Star, Calendar, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * Bannière spéciale pour mettre en valeur les films français
 * Inspiré du style CinePulse
 * @param {Object} movie - Film français à mettre en avant
 */
const FrenchMovieBanner = ({ movie }) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  if (!movie) return null;

  // Animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        duration: 0.8,
        when: "beforeChildren",
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  const imageVariants = {
    initial: { scale: 1.05, opacity: 0 },
    animate: { 
      scale: 1, 
      opacity: 1,
      transition: { duration: 1.5, ease: [0.6, 0.05, 0.01, 0.99] }
    }
  };

  return (
    <motion.div 
      className="relative w-full h-[70vh] overflow-hidden rounded-xl my-8"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      style={{ boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)' }}
    >
      {/* Badge "Cinéma Français" */}
      <div className="absolute top-6 left-6 z-30">
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="flex items-center px-4 py-2 rounded-full"
          style={{ 
            backgroundColor: 'rgba(var(--color-accent-rgb), 0.9)',
            backdropFilter: 'blur(4px)'
          }}
        >
          <img 
            src="/assets/icons/france-flag.svg" 
            alt="Drapeau français" 
            className="w-5 h-5 mr-2"
            onError={(e) => {
              e.target.src = 'https://upload.wikimedia.org/wikipedia/commons/c/c3/Flag_of_France.svg';
            }}
          />
          <span className="font-bold text-white">Cinéma Français</span>
        </motion.div>
      </div>

      {/* Image de fond avec effet parallaxe */}
      <div className="absolute inset-0 w-full h-full">
        <motion.div
          className={`w-full h-full transition-opacity duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          initial="initial"
          animate="animate"
          variants={imageVariants}
        >
          <img 
            src={movie.backdrop || movie.poster}
            alt={movie.title}
            className="w-full h-full object-cover"
            onLoad={() => setImageLoaded(true)}
            onError={(e) => {
              // Fallback image
              e.target.src = 'https://via.placeholder.com/1200x600/121118/ffffff?text=Film+Français';
              setImageLoaded(true);
            }}
          />
        </motion.div>
        
        {/* Overlay avec dégradé amélioré */}
        <div 
          className="absolute inset-0" 
          style={{ 
            background: `
              linear-gradient(0deg, var(--color-background) 0%, rgba(18, 17, 24, 0.8) 20%, rgba(18, 17, 24, 0.4) 60%, rgba(18, 17, 24, 0.2) 100%),
              linear-gradient(90deg, rgba(18, 17, 24, 0.9) 0%, rgba(18, 17, 24, 0.6) 30%, rgba(18, 17, 24, 0.2) 100%)
            `,
            boxShadow: 'inset 0 -100px 120px -50px var(--color-background)'
          }} 
        />
      </div>

      {/* Contenu avec animations améliorées */}
      <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16 z-10">
        <div className="max-w-3xl">
          {/* Source */}
          {movie.source && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-block mb-4 px-3 py-1 rounded-md text-sm font-semibold"
              style={{ 
                backgroundColor: 'rgba(var(--color-accent-rgb), 0.2)',
                color: 'var(--color-accent)'
              }}
            >
              {movie.source === 'cinepulse' ? 'CINEPULSE' : movie.source === 'xalaflix' ? 'XALAFLIX' : movie.source.toUpperCase()}
            </motion.div>
          )}
          
          <motion.div variants={itemVariants}>
            <h1 
              className="text-4xl md:text-6xl font-bold mb-4"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {movie.title}
            </h1>
          </motion.div>

          <motion.div variants={itemVariants}>
            <div 
              className="flex flex-wrap items-center gap-4 text-sm mb-4"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {movie.year && (
                <span className="flex items-center">
                  <Calendar size={16} className="mr-1.5" />
                  {movie.year}
                </span>
              )}
              {movie.duration && (
                <span className="flex items-center">
                  <Clock size={16} className="mr-1.5" />
                  {movie.duration}
                </span>
              )}
              {movie.genres && movie.genres.length > 0 && (
                <span>{movie.genres.slice(0, 3).join(' • ')}</span>
              )}
              {movie.rating && (
                <span className="flex items-center">
                  <Star size={16} className="mr-1.5" style={{ color: 'var(--color-accent)' }} />
                  {movie.rating}
                </span>
              )}
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <p 
              className="text-lg mb-8 line-clamp-3 md:line-clamp-none"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {movie.description || movie.synopsis}
            </p>
          </motion.div>

          {/* Réalisateur et acteurs */}
          {(movie.director || (movie.actors && movie.actors.length > 0)) && (
            <motion.div 
              variants={itemVariants}
              className="mb-8"
            >
              {movie.director && (
                <p className="mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                  <span className="font-semibold" style={{ color: 'var(--color-accent)' }}>Réalisateur: </span>
                  {movie.director}
                </p>
              )}
              
              {movie.actors && movie.actors.length > 0 && (
                <p style={{ color: 'var(--color-text-secondary)' }}>
                  <span className="font-semibold" style={{ color: 'var(--color-accent)' }}>Avec: </span>
                  {movie.actors.slice(0, 3).join(', ')}
                  {movie.actors.length > 3 && '...'}
                </p>
              )}
            </motion.div>
          )}

          <motion.div 
            className="flex flex-wrap gap-4"
            variants={itemVariants}
          >
            <Link to={`/movies/${movie.id}/play`}>
              <motion.button 
                className="btn btn-primary flex items-center gap-2 py-3 px-6 rounded-full"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Play size={20} fill="white" />
                Regarder
              </motion.button>
            </Link>

            <motion.button 
              className="btn btn-secondary flex items-center gap-2 py-3 px-6 rounded-full"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Plus size={20} />
              Ma liste
            </motion.button>

            <Link to={`/movies/${movie.id}`}>
              <motion.button 
                className="btn btn-secondary flex items-center gap-2 py-3 px-6 rounded-full"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Info size={20} />
                Détails
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </div>
      
      {/* Effet de vignette sur les côtés */}
      <div 
        className="absolute inset-0 pointer-events-none" 
        style={{ 
          boxShadow: 'inset 0 0 150px rgba(0, 0, 0, 0.7)'
        }}
      />
    </motion.div>
  );
};

export default FrenchMovieBanner;
