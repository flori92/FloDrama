/**
 * ScrapingManager
 * 
 * Composant d'administration pour gérer le scraping de contenu
 * Permet de lancer un scraping complet et de configurer le scraping quotidien
 */

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import smartScrapingService from '../../services/SmartScrapingService.js';

// Styles
const Container = styled.div`
  background-color: #1a1a1a;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
`;

const Title = styled.h2`
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: #fff;
  font-weight: 600;
`;

const Section = styled.div`
  margin-bottom: 1.5rem;
  border-bottom: 1px solid #333;
  padding-bottom: 1.5rem;
  
  &:last-child {
    border-bottom: none;
    margin-bottom: 0;
    padding-bottom: 0;
  }
`;

const SectionTitle = styled.h3`
  font-size: 1.2rem;
  margin-bottom: 1rem;
  color: #f0f0f0;
`;

const Button = styled.button`
  background-color: ${props => props.secondary ? '#333' : '#8e24aa'};
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: ${props => props.secondary ? '#444' : '#9c27b0'};
  }
  
  &:disabled {
    background-color: #555;
    cursor: not-allowed;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1rem;
`;

const Label = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #e0e0e0;
  font-size: 0.9rem;
`;

const Input = styled.input`
  padding: 0.5rem;
  border-radius: 4px;
  border: 1px solid #333;
  background-color: #222;
  color: white;
`;

const StatusCard = styled.div`
  background-color: #222;
  border-radius: 4px;
  padding: 1rem;
  margin-top: 1rem;
`;

const StatusLabel = styled.div`
  font-weight: 500;
  margin-bottom: 0.5rem;
  color: #e0e0e0;
`;

const ProgressBar = styled.progress`
  width: 100%;
  height: 8px;
  border-radius: 4px;
  margin: 0.5rem 0;
  
  &::-webkit-progress-bar {
    background-color: #333;
    border-radius: 4px;
  }
  
  &::-webkit-progress-value {
    background-color: #8e24aa;
    border-radius: 4px;
  }
  
  &::-moz-progress-bar {
    background-color: #8e24aa;
    border-radius: 4px;
  }
`;

const StatusText = styled.div`
  color: #ccc;
  font-size: 0.9rem;
  margin-top: 0.5rem;
`;

const ErrorMessage = styled.div`
  color: #f44336;
  margin-top: 0.5rem;
  font-size: 0.9rem;
`;

const SearchInput = styled.input`
  padding: 0.5rem;
  border-radius: 4px;
  border: 1px solid #333;
  background-color: #222;
  color: white;
  flex: 1;
  min-width: 200px;
`;

const ResultCard = styled.div`
  background-color: #222;
  border-radius: 4px;
  padding: 1rem;
  margin-top: 1rem;
`;

const ResultTitle = styled.h4`
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
  color: #fff;
`;

const ResultDetails = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 0.5rem;
  color: #ccc;
  font-size: 0.9rem;
`;

const ResultImage = styled.img`
  max-width: 100px;
  max-height: 150px;
  object-fit: cover;
  border-radius: 4px;
  margin-top: 0.5rem;
`;

const ResultsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const ResultListItem = styled.div`
  background-color: #222;
  border-radius: 4px;
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const ResultDate = styled.div`
  font-size: 0.9rem;
  color: #ccc;
`;

const ResultStats = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  
  span {
    background-color: #333;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.8rem;
  }
`;

