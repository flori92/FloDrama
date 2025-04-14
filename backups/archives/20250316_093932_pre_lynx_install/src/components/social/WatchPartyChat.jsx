import React, { useState, useEffect, useRef } from 'react';
import { Box, TextField, Button, Typography, Avatar, Paper, IconButton, Divider } from '@mui/material';
import { styled } from '@mui/material/styles';
import SendIcon from '@mui/icons-material/Send';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import socialViewingService from '../../services/SocialViewingService';
import dayjs from '../../config/dayjsConfig';

// Styles personnalisés
const ChatContainer = styled(Paper)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  maxHeight: '400px',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.background.paper,
  boxShadow: theme.shadows[3],
}));

const MessagesContainer = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  overflow: 'auto',
  padding: theme.spacing(2),
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1),
}));

const MessageBubble = styled(Box)(({ theme, isCurrentUser }) => ({
  display: 'flex',
  flexDirection: isCurrentUser ? 'row-reverse' : 'row',
  alignItems: 'flex-start',
  gap: theme.spacing(1),
  maxWidth: '80%',
  alignSelf: isCurrentUser ? 'flex-end' : 'flex-start',
}));

const MessageContent = styled(Box)(({ theme, isCurrentUser }) => ({
  backgroundColor: isCurrentUser ? theme.palette.primary.main : theme.palette.grey[100],
  color: isCurrentUser ? theme.palette.primary.contrastText : theme.palette.text.primary,
  padding: theme.spacing(1, 2),
  borderRadius: theme.shape.borderRadius,
  borderTopLeftRadius: isCurrentUser ? theme.shape.borderRadius : 0,
  borderTopRightRadius: isCurrentUser ? 0 : theme.shape.borderRadius,
  wordBreak: 'break-word',
}));

const InputContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  padding: theme.spacing(1),
  borderTop: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.default,
}));

const TimeStamp = styled(Typography)(({ theme }) => ({
  fontSize: '0.7rem',
  color: theme.palette.text.secondary,
  marginTop: theme.spacing(0.5),
}));

/**
 * Composant de chat pour les soirées de visionnage
 */
const WatchPartyChat = ({ watchPartyId }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  
  // Charger les messages existants et configurer les écouteurs d'événements
  useEffect(() => {
    if (!watchPartyId) return;
    
    // Fonction pour gérer les nouveaux messages
    const handleNewMessage = (event) => {
      setMessages(prevMessages => [...prevMessages, event.detail]);
    };
    
    // Ajouter l'écouteur d'événements
    window.addEventListener('watchPartyChatMessageReceived', handleNewMessage);
    
    // Initialiser avec les messages existants
    setMessages(socialViewingService.chatMessages);
    
    // Nettoyage
    return () => {
      window.removeEventListener('watchPartyChatMessageReceived', handleNewMessage);
    };
  }, [watchPartyId]);
  
  // Faire défiler automatiquement vers le bas lorsque de nouveaux messages arrivent
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Envoyer un nouveau message
  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    
    try {
      setIsLoading(true);
      await socialViewingService.sendChatMessage(newMessage);
      setNewMessage('');
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      // Afficher une notification d'erreur
    } finally {
      setIsLoading(false);
    }
  };
  
  // Gérer l'envoi avec la touche Entrée
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  // Formater la date relative
  const formatMessageTime = (timestamp) => {
    try {
      return dayjs(timestamp).fromNow();
    } catch (error) {
      return 'à l\'instant';
    }
  };
  
  return (
    <ChatContainer>
      <Box p={2} bgcolor="primary.dark" color="primary.contrastText">
        <Typography variant="h6">Chat de la soirée</Typography>
      </Box>
      
      <Divider />
      
      <MessagesContainer>
        {messages.length === 0 ? (
          <Box display="flex" justifyContent="center" alignItems="center" height="100%">
            <Typography variant="body2" color="textSecondary">
              Aucun message. Soyez le premier à écrire !
            </Typography>
          </Box>
        ) : (
          messages.map((message) => {
            const isCurrentUser = message.sender === 'Moi' || message.isCurrentUser;
            
            return (
              <MessageBubble key={message.id} isCurrentUser={isCurrentUser}>
                {!isCurrentUser && (
                  <Avatar 
                    alt={message.sender} 
                    src={message.senderAvatar}
                    sx={{ width: 32, height: 32 }}
                  />
                )}
                
                <Box>
                  {!isCurrentUser && (
                    <Typography variant="subtitle2" component="span" sx={{ ml: 1 }}>
                      {message.sender}
                    </Typography>
                  )}
                  
                  <MessageContent isCurrentUser={isCurrentUser}>
                    <Typography variant="body2">{message.content}</Typography>
                  </MessageContent>
                  
                  <TimeStamp align={isCurrentUser ? 'right' : 'left'}>
                    {formatMessageTime(message.timestamp)}
                  </TimeStamp>
                </Box>
              </MessageBubble>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </MessagesContainer>
      
      <InputContainer>
        <IconButton color="primary" aria-label="emoji">
          <EmojiEmotionsIcon />
        </IconButton>
        
        <TextField
          fullWidth
          placeholder="Écrivez votre message..."
          variant="outlined"
          size="small"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isLoading}
          sx={{ mx: 1 }}
        />
        
        <Button
          variant="contained"
          color="primary"
          endIcon={<SendIcon />}
          onClick={handleSendMessage}
          disabled={isLoading || !newMessage.trim()}
        >
          Envoyer
        </Button>
      </InputContainer>
    </ChatContainer>
  );
};

export default WatchPartyChat;
