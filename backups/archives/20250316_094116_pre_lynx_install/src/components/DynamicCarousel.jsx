/**
 * DynamicCarousel
 * 
 * Composant de carrousel dynamique qui change de contenu toutes les 5 secondes
 * Utilisé pour afficher des contenus variés sur la page d'accueil
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { getAssetUrl } from '../api/metadata';
import SmartScrapingService from '../services/SmartScrapingService';

// Styles du carrousel
const CarouselContainer = styled.div`
  position: relative;
  width: 100%;
  overflow: hidden;
  border-radius: 8px;
  margin-bottom: 2rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
`;

const CarouselTitle = styled.h2`
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: #fff;
  font-weight: 600;
`;

const CarouselContent = styled.div`
  display: flex;
  flex-wrap: nowrap;
  transition: transform 0.5s ease;
`;

const ItemsContainer = styled.div`
  display: flex;
  flex-wrap: nowrap;
  gap: 1rem;
  width: 100%;
  padding: 1rem;
`;

const ItemCard = styled.div`
  flex: 0 0 auto;
  width: 180px;
  margin-right: 1rem;
  border-radius: 8px;
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  background-color: #1a1a1a;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
  }
`;

const ItemImage = styled.img`
  width: 100%;
  height: 250px;
  object-fit: cover;
  border-radius: 8px 8px 0 0;
`;

const ItemTitle = styled.h3`
  font-size: 0.9rem;
  padding: 0.5rem;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #fff;
`;

const CarouselControls = styled.div`
  position: absolute;
  top: 50%;
  width: 100%;
  display: flex;
  justify-content: space-between;
  transform: translateY(-50%);
  z-index: 10;
`;

const ControlButton = styled.button`
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  margin: 0 10px;
  
  &:hover {
    background-color: rgba(0, 0, 0, 0.8);
  }
`;

const LoadingIndicator = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  color: #fff;
`;

const DynamicCarousel = ({ title, dataSource, refreshInterval = 5000 }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSet, setCurrentSet] = useState(0);
  const [totalSets, setTotalSets] = useState(0);
  const itemsPerSet = 6; // Nombre d'éléments affichés à la fois
  
  // Fonction pour récupérer les données en fonction de la source spécifiée
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      let data;
      
      switch (dataSource) {
        case 'popular':
          data = await SmartScrapingService.getPopular();
          break;
        case 'movies':
          data = await SmartScrapingService.getPopularMovies();
          break;
        case 'kshows':
          data = await SmartScrapingService.getPopularKshows();
          break;
        case 'latest':
          // Combiner plusieurs sources pour avoir plus de variété
          const popular = await SmartScrapingService.getPopular();
          const movies = await SmartScrapingService.getPopularMovies();
          
          // Vérifier si les données sont au nouveau format avec MAX_LENGTH
          const popularData = Array.isArray(popular) ? popular : (popular && popular.data ? popular.data : []);
          const moviesData = Array.isArray(movies) ? movies : (movies && movies.data ? movies.data : []);
          
          data = [...popularData, ...moviesData].sort(() => Math.random() - 0.5).slice(0, 20);
          break;
        default:
          data = await SmartScrapingService.getPopular();
      }
      
      // Vérifier si les données sont au nouveau format avec MAX_LENGTH
      const processedData = Array.isArray(data) ? data : (data && data.data ? data.data : []);
      
      // Mélanger les données pour plus de dynamisme
      const shuffledData = [...processedData].sort(() => Math.random() - 0.5);
      setItems(shuffledData);
      setTotalSets(Math.ceil(shuffledData.length / itemsPerSet));
    } catch (error) {
      console.error('Erreur lors de la récupération des données pour le carrousel:', error);
    } finally {
      setLoading(false);
    }
  }, [dataSource]);
  
  // Récupérer les données au chargement du composant
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  // Changer automatiquement de set toutes les X secondes
  useEffect(() => {
    if (totalSets <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentSet(prevSet => (prevSet + 1) % totalSets);
    }, refreshInterval);
    
    return () => clearInterval(interval);
  }, [totalSets, refreshInterval]);
  
  // Fonctions pour naviguer manuellement
  const goToPrevSet = () => {
    setCurrentSet(prevSet => (prevSet - 1 + totalSets) % totalSets);
  };
  
  const goToNextSet = () => {
    setCurrentSet(prevSet => (prevSet + 1) % totalSets);
  };
  
  // Calculer les éléments à afficher dans le set actuel
  const currentItems = items.slice(
    currentSet * itemsPerSet,
    (currentSet + 1) * itemsPerSet
  );
  
  if (loading) {
    return (
      <div>
        <CarouselTitle>{title}</CarouselTitle>
        <CarouselContainer>
          <LoadingIndicator>Chargement des contenus...</LoadingIndicator>
        </CarouselContainer>
      </div>
    );
  }
  
  if (items.length === 0) {
    return null;
  }
  
  return (
    <div>
      <CarouselTitle>{title}</CarouselTitle>
      <CarouselContainer>
        <CarouselContent>
          <ItemsContainer>
            {currentItems.map((item, index) => (
              <Link 
                key={`${item.id}-${index}`} 
                to={`/detail/${item.source.toLowerCase()}/${item.id}`}
                style={{ textDecoration: 'none' }}
              >
                <ItemCard>
                  <ItemImage 
                    src={item.image || getAssetUrl('images/placeholder.jpg')} 
                    alt={item.title} 
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = getAssetUrl('images/placeholder.jpg');
                    }}
                  />
                  <ItemTitle>{item.title}</ItemTitle>
                </ItemCard>
              </Link>
            ))}
          </ItemsContainer>
        </CarouselContent>
        
        {totalSets > 1 && (
          <CarouselControls>
            <ControlButton onClick={goToPrevSet}>
              &lt;
            </ControlButton>
            <ControlButton onClick={goToNextSet}>
              &gt;
            </ControlButton>
          </CarouselControls>
        )}
      </CarouselContainer>
    </div>
  );
};

export default DynamicCarousel;
