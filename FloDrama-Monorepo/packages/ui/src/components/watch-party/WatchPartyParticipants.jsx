/**
 * Composant pour afficher et gérer les participants d'une Watch Party
 */

import React from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity } from '../../adapters/react-native-adapter';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faCrown, faMicrophone, faMicrophoneSlash } from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';

/**
 * Composant d'affichage des participants
 * @param {Object} props - Propriétés du composant
 * @param {Array} props.participants - Liste des participants
 * @param {Function} props.onClose - Fonction appelée à la fermeture du panneau
 * @returns {JSX.Element} - Composant React
 */
const WatchPartyParticipants = ({ participants = [], onClose }) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  
  // Trier les participants (hôte en premier, puis par ordre alphabétique)
  const sortedParticipants = [...participants].sort((a, b) => {
    if (a.isHost && !b.isHost) return -1;
    if (!a.isHost && b.isHost) return 1;
    return a.displayName.localeCompare(b.displayName);
  });

  // Rendu d'un participant
  const renderParticipant = ({ item }) => {
    const isCurrentUser = item.id === user?.id;
    
    return (
      <View style={[
        styles.participantItem,
        isCurrentUser && { backgroundColor: colors.backgroundHighlight }
      ]}>
        <Image
          source={{ uri: item.avatar || 'https://via.placeholder.com/40' }}
          style={styles.avatar}
        />
        
        <View style={styles.participantInfo}>
          <Text style={[styles.participantName, { color: colors.text }]}>
            {item.displayName}
            {isCurrentUser && ' (Vous)'}
          </Text>
          
          {item.status && (
            <Text style={[styles.participantStatus, { color: colors.textSecondary }]}>
              {item.status}
            </Text>
          )}
        </View>
        
        <View style={styles.participantIcons}>
          {item.isHost && (
            <FontAwesomeIcon icon={faCrown} color={colors.warning} size={14} style={styles.icon} />
          )}
          
          {item.isMuted ? (
            <FontAwesomeIcon icon={faMicrophoneSlash} color={colors.error} size={14} style={styles.icon} />
          ) : (
            <FontAwesomeIcon icon={faMicrophone} color={colors.success} size={14} style={styles.icon} />
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.overlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            Participants ({participants.length})
          </Text>
          
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <FontAwesomeIcon icon={faTimes} color={colors.text} size={18} />
          </TouchableOpacity>
        </View>
        
        {participants.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Aucun autre participant pour le moment.
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              Partagez le lien de la Watch Party pour inviter vos amis !
            </Text>
          </View>
        ) : (
          <FlatList
            data={sortedParticipants}
            renderItem={renderParticipant}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  container: {
    width: '80%',
    maxWidth: 400,
    maxHeight: '80%',
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  listContent: {
    padding: 10,
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  participantInfo: {
    flex: 1,
    marginLeft: 10,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '500',
  },
  participantStatus: {
    fontSize: 12,
    marginTop: 2,
  },
  participantIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginLeft: 8,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default WatchPartyParticipants;
