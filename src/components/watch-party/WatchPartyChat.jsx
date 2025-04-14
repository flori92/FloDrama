/**
 * Composant de chat pour la fonctionnalité Watch Party
 * Utilise react-native-gifted-chat pour l'interface utilisateur
 */

import React, { useState, useCallback, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, FlatList } from '../../adapters/react-native-adapter';
import { GiftedChat, Bubble, Send, SystemMessage, InputToolbar, Actions } from '../../adapters/react-native-gifted-chat';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSmile, faThumbsUp, faHeart, faLaugh, faSurprise, faSadTear, faAngry } from '@fortawesome/free-solid-svg-icons';
import { useWatchParty } from '../../hooks/useWatchParty';
import { useAuth } from '../../hooks/useAuth';
import { formatTimestamp } from '../../utils/time-formatter';
import { useTheme } from '../../hooks/useTheme';

// Liste des émojis disponibles pour les réactions rapides
const QUICK_REACTIONS = [
  { id: 'thumbs-up', icon: faThumbsUp, label: '👍' },
  { id: 'heart', icon: faHeart, label: '❤️' },
  { id: 'laugh', icon: faLaugh, label: '😂' },
  { id: 'surprise', icon: faSurprise, label: '😮' },
  { id: 'sad', icon: faSadTear, label: '😢' },
  { id: 'angry', icon: faAngry, label: '😡' },
];

// Liste des émojis populaires pour le sélecteur
const POPULAR_EMOJIS = [
  '😀', '😂', '😍', '🤔', '👍', '👏', '🔥', '❤️', '💯', '🎉',
  '😊', '🙌', '👀', '💪', '🤣', '😎', '🙏', '👌', '🥰', '😱',
];

/**
 * Composant de chat pour Watch Party
 * @param {Object} props - Propriétés du composant
 * @param {string} props.partyId - Identifiant de la Watch Party
 * @param {number} props.videoTimestamp - Position actuelle de la vidéo en secondes
 * @param {Function} props.onSeekTo - Fonction appelée pour naviguer à un timestamp
 * @param {boolean} props.isPlaying - État de lecture de la vidéo
 * @returns {JSX.Element} - Composant React
 */
