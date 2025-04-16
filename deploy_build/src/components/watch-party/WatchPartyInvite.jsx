/**
 * Composant d'invitation pour la fonctionnalité Watch Party
 * Permet de générer et partager des liens d'invitation
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faCopy, faShare, faEnvelope } from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { useTheme } from '../../hooks/useTheme';
import { copyToClipboard } from '../../utils/clipboard';

/**
 * Composant modal d'invitation pour Watch Party
 * @param {Object} props - Propriétés du composant
 * @param {string} props.partyId - Identifiant de la Watch Party
 * @param {string} props.dramaId - Identifiant du drama
 * @param {Function} props.onClose - Fonction appelée à la fermeture du modal
 * @param {Function} props.onInviteSuccess - Fonction appelée après une invitation réussie
 * @returns {JSX.Element} - Composant React
 */
const WatchPartyInvite = ({ partyId, dramaId, onClose, onInviteSuccess }) => {
  const { colors } = useTheme();
  
  // États locaux
  const [inviteEmail, setInviteEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  
  // Générer le lien d'invitation
  const getInviteLink = () => {
    // Dans un environnement de production, utilisez window.location.origin
    // Pour le développement, on utilise une URL fixe
    const baseUrl = 'https://flodrama.com';
    return `${baseUrl}/watch-party/${partyId}/${dramaId}`;
  };
  
  // Copier le lien d'invitation dans le presse-papiers
  const handleCopyLink = async () => {
    const inviteLink = getInviteLink();
    const success = await copyToClipboard(inviteLink);
    
    if (success) {
      setSuccessMessage('Lien copié dans le presse-papiers !');
      setTimeout(() => setSuccessMessage(null), 3000);
      
      if (onInviteSuccess) {
        onInviteSuccess(inviteLink);
      }
    } else {
      setError('Impossible de copier le lien. Veuillez réessayer.');
      setTimeout(() => setError(null), 3000);
    }
  };
  
  // Envoyer une invitation par email
  const handleSendEmail = async () => {
    if (!inviteEmail || !inviteEmail.includes('@')) {
      setError('Veuillez entrer une adresse email valide.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulation d'un appel API pour envoyer l'email
      // À remplacer par un véritable appel API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccessMessage(`Invitation envoyée à ${inviteEmail} !`);
      setInviteEmail('');
      
      if (onInviteSuccess) {
        onInviteSuccess(getInviteLink());
      }
    } catch (err) {
      setError('Erreur lors de l\'envoi de l\'invitation. Veuillez réessayer.');
      console.error('Erreur d\'invitation:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Partager via WhatsApp (si disponible)
  const handleShareWhatsApp = () => {
    const inviteLink = getInviteLink();
    const whatsappUrl = `https://wa.me/?text=Rejoins-moi pour regarder un drama sur FloDrama ! ${inviteLink}`;
    
    // Dans un environnement web, ouvrir dans un nouvel onglet
    window.open(whatsappUrl, '_blank');
    
    if (onInviteSuccess) {
      onInviteSuccess(inviteLink);
    }
  };
  
  // Partager via l'API de partage native (si disponible)
  const handleShareNative = async () => {
    const inviteLink = getInviteLink();
    const shareText = `Rejoins-moi pour regarder un drama sur FloDrama ! ${inviteLink}`;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Invitation FloDrama Watch Party',
          text: shareText,
          url: inviteLink
        });
        
        if (onInviteSuccess) {
          onInviteSuccess(inviteLink);
        }
      } else {
        // Fallback si l'API de partage n'est pas disponible
        handleCopyLink();
      }
    } catch (err) {
      console.error('Erreur lors du partage:', err);
      // Si l'utilisateur annule le partage, ce n'est pas une erreur à afficher
      if (err.name !== 'AbortError') {
        setError('Erreur lors du partage. Veuillez réessayer.');
      }
    }
  };

  return (
    <View style={[styles.overlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            Inviter des amis
          </Text>
          
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <FontAwesomeIcon icon={faTimes} color={colors.text} size={18} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.content}>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Lien d'invitation
            </Text>
            
            <View style={[styles.linkContainer, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
              <Text style={[styles.linkText, { color: colors.textSecondary }]} numberOfLines={1} ellipsizeMode="middle">
                {getInviteLink()}
              </Text>
              
              <TouchableOpacity onPress={handleCopyLink} style={styles.copyButton}>
                <FontAwesomeIcon icon={faCopy} color={colors.primary} size={18} />
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Inviter par email
            </Text>
            
            <View style={styles.emailContainer}>
              <TextInput
                style={[styles.emailInput, { 
                  color: colors.text, 
                  backgroundColor: colors.backgroundSecondary,
                  borderColor: colors.border 
                }]}
                placeholder="Adresse email"
                placeholderTextColor={colors.textSecondary}
                value={inviteEmail}
                onChangeText={setInviteEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              
              <TouchableOpacity 
                onPress={handleSendEmail} 
                style={[styles.sendButton, { backgroundColor: colors.primary }]}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color={colors.textOnPrimary} />
                ) : (
                  <>
                    <FontAwesomeIcon icon={faEnvelope} color={colors.textOnPrimary} size={16} />
                    <Text style={[styles.sendButtonText, { color: colors.textOnPrimary }]}>
                      Envoyer
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Autres options de partage
            </Text>
            
            <View style={styles.shareOptions}>
              <TouchableOpacity 
                style={[styles.shareOption, { backgroundColor: colors.backgroundSecondary }]}
                onPress={handleShareWhatsApp}
              >
                <FontAwesomeIcon icon={faWhatsapp} color="#25D366" size={24} />
                <Text style={[styles.shareOptionText, { color: colors.text }]}>
                  WhatsApp
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.shareOption, { backgroundColor: colors.backgroundSecondary }]}
                onPress={handleShareNative}
              >
                <FontAwesomeIcon icon={faShare} color={colors.primary} size={24} />
                <Text style={[styles.shareOptionText, { color: colors.text }]}>
                  Partager
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {error && (
            <View style={[styles.messageContainer, { backgroundColor: colors.error + '20' }]}>
              <Text style={[styles.errorText, { color: colors.error }]}>
                {error}
              </Text>
            </View>
          )}
          
          {successMessage && (
            <View style={[styles.messageContainer, { backgroundColor: colors.success + '20' }]}>
              <Text style={[styles.successText, { color: colors.success }]}>
                {successMessage}
              </Text>
            </View>
          )}
        </View>
        
        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={onClose}
          >
            <Text style={[styles.buttonText, { color: colors.textOnPrimary }]}>
              Fermer
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
  linkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  linkText: {
    flex: 1,
    fontSize: 14,
    marginRight: 10,
  },
  copyButton: {
    padding: 5,
  },
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  emailInput: {
    flex: 1,
    height: 45,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 10,
    fontSize: 14,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 45,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  sendButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 5,
  },
  shareOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  shareOption: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 8,
    width: '45%',
  },
  shareOptionText: {
    marginTop: 8,
    fontSize: 14,
  },
  messageContainer: {
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  errorText: {
    fontSize: 14,
  },
  successText: {
    fontSize: 14,
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

export default WatchPartyInvite;
