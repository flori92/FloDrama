import React, { useState, useEffect, useRef } from 'react';
import { Box, TextField, InputAdornment, CircularProgress, Typography, Paper, List, ListItem, ListItemText, ListItemAvatar, Avatar, Chip, Divider, IconButton, Fade } from '@mui/material';
import { Search as SearchIcon, Clear as ClearIcon, Movie as MovieIcon, Tv as TvIcon, Animation as AnimationIcon, Bookmark as BookmarkIcon } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import SmartScrapingService from '../../services/SmartScrapingService.js';
import { useDebounce } from '../../hooks/useDebounce';

// Styles personnalisés
const SearchContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: '100%',
  maxWidth: '800px',
  margin: '0 auto',
}));

const SearchResults = styled(Paper)(({ theme }) => ({
  position: 'absolute',
  width: '100%',
  maxHeight: '500px',
  overflowY: 'auto',
  zIndex: 1000,
  marginTop: theme.spacing(1),
  boxShadow: theme.shadows[5],
}));

const ResultItem = styled(ListItem)(({ theme }) => ({
  transition: 'background-color 0.2s ease',
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
}));

const HighlightedText = styled('span')(({ theme }) => ({
  backgroundColor: theme.palette.warning.light,
  padding: '0 2px',
  borderRadius: '2px',
}));

const TypeChip = styled(Chip)(({ theme, type }) => {
  let color = 'default';
  
  switch (type) {
    case 'drama':
      color = 'primary';
      break;
    case 'movie':
      color = 'secondary';
      break;
    case 'anime':
      color = 'success';
      break;
    default:
      color = 'default';
  }
  
  return {
    margin: theme.spacing(0.5),
    '& .MuiChip-label': {
      fontWeight: 500,
    },
    backgroundColor: theme.palette[color].main,
    color: theme.palette.getContrastText(theme.palette[color].main),
  };
});

const NoResults = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  textAlign: 'center',
  color: theme.palette.text.secondary,
}));

const Suggestions = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  gap: theme.spacing(0.5),
  marginTop: theme.spacing(1),
}));

const SuggestionChip = styled(Chip)(({ theme }) => ({
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor: theme.palette.primary.light,
    color: theme.palette.primary.contrastText,
    transform: 'scale(1.05)',
  },
}));

/**
 * Composant de recherche rapide avec autocomplétion
 * Utilise Elasticsearch pour des performances optimales
 */