const WatchPartyChat = ({ 
  partyId, 
  videoTimestamp, 
  onSeekTo,
  isPlaying,
  onVideoSync
}) => {
  const { messages, status, sendMessage, addReaction } = useWatchParty(partyId);
  const { user } = useAuth();
  const { colors } = useTheme();
  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState(null);
  
  // Référence pour le composant GiftedChat
  const chatRef = useRef(null);

  // Synchroniser la position vidéo lorsque l'utilisateur partage un timestamp
  const handleSendWithTimestamp = useCallback(() => {
    if (inputText.trim()) {
      const messageWithTimestamp = [{
        _id: Math.random().toString(),
        text: inputText,
        createdAt: new Date(),
        user: {
          _id: user?.id || 'guest',
          name: user?.displayName || 'Invité',
          avatar: user?.profilePicture,
        },
        videoTimestamp,
      }];
      
      sendMessage(messageWithTimestamp);
      setInputText('');
    }
  }, [inputText, videoTimestamp, user, sendMessage]);

  // Ajouter un emoji au texte d'entrée
  const handleAddEmoji = useCallback((emoji) => {
    setInputText(prev => prev + emoji);
    setShowEmojiPicker(false);
  }, []);

  // Ajouter une réaction à un message
  const handleAddReaction = useCallback((messageId, reaction) => {
    addReaction(messageId, {
      type: reaction,
      user: {
        _id: user?.id || 'guest',
        name: user?.displayName || 'Invité',
      },
      createdAt: new Date(),
    });
    setSelectedMessageId(null);
  }, [addReaction, user]);

  // Envoyer une réaction rapide
  const handleQuickReaction = useCallback((reaction) => {
    const quickReactionMessage = [{
      _id: Math.random().toString(),
      text: reaction,
      createdAt: new Date(),
      user: {
        _id: user?.id || 'guest',
        name: user?.displayName || 'Invité',
        avatar: user?.profilePicture,
      },
      isReaction: true,
    }];
    
    sendMessage(quickReactionMessage);
  }, [user, sendMessage]);

  // Personnalisation des bulles de message
  const renderBubble = useCallback((props) => {
    return (
      <Bubble
        {...props}
        wrapperStyle={{
          left: {
            backgroundColor: colors.chatBubbleLeft,
          },
          right: {
            backgroundColor: colors.primary,
          },
        }}
        textStyle={{
          left: {
            color: colors.text,
          },
          right: {
            color: colors.textOnPrimary,
          },
        }}
        // Ajouter un long press pour les réactions
        onLongPress={() => setSelectedMessageId(props.currentMessage._id)}
      />
    );
  }, [colors]);

  // Personnalisation du bouton d'envoi
  const renderSend = useCallback((props) => {
    return (
      <View style={styles.sendContainer}>
        {videoTimestamp > 0 && (
          <TouchableOpacity 
            style={[styles.timestampButton, { backgroundColor: colors.secondary }]}
            onPress={handleSendWithTimestamp}
          >
            <Text style={[styles.timestampText, { color: colors.textOnSecondary }]}>
              {formatTimestamp(videoTimestamp)}
            </Text>
          </TouchableOpacity>
        )}
        <Send {...props} containerStyle={styles.sendButton}>
          <Text style={{ color: colors.primary }}>Envoyer</Text>
        </Send>
      </View>
    );
  }, [colors, videoTimestamp, handleSendWithTimestamp]);

  // Personnalisation des messages système
  const renderSystemMessage = useCallback((props) => {
    return (
      <SystemMessage
        {...props}
        containerStyle={styles.systemMessageContainer}
        textStyle={{
          color: colors.textSecondary,
          fontSize: 12,
          fontStyle: 'italic',
        }}
      />
    );
  }, [colors]);

  // Rendu des vues personnalisées (timestamps cliquables et réactions)
  const renderCustomView = useCallback((props) => {
    const { currentMessage } = props;
    
    // Afficher les réactions si présentes
    if (currentMessage.reactions && currentMessage.reactions.length > 0) {
      const reactionCounts = currentMessage.reactions.reduce((acc, reaction) => {
        acc[reaction.type] = (acc[reaction.type] || 0) + 1;
        return acc;
      }, {});
      
      return (
        <View style={styles.reactionsContainer}>
          {Object.entries(reactionCounts).map(([type, count]) => (
            <View key={type} style={[styles.reactionBadge, { backgroundColor: colors.background2 }]}>
              <Text style={styles.reactionEmoji}>{type}</Text>
              <Text style={[styles.reactionCount, { color: colors.textSecondary }]}>{count}</Text>
            </View>
          ))}
          {currentMessage.videoTimestamp && renderTimestampButton(currentMessage)}
        </View>
      );
    }
    
    // Afficher uniquement le timestamp si présent
    if (currentMessage.videoTimestamp) {
      return renderTimestampButton(currentMessage);
    }
    
    return null;
  }, [colors, onSeekTo]);

  // Fonction utilitaire pour rendre le bouton de timestamp
  const renderTimestampButton = useCallback((currentMessage) => {
    return (
      <TouchableOpacity 
        style={[styles.timestampContainer, { backgroundColor: colors.background2 }]}
        onPress={() => onSeekTo(currentMessage.videoTimestamp)}
      >
        <Text style={[styles.timestampLabel, { color: colors.textSecondary }]}>
          Aller à 
        </Text>
        <Text style={[styles.timestamp, { color: colors.accent }]}>
          {formatTimestamp(currentMessage.videoTimestamp)}
        </Text>
      </TouchableOpacity>
    );
  }, [colors, onSeekTo]);

  // Afficher l'état de connexion
  const renderFooter = useCallback(() => {
    if (!status.connected) {
      return (
        <View style={styles.disconnectedContainer}>
          <Text style={[styles.disconnectedText, { color: colors.error }]}>
            Déconnecté de la Watch Party. Reconnexion en cours...
          </Text>
        </View>
      );
    }
    
    // Afficher le sélecteur d'émojis si activé
    if (showEmojiPicker) {
      return (
        <View style={[styles.emojiPickerContainer, { backgroundColor: colors.background2 }]}>
          <View style={styles.emojiPickerHeader}>
            <Text style={[styles.emojiPickerTitle, { color: colors.text }]}>Émojis</Text>
            <TouchableOpacity onPress={() => setShowEmojiPicker(false)}>
              <Text style={{ color: colors.textSecondary }}>Fermer</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={POPULAR_EMOJIS}
            horizontal={false}
            numColumns={5}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.emojiItem} 
                onPress={() => handleAddEmoji(item)}
              >
                <Text style={styles.emojiText}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      );
    }
    
    // Afficher le menu de réaction si un message est sélectionné
    if (selectedMessageId) {
      return (
        <View style={[styles.reactionMenuContainer, { backgroundColor: colors.background2 }]}>
          <View style={styles.reactionMenuHeader}>
            <Text style={[styles.reactionMenuTitle, { color: colors.text }]}>Réagir</Text>
            <TouchableOpacity onPress={() => setSelectedMessageId(null)}>
              <Text style={{ color: colors.textSecondary }}>Annuler</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.reactionOptions}>
            {POPULAR_EMOJIS.slice(0, 8).map((emoji) => (
              <TouchableOpacity 
                key={emoji} 
                style={styles.reactionOption}
                onPress={() => handleAddReaction(selectedMessageId, emoji)}
              >
                <Text style={styles.reactionOptionText}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      );
    }
    
    // Afficher les réactions rapides
    return (
      <View style={[styles.quickReactionsContainer, { backgroundColor: colors.background }]}>
        <FlatList
          data={QUICK_REACTIONS}
          horizontal
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={[styles.quickReactionButton, { backgroundColor: colors.background2 }]}
              onPress={() => handleQuickReaction(item.label)}
            >
              <Text style={styles.quickReactionText}>{item.label}</Text>
            </TouchableOpacity>
          )}
        />
      </View>
    );
  }, [status, colors, showEmojiPicker, selectedMessageId, handleAddEmoji, handleAddReaction, handleQuickReaction]);

  // Personnalisation de la zone de saisie
  const renderInputToolbar = useCallback((props) => {
    // Désactiver la saisie si déconnecté
    if (!status.connected) {
      return null;
    }
    return (
      <InputToolbar
        {...props}
        containerStyle={{
          backgroundColor: colors.background,
          borderTopColor: colors.border,
        }}
        renderActions={() => (
          <Actions
            containerStyle={styles.actionsContainer}
            icon={() => (
              <TouchableOpacity onPress={() => setShowEmojiPicker(true)}>
                <FontAwesomeIcon icon={faSmile} color={colors.icon} size={24} />
              </TouchableOpacity>
            )}
          />
        )}
      />
    );
  }, [status, colors]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <GiftedChat
        ref={chatRef}
        messages={messages}
        onSend={sendMessage}
        user={{
          _id: user?.id || 'guest',
          name: user?.displayName || 'Invité',
          avatar: user?.profilePicture,
        }}
        renderBubble={renderBubble}
        renderSend={renderSend}
        renderSystemMessage={renderSystemMessage}
        renderCustomView={renderCustomView}
        renderFooter={renderFooter}
        renderInputToolbar={renderInputToolbar}
        placeholder="Discutez pendant le visionnage..."
        alwaysShowSend
        scrollToBottom
        text={inputText}
        onInputTextChanged={setInputText}
        textInputProps={{
          style: {
            color: colors.text,
            backgroundColor: colors.inputBackground,
            borderRadius: 20,
            paddingHorizontal: 12,
            marginRight: 10,
          },
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sendButton: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 5,
  },
  timestampButton: {
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 10,
  },
  timestampText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  systemMessageContainer: {
    marginBottom: 10,
    marginTop: 5,
  },
  timestampContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 5,
    alignSelf: 'flex-start',
  },
  timestampLabel: {
    fontSize: 12,
    marginRight: 4,
  },
  timestamp: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  disconnectedContainer: {
    padding: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  disconnectedText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  // Styles pour les réactions
  reactionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5,
  },
  reactionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 5,
    marginBottom: 5,
  },
  reactionEmoji: {
    fontSize: 14,
    marginRight: 3,
  },
  reactionCount: {
    fontSize: 12,
  },
  // Styles pour le menu de réaction
  reactionMenuContainer: {
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  reactionMenuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  reactionMenuTitle: {
    fontWeight: 'bold',
  },
  reactionOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  reactionOption: {
    padding: 10,
    borderRadius: 20,
    margin: 5,
  },
  reactionOptionText: {
    fontSize: 18,
  },
  // Styles pour les réactions rapides
  quickReactionsContainer: {
    paddingVertical: 10,
  },
  quickReactionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 5,
  },
  quickReactionText: {
    fontSize: 16,
  },
  // Styles pour le sélecteur d'émojis
  emojiPickerContainer: {
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  emojiPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  emojiPickerTitle: {
    fontWeight: 'bold',
  },
  emojiItem: {
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiText: {
    fontSize: 24,
  },
  // Styles pour les actions
  actionsContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
});

export default WatchPartyChat;
