/**
 * Conteneur principal pour la fonctionnalité Watch Party
 * Intègre le lecteur vidéo et le chat dans une interface unifiée
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faShareAlt, faCog, faTimes, faPoll } from '@fortawesome/free-solid-svg-icons';
import { View, StyleSheet, Text, TouchableOpacity, Alert } from '../../adapters/react-native-adapter';

import EnhancedVideoPlayer from '../video/EnhancedVideoPlayer';
import WatchPartyChat from './WatchPartyChat';
import WatchPartyParticipants from './WatchPartyParticipants';
import WatchPartySettings from './WatchPartySettings';
import WatchPartyPoll from './WatchPartyPoll';
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
  
  const [dramaInfo, setDramaInfo] = useState(null);
  const [videoTimestamp, setVideoTimestamp] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showPollPanel, setShowPollPanel] = useState(false);
  const [layout, setLayout] = useState('side-by-side'); // 'side-by-side', 'video-focus', 'chat-focus'
  
  const videoPlayerRef = useRef(null);
  
  const { status, participants, videoSync, syncVideoPosition, activePoll } = useWatchParty(partyId);

  // Charger les informations du drama
  useEffect(() => {
    const fetchDramaInfo = async () => {
      try {
        // Appel API pour récupérer les informations du drama
        const response = await fetch(`/api/dramas/${dramaId}`);
        if (!response.ok) {
          throw new Error('Erreur lors de la récupération des informations du drama');
        }
        
        const data = await response.json();
        setDramaInfo(data);
      } catch (error) {
        console.error('Erreur lors du chargement des informations du drama:', error);
        
        // En mode développement, utiliser des données de test
        if (process.env.NODE_ENV === 'development') {
          setDramaInfo({
            id: dramaId,
            title: 'Drama Test',
            episode: 1,
            season: 1,
            thumbnail: 'https://via.placeholder.com/300x150',
            description: 'Description du drama pour la Watch Party',
          });
        } else {
          Alert.alert('Erreur', 'Impossible de charger la vidéo. Veuillez réessayer.');
          navigate('/browse');
        }
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
  }, []);

  // Synchroniser la position vidéo avec les autres participants
  useEffect(() => {
    if (isPlaying) {
      const syncInterval = setInterval(() => {
        syncVideoPosition(videoTimestamp, isPlaying);
      }, 5000); // Synchroniser toutes les 5 secondes
      
      return () => clearInterval(syncInterval);
    }
  }, [videoTimestamp, isPlaying, syncVideoPosition]);

  // Gérer l'envoi de message
  const handleSendMessage = useCallback((message) => {
    // Ajouter le timestamp vidéo si nécessaire
    if (message.type === 'timestamp') {
      message.videoTimestamp = videoTimestamp;
    }
    
    // Envoyer le message via le hook useWatchParty
  }, [videoTimestamp]);

  // Gérer le partage de la Watch Party
  const handleShareParty = useCallback(() => {
    const shareUrl = `${window.location.origin}/watch-party/${partyId}`;
    copyToClipboard(shareUrl);
    
    Alert.alert(
      'Lien copié',
      'Le lien de la Watch Party a été copié dans le presse-papiers.',
      [{ text: 'OK' }]
    );
  }, [partyId]);

  // Gérer le départ de la Watch Party
  const handleLeaveParty = useCallback(() => {
    Alert.alert(
      'Quitter la Watch Party',
      'Êtes-vous sûr de vouloir quitter cette Watch Party ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Quitter', 
          style: 'destructive',
          onPress: () => {
            // Quitter la Watch Party et rediriger
            navigate('/browse');
          }
        }
      ]
    );
  }, [navigate]);

  // Vérifier si l'utilisateur a un abonnement actif
  if (!hasActiveSubscription || (currentPlan && currentPlan.id !== 'ultimate')) {
    return (
      <View style={[styles.subscriptionRequired, { backgroundColor: colors.background }]}>
        <Text style={[styles.subscriptionTitle, { color: colors.text }]}>
          Abonnement Ultimate requis
        </Text>
        <Text style={[styles.subscriptionText, { color: colors.textSecondary }]}>
          La fonctionnalité Watch Party est disponible uniquement avec l'abonnement Ultimate.
          Passez à l'abonnement Ultimate pour profiter de cette fonctionnalité exclusive.
        </Text>
        <TouchableOpacity 
          style={[styles.subscriptionButton, { backgroundColor: colors.primary }]}
          onPress={() => navigate('/subscription')}
        >
          <Text style={[styles.buttonText, { color: colors.textOnPrimary }]}>
            Voir les abonnements
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* En-tête */}
      <View style={[styles.header, { backgroundColor: colors.background2 }]}>
        <View style={styles.dramaInfo}>
          <Text style={[styles.dramaTitle, { color: colors.text }]}>
            {dramaInfo?.title || 'Chargement...'}
          </Text>
          {dramaInfo && (
            <Text style={[styles.dramaEpisode, { color: colors.textSecondary }]}>
              Saison {dramaInfo.season}, Épisode {dramaInfo.episode}
            </Text>
          )}
        </View>
        
        <View style={styles.headerControls}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => setShowParticipants(!showParticipants)}
          >
            <FontAwesomeIcon icon={faUsers} color={colors.icon} size={18} />
            <Text style={[styles.headerButtonText, { color: colors.text }]}>
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
            style={styles.headerButton}
            onPress={() => setShowPollPanel(!showPollPanel)}
          >
            <FontAwesomeIcon icon={faPoll} color={colors.icon} size={18} />
            {activePoll && (
              <View style={[styles.notificationBadge, { backgroundColor: colors.primary }]} />
            )}
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
          <EnhancedVideoPlayer
            ref={videoPlayerRef}
            contentId={dramaId}
            title={dramaInfo?.title}
            poster={dramaInfo?.thumbnail}
            onTimeUpdate={handleTimeUpdate}
            onPlayStateChange={handlePlayStateChange}
            style={styles.videoPlayer}
          />
          
          {/* Indicateur de synchronisation */}
          {videoSync && Math.abs(videoTimestamp - videoSync.timestamp) <= 3 && (
            <View style={[styles.syncIndicator, { backgroundColor: colors.success + '80' }]}>
              <Text style={[styles.syncText, { color: colors.textOnPrimary }]}>
                Synchronisé
              </Text>
            </View>
          )}
        </View>
        
        {/* Section chat */}
        <View style={[
          styles.chatContainer,
          layout === 'side-by-side' && styles.chatContainerSideBySide,
          layout === 'video-focus' && styles.chatContainerMinimized,
          layout === 'chat-focus' && styles.chatContainerFocus,
        ]}>
          {showPollPanel && (
            <View style={styles.pollContainer}>
              <WatchPartyPoll />
              
              {!activePoll && (
                <TouchableOpacity 
                  style={[styles.closePollButton, { backgroundColor: colors.background2 }]}
                  onPress={() => setShowPollPanel(false)}
                >
                  <FontAwesomeIcon icon={faTimes} color={colors.icon} size={16} />
                </TouchableOpacity>
              )}
            </View>
          )}
          
          <WatchPartyChat
            partyId={partyId}
            videoTimestamp={videoTimestamp}
            onSendMessage={handleSendMessage}
          />
        </View>
      </View>
      
      {/* Panneaux latéraux */}
      {showSettings && (
        <WatchPartySettings
          layout={layout}
          onLayoutChange={(newLayout) => setLayout(newLayout)}
          onClose={() => setShowSettings(false)}
        />
      )}
      
      {showParticipants && (
        <WatchPartyParticipants
          onClose={() => setShowParticipants(false)}
        />
      )}
      
      {/* Contrôles de mise en page pour mobile */}
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
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pollContainer: {
    position: 'relative',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  closePollButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
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
