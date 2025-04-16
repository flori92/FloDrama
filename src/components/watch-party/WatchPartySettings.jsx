/**
 * Composant de paramètres pour la fonctionnalité Watch Party
 * Permet de configurer l'affichage et les options de la session
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView } from '../../adapters/react-native-adapter';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faDesktop, faComments } from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../../hooks/useTheme';

/**
 * Composant de paramètres pour Watch Party
 * @param {Object} props - Propriétés du composant
 * @param {string} props.layout - Disposition actuelle ('side-by-side', 'video-focus', 'chat-focus')
 * @param {Function} props.onLayoutChange - Fonction appelée lors du changement de disposition
 * @param {Function} props.onClose - Fonction appelée à la fermeture du panneau
 * @returns {JSX.Element} - Composant React
 */
const WatchPartySettings = ({ layout, onLayoutChange, onClose }) => {
  const { colors } = useTheme();
  
  // États locaux pour les paramètres
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoSync, setAutoSync] = useState(true);
  const [showTimestamps, setShowTimestamps] = useState(true);
  
  // Fonction pour gérer les changements de disposition
  const handleLayoutChange = (newLayout) => {
    onLayoutChange(newLayout);
  };

  return (
    <View style={[styles.overlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            Paramètres de la Watch Party
          </Text>
          
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <FontAwesomeIcon icon={faTimes} color={colors.text} size={18} />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.content}>
          {/* Section: Disposition */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Disposition
            </Text>
            
            <View style={styles.layoutOptions}>
              <TouchableOpacity
                style={[
                  styles.layoutOption,
                  layout === 'side-by-side' && [styles.selectedOption, { borderColor: colors.primary }]
                ]}
                onPress={() => handleLayoutChange('side-by-side')}
              >
                <FontAwesomeIcon 
                  icon={faDesktop} 
                  color={layout === 'side-by-side' ? colors.primary : colors.icon} 
                  size={20} 
                />
                <Text style={[
                  styles.layoutText,
                  { color: layout === 'side-by-side' ? colors.primary : colors.text }
                ]}>
                  Côte à côte
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.layoutOption,
                  layout === 'video-focus' && [styles.selectedOption, { borderColor: colors.primary }]
                ]}
                onPress={() => handleLayoutChange('video-focus')}
              >
                <FontAwesomeIcon 
                  icon={faDesktop} 
                  color={layout === 'video-focus' ? colors.primary : colors.icon} 
                  size={24} 
                />
                <Text style={[
                  styles.layoutText,
                  { color: layout === 'video-focus' ? colors.primary : colors.text }
                ]}>
                  Focus vidéo
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.layoutOption,
                  layout === 'chat-focus' && [styles.selectedOption, { borderColor: colors.primary }]
                ]}
                onPress={() => handleLayoutChange('chat-focus')}
              >
                <FontAwesomeIcon 
                  icon={faComments} 
                  color={layout === 'chat-focus' ? colors.primary : colors.icon} 
                  size={20} 
                />
                <Text style={[
                  styles.layoutText,
                  { color: layout === 'chat-focus' ? colors.primary : colors.text }
                ]}>
                  Focus chat
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Section: Notifications */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Notifications
            </Text>
            
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  Notifications de messages
                </Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                  Afficher une notification lorsque vous recevez un message
                </Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: colors.switchTrackOff, true: colors.primary }}
                thumbColor={colors.switchThumb}
              />
            </View>
            
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  Sons de notification
                </Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                  Jouer un son lors de la réception d'un message
                </Text>
              </View>
              <Switch
                value={soundEnabled}
                onValueChange={setSoundEnabled}
                trackColor={{ false: colors.switchTrackOff, true: colors.primary }}
                thumbColor={colors.switchThumb}
              />
            </View>
          </View>
          
          {/* Section: Synchronisation */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Synchronisation
            </Text>
            
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  Synchronisation automatique
                </Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                  Synchroniser automatiquement avec les autres participants
                </Text>
              </View>
              <Switch
                value={autoSync}
                onValueChange={setAutoSync}
                trackColor={{ false: colors.switchTrackOff, true: colors.primary }}
                thumbColor={colors.switchThumb}
              />
            </View>
            
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  Afficher les timestamps
                </Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                  Afficher les timestamps cliquables dans les messages
                </Text>
              </View>
              <Switch
                value={showTimestamps}
                onValueChange={setShowTimestamps}
                trackColor={{ false: colors.switchTrackOff, true: colors.primary }}
                thumbColor={colors.switchThumb}
              />
            </View>
          </View>
        </ScrollView>
        
        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={onClose}
          >
            <Text style={[styles.buttonText, { color: colors.textOnPrimary }]}>
              Appliquer
            </Text>
          </TouchableOpacity>
        </View>
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
    maxWidth: 500,
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
  content: {
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
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedOption: {
    borderWidth: 2,
  },
  layoutText: {
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  settingInfo: {
    flex: 1,
    marginRight: 10,
  },
  settingLabel: {
    fontSize: 16,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 12,
  },
  footer: {
    padding: 15,
    borderTopWidth: 1,
    alignItems: 'flex-end',
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default WatchPartySettings;
