import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import { useSocket } from './useSocket';
import { useToast } from './useToast';

/**
 * Hook personnalisé pour gérer les fonctionnalités de Watch Party
 * @param {string} partyId - Identifiant de la Watch Party
 * @returns {Object} - Méthodes et états pour gérer la Watch Party
 */
export const useWatchParty = (partyId) => {
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  const { showToast } = useToast();

  // États
  const [status, setStatus] = useState('connecting'); // 'connecting', 'connected', 'error'
  const [partyInfo, setPartyInfo] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [messages, setMessages] = useState([]);
  const [videoSync, setVideoSync] = useState({ timestamp: 0, isPlaying: false });
  const [isHost, setIsHost] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [activePoll, setActivePoll] = useState(null);
  const [pollHistory, setPollHistory] = useState([]);
  const [bannedUsers, setBannedUsers] = useState([]);

  // Références
  const syncTimeoutRef = useRef(null);

  // Initialiser la connexion à la Watch Party
  useEffect(() => {
    if (!partyId || !isConnected || !user) return;

    // Rejoindre la Watch Party
    socket.emit('party:join', { 
      partyId, 
      userId: user.id,
      userName: user.displayName,
      profilePicture: user.profilePicture
    });

    // Écouter les événements de la Watch Party
    socket.on('party:joined', handlePartyJoined);
    socket.on('party:error', handlePartyError);
    socket.on('party:userJoined', handleUserJoined);
    socket.on('party:userLeft', handleUserLeft);
    socket.on('party:message', handleNewMessage);
    socket.on('party:videoSync', handleVideoSync);
    socket.on('party:settingsUpdated', handleSettingsUpdated);
    socket.on('party:joinRequest', handleJoinRequest);
    socket.on('party:joinRequestResponse', handleJoinRequestResponse);
    socket.on('party:userKicked', handleUserKicked);
    socket.on('party:userBanned', handleUserBanned);
    socket.on('party:userMuted', handleUserMuted);
    socket.on('party:pollCreated', handlePollCreated);
    socket.on('party:pollVote', handlePollVote);
    socket.on('party:pollEnded', handlePollEnded);

    // Nettoyage lors du démontage
    return () => {
      socket.off('party:joined', handlePartyJoined);
      socket.off('party:error', handlePartyError);
      socket.off('party:userJoined', handleUserJoined);
      socket.off('party:userLeft', handleUserLeft);
      socket.off('party:message', handleNewMessage);
      socket.off('party:videoSync', handleVideoSync);
      socket.off('party:settingsUpdated', handleSettingsUpdated);
      socket.off('party:joinRequest', handleJoinRequest);
      socket.off('party:joinRequestResponse', handleJoinRequestResponse);
      socket.off('party:userKicked', handleUserKicked);
      socket.off('party:userBanned', handleUserBanned);
      socket.off('party:userMuted', handleUserMuted);
      socket.off('party:pollCreated', handlePollCreated);
      socket.off('party:pollVote', handlePollVote);
      socket.off('party:pollEnded', handlePollEnded);

      // Quitter la Watch Party
      socket.emit('party:leave', { partyId, userId: user.id });
    };
  }, [partyId, isConnected, user, socket]);

  // Gestionnaires d'événements
  const handlePartyJoined = useCallback((data) => {
    setStatus('connected');
    setPartyInfo(data.party);
    setParticipants(data.participants);
    setMessages(data.messages || []);
    setVideoSync(data.videoSync || { timestamp: 0, isPlaying: false });
    setIsHost(data.party.hostId === user?.id);
    setPendingRequests(data.pendingRequests || []);
    setActivePoll(data.activePoll || null);
    setPollHistory(data.pollHistory || []);
    setBannedUsers(data.bannedUsers || []);

    showToast({
      type: 'success',
      message: 'Vous avez rejoint la Watch Party',
      duration: 3000
    });
  }, [user, showToast]);

  const handlePartyError = useCallback((error) => {
    setStatus('error');
    showToast({
      type: 'error',
      message: error.message || 'Erreur lors de la connexion à la Watch Party',
      duration: 5000
    });
  }, [showToast]);

  const handleUserJoined = useCallback((data) => {
    setParticipants(prev => [...prev, data.user]);

    // Ajouter un message système
    const systemMessage = {
      id: `system-${Date.now()}`,
      type: 'system',
      content: `${data.user.name} a rejoint la Watch Party`,
      timestamp: new Date().toISOString(),
      user: { id: 'system', name: 'Système' }
    };

    setMessages(prev => [...prev, systemMessage]);

    showToast({
      type: 'info',
      message: `${data.user.name} a rejoint la Watch Party`,
      duration: 3000
    });
  }, [showToast]);

  const handleUserLeft = useCallback((data) => {
    setParticipants(prev => prev.filter(p => p.id !== data.userId));

    // Ajouter un message système
    const user = participants.find(p => p.id === data.userId);
    if (user) {
      const systemMessage = {
        id: `system-${Date.now()}`,
        type: 'system',
        content: `${user.name} a quitté la Watch Party`,
        timestamp: new Date().toISOString(),
        user: { id: 'system', name: 'Système' }
      };

      setMessages(prev => [...prev, systemMessage]);
    }
  }, [participants]);

  const handleNewMessage = useCallback((message) => {
    setMessages(prev => [...prev, message]);
  }, []);

  const handleVideoSync = useCallback((syncData) => {
    setVideoSync(syncData);
  }, []);

  const handleSettingsUpdated = useCallback((settings) => {
    setPartyInfo(prev => ({ ...prev, ...settings }));

    showToast({
      type: 'info',
      message: 'Paramètres de la Watch Party mis à jour',
      duration: 3000
    });
  }, [showToast]);

  const handleJoinRequest = useCallback((request) => {
    setPendingRequests(prev => [...prev, request]);

    if (isHost) {
      showToast({
        type: 'info',
        message: `${request.user.name} souhaite rejoindre la Watch Party`,
        duration: 5000
      });
    }
  }, [isHost, showToast]);

  const handleJoinRequestResponse = useCallback((data) => {
    setPendingRequests(prev => prev.filter(r => r.userId !== data.userId));

    if (data.userId === user?.id) {
      if (data.approved) {
        showToast({
          type: 'success',
          message: 'Votre demande a été acceptée',
          duration: 3000
        });
      } else {
        showToast({
          type: 'error',
          message: 'Votre demande a été refusée',
          duration: 3000
        });
      }
    }
  }, [user, showToast]);

  const handleUserKicked = useCallback((data) => {
    if (data.userId === user?.id) {
      setStatus('error');
      showToast({
        type: 'error',
        message: 'Vous avez été exclu de la Watch Party',
        duration: 5000
      });
    } else {
      const kickedUser = participants.find(p => p.id === data.userId);
      if (kickedUser) {
        setParticipants(prev => prev.filter(p => p.id !== data.userId));

        // Ajouter un message système
        const systemMessage = {
          id: `system-${Date.now()}`,
          type: 'system',
          content: `${kickedUser.name} a été exclu de la Watch Party`,
          timestamp: new Date().toISOString(),
          user: { id: 'system', name: 'Système' }
        };

        setMessages(prev => [...prev, systemMessage]);
      }
    }
  }, [user, participants, showToast]);

  const handleUserBanned = useCallback((data) => {
    if (data.userId === user?.id) {
      setStatus('error');
      showToast({
        type: 'error',
        message: 'Vous avez été banni de la Watch Party',
        duration: 5000
      });
    } else {
      const bannedUser = participants.find(p => p.id === data.userId);
      if (bannedUser) {
        setParticipants(prev => prev.filter(p => p.id !== data.userId));
        setBannedUsers(prev => [...prev, data.userId]);

        // Ajouter un message système
        const systemMessage = {
          id: `system-${Date.now()}`,
          type: 'system',
          content: `${bannedUser.name} a été banni de la Watch Party`,
          timestamp: new Date().toISOString(),
          user: { id: 'system', name: 'Système' }
        };

        setMessages(prev => [...prev, systemMessage]);
      }
    }
  }, [user, participants, showToast]);

  const handleUserMuted = useCallback((data) => {
    setParticipants(prev => 
      prev.map(p => p.id === data.userId ? { ...p, isMuted: data.isMuted } : p)
    );

    const mutedUser = participants.find(p => p.id === data.userId);
    if (mutedUser) {
      // Ajouter un message système
      const systemMessage = {
        id: `system-${Date.now()}`,
        type: 'system',
        content: data.isMuted 
          ? `${mutedUser.name} a été mis en sourdine` 
          : `${mutedUser.name} peut à nouveau parler`,
        timestamp: new Date().toISOString(),
        user: { id: 'system', name: 'Système' }
      };

      setMessages(prev => [...prev, systemMessage]);
    }

    if (data.userId === user?.id) {
      showToast({
        type: data.isMuted ? 'warning' : 'success',
        message: data.isMuted 
          ? 'Vous avez été mis en sourdine par l\'hôte' 
          : 'Vous pouvez à nouveau participer au chat',
        duration: 5000
      });
    }
  }, [user, participants, showToast]);

  const handlePollCreated = useCallback((poll) => {
    setActivePoll(poll);

    // Ajouter un message système
    const creator = participants.find(p => p.id === poll.createdBy);
    const creatorName = creator ? creator.name : 'L\'hôte';

    const systemMessage = {
      id: `system-poll-${poll.id}`,
      type: 'system',
      content: `${creatorName} a lancé un sondage : "${poll.title}"`,
      timestamp: new Date().toISOString(),
      user: { id: 'system', name: 'Système' }
    };

    setMessages(prev => [...prev, systemMessage]);

    showToast({
      type: 'info',
      message: 'Nouveau sondage disponible',
      duration: 3000
    });
  }, [participants, showToast]);

  const handlePollVote = useCallback((data) => {
    if (!activePoll || activePoll.id !== data.pollId) return;

    setActivePoll(prev => ({
      ...prev,
      votes: {
        ...prev.votes,
        [data.userId]: data.optionId
      }
    }));

    // Si c'est l'utilisateur actuel qui a voté, afficher un toast
    if (data.userId === user?.id) {
      showToast({
        type: 'success',
        message: 'Votre vote a été enregistré',
        duration: 3000
      });
    }
  }, [activePoll, user, showToast]);

  const handlePollEnded = useCallback((data) => {
    if (!activePoll || activePoll.id !== data.pollId) return;

    // Ajouter le sondage à l'historique
    setPollHistory(prev => [
      { 
        ...activePoll, 
        endedAt: new Date().toISOString(),
        winnerId: data.winnerId
      }, 
      ...prev
    ]);

    // Ajouter un message système avec le résultat
    const winningOption = activePoll.options.find(opt => opt.id === data.winnerId);

    const systemMessage = {
      id: `system-poll-result-${activePoll.id}`,
      type: 'system',
      content: winningOption 
        ? `Résultat du sondage : "${winningOption.title}" a gagné` 
        : `Le sondage "${activePoll.title}" est terminé`,
      timestamp: new Date().toISOString(),
      user: { id: 'system', name: 'Système' }
    };

    setMessages(prev => [...prev, systemMessage]);

    // Réinitialiser le sondage actif
    setActivePoll(null);

    showToast({
      type: 'info',
      message: 'Le sondage est terminé',
      duration: 3000
    });
  }, [activePoll, showToast]);

  // Méthodes d'action

  /**
   * Envoyer un message dans le chat
   * @param {Object} messageData - Données du message
   */
  const sendMessage = useCallback((messageData) => {
    if (!isConnected || !partyId || !user) return;

    // Vérifier si l'utilisateur est en sourdine
    const currentUser = participants.find(p => p.id === user.id);
    if (currentUser?.isMuted) {
      showToast({
        type: 'error',
        message: 'Vous ne pouvez pas envoyer de messages car vous êtes en sourdine',
        duration: 3000
      });
      return;
    }

    const message = {
      id: `msg-${Date.now()}`,
      type: messageData.type || 'text',
      content: messageData.content,
      timestamp: new Date().toISOString(),
      user: {
        id: user.id,
        name: user.displayName,
        profilePicture: user.profilePicture
      },
      ...messageData
    };

    socket.emit('party:message', { partyId, message });

    // Optimistic update
    setMessages(prev => [...prev, message]);
  }, [isConnected, partyId, user, participants, socket, showToast]);

  /**
   * Synchroniser la position de la vidéo
   * @param {number} timestamp - Position en secondes
   * @param {boolean} isPlaying - État de lecture
   */
  const syncVideoPosition = useCallback((timestamp, isPlaying) => {
    if (!isConnected || !partyId || !user) return;

    // Limiter la fréquence des synchronisations
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = setTimeout(() => {
      socket.emit('party:videoSync', { 
        partyId, 
        userId: user.id,
        timestamp,
        isPlaying
      });

      // Optimistic update
      setVideoSync({ timestamp, isPlaying });
    }, 500);
  }, [isConnected, partyId, user, socket]);

  /**
   * Mettre à jour les paramètres de la Watch Party
   * @param {Object} settings - Nouveaux paramètres
   */
  const updatePartySettings = useCallback((settings) => {
    if (!isConnected || !partyId || !user || !isHost) return;

    socket.emit('party:updateSettings', { 
      partyId, 
      userId: user.id,
      settings
    });

    // Optimistic update
    setPartyInfo(prev => ({ ...prev, ...settings }));
  }, [isConnected, partyId, user, isHost, socket]);

  /**
   * Répondre à une demande de participation
   * @param {string} requestUserId - ID de l'utilisateur demandeur
   * @param {boolean} approved - Si la demande est approuvée
   */
  const respondToJoinRequest = useCallback((requestUserId, approved) => {
    if (!isConnected || !partyId || !user || !isHost) return;

    socket.emit('party:respondToJoinRequest', { 
      partyId, 
      hostId: user.id,
      userId: requestUserId,
      approved
    });

    // Optimistic update
    setPendingRequests(prev => prev.filter(r => r.userId !== requestUserId));
  }, [isConnected, partyId, user, isHost, socket]);

  /**
   * Exclure un participant de la Watch Party
   * @param {string} userId - ID de l'utilisateur à exclure
   */
  const kickParticipant = useCallback((userId) => {
    if (!isConnected || !partyId || !user || !isHost) return;

    socket.emit('party:kickUser', { 
      partyId, 
      hostId: user.id,
      userId
    });
  }, [isConnected, partyId, user, isHost, socket]);

  /**
   * Bannir un participant de la Watch Party
   * @param {string} userId - ID de l'utilisateur à bannir
   */
  const banParticipant = useCallback((userId) => {
    if (!isConnected || !partyId || !user || !isHost) return;

    socket.emit('party:banUser', { 
      partyId, 
      hostId: user.id,
      userId
    });
  }, [isConnected, partyId, user, isHost, socket]);

  /**
   * Mettre en sourdine ou réactiver un participant
   * @param {string} userId - ID de l'utilisateur
   * @param {boolean} isMuted - État de sourdine
   */
  const muteParticipant = useCallback((userId, isMuted) => {
    if (!isConnected || !partyId || !user || !isHost) return;

    socket.emit('party:muteUser', { 
      partyId, 
      hostId: user.id,
      userId,
      isMuted
    });
  }, [isConnected, partyId, user, isHost, socket]);

  /**
   * Créer un nouveau sondage
   * @param {Object} pollData - Données du sondage
   */
  const createPoll = useCallback((pollData) => {
    if (!isConnected || !partyId || !user) return;

    const poll = {
      id: `poll-${Date.now()}`,
      title: pollData.title,
      options: pollData.options.map((option, index) => ({
        ...option,
        id: `option-${Date.now()}-${index}`
      })),
      createdBy: user.id,
      createdAt: new Date().toISOString(),
      duration: pollData.duration || 120, // Durée en secondes
      votes: {}
    };

    socket.emit('party:createPoll', { 
      partyId, 
      userId: user.id,
      poll
    });

    // Optimistic update
    setActivePoll(poll);
  }, [isConnected, partyId, user, socket]);

  /**
   * Voter dans un sondage
   * @param {string} pollId - ID du sondage
   * @param {string} optionId - ID de l'option choisie
   */
  const votePoll = useCallback((pollId, optionId) => {
    if (!isConnected || !partyId || !user || !activePoll) return;

    socket.emit('party:votePoll', { 
      partyId, 
      userId: user.id,
      pollId,
      optionId
    });

    // Optimistic update
    setActivePoll(prev => ({
      ...prev,
      votes: {
        ...prev.votes,
        [user.id]: optionId
      }
    }));
  }, [isConnected, partyId, user, activePoll, socket]);

  /**
   * Terminer un sondage
   * @param {string} pollId - ID du sondage
   */
  const endPoll = useCallback((pollId) => {
    if (!isConnected || !partyId || !user || !isHost || !activePoll) return;

    // Calculer l'option gagnante
    const votes = activePoll.votes;
    const voteCounts = {};

    Object.values(votes).forEach(optionId => {
      voteCounts[optionId] = (voteCounts[optionId] || 0) + 1;
    });

    let winnerId = null;
    let maxVotes = 0;

    Object.entries(voteCounts).forEach(([optionId, count]) => {
      if (count > maxVotes) {
        maxVotes = count;
        winnerId = optionId;
      }
    });

    socket.emit('party:endPoll', { 
      partyId, 
      userId: user.id,
      pollId,
      winnerId
    });
  }, [isConnected, partyId, user, isHost, activePoll, socket]);

  return {
    status,
    partyInfo,
    participants,
    messages,
    videoSync,
    isHost,
    pendingRequests,
    activePoll,
    pollHistory,
    bannedUsers,
    sendMessage,
    syncVideoPosition,
    updatePartySettings,
    respondToJoinRequest,
    kickParticipant,
    banParticipant,
    muteParticipant,
    createPoll,
    votePoll,
    endPoll
  };
};
