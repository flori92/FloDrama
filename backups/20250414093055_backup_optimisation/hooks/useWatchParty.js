/**
 * Hook personnalisé pour gérer les Watch Parties
 * Facilite l'intégration du service WatchParty dans les composants React
 */

import { useState, useEffect, useCallback } from 'react';
import WatchPartyService from '../services/WatchPartyService';
import { useAuth } from './useAuth';
import { GiftedChat } from 'react-native-gifted-chat';

/**
 * Hook pour gérer une Watch Party
 * @param {string} partyId - Identifiant de la Watch Party à rejoindre
 * @returns {Object} - Fonctions et état de la Watch Party
 */
export const useWatchParty = (partyId) => {
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState({ connected: false, partyId: null });
  const [participants, setParticipants] = useState([]);
  const [videoSync, setVideoSync] = useState({ timestamp: 0, isPlaying: false });
  const { user } = useAuth();

  // Rejoindre la Watch Party au montage du composant
  useEffect(() => {
    if (partyId) {
      const joinParty = async () => {
        await WatchPartyService.joinParty(partyId);
      };
      
      joinParty();
      
      // Quitter la Watch Party au démontage
      return () => {
        WatchPartyService.leaveParty();
      };
    }
  }, [partyId]);

  // Écouter les nouveaux messages
  useEffect(() => {
    const handleNewMessage = (message) => {
      setMessages(previousMessages => 
        GiftedChat.append(previousMessages, [message])
      );
    };
    
    WatchPartyService.addMessageListener(handleNewMessage);
    
    return () => {
      WatchPartyService.removeMessageListener(handleNewMessage);
    };
  }, []);

  // Écouter les changements de statut
  useEffect(() => {
    const handleStatusChange = (newStatus) => {
      setStatus(newStatus);
    };
    
    WatchPartyService.addStatusListener(handleStatusChange);
    
    return () => {
      WatchPartyService.removeStatusListener(handleStatusChange);
    };
  }, []);

  // Écouter les synchronisations vidéo
  useEffect(() => {
    const handleVideoSync = (syncData) => {
      setVideoSync(syncData);
    };
    
    WatchPartyService.addVideoSyncListener(handleVideoSync);
    
    return () => {
      WatchPartyService.removeVideoSyncListener(handleVideoSync);
    };
  }, []);

  // Envoyer un message
  const sendMessage = useCallback((messages = []) => {
    const [message] = messages;
    
    if (message && user) {
      // Ajouter les informations de l'utilisateur
      const enrichedMessage = {
        ...message,
        user: {
          _id: user.id,
          name: user.displayName || user.username,
          avatar: user.profilePicture,
        },
      };
      
      // Envoyer via le service
      WatchPartyService.sendMessage(enrichedMessage);
      
      // Mettre à jour l'état local
      setMessages(previousMessages => 
        GiftedChat.append(previousMessages, [enrichedMessage])
      );
    }
  }, [user]);

  // Synchroniser la position vidéo
  const syncVideoPosition = useCallback((timestamp, isPlaying) => {
    WatchPartyService.syncVideoPosition(timestamp, isPlaying);
  }, []);

  // Formater les messages pour GiftedChat
  const formatMessagesForGiftedChat = useCallback((rawMessages) => {
    return rawMessages.map(msg => ({
      _id: msg.id || Math.random().toString(),
      text: msg.content,
      createdAt: new Date(msg.timestamp || Date.now()),
      user: {
        _id: msg.userId,
        name: msg.username,
        avatar: msg.userAvatar,
      },
      videoTimestamp: msg.videoTimestamp,
    }));
  }, []);

  // Charger les messages précédents
  const loadPreviousMessages = useCallback(async () => {
    try {
      // Cette fonction devrait être implémentée pour charger les messages depuis l'API
      // const response = await api.get(`/watch-parties/${partyId}/messages`);
      // const formattedMessages = formatMessagesForGiftedChat(response.data);
      // setMessages(formattedMessages);
    } catch (error) {
      console.error('Erreur lors du chargement des messages précédents:', error);
    }
  }, [partyId]);

  return {
    messages,
    status,
    participants,
    videoSync,
    sendMessage,
    syncVideoPosition,
    loadPreviousMessages,
  };
};
