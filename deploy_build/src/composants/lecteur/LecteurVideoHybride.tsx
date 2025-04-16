import React, { useState, useEffect, useRef } from 'react';
import { createHybridComponent, HybridComponent } from '../../adapters/hybrid-component';
import ReactPlayer from 'react-player'; // Pour l'exemple, on utilise react-player comme fallback

interface LecteurVideoProps {
  source: {
    uri: string;
  };
  sousTitres?: Array<{
    id: string;
    url: string;
    langue: string;
  }>;
  onFinLecture?: () => void;
  onErreur?: (error: Error) => void;
  onLecture?: () => void;
  onPause?: () => void;
  autoPlay?: boolean;
  qualiteParDefaut?: string;
  style?: React.CSSProperties;
  testID?: string;
}

/**
 * Composant de lecteur vidéo hybride qui utilise Lynx par défaut
 * et bascule vers ReactPlayer si nécessaire
 */
const LecteurVideoHybride: React.FC<LecteurVideoProps> = ({
  source,
  sousTitres,
  onFinLecture,
  onErreur,
  onLecture,
  onPause,
  autoPlay = false,
  qualiteParDefaut = 'auto',
  style,
  testID
}) => {
  const [isLynxAvailable, setIsLynxAvailable] = useState(true);
  const playerRef = useRef<any>(null);

  // Vérifier la disponibilité de Lynx au montage
  useEffect(() => {
    try {
      // Tenter d'importer un composant Lynx
      import('@lynx/core').catch(() => {
        console.warn('Lynx non disponible, utilisation de ReactPlayer');
        setIsLynxAvailable(false);
      });
    } catch {
      setIsLynxAvailable(false);
    }
  }, []);

  // Props communs pour les deux implémentations
  const commonProps = {
    style,
    testID: testID || 'lecteur-video-hybride',
  };

  // Props spécifiques pour Lynx
  const lynxProps = {
    source,
    subtitles: sousTitres,
    onEnd: onFinLecture,
    onError: onErreur,
    onPlay: onLecture,
    onPause: onPause,
    autoplay: autoPlay,
    defaultQuality: qualiteParDefaut,
    ...commonProps
  };

  // Props spécifiques pour ReactPlayer
  const reactProps = {
    url: source.uri,
    controls: true,
    playing: autoPlay,
    onEnded: onFinLecture,
    onError: onErreur,
    onPlay: onLecture,
    onPause: onPause,
    config: {
      file: {
        tracks: sousTitres?.map(st => ({
          kind: 'subtitles',
          src: st.url,
          srcLang: st.id,
          label: st.langue
        }))
      }
    },
    ...commonProps
  };

  return (
    <HybridComponent
      lynxComponent="LynxVideo"
      reactFallback={ReactPlayer}
      componentProps={isLynxAvailable ? lynxProps : reactProps}
      forceReact={!isLynxAvailable}
      style={style}
      testID={testID}
    />
  );
};

export default LecteurVideoHybride;

// Export d'un composant hybride générique pour d'autres cas d'utilisation
export const HybridVideo = createHybridComponent('LynxVideo', ReactPlayer);
