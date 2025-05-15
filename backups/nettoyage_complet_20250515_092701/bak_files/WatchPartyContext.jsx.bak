/**
 * Contexte pour la gestion des WatchParty
 * Permet de partager l'état et les fonctionnalités de WatchParty entre les composants
 */

import React, { createContext, useState, useEffect, useContext } from 'react';
import { io } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';
import { AuthContext } from './UserContext';

// URL du serveur Socket.IO (à configurer dans l'environnement de production)
const SOCKET_SERVER_URL = 'https://flodrama-watchparty.workers.dev';

// Création du contexte
export const WatchPartyContext = createContext();

export const WatchPartyProvider = ({ children }) => {
  const { User } = useContext(AuthContext);
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [partyId, setPartyId] = useState('');
  const [participants, setParticipants] = useState([]);
  const [messages, setMessages] = useState([]);
  const [playerState, setPlayerState] = useState({
    playing: false,
    currentTime: 0,
    duration: 0,
    contentId: null,
    contentTitle: '',
    contentPoster: '',
  });
  
  // Initialiser la connexion socket
  useEffect(() => {
    if (!socket && User) {
      const newSocket = io(SOCKET_SERVER_URL, {
        transports: ['websocket'],
        auth: {
          userId: User.uid,
          displayName: User.displayName || 'Utilisateur',
          photoURL: User.photoURL || '',
        },
      });

      newSocket.on('connect', () => {
        console.log('Connecté au serveur WatchParty');
        setConnected(true);
      });

      newSocket.on('disconnect', () => {
        console.log('Déconnecté du serveur WatchParty');
        setConnected(false);
      });

      newSocket.on('party:joined', (data) => {
        setPartyId(data.partyId);
        setParticipants(data.participants);
        setPlayerState(data.playerState);
        
        // Charger l'historique des messages si disponible
        if (data.messages) {
          setMessages(data.messages);
        }
      });

      newSocket.on('party:participantJoined', (data) => {
        setParticipants((prev) => [...prev, data.participant]);
        
        // Ajouter un message système
        addSystemMessage(`${data.participant.displayName} a rejoint la WatchParty`);
      });

      newSocket.on('party:participantLeft', (data) => {
        setParticipants((prev) => 
          prev.filter((p) => p.userId !== data.userId)
        );
        
        // Ajouter un message système
        addSystemMessage(`${data.displayName} a quitté la WatchParty`);
      });

      newSocket.on('party:playerStateChanged', (newState) => {
        setPlayerState(newState);
      });

      newSocket.on('party:messageReceived', (message) => {
        setMessages((prev) => [...prev, message]);
      });

      setSocket(newSocket);

      // Nettoyage à la déconnexion
      return () => {
        if (newSocket) {
          newSocket.disconnect();
        }
      };
    }
  }, [User]);

  // Créer une nouvelle WatchParty
  const createParty = (contentId, contentTitle, contentPoster) => {
    if (!socket || !connected) {
      return null;
    }
    
    const newPartyId = uuidv4().substring(0, 8);
    
    socket.emit('party:create', {
      partyId: newPartyId,
      contentId,
      contentTitle,
      contentPoster,
    });
    
    return newPartyId;
  };

  // Rejoindre une WatchParty existante
  const joinParty = (partyId) => {
    if (!socket || !connected) {
      return false;
    }
    
    socket.emit('party:join', {
      partyId,
    });
    
    return true;
  };

  // Quitter une WatchParty
  const leaveParty = () => {
    if (!socket || !connected || !partyId) {
      return;
    }
    
    socket.emit('party:leave', {
      partyId,
    });
    
    setPartyId('');
    setParticipants([]);
    setMessages([]);
    setPlayerState({
      playing: false,
      currentTime: 0,
      duration: 0,
      contentId: null,
      contentTitle: '',
      contentPoster: '',
    });
  };

  // Mettre à jour l'état du lecteur
  const updatePlayerState = (newState) => {
    if (!socket || !connected || !partyId) {
      return;
    }
    
    const updatedState = { ...playerState, ...newState };
    setPlayerState(updatedState);
    
    socket.emit('party:updatePlayerState', {
      partyId,
      playerState: updatedState,
    });
  };

  // Envoyer un message dans le chat
  const sendMessage = (text) => {
    if (!socket || !connected || !partyId || !text.trim()) {
      return;
    }
    
    const message = {
      id: uuidv4(),
      userId: User.uid,
      displayName: User.displayName || 'Utilisateur',
      photoURL: User.photoURL || '',
      text,
      timestamp: new Date().toISOString(),
      type: 'user',
    };
    
    socket.emit('party:sendMessage', {
      partyId,
      message,
    });
    
    // Ajouter le message localement pour une réponse immédiate
    setMessages((prev) => [...prev, message]);
  };

  // Ajouter un message système
  const addSystemMessage = (text) => {
    const message = {
      id: uuidv4(),
      text,
      timestamp: new Date().toISOString(),
      type: 'system',
    };
    
    setMessages((prev) => [...prev, message]);
  };

  // Valeurs exposées par le contexte
  const value = {
    connected,
    partyId,
    participants,
    messages,
    playerState,
    createParty,
    joinParty,
    leaveParty,
    updatePlayerState,
    sendMessage,
  };

  return (
    <WatchPartyContext.Provider value={value}>
      {children}
    </WatchPartyContext.Provider>
  );
};

// Hook personnalisé pour utiliser le contexte WatchParty
export const useWatchParty = () => {
  const context = useContext(WatchPartyContext);
  if (!context) {
    throw new Error("useWatchParty doit être utilisé à l'intérieur d'un WatchPartyProvider");
  }
  return context;
};
