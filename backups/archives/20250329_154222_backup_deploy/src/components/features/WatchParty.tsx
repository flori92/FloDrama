import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSocket } from '../../hooks/useSocket';
import { useAuth } from '../../hooks/useAuth';
import { WatchPartyMessage, WatchPartyMember, MessageType } from '../../types/watchParty';
import EmojiPicker from './EmojiPicker';
import '../../styles/components/watchParty.scss';

const EMOJI_SHORTCUTS: Record<string, string> = {
  ':)': '😊',
  ':D': '😄',
  ':(': '😢',
  ':p': '😛',
  '<3': '❤️',
  ':fire:': '🔥',
  ':clap:': '👏',
};

const WatchParty: React.FC = () => {
  const { socket } = useSocket();
  const { user } = useAuth();
  const [messages, setMessages] = useState<WatchPartyMessage[]>([]);
  const [members, setMembers] = useState<WatchPartyMember[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const roomId = "default-room"; // À remplacer par un ID dynamique ou provenant des paramètres d'URL

  // Fonction pour rejoindre la watch party
  useEffect(() => {
    if (socket && user) {
      // Rejoindre la room
      socket.emit('joinWatchParty', {
        roomId,
        userId: user.id,
        username: user.username,
      });

      // Écouter les messages
      socket.on('watchPartyMessage', (message: WatchPartyMessage) => {
        setMessages(prev => [...prev, message]);
      });

      // Écouter les mises à jour des membres
      socket.on('watchPartyMembers', (updatedMembers: WatchPartyMember[]) => {
        setMembers(updatedMembers);
      });

      // Écouter les commandes vidéo (play, pause, seek)
      socket.on('videoControl', (data: { action: string; time?: number }) => {
        if (!videoRef.current) return;

        if (data.action === 'play') {
          videoRef.current.play();
        } else if (data.action === 'pause') {
          videoRef.current.pause();
        } else if (data.action === 'seek' && data.time !== undefined) {
          videoRef.current.currentTime = data.time;
        }
      });

      // Nettoyage lors du démontage du composant
      return () => {
        socket.emit('leaveWatchParty', { roomId, userId: user.id });
        socket.off('watchPartyMessage');
        socket.off('watchPartyMembers');
        socket.off('videoControl');
      };
    }
  }, [socket, user, roomId]);

  // Scroll automatique vers le bas lors de nouveaux messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fonction pour afficher une animation de réaction
  const showReactionAnimation = useCallback((emoji: string, containerId: string) => {
    const container = document.getElementById(containerId);
    if (!container) return;

    const reactionElement = document.createElement('div');
    reactionElement.className = 'reaction-animation';
    reactionElement.textContent = emoji;
    
    // Position aléatoire horizontale
    const randomX = Math.floor(Math.random() * (container.offsetWidth - 40));
    reactionElement.style.left = `${randomX}px`;
    
    container.appendChild(reactionElement);
    
    // Supprimer l'élément après l'animation
    setTimeout(() => {
      if (container.contains(reactionElement)) {
        container.removeChild(reactionElement);
      }
    }, 1500);
  }, []);

  // Fonction pour envoyer un message
  const sendMessage = useCallback(() => {
    if (!socket || !user || (!inputMessage.trim() && !showEmojiPicker)) return;

    const messageContent = inputMessage.trim();
    
    // Vérifier si le message contient des raccourcis d'emoji
    let processedMessage = messageContent;
    Object.entries(EMOJI_SHORTCUTS).forEach(([shortcut, emoji]) => {
      processedMessage = processedMessage.replace(new RegExp(shortcut, 'g'), emoji);
    });

    if (processedMessage) {
      const newMessage: WatchPartyMessage = {
        id: Date.now().toString(),
        userId: user.id,
        username: user.username,
        content: processedMessage,
        timestamp: new Date().toISOString(),
        type: MessageType.TEXT,
      };

      socket.emit('sendWatchPartyMessage', {
        roomId,
        message: newMessage,
      });

      setInputMessage('');
    }
  }, [inputMessage, socket, user, roomId, showEmojiPicker]);

  // Gérer l'envoi avec la touche Entrée
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);

  // Envoyer un emoji
  const handleEmojiSelect = useCallback((emoji: string) => {
    const newMessage: WatchPartyMessage = {
      id: Date.now().toString(),
      userId: user?.id || '',
      username: user?.username || '',
      content: emoji,
      timestamp: new Date().toISOString(),
      type: MessageType.EMOJI,
    };

    if (socket && user) {
      socket.emit('sendWatchPartyMessage', {
        roomId,
        message: newMessage,
      });
      
      // Afficher une animation de réaction dans le conteneur vidéo
      showReactionAnimation(emoji, 'video-container');
    }
    
    // Fermer le sélecteur d'émojis après la sélection
    setShowEmojiPicker(false);
  }, [socket, user, roomId, showReactionAnimation]);

  // Envoyer un GIF
  const handleGifSelect = useCallback((gifUrl: string) => {
    const newMessage: WatchPartyMessage = {
      id: Date.now().toString(),
      userId: user?.id || '',
      username: user?.username || '',
      content: gifUrl,
      timestamp: new Date().toISOString(),
      type: MessageType.GIF,
    };

    if (socket && user) {
      socket.emit('sendWatchPartyMessage', {
        roomId,
        message: newMessage,
      });
    }
    
    // Fermer le sélecteur d'émojis après la sélection
    setShowEmojiPicker(false);
  }, [socket, user, roomId]);

  // Contrôles vidéo
  const handleVideoPlay = useCallback(() => {
    if (socket) {
      socket.emit('videoControl', { roomId, action: 'play' });
    }
  }, [socket, roomId]);

  const handleVideoPause = useCallback(() => {
    if (socket) {
      socket.emit('videoControl', { roomId, action: 'pause' });
    }
  }, [socket, roomId]);

  const handleVideoSeek = useCallback(() => {
    if (socket && videoRef.current) {
      socket.emit('videoControl', {
        roomId,
        action: 'seek',
        time: videoRef.current.currentTime,
      });
    }
  }, [socket, roomId]);

  // Formater l'heure pour l'affichage
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Basculer l'affichage du sélecteur d'émojis
  const toggleEmojiPicker = useCallback(() => {
    setShowEmojiPicker(prev => !prev);
  }, []);

  return (
    <div className="watch-party">
      <div className="video-container" id="video-container">
        <video
          ref={videoRef}
          controls
          onPlay={handleVideoPlay}
          onPause={handleVideoPause}
          onSeeked={handleVideoSeek}
        >
          <source src="/path/to/your/video.mp4" type="video/mp4" />
          Votre navigateur ne supporte pas la lecture vidéo.
        </video>
      </div>

      <div className="chat-container">
        <div className="members-list">
          {members.map((member) => (
            <div key={member.userId} className="member-item">
              <span className="member-name">{member.username}</span>
              {member.isHost && <span className="host-badge">Hôte</span>}
              <span className={`status-badge ${member.isReady ? 'ready' : 'not-ready'}`}>
                {member.isReady ? 'Prêt' : 'Pas prêt'}
              </span>
            </div>
          ))}
        </div>

        <div className="chat-messages" ref={chatContainerRef}>
          {messages.map((message) => (
            <div
              key={message.id}
              className={`message ${message.userId === user?.id ? 'own-message' : ''} ${
                message.type === MessageType.SYSTEM ? 'system' : ''
              }`}
            >
              {message.type !== MessageType.SYSTEM && (
                <div className="message-header">
                  <span className="username">{message.username}</span>
                  <span className="timestamp">{formatTime(message.timestamp)}</span>
                </div>
              )}

              <div className={`message-content ${message.type === MessageType.EMOJI ? 'emoji-message' : ''}`}>
                {message.type === MessageType.GIF ? (
                  <img src={message.content} alt="GIF" className="gif-content" />
                ) : (
                  message.content
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Écrivez un message..."
          />
          <div className="emoji-picker-container">
            <button 
              className="emoji-button" 
              onClick={toggleEmojiPicker}
              aria-label="Afficher/Masquer les émojis"
            >
              😊
            </button>
            {showEmojiPicker && (
              <EmojiPicker onSelect={handleEmojiSelect} onGifSelect={handleGifSelect} />
            )}
          </div>
          <button className="send-button" onClick={sendMessage}>
            Envoyer
          </button>
        </div>
      </div>
    </div>
  );
};

export default WatchParty;
