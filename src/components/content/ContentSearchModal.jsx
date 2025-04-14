/**
 * Modal de recherche de contenu pour les sondages de Watch Party
 * Permet de rechercher et sélectionner des contenus à ajouter aux sondages
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  Modal, 
  TextInput, 
  FlatList, 
  Image, 
  ActivityIndicator 
} from '../../adapters/react-native-adapter';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faTimes, faFilm, faTv, faPlus } from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../../hooks/useTheme';
import { useContent } from '../../hooks/useContent';

/**
 * Modal de recherche de contenu pour les sondages
 * @param {Object} props - Propriétés du composant
 * @param {boolean} props.visible - Si le modal est visible
 * @param {Function} props.onClose - Fonction appelée pour fermer le modal
 * @param {Function} props.onSelect - Fonction appelée lors de la sélection d'un contenu
 * @returns {JSX.Element} - Composant React
 */
const ContentSearchModal = ({ visible, onClose, onSelect }) => {
  const { colors } = useTheme();
  const { searchContent, popularContent } = useContent();
  
  // États locaux
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [popularItems, setPopularItems] = useState([]);
  
  // Charger les contenus populaires au montage
  useEffect(() => {
    const loadPopularContent = async () => {
      setIsLoading(true);
      try {
        const popular = await popularContent();
        setPopularItems(popular);
      } catch (error) {
        console.error('Erreur lors du chargement des contenus populaires:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (visible) {
      loadPopularContent();
    }
  }, [visible, popularContent]);
  
  // Effectuer une recherche lorsque la requête change
  useEffect(() => {
    const delaySearch = setTimeout(async () => {
      if (searchQuery.trim().length > 2) {
        setIsLoading(true);
        try {
          const results = await searchContent(searchQuery, selectedFilter);
          setSearchResults(results);
        } catch (error) {
          console.error('Erreur lors de la recherche:', error);
        } finally {
          setIsLoading(false);
        }
      } else if (searchQuery.trim().length === 0) {
        setSearchResults([]);
      }
    }, 500);
    
    return () => clearTimeout(delaySearch);
  }, [searchQuery, selectedFilter, searchContent]);
  
  // Gérer la sélection d'un filtre
  const handleFilterSelect = useCallback((filter) => {
    setSelectedFilter(filter);
  }, []);
  
  // Gérer la sélection d'un contenu
  const handleSelectContent = useCallback((content) => {
    onSelect(content);
  }, [onSelect]);
  
  // Rendu d'un élément de contenu
  const renderContentItem = useCallback(({ item }) => (
    <TouchableOpacity 
      style={[styles.contentItem, { backgroundColor: colors.cardBackground }]}
      onPress={() => handleSelectContent(item)}
    >
      <Image 
        source={{ uri: item.posterUrl || item.imageUrl }} 
        style={styles.contentImage}
        resizeMode="cover"
      />
      
      <View style={styles.contentInfo}>
        <Text style={[styles.contentTitle, { color: colors.text }]} numberOfLines={1}>
          {item.title}
        </Text>
        
        <View style={styles.contentMeta}>
          <FontAwesomeIcon 
            icon={item.type === 'Série' || item.type === 'Drama' ? faTv : faFilm} 
            color={colors.icon} 
            size={12} 
            style={styles.contentTypeIcon}
          />
          <Text style={[styles.contentType, { color: colors.textSecondary }]}>
            {item.type}
          </Text>
          <Text style={[styles.contentYear, { color: colors.textSecondary }]}>
            {item.year}
          </Text>
        </View>
        
        <Text style={[styles.contentDescription, { color: colors.textSecondary }]} numberOfLines={2}>
          {item.description}
        </Text>
      </View>
      
      <TouchableOpacity 
        style={[styles.addButton, { backgroundColor: colors.primary }]}
        onPress={() => handleSelectContent(item)}
      >
        <FontAwesomeIcon icon={faPlus} color={colors.textOnPrimary} size={14} />
      </TouchableOpacity>
    </TouchableOpacity>
  ), [colors, handleSelectContent]);
  
  // Rendu d'une section vide
  const renderEmptyState = useCallback(() => (
    <View style={styles.emptyState}>
      {searchQuery.trim().length > 2 ? (
        <>
          <FontAwesomeIcon icon={faSearch} color={colors.textSecondary} size={40} style={styles.emptyIcon} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Aucun résultat trouvé pour "{searchQuery}"
          </Text>
        </>
      ) : searchQuery.trim().length > 0 ? (
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          Veuillez saisir au moins 3 caractères
        </Text>
      ) : (
        <>
          <FontAwesomeIcon icon={faSearch} color={colors.textSecondary} size={40} style={styles.emptyIcon} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Recherchez des films, séries ou dramas
          </Text>
        </>
      )}
    </View>
  ), [colors, searchQuery]);
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.text }]}>
              Rechercher du contenu
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <FontAwesomeIcon icon={faTimes} color={colors.icon} size={20} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.searchContainer}>
            <View style={[styles.searchInputContainer, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
              <FontAwesomeIcon icon={faSearch} color={colors.icon} size={16} style={styles.searchIcon} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Films, séries, dramas..."
                placeholderTextColor={colors.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus={true}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                  <FontAwesomeIcon icon={faTimes} color={colors.icon} size={16} />
                </TouchableOpacity>
              )}
            </View>
            
            <View style={styles.filterContainer}>
              <TouchableOpacity 
                style={[
                  styles.filterButton, 
                  selectedFilter === 'all' && { backgroundColor: colors.primary + '20' }
                ]}
                onPress={() => handleFilterSelect('all')}
              >
                <Text 
                  style={[
                    styles.filterText, 
                    { color: selectedFilter === 'all' ? colors.primary : colors.textSecondary }
                  ]}
                >
                  Tout
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.filterButton, 
                  selectedFilter === 'movie' && { backgroundColor: colors.primary + '20' }
                ]}
                onPress={() => handleFilterSelect('movie')}
              >
                <Text 
                  style={[
                    styles.filterText, 
                    { color: selectedFilter === 'movie' ? colors.primary : colors.textSecondary }
                  ]}
                >
                  Films
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.filterButton, 
                  selectedFilter === 'series' && { backgroundColor: colors.primary + '20' }
                ]}
                onPress={() => handleFilterSelect('series')}
              >
                <Text 
                  style={[
                    styles.filterText, 
                    { color: selectedFilter === 'series' ? colors.primary : colors.textSecondary }
                  ]}
                >
                  Séries
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.filterButton, 
                  selectedFilter === 'drama' && { backgroundColor: colors.primary + '20' }
                ]}
                onPress={() => handleFilterSelect('drama')}
              >
                <Text 
                  style={[
                    styles.filterText, 
                    { color: selectedFilter === 'drama' ? colors.primary : colors.textSecondary }
                  ]}
                >
                  Dramas
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <FlatList
              data={searchQuery.trim().length > 0 ? searchResults : popularItems}
              keyExtractor={(item) => item.id}
              renderItem={renderContentItem}
              contentContainerStyle={styles.contentList}
              ListEmptyComponent={renderEmptyState}
              ListHeaderComponent={
                searchQuery.trim().length === 0 && popularItems.length > 0 ? (
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Contenus populaires
                  </Text>
                ) : null
              }
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
    borderRadius: 12,
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
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  searchContainer: {
    padding: 15,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  clearButton: {
    padding: 5,
  },
  filterContainer: {
    flexDirection: 'row',
    marginTop: 10,
  },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 8,
  },
  filterText: {
    fontSize: 14,
  },
  contentList: {
    padding: 15,
  },
  contentItem: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  contentImage: {
    width: 60,
    height: 90,
    borderRadius: 4,
  },
  contentInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  contentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  contentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  contentTypeIcon: {
    marginRight: 5,
  },
  contentType: {
    fontSize: 12,
    marginRight: 8,
  },
  contentYear: {
    fontSize: 12,
  },
  contentDescription: {
    fontSize: 12,
    marginTop: 6,
    lineHeight: 16,
  },
  addButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    marginBottom: 15,
    opacity: 0.5,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
  },
});

export default ContentSearchModal;
