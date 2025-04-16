import React, { useEffect, useRef, useState } from 'react';
import { useHybridComponent } from '@/hooks/useHybridComponent';
import { HybridComponent } from '@/adapters/hybrid-component';

interface LecteurVideoProps {
  url?: string;
  titre?: string;
  sousTitres?: Array<{
    langue: string;
    url: string;
  }>;
  autoplay?: boolean;
  onFinLecture?: () => void;
  onErreur?: (error: Error) => void;
}

/**
 * Composant de lecteur vidéo hybride
 * Utilise Lynx par défaut avec fallback vers ReactPlayer
 */
const LecteurVideo: React.FC<LecteurVideoProps> = ({
  url = '',
  titre = '',
  sousTitres = [],
  autoplay = false,
  onFinLecture,
  onErreur
}) => {
  const [sousTitreActif, setSousTitreActif] = useState<string | null>(null);
  const playerRef = useRef<any>(null);

  // Utilisation du hook hybride pour le lecteur
  const { isUsingLynx, adaptedProps, error, isLoading } = useHybridComponent('LecteurVideo', {
    source: { uri: url },
    title: titre,
    subtitles: sousTitres,
    autoPlay: autoplay,
    onEnd: onFinLecture,
    onError: onErreur,
    ref: playerRef
  });

  useEffect(() => {
    if (error && onErreur) {
      onErreur(error);
    }
  }, [error, onErreur]);

  // Gestion des sous-titres
  const handleChangementSousTitre = (langue: string) => {
    setSousTitreActif(langue);
    if (playerRef.current) {
      // Adapter selon si on utilise Lynx ou React
      if (isUsingLynx) {
        playerRef.current.setSubtitleTrack(langue);
      } else {
        // Logique spécifique pour ReactPlayer
        const sousTitre = sousTitres.find(st => st.langue === langue);
        if (sousTitre) {
          playerRef.current.loadSubtitles(sousTitre.url);
        }
      }
    }
  };

  if (isLoading) {
    return <div>Chargement du lecteur...</div>;
  }

  return (
    <div className="lecteur-video-container">
      <HybridComponent
        componentName="LecteurVideo"
        isLynx={isUsingLynx}
        props={adaptedProps}
      />

      {/* Contrôles des sous-titres */}
      {sousTitres.length > 0 && (
        <div className="sous-titres-controls">
          <select
            value={sousTitreActif || ''}
            onChange={(e) => handleChangementSousTitre(e.target.value)}
          >
            <option value="">Sans sous-titres</option>
            {sousTitres.map(({ langue }) => (
              <option key={langue} value={langue}>
                {langue}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Affichage du titre */}
      {titre && <h2 className="video-title">{titre}</h2>}
    </div>
  );
};

export default LecteurVideo;
