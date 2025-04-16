/**
 * Page d'accueil dynamique de FloDrama
 * Affiche automatiquement les derniers contenus disponibles avec carousel
 */

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import contentDiscoveryService from '../services/contentDiscoveryService';
import DynamicCarousel from '../components/DynamicCarousel';
import '../styles/gradients.css';
import { motion } from 'framer-motion';
import { getOptimizedImageUrl } from '../utils/imageOptimizer';
import AppleStyleCard from '../components/cards/AppleStyleCard';

// Styles conformes à l'identité visuelle FloDrama
const PageContainer = styled.div`
  min-height: 100vh;
  background-color: #121118;
  color: white;
  padding: 20px;
  font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
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
  margin: 40px 0 20px;
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

const LoadingContainer = styled.div`
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #121118;
`;

const LoadingText = styled.p`
  font-size: 1.2rem;
  margin-top: 20px;
  color: white;
  background: linear-gradient(to right, #3b82f6, #d946ef);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const Spinner = styled.div`
  width: 50px;
  height: 50px;
  border: 5px solid rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  border-top: 5px solid #3b82f6;
  border-right: 5px solid #9333ea;
  border-bottom: 5px solid #d946ef;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const FilterSection = styled.div`
  display: flex;
  overflow-x: auto;
  gap: 12px;
  padding: 16px 0;
  margin-bottom: 20px;

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

const CategoryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 16px;
  margin-top: 20px;
`;

/**
 * Page d'accueil dynamique pour FloDrama
 * Utilise contentDiscoveryService pour afficher des contenus toujours à jour
 */
const DynamicHomePage = () => {
  // États
  const [loading, setLoading] = useState(true);
  const [homeCarousels, setHomeCarousels] = useState([]);
  const [heroContent, setHeroContent] = useState(null);
  const [currentCategory, setCurrentCategory] = useState('all');
  const [categoryContent, setCategoryContent] = useState([]);
  const [categoryLoading, setCategoryLoading] = useState(false);
  
  // Récupérer les données de la page d'accueil
  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        setLoading(true);
        
        // Récupérer les carousels générés dynamiquement
        const carousels = await contentDiscoveryService.generateHomeCarousels();
        
        // Définir le contenu du héros (premier élément du carousel "À la une")
        const featuredCarousel = carousels.find(carousel => carousel.id === 'featured');
        if (featuredCarousel && featuredCarousel.items.length > 0) {
          setHeroContent(featuredCarousel.items[0]);
        }
        
        // Filtrer le premier élément du carousel "À la une" pour éviter la duplication
        const processedCarousels = carousels.map(carousel => {
          if (carousel.id === 'featured') {
            return {
              ...carousel,
              items: carousel.items.slice(1) // Exclure le premier élément
            };
          }
          return carousel;
        });
        
        setHomeCarousels(processedCarousels);
        setLoading(false);
      } catch (error) {
        console.error('Erreur lors du chargement des données de la page d\'accueil:', error);
        setLoading(false);
      }
    };
    
    fetchHomeData();
    
    // Actualiser les données toutes les 30 minutes
    const refreshInterval = setInterval(() => {
      fetchHomeData();
    }, 30 * 60 * 1000);
    
    return () => clearInterval(refreshInterval);
  }, []);
  
  // Récupérer le contenu par catégorie lorsqu'une catégorie est sélectionnée
  useEffect(() => {
    if (currentCategory === 'all') {
      setCategoryContent([]);
      return;
    }
    
    const fetchCategoryContent = async () => {
      setCategoryLoading(true);
      
      try {
        let content;
        
        if (currentCategory === 'anime') {
          // Pour les animés, utiliser la recherche spécifique aux animés
          const animeData = await contentDiscoveryService.searchAnime({
            limit: 30
          });
          content = animeData;
        } else {
          // Pour les autres catégories, utiliser getContentByCategory
          content = await contentDiscoveryService.getContentByCategory(
            currentCategory,
            { limit: 30 }
          );
        }
        
        setCategoryContent(content);
      } catch (error) {
        console.error(`Erreur lors de la récupération du contenu ${currentCategory}:`, error);
      } finally {
        setCategoryLoading(false);
      }
    };
    
    fetchCategoryContent();
  }, [currentCategory]);
  
  // Transmettre les carousels au format attendu par le composant DynamicCarousel
  const formatCarouselData = (carousel) => {
    return {
      title: carousel.title,
      description: carousel.description,
      // Adapter le format car DynamicCarousel attend dataSource mais notre service renvoie des items
      data: carousel.items
    };
  };
  
  // Si la page est en cours de chargement, afficher une animation
  if (loading) {
    return (
      <LoadingContainer>
        <Spinner />
        <LoadingText>Chargement des derniers contenus...</LoadingText>
      </LoadingContainer>
    );
  }
  
  return (
    <PageContainer>
      {/* Section Hero */}
      {heroContent && (
        <HeroSection>
          <HeroBackdrop image={heroContent.backdrop || getOptimizedImageUrl(heroContent.title, true)} />
          <HeroContent>
            <HeroTitle
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {heroContent.title}
            </HeroTitle>
            
            <HeroMeta>
              <span>{heroContent.year}</span>
              <span>{heroContent.mediaType === 'movie' ? 'Film' : heroContent.mediaType === 'anime' ? 'Animé' : 'Série'}</span>
              {heroContent.rating && <span>⭐ {heroContent.rating}</span>}
              {heroContent.language && <span>{heroContent.region || heroContent.language.toUpperCase()}</span>}
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
      
      {/* Section Catégories */}
      <SectionTitle>Explorer par catégorie</SectionTitle>
      <SectionDescription>
        Découvrez nos collections de films, séries, animés et productions bollywood
      </SectionDescription>
      
      <FilterSection>
        <FilterButton 
          active={currentCategory === 'all'} 
          onClick={() => setCurrentCategory('all')}
        >
          Tous les carousels
        </FilterButton>
        <FilterButton 
          active={currentCategory === 'movies'} 
          onClick={() => setCurrentCategory('movies')}
        >
          Films
        </FilterButton>
        <FilterButton 
          active={currentCategory === 'drama'} 
          onClick={() => setCurrentCategory('drama')}
        >
          Dramas
        </FilterButton>
        <FilterButton 
          active={currentCategory === 'anime'} 
          onClick={() => setCurrentCategory('anime')}
        >
          Animés
        </FilterButton>
        <FilterButton 
          active={currentCategory === 'bollywood'} 
          onClick={() => setCurrentCategory('bollywood')}
        >
          Bollywood
        </FilterButton>
        <FilterButton 
          active={currentCategory === 'action'} 
          onClick={() => setCurrentCategory('action')}
        >
          Action
        </FilterButton>
        <FilterButton 
          active={currentCategory === 'comedy'} 
          onClick={() => setCurrentCategory('comedy')}
        >
          Comédie
        </FilterButton>
        <FilterButton 
          active={currentCategory === 'romance'} 
          onClick={() => setCurrentCategory('romance')}
        >
          Romance
        </FilterButton>
      </FilterSection>
      
      {/* Afficher soit les carousels, soit la grille de catégorie */}
      {currentCategory === 'all' ? (
        // Carousels dynamiques
        homeCarousels.map((carousel, index) => (
          <div key={carousel.id || index}>
            <DynamicCarousel 
              title={carousel.title} 
              dataSource={carousel.items} 
              refreshInterval={5000 + (index * 1000)} // Décaler les intervalles de mise à jour
            />
          </div>
        ))
      ) : (
        // Contenu de la catégorie sélectionnée
        <>
          <SectionTitle>
            {currentCategory === 'movies' ? 'Films' : 
             currentCategory === 'drama' ? 'Dramas' : 
             currentCategory === 'anime' ? 'Animés' : 
             currentCategory === 'bollywood' ? 'Bollywood' : 
             currentCategory.charAt(0).toUpperCase() + currentCategory.slice(1)}
          </SectionTitle>
          
          {categoryLoading ? (
            <LoadingContainer style={{ height: '300px' }}>
              <Spinner />
            </LoadingContainer>
          ) : (
            <CategoryGrid>
              {categoryContent.map((item, index) => (
                <AppleStyleCard 
                  key={`${item.id}-${index}`}
                  item={item}
                  showInfo={true}
                  index={index}
                />
              ))}
            </CategoryGrid>
          )}
        </>
      )}
    </PageContainer>
  );
};

export default DynamicHomePage;
