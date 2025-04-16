/**
 * Conteneur principal pour la fonctionnalité Watch Party
 * Intègre le lecteur vidéo et le chat dans une interface unifiée
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faShareAlt, faCog, faTimes } from '@fortawesome/free-solid-svg-icons';
import { View, StyleSheet, Text, TouchableOpacity, Alert } from '../../adapters/react-native-adapter';

import VideoPlayer from '../video/VideoPlayer';
import WatchPartyChat from './WatchPartyChat';
import WatchPartyParticipants from './WatchPartyParticipants';
import WatchPartySettings from './WatchPartySettings';
import { useWatchParty } from '../../hooks/useWatchParty';
import { useTheme } from '../../hooks/useTheme';
import { useSubscription } from '../../hooks/useSubscription';
import { formatTimestamp } from '../../utils/time-formatter';
import { copyToClipboard } from '../../utils/clipboard';

/**
 * Conteneur principal pour la Watch Party
 * @returns {JSX.Element} - Composant React
 */
const WatchPartyContainer = () => {
  const { partyId, dramaId } = useParams();
  const navigate = useNavigate();
  const { colors } = useTheme();
  const { hasActiveSubscription, currentPlan } = useSubscription();
  
  const [videoUrl, setVideoUrl] = useState('');
  const [dramaInfo, setDramaInfo] = useState(null);
  const [videoTimestamp, setVideoTimestamp] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [layout, setLayout] = useState('side-by-side'); // 'side-by-side', 'video-focus', 'chat-focus'
  
  const videoPlayerRef = useRef(null);
  
  const { status, participants, videoSync, syncVideoPosition } = useWatchParty(partyId);

  // Charger les informations du drama
  useEffect(() => {
    const fetchDramaInfo = async () => {
      try {
        // Appel API pour récupérer les informations du drama
        // const response = await api.get(`/dramas/${dramaId}`);
        // setDramaInfo(response.data);
        // setVideoUrl(response.data.videoUrl);
        
        // Simulation pour le développement
        setDramaInfo({
          id: dramaId,
          title: 'Drama Test',
          episode: 1,
          season: 1,
          thumbnail: 'https://via.placeholder.com/300x150',
          description: 'Description du drama pour la Watch Party',
        });
        
        // URL de test - à remplacer par l'URL réelle du drama
        setVideoUrl('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4');
      } catch (error) {
        console.error('Erreur lors du chargement des informations du drama:', error);
        Alert.alert('Erreur', 'Impossible de charger la vidéo. Veuillez réessayer.');
        navigate('/browse');
      }
    };
    
    fetchDramaInfo();
  }, [dramaId, navigate]);

  // Gérer la synchronisation vidéo
  useEffect(() => {
    if (videoSync && videoPlayerRef.current) {
      // Vérifier si la différence de timestamp est significative (plus de 3 secondes)
      const timeDifference = Math.abs(videoTimestamp - videoSync.timestamp);
      
      if (timeDifference > 3) {
        videoPlayerRef.current.seekTo(videoSync.timestamp);
      }
      
      // Synchroniser l'état de lecture (play/pause)
      if (isPlaying !== videoSync.isPlaying) {
        if (videoSync.isPlaying) {
          videoPlayerRef.current.play();
        } else {
          videoPlayerRef.current.pause();
        }
      }
    }
  }, [videoSync, videoTimestamp, isPlaying]);

  // Gérer le changement de position vidéo
  const handleTimeUpdate = useCallback((currentTime) => {
    setVideoTimestamp(currentTime);
  }, []);

  // Gérer le changement d'état de lecture
  const handlePlayStateChange = useCallback((playing) => {
    setIsPlaying(playing);
    
    // Synchroniser avec les autres participants
    syncVideoPosition(videoTimestamp, playing);
  }, [videoTimestamp, syncVideoPosition]);

  // Naviguer à un timestamp spécifique
  const handleSeekTo = useCallback((timestamp) => {
    if (videoPlayerRef.current) {
      videoPlayerRef.current.seekTo(timestamp);
      
      // Synchroniser avec les autres participants
      syncVideoPosition(timestamp, isPlaying);
    }
  }, [isPlaying, syncVideoPosition]);

  // Partager le lien de la Watch Party
  const handleShareParty = useCallback(() => {
    const shareUrl = `${window.location.origin}/watch-party/${partyId}/${dramaId}`;
    copyToClipboard(shareUrl);
    Alert.alert(
      'Lien copié !',
      'Le lien de la Watch Party a été copié dans le presse-papiers. Partagez-le avec vos amis pour qu\'ils puissent vous rejoindre.'
    );
  }, [partyId, dramaId]);

  // Quitter la Watch Party
  const handleLeaveParty = useCallback(() => {
    navigate(`/watch/${dramaId}`);
  }, [dramaId, navigate]);

  // Vérifier si l'utilisateur a accès à cette fonctionnalité
  if (!hasActiveSubscription && currentPlan !== 'ultimate') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.subscriptionRequired}>
          <Text style={[styles.subscriptionTitle, { color: colors.text }]}>
            Fonctionnalité Premium
          </Text>
          <Text style={[styles.subscriptionText, { color: colors.textSecondary }]}>
            La Watch Party est disponible uniquement pour les abonnements Ultimate.
          </Text>
          <TouchableOpacity
            style={[styles.subscriptionButton, { backgroundColor: colors.primary }]}
            onPress={() => navigate('/subscription')}
          >
            <Text style={[styles.buttonText, { color: colors.textOnPrimary }]}>
              Découvrir les abonnements
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* En-tête */}
      <View style={[styles.header, { backgroundColor: colors.background2 }]}>
        <View style={styles.dramaInfo}>
          {dramaInfo && (
            <>
              <Text style={[styles.dramaTitle, { color: colors.text }]}>
                {dramaInfo.title}
              </Text>
              <Text style={[styles.dramaEpisode, { color: colors.textSecondary }]}>
                Saison {dramaInfo.season}, Épisode {dramaInfo.episode}
              </Text>
            </>
          )}
        </View>
        
        <View style={styles.headerControls}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => setShowParticipants(!showParticipants)}
          >
            <FontAwesomeIcon icon={faUsers} color={colors.icon} size={18} />
            <Text style={[styles.headerButtonText, { color: colors.textSecondary }]}>
              {participants.length}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={handleShareParty}
          >
            <FontAwesomeIcon icon={faShareAlt} color={colors.icon} size={18} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => setShowSettings(!showSettings)}
          >
            <FontAwesomeIcon icon={faCog} color={colors.icon} size={18} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.headerButton, styles.leaveButton]}
            onPress={handleLeaveParty}
          >
            <FontAwesomeIcon icon={faTimes} color={colors.error} size={18} />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Contenu principal */}
      <View style={[
        styles.content,
        layout === 'side-by-side' && styles.contentSideBySide,
        layout === 'video-focus' && styles.contentVideoFocus,
        layout === 'chat-focus' && styles.contentChatFocus,
      ]}>
        {/* Lecteur vidéo */}
        <View style={[
          styles.videoContainer,
          layout === 'side-by-side' && styles.videoContainerSideBySide,
          layout === 'video-focus' && styles.videoContainerFocus,
          layout === 'chat-focus' && styles.videoContainerMinimized,
        ]}>
          {videoUrl ? (
            <VideoPlayer
              ref={videoPlayerRef}
              source={videoUrl}
              poster={dramaInfo?.thumbnail}
              onTimeUpdate={handleTimeUpdate}
              onPlayStateChange={handlePlayStateChange}
              style={styles.videoPlayer}
            />
          ) : (
            <View style={[styles.loadingContainer, { backgroundColor: colors.background2 }]}>
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                Chargement de la vidéo...
              </Text>
            </View>
          )}
          
          {/* Indicateur de synchronisation */}
          {status.connected && (
            <View style={[styles.syncIndicator, { backgroundColor: colors.background2 }]}>
              <Text style={[styles.syncText, { color: colors.textSecondary }]}>
                {isPlaying ? 'Lecture synchronisée' : 'Pause synchronisée'} • {formatTimestamp(videoTimestamp)}
              </Text>
            </View>
          )}
        </View>
        
        {/* Chat */}
        <View style={[
          styles.chatContainer,
          layout === 'side-by-side' && styles.chatContainerSideBySide,
          layout === 'video-focus' && styles.chatContainerMinimized,
          layout === 'chat-focus' && styles.chatContainerFocus,
        ]}>
          <WatchPartyChat
            partyId={partyId}
            videoTimestamp={videoTimestamp}
            onSeekTo={handleSeekTo}
            isPlaying={isPlaying}
          />
        </View>
      </View>
      
      {/* Panneau des participants (conditionnel) */}
      {showParticipants && (
        <WatchPartyParticipants
          participants={participants}
          onClose={() => setShowParticipants(false)}
        />
      )}
      
      {/* Panneau des paramètres (conditionnel) */}
      {showSettings && (
        <WatchPartySettings
          layout={layout}
          onLayoutChange={setLayout}
          onClose={() => setShowSettings(false)}
        />
      )}
      
      {/* Contrôles de mise en page (mobile uniquement) */}
      <View style={[styles.layoutControls, { backgroundColor: colors.background2 }]}>
        <TouchableOpacity
          style={[
            styles.layoutButton,
            layout === 'side-by-side' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }
          ]}
          onPress={() => setLayout('side-by-side')}
        >
          <Text style={[
            styles.layoutButtonText,
            { color: layout === 'side-by-side' ? colors.primary : colors.textSecondary }
          ]}>
            Côte à côte
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.layoutButton,
            layout === 'video-focus' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }
          ]}
          onPress={() => setLayout('video-focus')}
        >
          <Text style={[
            styles.layoutButtonText,
            { color: layout === 'video-focus' ? colors.primary : colors.textSecondary }
          ]}>
            Vidéo
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.layoutButton,
            layout === 'chat-focus' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }
          ]}
          onPress={() => setLayout('chat-focus')}
        >
          <Text style={[
            styles.layoutButtonText,
            { color: layout === 'chat-focus' ? colors.primary : colors.textSecondary }
          ]}>
            Chat
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: '100vh',
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  dramaInfo: {
    flex: 1,
  },
  dramaTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  dramaEpisode: {
    fontSize: 14,
  },
  headerControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 10,
    marginLeft: 10,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButtonText: {
    marginLeft: 5,
    fontSize: 14,
  },
  leaveButton: {
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
  },
  contentSideBySide: {
    flexDirection: 'row',
  },
  contentVideoFocus: {
    flexDirection: 'column',
  },
  contentChatFocus: {
    flexDirection: 'column-reverse',
  },
  videoContainer: {
    position: 'relative',
  },
  videoContainerSideBySide: {
    flex: 2,
  },
  videoContainerFocus: {
    flex: 3,
  },
  videoContainerMinimized: {
    height: 200,
  },
  videoPlayer: {
    width: '100%',
    height: '100%',
  },
  chatContainer: {
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(0, 0, 0, 0.1)',
  },
  chatContainerSideBySide: {
    flex: 1,
  },
  chatContainerFocus: {
    flex: 3,
  },
  chatContainerMinimized: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  syncIndicator: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    padding: 8,
    borderRadius: 15,
    opacity: 0.8,
  },
  syncText: {
    fontSize: 12,
  },
  layoutControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    display: 'none', // Masqué par défaut, affiché uniquement sur mobile
  },
  layoutButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  layoutButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  subscriptionRequired: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  subscriptionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  subscriptionText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
  },
  subscriptionButton: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  // Media queries pour le responsive
  '@media (max-width: 768px)': {
    contentSideBySide: {
      flexDirection: 'column',
    },
    videoContainerSideBySide: {
      height: '50%',
    },
    chatContainerSideBySide: {
      height: '50%',
      borderLeftWidth: 0,
      borderTopWidth: 1,
      borderTopColor: 'rgba(0, 0, 0, 0.1)',
    },
    layoutControls: {
      display: 'flex',
    },
  },
});

export default WatchPartyContainer;
