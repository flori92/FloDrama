import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import SeasonSelector from './SeasonSelector';
import EpisodeGrid from './EpisodeGrid';

/**
 * Composant de section d'épisodes complet
 * Combine le sélecteur de saison et la grille d'épisodes
 * Inspiré du design de CinePulse
 */
const EpisodeSection = ({ episodes, seriesId }) => {
  const [currentSeason, setCurrentSeason] = useState(1);
  const [totalSeasons, setTotalSeasons] = useState(1);

  // Déterminer le nombre total de saisons à partir des épisodes
  useEffect(() => {
    if (episodes && episodes.length > 0) {
      const maxSeason = Math.max(...episodes.map(ep => ep.season || 1));
      setTotalSeasons(maxSeason);
    }
  }, [episodes]);

  // Gérer le changement de saison
  const handleSeasonChange = (season) => {
    setCurrentSeason(season);
    // Faire défiler vers le haut de la section d'épisodes
    window.scrollTo({
      top: document.getElementById('episode-section').offsetTop - 100,
      behavior: 'smooth'
    });
  };

  if (!episodes || episodes.length === 0) {
    return (
      <div 
        id="episode-section"
        className="mt-12 p-6 rounded-lg text-center"
        style={{ backgroundColor: 'rgba(var(--color-background-darker-rgb), 0.6)' }}
      >
        <h2 className="text-2xl font-bold mb-4 text-white">Épisodes</h2>
        <p className="text-text-secondary">
          Aucun épisode disponible pour cette série pour le moment.
        </p>
      </div>
    );
  }

  return (
    <div 
      id="episode-section"
      className="mt-12 p-6 rounded-lg"
      style={{ backgroundColor: 'rgba(var(--color-background-darker-rgb), 0.6)' }}
    >
      <h2 className="text-2xl font-bold mb-6 text-white">Épisodes</h2>
      
      {totalSeasons > 1 && (
        <SeasonSelector 
          seasons={totalSeasons}
          currentSeason={currentSeason}
          onSeasonChange={handleSeasonChange}
        />
      )}
      
      <EpisodeGrid 
        episodes={episodes}
        seriesId={seriesId}
        currentSeason={currentSeason}
      />
    </div>
  );
};

EpisodeSection.propTypes = {
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
  seriesId: PropTypes.string.isRequired
};

export default EpisodeSection;
