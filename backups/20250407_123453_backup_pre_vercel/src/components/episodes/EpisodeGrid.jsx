import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Calendar, Clock } from 'lucide-react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

/**
 * Composant d'affichage des épisodes en grille
 * Inspiré du design de CinePulse
 */
const EpisodeGrid = ({ episodes, seriesId, currentSeason = 1 }) => {
  const [hoveredEpisode, setHoveredEpisode] = useState(null);

  // Filtrer les épisodes par saison
  const filteredEpisodes = episodes.filter(ep => ep.season === currentSeason);

  // Animation pour les cartes d'épisodes
  const cardVariants = {
    initial: { 
      scale: 1,
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    },
    hover: { 
      scale: 1.03,
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
      transition: { duration: 0.2 }
    }
  };

  // Formater la durée en minutes
  const formatDuration = (minutes) => {
    if (!minutes) return 'Durée inconnue';
    return `${minutes} min`;
  };

  // Formater la date
  const formatDate = (dateString) => {
    if (!dateString) return 'Date inconnue';
    
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }).format(date);
    } catch (error) {
      return dateString;
    }
  };

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-6 text-white">
        Saison {currentSeason}
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredEpisodes.length > 0 ? (
          filteredEpisodes.map((episode) => (
            <Link 
              to={`/series/${seriesId}/play/${episode.id}`} 
              key={episode.id}
              className="text-white no-underline"
            >
              <motion.div
                className="rounded-lg overflow-hidden h-full flex flex-col"
                variants={cardVariants}
                initial="initial"
                whileHover="hover"
                onMouseEnter={() => setHoveredEpisode(episode.id)}
                onMouseLeave={() => setHoveredEpisode(null)}
                style={{ 
                  backgroundColor: 'rgba(var(--color-card-background), 0.6)',
                  border: '1px solid var(--color-card-border)'
                }}
              >
                {/* Image de l'épisode */}
                <div className="relative aspect-video">
                  <img 
                    src={episode.thumbnail || 'https://via.placeholder.com/400x225?text=Episode'} 
                    alt={`Épisode ${episode.number}`}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Overlay au survol */}
                  {hoveredEpisode === episode.id && (
                    <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="bg-accent rounded-full p-3">
                          <Play size={24} fill="white" stroke="white" />
                        </div>
                      </motion.div>
                    </div>
                  )}
                  
                  {/* Numéro d'épisode */}
                  <div className="absolute top-2 left-2 bg-accent px-2 py-1 rounded text-sm font-medium">
                    Épisode {episode.number}
                  </div>
                </div>
                
                {/* Informations sur l'épisode */}
                <div className="p-4 flex flex-col flex-grow">
                  <div className="flex items-center text-xs text-text-tertiary mb-2 space-x-4">
                    <div className="flex items-center">
                      <Calendar size={14} className="mr-1" />
                      <span>{formatDate(episode.airDate)}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock size={14} className="mr-1" />
                      <span>{formatDuration(episode.duration)}</span>
                    </div>
                  </div>
                  
                  <h3 className="font-bold text-lg mb-2 text-white">
                    {episode.title || `Épisode ${episode.number}`}
                  </h3>
                  
                  <p className="text-sm text-text-secondary line-clamp-3 flex-grow">
                    {episode.description || "Aucune description disponible pour cet épisode."}
                  </p>
                </div>
              </motion.div>
            </Link>
          ))
        ) : (
          <div className="col-span-full text-center py-12 text-text-secondary">
            Aucun épisode disponible pour la saison {currentSeason}
          </div>
        )}
      </div>
      
      {/* Note légale en bas de la grille d'épisodes */}
      <div className="mt-8 p-4 rounded-lg text-sm text-text-tertiary bg-background-darker">
        <p className="mb-0">
          <span className="font-medium text-accent">Petite précision :</span> Les informations sur les saisons et épisodes affichées ici proviennent de TMDB. Comme leur classement peut dépendre de versions internationales, d'épisodes spéciaux ou de modifications apportées par la communauté, l'ordre peut donc parfois différer de celui auquel tu es habitué.
        </p>
      </div>
    </div>
  );
};

EpisodeGrid.propTypes = {
  episodes: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      number: PropTypes.number.isRequired,
      title: PropTypes.string,
      description: PropTypes.string,
      thumbnail: PropTypes.string,
      duration: PropTypes.number,
      airDate: PropTypes.string,
      season: PropTypes.number.isRequired
    })
  ).isRequired,
  seriesId: PropTypes.string.isRequired,
  currentSeason: PropTypes.number
};

export default EpisodeGrid;