const ScrapingManager = () => {
  const [scrapingStatus, setScrapingStatus] = useState({
    inProgress: false,
    progress: 0,
    currentSource: '',
    currentPage: 0,
    totalPages: 0,
    itemsCount: 0,
    totalItems: 0,
    status: 'idle',
    error: null
  });
  
  const [scrapingConfig, setScrapingConfig] = useState({
    saveToS3: true,
    includeImages: true,
    maxPages: 3,
    dailyTime: '03:00'
  });
  
  const [dailyScrapingActive, setDailyScrapingActive] = useState(false);
  const [recentResults, setRecentResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('all');
  const [searchResult, setSearchResult] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  
  // Vérifier si un scraping quotidien est déjà configuré au chargement
  useEffect(() => {
    // Vérifier si le scraping quotidien est actif
    if (smartScrapingService._backgroundScrapingInterval) {
      setDailyScrapingActive(true);
    }
    
    // Écouter les événements de mise à jour des métadonnées
    const handleMetadataUpdate = (event) => {
      const { timestamp, results } = event.detail;
      setRecentResults(prev => [{
        timestamp,
        date: new Date(timestamp).toLocaleString(),
        results,
      }, ...prev.slice(0, 9)]);
    };
    
    window.addEventListener('flodrama:metadata-updated', handleMetadataUpdate);
    
    return () => {
      window.removeEventListener('flodrama:metadata-updated', handleMetadataUpdate);
    };
  }, []);
  
  // Fonction pour activer/désactiver le scraping quotidien
  const toggleDailyScraping = () => {
    if (dailyScrapingActive) {
      // Arrêter le scraping quotidien
      smartScrapingService.stopBackgroundScraping();
      setDailyScrapingActive(false);
    } else {
      // Démarrer le scraping quotidien
      smartScrapingService.startDailyBackgroundScraping();
      setDailyScrapingActive(true);
    }
  };
  
  // Fonction pour lancer une recherche optimisée
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setSearchLoading(true);
    setSearchResult(null);
    
    try {
      const result = await smartScrapingService.searchUntilFound(searchQuery, searchType);
      setSearchResult(result);
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
      setSearchResult({ error: error.message });
    } finally {
      setSearchLoading(false);
    }
  };
  
  // Fonction pour lancer un scraping manuel immédiat
  const runBackgroundScraping = async () => {
    setScrapingStatus({
      ...scrapingStatus,
      inProgress: true,
      status: 'starting background scraping',
      error: null
    });
    
    try {
      const results = await smartScrapingService._runBackgroundScraping();
      
      setScrapingStatus({
        ...scrapingStatus,
        inProgress: false,
        status: 'completed',
        error: null
      });
      
      // Mettre à jour les résultats récents
      const timestamp = Date.now();
      setRecentResults(prev => [{
        timestamp,
        date: new Date(timestamp).toLocaleString(),
        results,
      }, ...prev.slice(0, 9)]);
      
    } catch (error) {
      setScrapingStatus({
        ...scrapingStatus,
        inProgress: false,
        status: 'error',
        error: error.message
      });
    }
  };
  
  return (
    <Container>
      <Title>Gestionnaire de Scraping</Title>
      
      <Section>
        <SectionTitle>Scraping Complet</SectionTitle>
        <FormGroup>
          <Label>
            <input 
              type="checkbox" 
              checked={scrapingConfig.saveToS3} 
              onChange={e => setScrapingConfig({...scrapingConfig, saveToS3: e.target.checked})}
            />
            Sauvegarder sur S3
          </Label>
          
          <Label>
            <input 
              type="checkbox" 
              checked={scrapingConfig.includeImages} 
              onChange={e => setScrapingConfig({...scrapingConfig, includeImages: e.target.checked})}
            />
            Inclure les images
          </Label>
          
          <Label>
            Pages max:
            <Input 
              type="number" 
              min="1" 
              max="10" 
              value={scrapingConfig.maxPages} 
              onChange={e => setScrapingConfig({...scrapingConfig, maxPages: parseInt(e.target.value)})}
            />
          </Label>
        </FormGroup>
        
        <Button 
          onClick={runBackgroundScraping} 
          disabled={scrapingStatus.inProgress}
        >
          Lancer le scraping complet
        </Button>
      </Section>
      
      <Section>
        <SectionTitle>Scraping Quotidien</SectionTitle>
        <p>Le scraping quotidien permet de maintenir automatiquement les métadonnées à jour.</p>
        
        <FormGroup>
          <Label>
            Heure d'exécution:
            <Input 
              type="time" 
              value={scrapingConfig.dailyTime} 
              onChange={e => setScrapingConfig({...scrapingConfig, dailyTime: e.target.value})}
              disabled={dailyScrapingActive}
            />
          </Label>
        </FormGroup>
        
        <ButtonGroup>
          <Button 
            onClick={toggleDailyScraping}
            secondary={dailyScrapingActive}
          >
            {dailyScrapingActive ? 'Désactiver le scraping quotidien' : 'Activer le scraping quotidien'}
          </Button>
          
          <Button 
            onClick={runBackgroundScraping} 
            disabled={scrapingStatus.inProgress}
          >
            Exécuter maintenant
          </Button>
        </ButtonGroup>
      </Section>
      
      <Section>
        <SectionTitle>Recherche Optimisée</SectionTitle>
        <p>Cette fonctionnalité recherche un élément dans toutes les sources jusqu'à ce qu'il soit trouvé.</p>
        
        <FormGroup>
          <Label>
            Type:
            <select 
              value={searchType} 
              onChange={e => setSearchType(e.target.value)}
            >
              <option value="all">Tous</option>
              <option value="drama">Dramas</option>
              <option value="anime">Animés</option>
              <option value="movie">Films</option>
            </select>
          </Label>
          
          <SearchInput 
            type="text" 
            placeholder="Rechercher..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleSearch()}
          />
          
          <Button 
            onClick={handleSearch}
            disabled={searchLoading || !searchQuery.trim()}
          >
            {searchLoading ? 'Recherche en cours...' : 'Rechercher'}
          </Button>
        </FormGroup>
        
        {searchResult && (
          <ResultCard>
            {searchResult.error ? (
              <ErrorMessage>{searchResult.error}</ErrorMessage>
            ) : searchResult ? (
              <>
                <ResultTitle>{searchResult.title}</ResultTitle>
                <ResultDetails>
                  <div>Source: {searchResult.source}</div>
                  {searchResult.year && <div>Année: {searchResult.year}</div>}
                  {searchResult.type && <div>Type: {searchResult.type}</div>}
                </ResultDetails>
                {searchResult.image && (
                  <ResultImage src={searchResult.image} alt={searchResult.title} />
                )}
              </>
            ) : (
              <p>Aucun résultat trouvé</p>
            )}
          </ResultCard>
        )}
      </Section>
      
      <Section>
        <SectionTitle>Statut du Scraping</SectionTitle>
        {scrapingStatus.inProgress ? (
          <StatusCard>
            <StatusLabel>En cours: {scrapingStatus.currentSource || 'Initialisation...'}</StatusLabel>
            <ProgressBar value={scrapingStatus.progress} max="100" />
            <StatusText>
              {scrapingStatus.status === 'scraping' && (
                <>
                  Page {scrapingStatus.currentPage}/{scrapingStatus.totalPages || '?'} - 
                  {scrapingStatus.itemsCount} éléments trouvés
                </>
              )}
              {scrapingStatus.status !== 'scraping' && scrapingStatus.status}
            </StatusText>
          </StatusCard>
        ) : (
          <StatusCard>
            <StatusLabel>
              {scrapingStatus.status === 'completed' ? 'Terminé avec succès' : 
               scrapingStatus.status === 'error' ? 'Erreur' : 'Inactif'}
            </StatusLabel>
            {scrapingStatus.error && (
              <ErrorMessage>{scrapingStatus.error}</ErrorMessage>
            )}
          </StatusCard>
        )}
      </Section>
      
      <Section>
        <SectionTitle>Résultats Récents</SectionTitle>
        {recentResults.length > 0 ? (
          <ResultsList>
            {recentResults.map((result, index) => (
              <ResultListItem key={index}>
                <ResultDate>{result.date}</ResultDate>
                <ResultStats>
                  {result.results.popular !== undefined && <span>Populaires: {result.results.popular}</span>}
                  {result.results.movies !== undefined && <span>Films: {result.results.movies}</span>}
                  {result.results.kshows !== undefined && <span>K-Shows: {result.results.kshows}</span>}
                  {result.results.animes !== undefined && <span>Animés: {result.results.animes}</span>}
                </ResultStats>
              </ResultListItem>
            ))}
          </ResultsList>
        ) : (
          <p>Aucun résultat récent</p>
        )}
      </Section>
    </Container>
  );
};

export default ScrapingManager;
