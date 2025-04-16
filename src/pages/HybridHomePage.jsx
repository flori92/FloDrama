/**
 * Page d'accueil hybride pour FloDrama
 * Utilise le service hybride pour afficher des contenus dynamiques et toujours à jour
 */

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import hybridContentService from '../services/HybridContentService';
import { motion } from 'framer-motion';
import { getOptimizedImageUrl } from '../utils/imageOptimizer';

// Styles conformes à l'identité visuelle FloDrama
const PageContainer = styled.div`
  min-height: 100vh;
  background-color: #121118;
  color: white;
  padding: 20px;
  font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const Logo = styled.h1`
  font-size: 2rem;
  font-weight: bold;
  background: linear-gradient(to right, #3b82f6, #d946ef);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0;
`;

const SearchBar = styled.div`
  position: relative;
  width: 300px;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 12px 20px;
  border-radius: 30px;
  border: none;
  background-color: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 0.9rem;
  
  &:focus {
    outline: none;
    background-color: rgba(255, 255, 255, 0.15);
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
  }
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
`;

const SearchButton = styled.button`
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  
  &:hover {
    color: white;
  }
`;

const HeroSection = styled.div`
  position: relative;
  width: 100%;
  height: 70vh;
  min-height: 500px;
  margin-bottom: 40px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
`;

const HeroBackdrop = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: ${props => props.image ? `url(${props.image})` : 'linear-gradient(to right, #3b82f6, #d946ef)'};
  background-size: cover;
  background-position: center;
  filter: brightness(0.6);

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 70%;
    background: linear-gradient(to top, #121118, transparent);
  }
`;

const HeroContent = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  padding: 40px;
  display: flex;
  flex-direction: column;
  z-index: 3;
`;

const HeroTitle = styled(motion.h1)`
  font-size: clamp(2rem, 4vw, 3.5rem);
  font-weight: bold;
  margin-bottom: 16px;
  background: linear-gradient(to right, #3b82f6, #d946ef);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
`;

const HeroDescription = styled(motion.p)`
  font-size: clamp(1rem, 2vw, 1.2rem);
  max-width: 800px;
  margin-bottom: 24px;
  line-height: 1.6;
`;

const HeroMeta = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.8);
`;

const HeroButton = styled(motion.button)`
  background: linear-gradient(to right, #3b82f6, #d946ef);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 30px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  align-self: flex-start;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);
`;

const PlayIcon = styled.span`
  font-size: 1.5rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.8rem;
  margin-bottom: 20px;
  font-weight: bold;
  background: linear-gradient(to right, #3b82f6, #d946ef);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  display: inline-block;
`;

const SectionDescription = styled.p`
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 24px;
`;

const CarouselSection = styled.div`
  margin-bottom: 50px;
`;

const CarouselContainer = styled.div`
  position: relative;
  width: 100%;
  overflow-x: auto;
  padding: 20px 0;
  
  /* Masquer la scrollbar mais garder la fonctionnalité */
  -ms-overflow-style: none;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
`;

const CarouselContent = styled.div`
  display: flex;
  gap: 16px;
`;

const CardContainer = styled(motion.div)`
  flex: 0 0 auto;
  width: 200px;
  border-radius: 8px;
  overflow: hidden;
  background-color: #1A1926;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
  transition: transform 0.3s ease;
  cursor: pointer;
  
  &:hover {
    transform: translateY(-5px) scale(1.02);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
  }
`;

const CardImage = styled.img`
  width: 100%;
  aspect-ratio: 2/3;
  object-fit: cover;
`;

const CardInfo = styled.div`
  padding: 12px;
`;

const CardTitle = styled.h3`
  font-size: 1rem;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const CardMeta = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.6);
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: ${props => props.height || '100vh'};
`;

const Spinner = styled.div`
  width: 50px;
  height: 50px;
  border: 4px solid rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  border-top: 4px solid #3b82f6;
  border-right: 4px solid #9333ea;
  border-bottom: 4px solid #d946ef;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const LoadingText = styled.p`
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.7);
`;

const FilterBar = styled.div`
  display: flex;
  overflow-x: auto;
  gap: 12px;
  margin-bottom: 20px;
  padding-bottom: 8px;
  
  /* Masquer la scrollbar mais garder la fonctionnalité */
  -ms-overflow-style: none;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
`;

const FilterButton = styled.button`
  background-color: ${props => props.active ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.1)'};
  color: ${props => props.active ? '#3b82f6' : 'white'};
  border: ${props => props.active ? '1px solid #3b82f6' : '1px solid rgba(255, 255, 255, 0.2)'};
  border-radius: 20px;
  padding: 8px 16px;
  font-size: 0.9rem;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background-color: rgba(59, 130, 246, 0.2);
    border-color: #3b82f6;
  }
