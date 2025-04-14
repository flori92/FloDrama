import React from 'react';

interface WatchPartyProps {
  videoId: string;
  episodeId: string;
  currentTime?: number;
  isPlaying?: boolean;
  onClose?: () => void;
}

const WatchParty: React.FC<WatchPartyProps> = ({
  videoId,
  episodeId,
  currentTime = 0,
  isPlaying = false,
  onClose
}) => {
  return (
    <div className="watch-party">
      <div className="watch-party__header">
        <h3>Watch Party</h3>
        <button onClick={onClose}>Fermer</button>
      </div>
      <div className="watch-party__content">
        <p>Regardez ensemble avec vos amis!</p>
        <p>ID de la vidéo: {videoId}</p>
        <p>ID de l'épisode: {episodeId}</p>
        <p>Temps actuel: {currentTime}s</p>
        <p>Statut: {isPlaying ? 'En lecture' : 'En pause'}</p>
      </div>
    </div>
  );
};

export default WatchParty;
