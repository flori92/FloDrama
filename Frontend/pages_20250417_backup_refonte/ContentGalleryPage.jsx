import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ContentDataService from '../services/ContentService';
import LoadingSpinner from '../components/LoadingSpinner';
import '../styles/ContentGalleryPage.css';

/**
 * Page de galerie de contenu pour FloDrama
 * Affiche une collection de films, séries et animes disponibles pour le visionnage
 */
const ContentGalleryPage = ({ type = 'all', title }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [contents, setContents] = useState([]);
  const [filteredContents, setFilteredContents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const navigate = useNavigate();

  // Charger les contenus au chargement de la page
  useEffect(() => {
    const loadContents = async () => {
      try {
        setIsLoading(true);
        
        let contentData = [];
        
        // Récupérer les données depuis ContentDataService
        if (ContentDataService) {
          try {
            if (type === 'all') {
              contentData = await ContentDataService.getAllContents();
            } else {
              contentData = await ContentDataService.getContentsByType(type);
            }
          } catch (error) {
            console.warn('Erreur lors de la récupération des données depuis ContentDataService:', error);
          }
        }
        
        // Si aucune donnée n'est disponible, utiliser des données de démonstration
        if (!contentData || contentData.length === 0) {
          contentData = generateDemoContents(type);
        }
        
        setContents(contentData);
        setFilteredContents(contentData);
      } catch (error) {
        console.error('Erreur lors du chargement des contenus:', error);
        setError('Impossible de charger les contenus. Veuillez réessayer plus tard.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadContents();
  }, [type]);
  
  // Filtrer les contenus en fonction de la recherche
  useEffect(() => {
    if (searchQuery.trim() === '' && activeFilter === 'all') {
      setFilteredContents(contents);
      return;
    }
    
    let filtered = contents;
    
    // Filtrer par type si nécessaire
    if (activeFilter !== 'all') {
      filtered = filtered.filter(content => content.type === activeFilter);
    }
    
    // Filtrer par recherche si nécessaire
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(content => 
        content.title.toLowerCase().includes(query) || 
        (content.description && content.description.toLowerCase().includes(query))
      );
    }
    
    setFilteredContents(filtered);
  }, [searchQuery, activeFilter, contents]);
  
  // Générer des données de démonstration
  const generateDemoContents = (contentType) => {
    const demoContents = [
      {
        id: 'drama-1',
        title: 'Crash Landing on You',
        type: 'drama',
        image: 'https://m.media-amazon.com/images/M/MV5BMzRiZWUyN2YtNDI4YS00NTg2LTg0OTgtMGI2ZjU4ODQ4Yjk3XkEyXkFqcGdeQXVyNTI5NjIyMw@@._V1_.jpg',
        description: 'Une héritière sud-coréenne atterrit accidentellement en Corée du Nord après un accident de parapente.',
        year: 2019,
        rating: 4.8,
        episodes: 16,
        sources: [
          { quality: 'auto', url: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.mp4/.m3u8' },
          { quality: '1080p', url: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.mp4/.m3u8' }
        ]
      },
      {
        id: 'drama-2',
        title: 'Goblin',
        type: 'drama',
        image: 'https://m.media-amazon.com/images/M/MV5BZTg0YmQxZTgtMzgwYi00N2NhLTlkMWYtOWYwNDA1YjkxMmViL2ltYWdlL2ltYWdlXkEyXkFqcGdeQXVyMzE4MDkyNTA@._V1_FMjpg_UX1000_.jpg',
        description: 'Un goblin immortel cherche une mariée humaine pour mettre fin à sa vie éternelle.',
        year: 2016,
        rating: 4.7,
        episodes: 16,
        sources: [
          { quality: 'auto', url: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.mp4/.m3u8' },
          { quality: '1080p', url: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.mp4/.m3u8' }
        ]
      },
      {
        id: 'film-1',
        title: 'Parasite',
        type: 'film',
        image: 'https://m.media-amazon.com/images/M/MV5BYWZjMjk3ZTItODQ2ZC00NTY5LWE0ZDYtZTI3MjcwN2Q5NTVkXkEyXkFqcGdeQXVyODk4OTc3MTY@._V1_.jpg',
        description: 'Une famille pauvre s\'immisce dans la vie d\'une famille riche, avec des conséquences inattendues.',
        year: 2019,
        rating: 4.9,
        duration: 132,
        sources: [
          { quality: 'auto', url: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.mp4/.m3u8' },
          { quality: '1080p', url: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.mp4/.m3u8' }
        ]
      },
      {
        id: 'film-2',
        title: 'Train to Busan',
        type: 'film',
        image: 'https://m.media-amazon.com/images/M/MV5BMTkwOTQ4OTg0OV5BMl5BanBnXkFtZTgwMzQyOTM0OTE@._V1_.jpg',
        description: 'Un père et sa fille se retrouvent dans un train avec des passagers contaminés par un virus zombie.',
        year: 2016,
        rating: 4.6,
        duration: 118,
        sources: [
          { quality: 'auto', url: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.mp4/.m3u8' },
          { quality: '1080p', url: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.mp4/.m3u8' }
        ]
      },
      {
        id: 'bollywood-1',
        title: '3 Idiots',
        type: 'bollywood',
        image: 'https://m.media-amazon.com/images/M/MV5BNTkyOGVjMGEtNmQzZi00NzFlLTlhOWQtODYyMDc2ZGJmYzFhXkEyXkFqcGdeQXVyNjU0OTQ0OTY@._V1_.jpg',
        description: 'Deux amis partent à la recherche de leur camarade de classe disparu.',
        year: 2009,
        rating: 4.8,
        duration: 170,
        sources: [
          { quality: 'auto', url: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.mp4/.m3u8' },
          { quality: '1080p', url: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.mp4/.m3u8' }
        ]
      },
      {
        id: 'bollywood-2',
        title: 'Dangal',
        type: 'bollywood',
        image: 'https://m.media-amazon.com/images/M/MV5BMTQ4MzQzMzM2Nl5BMl5BanBnXkFtZTgwMTQ1NzU3MDI@._V1_.jpg',
        description: 'Un ancien lutteur entraîne ses filles pour qu\'elles deviennent des championnes de lutte.',
        year: 2016,
        rating: 4.7,
        duration: 161,
        sources: [
          { quality: 'auto', url: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.mp4/.m3u8' },
          { quality: '1080p', url: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.mp4/.m3u8' }
        ]
      },
      {
        id: 'anime-1',
        title: 'Your Name',
        type: 'anime',
        image: 'https://m.media-amazon.com/images/M/MV5BODRmZDVmNzUtZDA4ZC00NjhkLWI2M2UtN2M0ZDIzNDcxYThjL2ltYWdlXkEyXkFqcGdeQXVyNTk0MzMzODA@._V1_.jpg',
        description: 'Deux adolescents découvrent qu\'ils échangent leurs corps pendant leur sommeil.',
        year: 2016,
        rating: 4.8,
        duration: 106,
        sources: [
          { quality: 'auto', url: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.mp4/.m3u8' },
          { quality: '1080p', url: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.mp4/.m3u8' }
        ]
      },
      {
        id: 'anime-2',
        title: 'Attack on Titan',
        type: 'anime',
        image: 'https://m.media-amazon.com/images/M/MV5BMTY5ODk1NzUyMl5BMl5BanBnXkFtZTgwMjUyNzEyMTE@._V1_.jpg',
        description: 'L\'humanité lutte pour sa survie face à des titans mangeurs d\'hommes.',
        year: 2013,
        rating: 4.9,
        episodes: 75,
        sources: [
          { quality: 'auto', url: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.mp4/.m3u8' },
          { quality: '1080p', url: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.mp4/.m3u8' }
        ]
      }
    ];
    
    // Filtrer par type si nécessaire
    if (contentType !== 'all') {
      return demoContents.filter(content => content.type === contentType);
    }
    
    return demoContents;
  };
  
  // Gérer le clic sur une carte de contenu
  const handleContentClick = (content) => {
    // Si c'est un film, rediriger directement vers le lecteur
    if (content.type === 'film' || content.type === 'bollywood') {
      navigate(`/player?id=${content.id}`);
    } else {
      // Pour les séries et animes, rediriger vers la page de détails
      navigate(`/contenu/${content.id}`);
    }
  };
  
  // Formater la durée (minutes -> HH:MM)
  const formatDuration = (minutes) => {
    if (!minutes) return '';
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    return `${hours}h${mins.toString().padStart(2, '0')}`;
  };
  
  // Afficher un écran de chargement
  if (isLoading) {
    return (
      <div className="content-gallery-loading">
        <LoadingSpinner />
        <p>Chargement des contenus...</p>
      </div>
    );
  }
  
  // Afficher un message d'erreur
  if (error) {
    return (
      <div className="content-gallery-error">
        <h2>Erreur</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className="content-gallery-retry-button">
          Réessayer
        </button>
      </div>
    );
  }
  
  return (
    <div className="content-gallery-page">
      <div className="content-gallery-header">
        <h1 className="content-gallery-title">
          {title || (type === 'all' ? 'Tous les contenus' : type.charAt(0).toUpperCase() + type.slice(1))}
        </h1>
        
        <div className="content-gallery-controls">
          {/* Barre de recherche */}
          <div className="content-gallery-search">
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="content-gallery-search-input"
            />
            <button className="content-gallery-search-button">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </button>
          </div>
          
          {/* Filtres */}
          {type === 'all' && (
            <div className="content-gallery-filters">
              <button 
                className={`content-gallery-filter-button ${activeFilter === 'all' ? 'active' : ''}`}
                onClick={() => setActiveFilter('all')}
              >
                Tous
              </button>
              <button 
                className={`content-gallery-filter-button ${activeFilter === 'drama' ? 'active' : ''}`}
                onClick={() => setActiveFilter('drama')}
              >
                Dramas
              </button>
              <button 
                className={`content-gallery-filter-button ${activeFilter === 'film' ? 'active' : ''}`}
                onClick={() => setActiveFilter('film')}
              >
                Films
              </button>
              <button 
                className={`content-gallery-filter-button ${activeFilter === 'bollywood' ? 'active' : ''}`}
                onClick={() => setActiveFilter('bollywood')}
              >
                Bollywood
              </button>
              <button 
                className={`content-gallery-filter-button ${activeFilter === 'anime' ? 'active' : ''}`}
                onClick={() => setActiveFilter('anime')}
              >
                Animé
              </button>
            </div>
          )}
        </div>
      </div>
      
      {filteredContents.length === 0 ? (
        <div className="content-gallery-empty">
          <p>Aucun contenu trouvé pour votre recherche.</p>
        </div>
      ) : (
        <div className="content-gallery-grid">
          {filteredContents.map((content) => (
            <div 
              key={content.id} 
              className="content-card"
              onClick={() => handleContentClick(content)}
            >
              <div className="content-card-image-container">
                <img 
                  src={content.image} 
                  alt={content.title} 
                  className="content-card-image"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/assets/placeholder.jpg';
                  }}
                />
                <div className="content-card-overlay">
                  <button className="content-card-play-button">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                  </button>
                </div>
                <div className="content-card-badges">
                  <span className="content-card-type">
                    {content.type === 'drama' ? 'Drama' : 
                     content.type === 'film' ? 'Film' : 
                     content.type === 'bollywood' ? 'Bollywood' : 
                     content.type === 'anime' ? 'Animé' : content.type}
                  </span>
                  {content.episodes && (
                    <span className="content-card-episodes">
                      {content.episodes} épisodes
                    </span>
                  )}
                  {content.duration && (
                    <span className="content-card-duration">
                      {formatDuration(content.duration)}
                    </span>
                  )}
                </div>
              </div>
              <div className="content-card-info">
                <h3 className="content-card-title">{content.title}</h3>
                <div className="content-card-meta">
                  <span className="content-card-year">{content.year}</span>
                  <span className="content-card-rating">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                    </svg>
                    {content.rating}
                  </span>
                </div>
                <p className="content-card-description">
                  {content.description && content.description.length > 100
                    ? content.description.substring(0, 100) + '...'
                    : content.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ContentGalleryPage;