`;

/**
 * Page d'accueil hybride pour FloDrama avec contenu dynamique
 */
const HybridHomePage = () => {
  // États
  const [loading, setLoading] = useState(true);
  const [homeCarousels, setHomeCarousels] = useState([]);
  const [heroContent, setHeroContent] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  
  // Récupérer les données pour la page d'accueil
  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        setLoading(true);
        
        // Récupérer les carousels
        const carousels = await hybridContentService.generateHomeCarousels();
        
        if (carousels && carousels.length > 0) {
          // Définir le contenu du héros
          const featuredCarousel = carousels.find(c => c.id === 'featured');
          if (featuredCarousel && featuredCarousel.items.length > 0) {
            setHeroContent(featuredCarousel.items[0]);
          }
          
          // Mettre à jour les carousels
          setHomeCarousels(carousels);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        setLoading(false);
      }
    };
    
    fetchHomeData();
  }, []);
  
  // Fonction de recherche
  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) return;
    
    try {
      setLoading(true);
      
      // Effectuer la recherche
      const results = await hybridContentService.searchContent(searchQuery);
      
      // Mettre à jour les carousels avec les résultats
      if (results && results.length > 0) {
        // Définir le premier résultat comme héros
        setHeroContent(results[0]);
        
        // Créer un carousel avec les résultats
        const searchCarousel = {
          id: 'search_results',
          title: `Résultats pour "${searchQuery}"`,
          description: `${results.length} résultats trouvés`,
          items: results
        };
        
        // Mettre à jour les carousels
        setHomeCarousels([searchCarousel]);
      } else {
        // Pas de résultats
        setHomeCarousels([{
          id: 'no_results',
          title: `Aucun résultat pour "${searchQuery}"`,
          description: 'Essayez avec d\'autres termes de recherche',
          items: []
        }]);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
      setLoading(false);
    }
  };
  
  // Fonction pour changer le filtre
  const handleFilterChange = async (filter) => {
    if (filter === selectedFilter) return;
    
    setSelectedFilter(filter);
    setLoading(true);
    
    try {
      if (filter === 'all') {
        // Récupérer tous les carousels
        const carousels = await hybridContentService.generateHomeCarousels(true);
        setHomeCarousels(carousels);
        
        // Mettre à jour le héros
        const featuredCarousel = carousels.find(c => c.id === 'featured');
        if (featuredCarousel && featuredCarousel.items.length > 0) {
          setHeroContent(featuredCarousel.items[0]);
        }
      } else {
        // Récupérer le contenu pour la catégorie sélectionnée
        const categoryContent = await hybridContentService.getLatestByCategory(filter, { limit: 30 });
        
        if (categoryContent && categoryContent.length > 0) {
          // Mettre à jour le héros
          setHeroContent(categoryContent[0]);
          
          // Créer un carousel avec le contenu
          const categoryCarousel = {
            id: `category_${filter}`,
            title: filter === 'movies' ? 'Films' : 
                  filter === 'drama' ? 'Dramas' : 
                  filter === 'anime' ? 'Animés' : 
                  filter === 'bollywood' ? 'Bollywood' : 
                  filter.charAt(0).toUpperCase() + filter.slice(1),
            description: 'Les dernières sorties',
            items: categoryContent
          };
          
          setHomeCarousels([categoryCarousel]);
        }
      }
    } catch (error) {
      console.error('Erreur lors du changement de filtre:', error);
    }
    
    setLoading(false);
  };
  
  // Si la page est en cours de chargement, afficher un indicateur
  if (loading && !heroContent) {
    return (
      <PageContainer>
        <Header>
          <Logo>FloDrama</Logo>
        </Header>
        
        <LoadingContainer>
          <Spinner />
          <LoadingText>Chargement des derniers contenus...</LoadingText>
        </LoadingContainer>
      </PageContainer>
    );
  }
  
  return (
    <PageContainer>
      <Header>
        <Logo>FloDrama</Logo>
        
        <SearchBar>
          <form onSubmit={handleSearch}>
            <SearchInput
              type="text"
              placeholder="Rechercher des films, séries, animés..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <SearchButton type="submit">🔍</SearchButton>
          </form>
        </SearchBar>
      </Header>
      
      {/* Section de filtres */}
      <FilterBar>
        <FilterButton 
          active={selectedFilter === 'all'}
          onClick={() => handleFilterChange('all')}
        >
          Tout
        </FilterButton>
        <FilterButton 
          active={selectedFilter === 'movies'}
          onClick={() => handleFilterChange('movies')}
        >
          Films
        </FilterButton>
        <FilterButton 
          active={selectedFilter === 'drama'}
          onClick={() => handleFilterChange('drama')}
        >
          Dramas
        </FilterButton>
        <FilterButton 
          active={selectedFilter === 'anime'}
          onClick={() => handleFilterChange('anime')}
        >
          Animés
        </FilterButton>
        <FilterButton 
          active={selectedFilter === 'bollywood'}
          onClick={() => handleFilterChange('bollywood')}
        >
          Bollywood
        </FilterButton>
      </FilterBar>
      
      {/* Section Hero */}
      {heroContent && (
        <HeroSection>
          <HeroBackdrop image={heroContent.backdrop || heroContent.poster || getOptimizedImageUrl(heroContent.title, true)} />
          <HeroContent>
            <HeroTitle
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {heroContent.title}
            </HeroTitle>
            
            <HeroMeta>
              <span>{heroContent.year || 'N/A'}</span>
              <span>{heroContent.mediaType === 'movie' ? 'Film' : heroContent.mediaType === 'anime' ? 'Animé' : 'Série'}</span>
              {heroContent.rating && <span>⭐ {heroContent.rating}</span>}
              {heroContent.region && <span>{heroContent.region}</span>}
              {heroContent.language && !heroContent.region && <span>{heroContent.language.toUpperCase()}</span>}
            </HeroMeta>
            
            <HeroDescription
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {heroContent.description || "Aucune description disponible pour ce contenu."}
            </HeroDescription>
            
            <HeroButton
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <PlayIcon>▶</PlayIcon>
              Regarder maintenant
            </HeroButton>
          </HeroContent>
        </HeroSection>
      )}
      
      {/* Sections de carousels */}
      {loading ? (
        <LoadingContainer height="300px">
          <Spinner />
          <LoadingText>Chargement...</LoadingText>
        </LoadingContainer>
      ) : (
        homeCarousels.map((carousel) => (
          <CarouselSection key={carousel.id}>
            <SectionTitle>{carousel.title}</SectionTitle>
            {carousel.description && (
              <SectionDescription>{carousel.description}</SectionDescription>
            )}
            
            {carousel.items && carousel.items.length > 0 ? (
              <CarouselContainer>
                <CarouselContent>
                  {carousel.items.map((item, index) => (
                    <CardContainer
                      key={`${item.id || index}`}
                      whileHover={{ y: -5, scale: 1.02 }}
                      transition={{ duration: 0.3 }}
                    >
                      <CardImage 
                        src={item.poster || getOptimizedImageUrl(item.title)}
                        alt={item.title}
                        onError={(e) => {
                          e.target.src = getOptimizedImageUrl(item.title);
                        }}
                      />
                      <CardInfo>
                        <CardTitle>{item.title}</CardTitle>
                        <CardMeta>
                          <span>{item.year || 'N/A'}</span>
                          <span>⭐ {item.rating || '4.0'}</span>
                        </CardMeta>
                      </CardInfo>
                    </CardContainer>
                  ))}
                </CarouselContent>
              </CarouselContainer>
            ) : (
              <p style={{ color: 'rgba(255, 255, 255, 0.5)', padding: '20px 0' }}>
                Aucun contenu disponible
              </p>
            )}
          </CarouselSection>
        ))
      )}
    </PageContainer>
  );
};

export default HybridHomePage;
