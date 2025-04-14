/**
 * Composant de paramètres pour la Watch Party
 * Permet de configurer les options de la session
 */

import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Switch, ScrollView, Image } from '../../adapters/react-native-adapter';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faUserShield, faUsers, faVolumeMute, faVolumeUp, faLock, faLockOpen } from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../../hooks/useTheme';
import { useWatchParty } from '../../hooks/useWatchParty';
import { useAuth } from '../../hooks/useAuth';

/**
 * Composant de paramètres pour la Watch Party
 * @param {Object} props - Propriétés du composant
 * @param {string} props.layout - Mise en page actuelle
 * @param {Function} props.onLayoutChange - Fonction appelée lors du changement de mise en page
 * @param {Function} props.onClose - Fonction appelée pour fermer le panneau
 * @returns {JSX.Element} - Composant React
 */
const WatchPartySettings = ({ layout, onLayoutChange, onClose }) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { 
    partyInfo, 
    participants, 
    isHost, 
    updatePartySettings, 
    kickParticipant, 
    banParticipant, 
    muteParticipant 
  } = useWatchParty();
  
  // États locaux pour les paramètres
  const [isPrivate, setIsPrivate] = useState(partyInfo?.isPrivate || false);
  const [requireApproval, setRequireApproval] = useState(partyInfo?.requireApproval || false);
  const [chatEnabled, setChatEnabled] = useState(partyInfo?.chatEnabled !== false); // Activé par défaut
  const [showModeration, setShowModeration] = useState(false);
  
  // Mettre à jour les paramètres de la Watch Party
  const handleUpdateSettings = useCallback(() => {
    updatePartySettings({
      isPrivate,
      requireApproval,
      chatEnabled
    });
  }, [isPrivate, requireApproval, chatEnabled, updatePartySettings]);
  
  // Gérer l'expulsion d'un participant
  const handleKickParticipant = useCallback((participantId) => {
    kickParticipant(participantId);
  }, [kickParticipant]);
  
  // Gérer le bannissement d'un participant
  const handleBanParticipant = useCallback((participantId) => {
    banParticipant(participantId);
  }, [banParticipant]);
  
  // Gérer la mise en sourdine d'un participant
  const handleMuteParticipant = useCallback((participantId, isMuted) => {
    muteParticipant(participantId, isMuted);
  }, [muteParticipant]);
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background2 }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Paramètres</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <FontAwesomeIcon icon={faTimes} color={colors.icon} size={20} />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content}>
        {/* Section de mise en page */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Mise en page</Text>
          
          <View style={styles.layoutOptions}>
            <TouchableOpacity 
              style={[
                styles.layoutOption,
                layout === 'side-by-side' && { backgroundColor: colors.primary + '30' },
                { borderColor: colors.border }
              ]}
              onPress={() => onLayoutChange('side-by-side')}
            >
              <View style={styles.layoutPreview}>
                <View style={[styles.layoutPreviewVideo, { backgroundColor: colors.primary + '50' }]} />
                <View style={[styles.layoutPreviewChat, { backgroundColor: colors.secondary + '50' }]} />
              </View>
              <Text style={[styles.layoutOptionText, { color: colors.text }]}>Côte à côte</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.layoutOption,
                layout === 'video-focus' && { backgroundColor: colors.primary + '30' },
                { borderColor: colors.border }
              ]}
              onPress={() => onLayoutChange('video-focus')}
            >
              <View style={styles.layoutPreview}>
                <View style={[styles.layoutPreviewVideoFocus, { backgroundColor: colors.primary + '50' }]} />
                <View style={[styles.layoutPreviewChatSmall, { backgroundColor: colors.secondary + '50' }]} />
              </View>
              <Text style={[styles.layoutOptionText, { color: colors.text }]}>Focus vidéo</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.layoutOption,
                layout === 'chat-focus' && { backgroundColor: colors.primary + '30' },
                { borderColor: colors.border }
              ]}
              onPress={() => onLayoutChange('chat-focus')}
            >
              <View style={styles.layoutPreview}>
                <View style={[styles.layoutPreviewVideoSmall, { backgroundColor: colors.primary + '50' }]} />
                <View style={[styles.layoutPreviewChatFocus, { backgroundColor: colors.secondary + '50' }]} />
              </View>
              <Text style={[styles.layoutOptionText, { color: colors.text }]}>Focus chat</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Section des paramètres de la Watch Party (uniquement pour l'hôte) */}
        {isHost && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Paramètres de la Watch Party</Text>
            
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <FontAwesomeIcon 
                  icon={isPrivate ? faLock : faLockOpen} 
                  color={isPrivate ? colors.primary : colors.icon} 
                  size={18} 
                />
                <Text style={[styles.settingText, { color: colors.text }]}>
                  Watch Party privée
                </Text>
              </View>
              <Switch
                value={isPrivate}
                onValueChange={(value) => {
                  setIsPrivate(value);
                  handleUpdateSettings();
                }}
                trackColor={{ false: colors.border, true: colors.primary + '80' }}
                thumbColor={isPrivate ? colors.primary : colors.textSecondary}
              />
            </View>
            
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <FontAwesomeIcon 
                  icon={faUsers} 
                  color={requireApproval ? colors.primary : colors.icon} 
                  size={18} 
                />
                <Text style={[styles.settingText, { color: colors.text }]}>
                  Approbation requise pour rejoindre
                </Text>
              </View>
              <Switch
                value={requireApproval}
                onValueChange={(value) => {
                  setRequireApproval(value);
                  handleUpdateSettings();
                }}
                trackColor={{ false: colors.border, true: colors.primary + '80' }}
                thumbColor={requireApproval ? colors.primary : colors.textSecondary}
              />
            </View>
            
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <FontAwesomeIcon 
                  icon={chatEnabled ? faVolumeUp : faVolumeMute} 
                  color={chatEnabled ? colors.primary : colors.error} 
                  size={18} 
                />
                <Text style={[styles.settingText, { color: colors.text }]}>
                  Chat activé
                </Text>
              </View>
              <Switch
                value={chatEnabled}
                onValueChange={(value) => {
                  setChatEnabled(value);
                  handleUpdateSettings();
                }}
                trackColor={{ false: colors.border, true: colors.primary + '80' }}
                thumbColor={chatEnabled ? colors.primary : colors.textSecondary}
              />
            </View>
            
            <TouchableOpacity 
              style={[styles.moderationButton, { backgroundColor: colors.primary + '20' }]}
              onPress={() => setShowModeration(!showModeration)}
            >
              <FontAwesomeIcon icon={faUserShield} color={colors.primary} size={18} />
              <Text style={[styles.moderationButtonText, { color: colors.primary }]}>
                {showModeration ? 'Masquer la modération' : 'Afficher la modération'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
        
        {/* Section de modération (uniquement pour l'hôte et si activée) */}
        {isHost && showModeration && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Modération des participants</Text>
            
            {participants.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Aucun participant dans la Watch Party
              </Text>
            ) : (
              participants
                .filter(p => p.id !== user?.id) // Exclure l'hôte
                .map(participant => (
                  <View key={participant.id} style={[styles.participantRow, { borderBottomColor: colors.border }]}>
                    <View style={styles.participantInfo}>
                      {participant.profilePicture ? (
                        <Image 
                          source={{ uri: participant.profilePicture }} 
                          style={styles.participantAvatar} 
                        />
                      ) : (
                        <View style={[styles.participantAvatarPlaceholder, { backgroundColor: colors.primary + '50' }]}>
                          <Text style={[styles.avatarInitial, { color: colors.primary }]}>
                            {participant.name.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                      )}
                      <Text style={[styles.participantName, { color: colors.text }]}>
                        {participant.name}
                      </Text>
                      {participant.isMuted && (
                        <FontAwesomeIcon icon={faVolumeMute} color={colors.error} size={14} style={styles.statusIcon} />
                      )}
                    </View>
                    
                    <View style={styles.participantActions}>
                      <TouchableOpacity 
                        style={[styles.actionButton, { backgroundColor: colors.warning + '20' }]}
                        onPress={() => handleMuteParticipant(participant.id, !participant.isMuted)}
                      >
                        <FontAwesomeIcon 
                          icon={participant.isMuted ? faVolumeUp : faVolumeMute} 
                          color={participant.isMuted ? colors.success : colors.warning} 
                          size={14} 
                        />
                        <Text style={[styles.actionText, { color: participant.isMuted ? colors.success : colors.warning }]}>
                          {participant.isMuted ? 'Réactiver' : 'Muter'}
                        </Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={[styles.actionButton, { backgroundColor: colors.error + '20' }]}
                        onPress={() => handleKickParticipant(participant.id)}
                      >
                        <Text style={[styles.actionText, { color: colors.error }]}>
                          Exclure
                        </Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={[styles.actionButton, { backgroundColor: colors.error + '20' }]}
                        onPress={() => handleBanParticipant(participant.id)}
                      >
                        <Text style={[styles.actionText, { color: colors.error }]}>
                          Bannir
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 350,
    height: '100%',
    zIndex: 100,
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(0, 0, 0, 0.1)',
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
  content: {
    flex: 1,
    padding: 15,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  layoutOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  layoutOption: {
    width: '30%',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  layoutPreview: {
    width: 60,
    height: 60,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 4,
    marginBottom: 5,
    position: 'relative',
  },
  layoutPreviewVideo: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '50%',
    height: '100%',
    borderRadius: 2,
  },
  layoutPreviewChat: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: '50%',
    height: '100%',
    borderRadius: 2,
  },
  layoutPreviewVideoFocus: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    height: '70%',
    borderRadius: 2,
  },
  layoutPreviewChatSmall: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    width: '100%',
    height: '30%',
    borderRadius: 2,
  },
  layoutPreviewVideoSmall: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    height: '30%',
    borderRadius: 2,
  },
  layoutPreviewChatFocus: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    width: '100%',
    height: '70%',
    borderRadius: 2,
  },
  layoutOptionText: {
    fontSize: 12,
    marginTop: 5,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    marginLeft: 10,
    fontSize: 14,
  },
  moderationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 15,
  },
  moderationButtonText: {
    marginLeft: 8,
    fontWeight: '500',
  },
  participantRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  participantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  participantAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  participantAvatarPlaceholder: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  participantName: {
    marginLeft: 10,
    fontSize: 14,
  },
  statusIcon: {
    marginLeft: 5,
  },
  participantActions: {
    flexDirection: 'row',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 5,
  },
  actionText: {
    fontSize: 12,
    marginLeft: 3,
  },
  emptyText: {
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 10,
  },
});

export default WatchPartySettings;
