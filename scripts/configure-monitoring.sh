#!/bin/bash
# Script de configuration de la surveillance des performances pour FloDrama
# Ce script met en place les outils de monitoring pour le système hybride

# Couleurs pour les messages
ROUGE='\033[0;31m'
VERT='\033[0;32m'
BLEU='\033[0;34m'
JAUNE='\033[0;33m'
NC='\033[0m' # No Color

# Fonction pour afficher des messages
log() {
  echo -e "${BLEU}[$(date +"%Y-%m-%d %H:%M:%S")]${NC} $1"
}

succes() {
  echo -e "${VERT}[SUCCÈS]${NC} $1"
}

erreur() {
  echo -e "${ROUGE}[ERREUR]${NC} $1"
}

attention() {
  echo -e "${JAUNE}[ATTENTION]${NC} $1"
}

# Obtenir le chemin absolu du répertoire du script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( dirname "$SCRIPT_DIR" )"

# Installation des dépendances de monitoring
log "Installation des dépendances de monitoring..."
cd "${PROJECT_ROOT}" && npm install --save @vercel/analytics sentry @sentry/react @sentry/tracing

if [ $? -ne 0 ]; then
  erreur "Échec de l'installation des dépendances de monitoring"
  exit 1
else
  succes "Dépendances de monitoring installées avec succès"
fi

# Création du fichier de configuration Sentry
log "Création du fichier de configuration Sentry..."
cat > "${PROJECT_ROOT}/sentry.properties" << EOL
defaults.url=https://sentry.io/
defaults.org=flodrama
defaults.project=flodrama-app
auth.token=flodrama-sentry-auth-token
cli.executable=node_modules/@sentry/cli/bin/sentry-cli
EOL

# Création du fichier de monitoring
log "Création du fichier de monitoring..."
mkdir -p "${PROJECT_ROOT}/src/utils"

cat > "${PROJECT_ROOT}/src/utils/monitoring.js" << EOL
import { Analytics } from '@vercel/analytics/react';
import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

// Initialisation de Sentry pour la surveillance des erreurs
export const initSentry = () => {
  if (process.env.NODE_ENV === 'production') {
    Sentry.init({
      dsn: "https://examplePublicKey@o0.ingest.sentry.io/0",
      integrations: [new BrowserTracing()],
      tracesSampleRate: 0.5,
      environment: process.env.VERCEL_ENV || 'development',
      release: 'flodrama@1.0.0',
      beforeSend(event) {
        // Vérifier si l'erreur est liée au système de lecture vidéo
        if (event.exception && event.exception.values) {
          const exceptions = event.exception.values;
          for (const exception of exceptions) {
            if (exception.value && exception.value.includes('video') || exception.value.includes('stream')) {
              // Ajouter un tag pour les erreurs de streaming
              event.tags = {
                ...event.tags,
                streaming_error: true,
                aws_service: 'video_proxy'
              };
              
              // Augmenter la priorité de ces erreurs
              event.level = 'error';
            }
          }
        }
        return event;
      }
    });
    
    console.log('Sentry initialized for error monitoring');
  }
};

// Composant Analytics pour la surveillance des performances
export const AnalyticsProvider = ({ children }) => {
  return (
    <>
      {children}
      <Analytics />
    </>
  );
};

