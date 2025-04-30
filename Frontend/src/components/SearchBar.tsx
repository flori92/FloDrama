import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchContent, ContentItem, SearchResponse } from '../services/contentService';
import '../styles/SearchBar.css';
import { motion, AnimatePresence } from 'framer-motion';

interface SearchBarProps {
  userId: string;
  onSearchStart?: () => void;
  onSearchComplete?: (results: any[]) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ userId, onSearchStart, onSearchComplete }) => {
  const [query, setQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [showRequestStatus, setShowRequestStatus] = useState<boolean>(false);
  const [requestStatus, setRequestStatus] = useState<string>('pending');
  const statusCheckInterval = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();

  // Nettoyer les intervalles lors du démontage du composant
  useEffect(() => {
    return () => {
      if (statusCheckInterval.current) {
        clearInterval(statusCheckInterval.current);
      }
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  // Fonction pour vérifier le statut d'une demande de contenu
  const checkRequestStatus = async (reqId: string) => {
    try {
      const response = await fetch(`/api/content-request/${reqId}`);
      const data = await response.json();
      
      if (data.status === 'completed') {
        setRequestStatus('completed');
        
        // Rediriger vers les résultats de recherche si disponibles
        if (data.resultsCount > 0) {
          navigate(`/search?q=${encodeURIComponent(query)}`);
        }
        
        // Arrêter la vérification du statut
        if (statusCheckInterval.current) {
          clearInterval(statusCheckInterval.current);
          statusCheckInterval.current = null;
        }
      } else if (data.status === 'processing') {
        setRequestStatus('processing');
      }
    } catch (error) {
      console.error('Erreur lors de la vérification du statut de la demande:', error);
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    
    if (!query.trim()) return;
    
    setIsSearching(true);
    
    if (onSearchStart) {
      onSearchStart();
    }
    
    try {
      // Effectuer la recherche
      const searchResult = await searchContent(query, userId);
      
      if (onSearchComplete && searchResult.results) {
        onSearchComplete(searchResult.results);
      }
      
      // Vérifier si la recherche a déclenché un scraping ciblé
      if (searchResult.message && searchResult.requestId) {
        setRequestId(searchResult.requestId);
        setShowRequestStatus(true);
        setRequestStatus('pending');
        
        // Démarrer la vérification périodique du statut
        if (statusCheckInterval.current) {
          clearInterval(statusCheckInterval.current);
        }
        
        statusCheckInterval.current = setInterval(() => {
          if (searchResult.requestId) {
            checkRequestStatus(searchResult.requestId);
          }
        }, 10000); // Vérifier toutes les 10 secondes
      } else {
        // Si des résultats ont été trouvés, naviguer vers la page de résultats
        navigate(`/search?q=${encodeURIComponent(query)}`);
      }
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    
    // Recherche automatique après un délai
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    if (newQuery.trim().length > 2) {
      const timeout = setTimeout(() => {
        handleSearch();
      }, 500);
      
      setSearchTimeout(timeout);
    }
  };

  return (
    <div className="search-bar-container">
      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder="Rechercher un film, un drama, un anime..."
          className="search-input"
          disabled={isSearching}
          aria-label="Barre de recherche"
        />
        <motion.button 
          type="submit" 
          className="search-button"
          disabled={isSearching || !query.trim()}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          {isSearching ? (
            <span className="search-spinner"></span>
          ) : (
            <span className="search-icon">🔍</span>
          )}
        </motion.button>
      </form>
      
      <AnimatePresence>
        {showRequestStatus && (
          <motion.div 
            className={`search-request-status ${requestStatus}`}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {requestStatus === 'pending' && (
              <>
                <span className="status-icon">⏳</span>
                <span className="status-text">
                  Nous recherchons "{query}" dans nos sources. Vous serez notifié lorsque nous aurons des résultats.
                </span>
              </>
            )}
            {requestStatus === 'processing' && (
              <>
                <span className="status-icon">🔄</span>
                <span className="status-text">
                  Nous avons trouvé des sources potentielles pour "{query}". Traitement en cours...
                </span>
              </>
            )}
            {requestStatus === 'completed' && (
              <>
                <span className="status-icon">✅</span>
                <span className="status-text">
                  Recherche terminée ! Consultez vos notifications pour voir les résultats.
                </span>
              </>
            )}
            <motion.button 
              className="status-close-button"
              onClick={() => setShowRequestStatus(false)}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
            >
              ×
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchBar;
