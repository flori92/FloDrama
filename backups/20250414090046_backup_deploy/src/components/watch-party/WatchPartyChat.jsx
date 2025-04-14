/**
 * Composant de chat pour la fonctionnalité Watch Party
 * Utilise react-native-gifted-chat pour l'interface utilisateur
 */

import React, { useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from '../../adapters/react-native-adapter';
import { GiftedChat, Bubble, Send, SystemMessage, InputToolbar } from '../../adapters/react-native-gifted-chat';
import { useWatchParty } from '../../hooks/useWatchParty';
import { useAuth } from '../../hooks/useAuth';
import { formatTimestamp } from '../../utils/time-formatter';
import { useTheme } from '../../hooks/useTheme';

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
  const { messages, status, sendMessage } = useWatchParty(partyId);
  const { user } = useAuth();
  const { colors } = useTheme();
  const [inputText, setInputText] = useState('');

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

  // Rendu des vues personnalisées (timestamps cliquables)
  const renderCustomView = useCallback((props) => {
    const { currentMessage } = props;
    
    if (currentMessage.videoTimestamp) {
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
    }
    
    return null;
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
    return null;
  }, [status, colors]);

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
      />
    );
  }, [status, colors]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <GiftedChat
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
    height: '100%',
  },
  sendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginRight: 10,
  },
  sendButton: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 5,
  },
  timestampButton: {
    padding: 6,
    borderRadius: 15,
    marginRight: 10,
  },
  timestampText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  timestampContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 5,
    borderRadius: 10,
    marginTop: 5,
    marginBottom: 5,
  },
  timestampLabel: {
    fontSize: 12,
    marginRight: 5,
  },
  timestamp: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  systemMessageContainer: {
    marginBottom: 10,
    marginTop: 5,
  },
  disconnectedContainer: {
    padding: 10,
    alignItems: 'center',
  },
  disconnectedText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
});

export default WatchPartyChat;