const FastSearch = ({ onResultSelect, placeholder = "Rechercher un drama, anime, film..." }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedType, setSelectedType] = useState('all');
  const searchRef = useRef(null);
  const debouncedQuery = useDebounce(query, 300);
  
  // Filtres de type
  const typeFilters = [
    { value: 'all', label: 'Tous', icon: <BookmarkIcon /> },
    { value: 'drama', label: 'Dramas', icon: <TvIcon /> },
    { value: 'movie', label: 'Films', icon: <MovieIcon /> },
    { value: 'anime', label: 'Animés', icon: <AnimationIcon /> },
  ];
  
  // Effectuer la recherche lorsque la requête change
  useEffect(() => {
    const performSearch = async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) {
        setResults([]);
        setShowResults(false);
        return;
      }
      
      setLoading(true);
      
      try {
        // Utiliser la méthode de recherche rapide
        const searchResults = await SmartScrapingService.searchFast(debouncedQuery, selectedType, {
          size: 20,
          sort: '_score'
        });
        
        setResults(searchResults);
        setShowResults(true);
      } catch (error) {
        console.error('Erreur lors de la recherche:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };
    
    performSearch();
  }, [debouncedQuery, selectedType]);
  
  // Récupérer des suggestions lorsque la requête change
  useEffect(() => {
    const getSuggestions = async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) {
        setSuggestions([]);
        return;
      }
      
      try {
        const suggestionResults = await SmartScrapingService.getSuggestions(debouncedQuery, 5);
        setSuggestions(suggestionResults);
      } catch (error) {
        console.error('Erreur lors de la récupération des suggestions:', error);
        setSuggestions([]);
      }
    };
    
    getSuggestions();
  }, [debouncedQuery]);
  
  // Gérer le clic en dehors du composant pour fermer les résultats
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Gérer le changement de requête
  const handleQueryChange = (event) => {
    setQuery(event.target.value);
    if (event.target.value) {
      setShowResults(true);
    }
  };
  
  // Effacer la recherche
  const handleClearSearch = () => {
    setQuery('');
    setResults([]);
    setShowResults(false);
  };
  
  // Gérer la sélection d'un résultat
  const handleResultClick = (result) => {
    if (onResultSelect) {
      onResultSelect(result);
    }
    setShowResults(false);
  };
  
  // Gérer la sélection d'une suggestion
  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion);
  };
  
  // Gérer le changement de type
  const handleTypeChange = (type) => {
    setSelectedType(type);
  };
  
  // Mettre en évidence les termes de recherche dans le texte
  const highlightText = (text, searchTerm) => {
    if (!text || !searchTerm) return text;
    
    const parts = text.split(new RegExp(`(${searchTerm})`, 'gi'));
    
    return parts.map((part, index) => 
      part.toLowerCase() === searchTerm.toLowerCase() 
        ? <HighlightedText key={index}>{part}</HighlightedText> 
        : part
    );
  };
  
  // Déterminer l'icône en fonction du type
  const getIconByType = (type) => {
    switch (type) {
      case 'drama':
        return <TvIcon />;
      case 'movie':
        return <MovieIcon />;
      case 'anime':
        return <AnimationIcon />;
      default:
        return <BookmarkIcon />;
    }
  };
  
  return (
    <SearchContainer ref={searchRef}>
      <TextField
        fullWidth
        variant="outlined"
        placeholder={placeholder}
        value={query}
        onChange={handleQueryChange}
        onFocus={() => query && setShowResults(true)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon color="action" />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              {loading ? (
                <CircularProgress size={20} />
              ) : query ? (
                <IconButton
                  size="small"
                  onClick={handleClearSearch}
                  aria-label="Effacer la recherche"
                >
                  <ClearIcon />
                </IconButton>
              ) : null}
            </InputAdornment>
          ),
        }}
      />
      
      {/* Filtres de type */}
      <Box sx={{ display: 'flex', mt: 1, flexWrap: 'wrap', gap: 1 }}>
        {typeFilters.map((filter) => (
          <Chip
            key={filter.value}
            icon={filter.icon}
            label={filter.label}
            onClick={() => handleTypeChange(filter.value)}
            color={selectedType === filter.value ? 'primary' : 'default'}
            variant={selectedType === filter.value ? 'filled' : 'outlined'}
          />
        ))}
      </Box>
      
      {/* Suggestions */}
      {suggestions.length > 0 && !showResults && (
        <Suggestions>
          <Typography variant="caption" sx={{ mr: 1, alignSelf: 'center' }}>
            Suggestions:
          </Typography>
          {suggestions.map((suggestion, index) => (
            <SuggestionChip
              key={index}
              label={suggestion}
              size="small"
              onClick={() => handleSuggestionClick(suggestion)}
            />
          ))}
        </Suggestions>
      )}
      
      {/* Résultats de recherche */}
      <Fade in={showResults && query.length >= 2}>
        <SearchResults elevation={3} sx={{ display: showResults && query.length >= 2 ? 'block' : 'none' }}>
          {results.length > 0 ? (
            <List>
              {results.map((result, index) => (
                <React.Fragment key={result.id || `result-${index}`}>
                  <ResultItem button onClick={() => handleResultClick(result)}>
                    <ListItemAvatar>
                      {result.image ? (
                        <Avatar src={result.image} alt={result.title} variant="rounded" />
                      ) : (
                        <Avatar variant="rounded">{getIconByType(result.type)}</Avatar>
                      )}
                    </ListItemAvatar>
                    <ListItemText
                      primary={highlightText(result.title, query)}
                      secondary={
                        <>
                          <Typography component="span" variant="body2" color="text.primary">
                            {result.source} • {result.year || 'N/A'}
                          </Typography>
                          <Box sx={{ mt: 0.5 }}>
                            <TypeChip
                              size="small"
                              label={result.type || 'Inconnu'}
                              type={result.type}
                            />
                            {result.country && (
                              <Chip
                                size="small"
                                label={result.country}
                                variant="outlined"
                              />
                            )}
                          </Box>
                        </>
                      }
                    />
                  </ResultItem>
                  {index < results.length - 1 && <Divider variant="inset" component="li" />}
                </React.Fragment>
              ))}
            </List>
          ) : (
            <NoResults>
              <Typography variant="body1">
                Aucun résultat trouvé pour "{query}"
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Essayez avec des termes différents ou moins spécifiques
              </Typography>
            </NoResults>
          )}
        </SearchResults>
      </Fade>
    </SearchContainer>
  );
};

export default FastSearch;