// Fonction pour surveiller les performances de lecture vidéo
export const monitorVideoPerformance = (videoElement) => {
  if (!videoElement || process.env.NODE_ENV !== 'production') return;
  
  const metrics = {
    startTime: Date.now(),
    firstFrameTime: null,
    bufferingEvents: 0,
    bufferingDuration: 0,
    lastBufferingStart: null,
    playbackErrors: 0,
    videoSource: videoElement.src || 'unknown'
  };
  
  // Événement de chargement du premier frame
  videoElement.addEventListener('loadeddata', () => {
    metrics.firstFrameTime = Date.now();
    const timeToFirstFrame = metrics.firstFrameTime - metrics.startTime;
    
    // Envoyer la métrique à Vercel Analytics
    if (window.va) {
      window.va('event', {
        name: 'video_first_frame',
        value: timeToFirstFrame,
        videoSource: metrics.videoSource.includes('cloudfront') ? 'aws' : 'fallback'
      });
    }
  });
  
  // Événements de buffering
  videoElement.addEventListener('waiting', () => {
    metrics.lastBufferingStart = Date.now();
    metrics.bufferingEvents++;
    
    if (window.va) {
      window.va('event', {
        name: 'video_buffering_start',
        bufferingEvents: metrics.bufferingEvents,
        videoSource: metrics.videoSource.includes('cloudfront') ? 'aws' : 'fallback'
      });
    }
  });
  
  videoElement.addEventListener('playing', () => {
    if (metrics.lastBufferingStart) {
      const bufferingTime = Date.now() - metrics.lastBufferingStart;
      metrics.bufferingDuration += bufferingTime;
      metrics.lastBufferingStart = null;
      
      if (window.va) {
        window.va('event', {
          name: 'video_buffering_end',
          bufferingTime,
          totalBufferingDuration: metrics.bufferingDuration,
          videoSource: metrics.videoSource.includes('cloudfront') ? 'aws' : 'fallback'
        });
      }
    }
  });
  
  // Événements d'erreur
  videoElement.addEventListener('error', (e) => {
    metrics.playbackErrors++;
    
    // Envoyer l'erreur à Sentry
    Sentry.captureException(new Error(\`Video playback error: \${e.target.error?.message || 'Unknown error'}\`), {
      tags: {
        videoSource: metrics.videoSource.includes('cloudfront') ? 'aws' : 'fallback',
        errorCode: e.target.error?.code || 'unknown'
      },
      extra: {
        metrics,
        videoElement: {
          currentSrc: videoElement.currentSrc,
          networkState: videoElement.networkState,
          readyState: videoElement.readyState
        }
      }
    });
    
    if (window.va) {
      window.va('event', {
        name: 'video_playback_error',
        errorCode: e.target.error?.code || 'unknown',
        videoSource: metrics.videoSource.includes('cloudfront') ? 'aws' : 'fallback'
      });
    }
  });
  
  return metrics;
};

export default {
  initSentry,
  AnalyticsProvider,
  monitorVideoPerformance
};
EOL

# Mise à jour du fichier main.jsx pour inclure le monitoring
log "Mise à jour du fichier main.jsx pour inclure le monitoring..."

# Vérifier si le fichier main.jsx existe
if [ -f "${PROJECT_ROOT}/src/main.jsx" ]; then
  # Sauvegarder le fichier original
  cp "${PROJECT_ROOT}/src/main.jsx" "${PROJECT_ROOT}/src/main.jsx.bak"
  
  # Ajouter l'import et l'initialisation de Sentry
  sed -i '' '1s/^/import { initSentry, AnalyticsProvider } from ".\/utils\/monitoring";\n/' "${PROJECT_ROOT}/src/main.jsx"
  sed -i '' '/import/a\\n// Initialiser Sentry pour la surveillance des erreurs\ninitSentry();' "${PROJECT_ROOT}/src/main.jsx"
  
  # Envelopper l'application avec AnalyticsProvider
  sed -i '' 's/<React.StrictMode>/<AnalyticsProvider><React.StrictMode>/' "${PROJECT_ROOT}/src/main.jsx"
  sed -i '' 's/<\/React.StrictMode>/<\/React.StrictMode><\/AnalyticsProvider>/' "${PROJECT_ROOT}/src/main.jsx"
  
  succes "Fichier main.jsx mis à jour avec succès"
else
  attention "Le fichier main.jsx n'existe pas. Veuillez ajouter manuellement le monitoring à votre point d'entrée."
fi

# Mise à jour du composant VideoPlayer pour inclure le monitoring
log "Création/mise à jour du composant VideoPlayer avec monitoring..."

mkdir -p "${PROJECT_ROOT}/src/components/video"

cat > "${PROJECT_ROOT}/src/components/video/VideoPlayer.jsx" << EOL
import React, { useEffect, useRef } from 'react';
import { monitorVideoPerformance } from '../../utils/monitoring';
import './VideoPlayer.css';

const VideoPlayer = ({ 
  src, 
  poster, 
  title, 
  autoPlay = false, 
  controls = true, 
  onError, 
  onPlay, 
  onPause, 
  onEnded 
}) => {
  const videoRef = useRef(null);
  const metricsRef = useRef(null);
  
  // Fonction pour basculer vers la source de secours en cas d'erreur
  const handleError = (e) => {
    console.error('Erreur de lecture vidéo:', e);
    
    // Appeler le callback d'erreur si fourni
    if (onError && typeof onError === 'function') {
      onError(e);
    }
    
    // Vérifier si le fallback est activé
    if (process.env.VITE_VIDEO_FALLBACK_ENABLED === 'true' && src.includes('cloudfront')) {
      // Construire l'URL de fallback
      const videoId = src.split('/').pop().split('?')[0];
      const fallbackSrc = \`/api/video/fallback/\${videoId}\`;
      
      console.log('Basculement vers la source de secours:', fallbackSrc);
      
      // Mettre à jour la source vidéo
      if (videoRef.current) {
        videoRef.current.src = fallbackSrc;
        videoRef.current.load();
        videoRef.current.play().catch(err => console.error('Erreur lors de la lecture du fallback:', err));
      }
    }
  };
  
  // Initialiser le monitoring des performances
  useEffect(() => {
    if (videoRef.current) {
      metricsRef.current = monitorVideoPerformance(videoRef.current);
    }
    
    return () => {
      // Nettoyage si nécessaire
      metricsRef.current = null;
    };
  }, []);
  
  // Mettre à jour la source vidéo lorsqu'elle change
  useEffect(() => {
    if (videoRef.current && src) {
      videoRef.current.load();
      
      if (autoPlay) {
        videoRef.current.play().catch(err => console.error('Erreur lors de la lecture automatique:', err));
      }
    }
  }, [src, autoPlay]);
  
  return (
    <div className="video-player-container">
      {title && <h3 className="video-title">{title}</h3>}
      
      <div className="video-wrapper">
        <video
          ref={videoRef}
          className="video-player"
          poster={poster}
          controls={controls}
          onError={handleError}
          onPlay={onPlay}
          onPause={onPause}
          onEnded={onEnded}
          playsInline
        >
          <source src={src} type="video/mp4" />
          Votre navigateur ne prend pas en charge la lecture vidéo.
        </video>
      </div>
    </div>
  );
};

export default VideoPlayer;
EOL

# Création du fichier CSS pour le VideoPlayer
cat > "${PROJECT_ROOT}/src/components/video/VideoPlayer.css" << EOL
.video-player-container {
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
  overflow: hidden;
  background-color: #121118;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.video-title {
  padding: 12px 16px;
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: white;
  background: linear-gradient(to right, #3b82f6, #d946ef);
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
}

.video-wrapper {
  position: relative;
  width: 100%;
  padding-top: 56.25%; /* 16:9 Aspect Ratio */
  overflow: hidden;
}

.video-player {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  background-color: #000;
}

/* Personnalisation des contrôles vidéo */
.video-player::-webkit-media-controls {
  background-color: rgba(18, 17, 24, 0.7);
}

.video-player::-webkit-media-controls-panel {
  background-color: rgba(18, 17, 24, 0.7);
}

.video-player::-webkit-media-controls-play-button {
  background-color: rgba(59, 130, 246, 0.8);
  border-radius: 50%;
  transition: all 0.3s ease;
}

.video-player::-webkit-media-controls-play-button:hover {
  background-color: rgba(217, 70, 239, 0.8);
}

/* Styles pour les appareils mobiles */
@media (max-width: 768px) {
  .video-player-container {
    border-radius: 0;
  }
  
  .video-title {
    font-size: 1rem;
    padding: 8px 12px;
  }
}
EOL

# Rendre le script exécutable
chmod +x "${PROJECT_ROOT}/scripts/configure-vercel-env.sh"

# Afficher les informations de configuration
echo ""
succes "Configuration de la surveillance des performances terminée!"
echo -e "${VERT}Monitoring:${NC} Configuré et prêt à l'emploi"
echo -e "${VERT}Composant VideoPlayer:${NC} Créé avec monitoring intégré"

# Conseils post-configuration
echo ""
log "Conseils post-configuration:"
echo "1. Exécutez le script de déploiement pour appliquer les modifications"
echo "2. Vérifiez les métriques de performance dans le dashboard Vercel Analytics"
echo "3. Configurez des alertes dans Sentry pour les erreurs de lecture vidéo"
