/**
 * Composant de message pour la Watch Party
 * Affiche un message avec des timestamps cliquables
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { formatTimestamp } from '../../utils/time-formatter';

/**
 * Regex pour détecter les timestamps dans le texte
 * Formats supportés: [00:00], [00:00:00], @00:00, @00:00:00
 */
const TIMESTAMP_REGEX = /(\[|@)(\d{1,2}:\d{2}(:\d{2})?)(\])?/g;

/**
 * Composant pour afficher un message dans la Watch Party
 * @param {Object} props - Propriétés du composant
 * @param {Object} props.message - Message à afficher
 * @param {boolean} props.isMine - Indique si le message est de l'utilisateur courant
 * @param {Function} props.onTimestampClick - Fonction appelée lorsqu'un timestamp est cliqué
 * @param {Function} props.onLongPress - Fonction appelée lors d'un appui long sur le message
 * @returns {JSX.Element} - Composant React
 */
const WatchPartyMessage = ({ message, isMine, onTimestampClick, onLongPress }) => {
  const { colors } = useTheme();
  
  // Fonction pour rendre le texte avec des timestamps cliquables
  const renderTextWithTimestamps = (text) => {
    if (!text) return null;
    
    // Diviser le texte en segments basés sur les timestamps
    const segments = [];
    let lastIndex = 0;
    let match;
    
    // Réinitialiser le regex pour éviter des problèmes avec exec()
    TIMESTAMP_REGEX.lastIndex = 0;
    
    while ((match = TIMESTAMP_REGEX.exec(text)) !== null) {
      // Ajouter le texte avant le timestamp
      if (match.index > lastIndex) {
        segments.push({
          type: 'text',
          content: text.substring(lastIndex, match.index),
          key: `text-${lastIndex}`
        });
      }
      
      // Extraire le timestamp sans les délimiteurs
      const rawTimestamp = match[2];
      
      // Ajouter le timestamp
      segments.push({
        type: 'timestamp',
        content: rawTimestamp,
        key: `timestamp-${match.index}`
      });
      
      lastIndex = match.index + match[0].length;
    }
    
    // Ajouter le reste du texte après le dernier timestamp
    if (lastIndex < text.length) {
      segments.push({
        type: 'text',
        content: text.substring(lastIndex),
        key: `text-${lastIndex}`
      });
    }
    
    // Rendre les segments
    return segments.map(segment => {
      if (segment.type === 'timestamp') {
        return (
          <TouchableOpacity
            key={segment.key}
            onPress={() => onTimestampClick && onTimestampClick(segment.content)}
            style={[styles.timestamp, { backgroundColor: colors.primary + '30' }]}
          >
            <Text style={[styles.timestampText, { color: colors.primary }]}>
              {formatTimestamp(segment.content)}
            </Text>
          </TouchableOpacity>
        );
      } else {
        return (
          <Text 
            key={segment.key} 
            style={[styles.messageText, { color: isMine ? colors.textOnPrimary : colors.text }]}
          >
            {segment.content}
          </Text>
        );
      }
    });
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isMine ? styles.myMessageContainer : styles.otherMessageContainer,
        { 
          backgroundColor: isMine ? colors.primary : colors.backgroundSecondary,
          borderBottomRightRadius: isMine ? 0 : 15,
          borderBottomLeftRadius: isMine ? 15 : 0,
        }
      ]}
      onLongPress={onLongPress}
      delayLongPress={500}
      activeOpacity={0.8}
    >
      {!isMine && (
        <View style={styles.avatarContainer}>
          {message.user.avatar ? (
            <Image source={{ uri: message.user.avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.defaultAvatar, { backgroundColor: colors.primary }]}>
              <Text style={[styles.defaultAvatarText, { color: colors.textOnPrimary }]}>
                {message.user.name ? message.user.name.charAt(0).toUpperCase() : '?'}
              </Text>
            </View>
          )}
        </View>
      )}
      
      <View style={styles.contentContainer}>
        {!isMine && (
          <Text style={[styles.username, { color: colors.primary }]}>
            {message.user.name}
          </Text>
        )}
        
        <View style={styles.messageContent}>
          {renderTextWithTimestamps(message.text)}
        </View>
        
        <Text style={[styles.time, { color: isMine ? colors.textOnPrimary + '80' : colors.textSecondary }]}>
          {formatTimestamp(message.createdAt)}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginVertical: 4,
    maxWidth: '80%',
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  myMessageContainer: {
    alignSelf: 'flex-end',
    marginLeft: 50,
  },
  otherMessageContainer: {
    alignSelf: 'flex-start',
    marginRight: 50,
  },
  avatarContainer: {
    marginRight: 8,
    alignSelf: 'flex-start',
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  defaultAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  defaultAvatarText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  contentContainer: {
    flex: 1,
  },
  username: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  messageContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  timestamp: {
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
    marginHorizontal: 2,
  },
  timestampText: {
    fontSize: 14,
    fontWeight: '500',
  },
  time: {
    fontSize: 10,
    alignSelf: 'flex-end',
    marginTop: 4,
  },
});

export default WatchPartyMessage;
