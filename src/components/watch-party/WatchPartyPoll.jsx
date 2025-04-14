/**
 * Composant de sondage pour la Watch Party
 * Permet aux utilisateurs de voter pour le prochain contenu à regarder
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, FlatList, Image, Animated } from '../../adapters/react-native-adapter';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPoll, faCheck, faTimes, faPlus, faTrash, faSearch, faFilm } from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../../hooks/useTheme';
import { useWatchParty } from '../../hooks/useWatchParty';
import { useAuth } from '../../hooks/useAuth';
import { useContent } from '../../hooks/useContent';
import ContentSearchModal from '../content/ContentSearchModal';

/**
 * Composant de sondage pour la Watch Party
 * @returns {JSX.Element} - Composant React
 */
const WatchPartyPoll = () => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { searchContent } = useContent();
  const { 
    partyInfo, 
    isHost, 
    activePoll, 
    createPoll, 
    endPoll, 
    votePoll,
    participants 
  } = useWatchParty();
  
  // États locaux
  const [isCreatingPoll, setIsCreatingPoll] = useState(false);
  const [pollOptions, setPollOptions] = useState([]);
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [pollTitle, setPollTitle] = useState("Que regarder ensuite ?");
  const [selectedOption, setSelectedOption] = useState(null);
  const [pollAnimation] = useState(new Animated.Value(0));
  
  // Effet d'animation à l'apparition d'un nouveau sondage
  useEffect(() => {
    if (activePoll) {
      Animated.sequence([
        Animated.timing(pollAnimation, {
          toValue: 1.05,
          duration: 300,
          useNativeDriver: true
        }),
        Animated.timing(pollAnimation, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true
        })
      ]).start();
    } else {
      pollAnimation.setValue(0);
    }
  }, [activePoll, pollAnimation]);
  
  // Ajouter une option au sondage en cours de création
  const handleAddOption = useCallback((content) => {
    if (pollOptions.length < 5) {
      setPollOptions([...pollOptions, content]);
    }
    setSearchModalVisible(false);
  }, [pollOptions]);
  
  // Supprimer une option du sondage en cours de création
  const handleRemoveOption = useCallback((index) => {
    setPollOptions(pollOptions.filter((_, i) => i !== index));
  }, [pollOptions]);
  
  // Créer un nouveau sondage
  const handleCreatePoll = useCallback(() => {
    if (pollOptions.length >= 2) {
      createPoll({
        title: pollTitle,
        options: pollOptions,
        createdBy: user.id,
        duration: 120 // 2 minutes par défaut
      });
      setIsCreatingPoll(false);
      setPollOptions([]);
    }
  }, [pollTitle, pollOptions, user, createPoll]);
  
  // Voter pour une option
  const handleVote = useCallback((optionId) => {
    if (activePoll && !activePoll.votes[user.id]) {
      setSelectedOption(optionId);
      votePoll(activePoll.id, optionId);
    }
  }, [activePoll, user, votePoll]);
  
  // Terminer le sondage actif
  const handleEndPoll = useCallback(() => {
    if (activePoll) {
      endPoll(activePoll.id);
    }
  }, [activePoll, endPoll]);
  
  // Calculer le pourcentage de votes pour une option
  const calculatePercentage = useCallback((optionId) => {
    if (!activePoll) return 0;
    
    const totalVotes = Object.keys(activePoll.votes).length;
    if (totalVotes === 0) return 0;
    
    const optionVotes = Object.values(activePoll.votes).filter(vote => vote === optionId).length;
    return Math.round((optionVotes / totalVotes) * 100);
  }, [activePoll]);
  
  // Vérifier si l'utilisateur a déjà voté
  const hasVoted = useCallback(() => {
    return activePoll && activePoll.votes && activePoll.votes[user.id];
  }, [activePoll, user]);
  
  // Obtenir le nom du participant à partir de son ID
  const getParticipantName = useCallback((participantId) => {
    const participant = participants.find(p => p.id === participantId);
    return participant ? participant.name : 'Inconnu';
  }, [participants]);
  
  // Afficher l'interface de création de sondage
  const renderPollCreation = () => (
    <View style={styles.pollCreationContainer}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Créer un sondage</Text>
        <TouchableOpacity onPress={() => setIsCreatingPoll(false)} style={styles.closeButton}>
          <FontAwesomeIcon icon={faTimes} color={colors.icon} size={18} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.pollForm}>
        <Text style={[styles.label, { color: colors.text }]}>Titre du sondage</Text>
        <TouchableOpacity 
          style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}
          onPress={() => {/* Ouvrir un modal d'édition de texte si nécessaire */}}
        >
          <Text style={[styles.inputText, { color: colors.text }]}>{pollTitle}</Text>
        </TouchableOpacity>
        
        <Text style={[styles.label, { color: colors.text, marginTop: 15 }]}>Options (2-5)</Text>
        
        {pollOptions.length > 0 && (
          <FlatList
            data={pollOptions}
            keyExtractor={(item, index) => `option-${index}`}
            renderItem={({ item, index }) => (
              <View style={[styles.optionItem, { backgroundColor: colors.cardBackground }]}>
                <Image 
                  source={{ uri: item.posterUrl || item.imageUrl }} 
                  style={styles.optionImage} 
                  resizeMode="cover"
                />
                <View style={styles.optionInfo}>
                  <Text style={[styles.optionTitle, { color: colors.text }]} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={[styles.optionSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
                    {item.type} • {item.year}
                  </Text>
                </View>
                <TouchableOpacity 
                  style={[styles.removeButton, { backgroundColor: colors.error + '20' }]}
                  onPress={() => handleRemoveOption(index)}
                >
                  <FontAwesomeIcon icon={faTrash} color={colors.error} size={14} />
                </TouchableOpacity>
              </View>
            )}
            style={styles.optionsList}
          />
        )}
        
        {pollOptions.length < 5 && (
          <TouchableOpacity 
            style={[styles.addButton, { backgroundColor: colors.primary + '20' }]}
            onPress={() => setSearchModalVisible(true)}
          >
            <FontAwesomeIcon icon={faPlus} color={colors.primary} size={16} />
            <Text style={[styles.addButtonText, { color: colors.primary }]}>
              Ajouter une option
            </Text>
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[
            styles.createButton, 
            { 
              backgroundColor: pollOptions.length >= 2 ? colors.primary : colors.primary + '50',
              opacity: pollOptions.length >= 2 ? 1 : 0.5
            }
          ]}
          onPress={handleCreatePoll}
          disabled={pollOptions.length < 2}
        >
          <Text style={[styles.createButtonText, { color: colors.textOnPrimary }]}>
            Lancer le sondage
          </Text>
        </TouchableOpacity>
      </View>
      
      <ContentSearchModal
        visible={searchModalVisible}
        onClose={() => setSearchModalVisible(false)}
        onSelect={handleAddOption}
      />
    </View>
  );
  
  // Afficher un sondage actif
  const renderActivePoll = () => {
    if (!activePoll) return null;
    
    const hasUserVoted = hasVoted();
    const creatorName = getParticipantName(activePoll.createdBy);
    
    return (
      <Animated.View 
        style={[
          styles.activePollContainer,
          { 
            backgroundColor: colors.cardBackground,
            borderColor: colors.primary + '50',
            transform: [{ scale: pollAnimation }]
          }
        ]}
      >
        <View style={styles.pollHeader}>
          <View style={styles.pollTitleContainer}>
            <FontAwesomeIcon icon={faPoll} color={colors.primary} size={18} style={styles.pollIcon} />
            <Text style={[styles.pollTitle, { color: colors.text }]}>
              {activePoll.title}
            </Text>
          </View>
          
          <Text style={[styles.pollCreator, { color: colors.textSecondary }]}>
            Créé par {creatorName}
          </Text>
          
          {isHost && (
            <TouchableOpacity 
              style={[styles.endPollButton, { backgroundColor: colors.error + '20' }]}
              onPress={handleEndPoll}
            >
              <Text style={[styles.endPollText, { color: colors.error }]}>
                Terminer
              </Text>
            </TouchableOpacity>
          )}
        </View>
        
        <FlatList
          data={activePoll.options}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const percentage = calculatePercentage(item.id);
            const isSelected = hasUserVoted && activePoll.votes[user.id] === item.id;
            
            return (
              <TouchableOpacity 
                style={[
                  styles.pollOptionItem,
                  { 
                    backgroundColor: isSelected ? colors.primary + '20' : colors.background2,
                    borderColor: isSelected ? colors.primary : 'transparent'
                  }
                ]}
                onPress={() => handleVote(item.id)}
                disabled={hasUserVoted}
              >
                <Image 
                  source={{ uri: item.posterUrl || item.imageUrl }} 
                  style={styles.pollOptionImage} 
                  resizeMode="cover"
                />
                
                <View style={styles.pollOptionContent}>
                  <Text style={[styles.pollOptionTitle, { color: colors.text }]}>
                    {item.title}
                  </Text>
                  <Text style={[styles.pollOptionSubtitle, { color: colors.textSecondary }]}>
                    {item.type} • {item.year}
                  </Text>
                  
                  <View style={styles.voteBarContainer}>
                    <View 
                      style={[
                        styles.voteBar, 
                        { 
                          backgroundColor: colors.primary,
                          width: `${percentage}%` 
                        }
                      ]} 
                    />
                    <Text style={[styles.votePercentage, { color: colors.text }]}>
                      {percentage}%
                    </Text>
                  </View>
                </View>
                
                {isSelected && (
                  <View style={[styles.selectedBadge, { backgroundColor: colors.primary }]}>
                    <FontAwesomeIcon icon={faCheck} color={colors.textOnPrimary} size={12} />
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
          style={styles.pollOptionsList}
        />
        
        {!hasUserVoted && (
          <Text style={[styles.votePrompt, { color: colors.textSecondary }]}>
            Cliquez sur une option pour voter
          </Text>
        )}
      </Animated.View>
    );
  };
  
  // Afficher le bouton pour créer un sondage (uniquement pour l'hôte)
  const renderCreatePollButton = () => {
    if (!isHost || activePoll) return null;
    
    return (
      <TouchableOpacity 
        style={[styles.createPollButton, { backgroundColor: colors.primary }]}
        onPress={() => setIsCreatingPoll(true)}
      >
        <FontAwesomeIcon icon={faPoll} color={colors.textOnPrimary} size={18} />
        <Text style={[styles.createPollText, { color: colors.textOnPrimary }]}>
          Créer un sondage
        </Text>
      </TouchableOpacity>
    );
  };
  
  // Rendu principal du composant
  return (
    <View style={styles.container}>
      {isCreatingPoll ? renderPollCreation() : (
        <>
          {renderActivePoll()}
          {renderCreatePollButton()}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  createPollButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 20,
    marginHorizontal: 10,
  },
  createPollText: {
    marginLeft: 8,
    fontWeight: '500',
    fontSize: 14,
  },
  pollCreationContainer: {
    backgroundColor: '#1A1926',
    borderRadius: 8,
    margin: 10,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  pollForm: {
    padding: 15,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  inputText: {
    fontSize: 14,
  },
  optionsList: {
    marginTop: 10,
    maxHeight: 200,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  optionImage: {
    width: 40,
    height: 60,
    borderRadius: 4,
  },
  optionInfo: {
    flex: 1,
    marginLeft: 10,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  optionSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  removeButton: {
    padding: 8,
    borderRadius: 20,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  addButtonText: {
    marginLeft: 8,
    fontWeight: '500',
  },
  footer: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    alignItems: 'center',
  },
  createButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    width: '100%',
    alignItems: 'center',
  },
  createButtonText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  activePollContainer: {
    margin: 10,
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  pollHeader: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  pollTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pollIcon: {
    marginRight: 8,
  },
  pollTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  pollCreator: {
    fontSize: 12,
    marginTop: 4,
  },
  endPollButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  endPollText: {
    fontSize: 12,
    fontWeight: '500',
  },
  pollOptionsList: {
    padding: 10,
    maxHeight: 300,
  },
  pollOptionItem: {
    flexDirection: 'row',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    position: 'relative',
  },
  pollOptionImage: {
    width: 45,
    height: 68,
    borderRadius: 4,
  },
  pollOptionContent: {
    flex: 1,
    marginLeft: 10,
    justifyContent: 'space-between',
  },
  pollOptionTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  pollOptionSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  voteBarContainer: {
    height: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 3,
    marginTop: 8,
    position: 'relative',
  },
  voteBar: {
    height: '100%',
    borderRadius: 3,
  },
  votePercentage: {
    position: 'absolute',
    right: 0,
    top: -18,
    fontSize: 12,
    fontWeight: 'bold',
  },
  selectedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  votePrompt: {
    textAlign: 'center',
    padding: 10,
    fontStyle: 'italic',
    fontSize: 12,
  },
});

export default WatchPartyPoll;
