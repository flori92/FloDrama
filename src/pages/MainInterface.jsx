import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import './MainInterface.css';

// Importation des icônes
import { 
  FaPlay, 
  FaInfoCircle, 
  FaPlus, 
  FaCheck, 
  FaStar, 
  FaShare,
  FaBookmark,
  FaHeart,
  FaSearch,
  FaUser,
  FaBell,
  FaCog
} from 'react-icons/fa';

const MainInterface = () => {
  // État pour le chargement initial
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // État pour le carrousel héroïque
  const [heroItems, setHeroItems] = useState([]);
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const heroIntervalRef = useRef(null);
  
  // États pour les différentes sections de contenu
  const [recommendedContent, setRecommendedContent] = useState([]);
  const [trendingContent, setTrendingContent] = useState([]);
  const [dramaContent, setDramaContent] = useState([]);
  const [animeContent, setAnimeContent] = useState([]);
  const [bollywoodContent, setBollywoodContent] = useState([]);
  const [contextualContent, setContextualContent] = useState({});
  
  // Références pour les intervalles de rotation des carrousels
  const recommendedIntervalRef = useRef(null);
  const trendingIntervalRef = useRef(null);
  const dramaIntervalRef = useRef(null);
  const animeIntervalRef = useRef(null);
  const bollywoodIntervalRef = useRef(null);
  const contextualIntervalRef = useRef(null);
  
  // Références pour l'intersection observer
  const sectionRefs = useRef({});
  
  // Fonction pour simuler le chargement des données
  const fetchData = async () => {
    try {
      // Simulons un délai de chargement
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Données simulées pour le carrousel héroïque
      const heroData = [
        {
          id: 'hero1',
          title: 'Pachinko',
          year: 2022,
          rating: 8.7,
          duration: '60 min',
          genres: ['Drame', 'Historique'],
          description: 'Chronique d\'une famille coréenne sur quatre générations, depuis l\'occupation japonaise jusqu\'à nos jours. Le récit débute en 1915, dans un petit village de pêcheurs près de Busan.',
          backdropUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1925&auto=format&fit=crop',
          inWatchlist: false
        },
        {
          id: 'hero2',
          title: 'Squid Game',
          year: 2021,
          rating: 8.3,
          duration: '55 min',
          genres: ['Thriller', 'Drame'],
          description: 'Des personnes en difficultés financières sont invitées à participer à une mystérieuse compétition de survie. Participant à une série de jeux traditionnels pour enfants, mais avec des rebondissements mortels, ils risquent leur vie pour une énorme somme d\'argent.',
          backdropUrl: 'https://images.unsplash.com/photo-1635805737707-575885ab0820?q=80&w=1887&auto=format&fit=crop',
          inWatchlist: true
        },
        {
          id: 'hero3',
          title: 'Demon Slayer',
          year: 2019,
          rating: 8.9,
          duration: '25 min',
          genres: ['Animation', 'Action'],
          description: 'Le jeune Tanjirô vit avec sa famille dans les montagnes. Un jour, après être descendu au village, il découvre que sa famille a été attaquée par un démon. Nezuko, sa sœur, est la seule survivante mais elle a été transformée en démon.',
          backdropUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=1770&auto=format&fit=crop',
          inWatchlist: false
        }
      ];
      
      // Fonction pour générer des données de contenu aléatoires
      const generateContentItems = (count, type, isNew = false, isTrending = false) => {
        const genres = ['Action', 'Drame', 'Comédie', 'Romance', 'Thriller', 'Animation', 'Historique', 'Fantastique'];
        const years = isNew ? [2022, 2023, 2024] : [2018, 2019, 2020, 2021, 2022, 2023, 2024];
        const titles = {
          drama: ['My Love From The Star', 'Crash Landing on You', 'Itaewon Class', 'The Glory', 'Extraordinary Attorney Woo', 'Goblin', 'Reply 1988', 'Hospital Playlist'],
          anime: ['Attack on Titan', 'One Piece', 'Jujutsu Kaisen', 'My Hero Academia', 'Chainsaw Man', 'Spy x Family', 'Demon Slayer', 'Tokyo Revengers'],
          bollywood: ['Pathaan', 'RRR', 'Brahmastra', 'Jawan', 'Animal', 'Kalki 2898 AD', 'Stree 2', 'Dunki']
        };
        
        const getTitles = () => {
          switch(type) {
            case 'drama': return titles.drama;
            case 'anime': return titles.anime;
            case 'bollywood': return titles.bollywood;
            default: return [...titles.drama, ...titles.anime, ...titles.bollywood];
          }
        };
        
        const availableTitles = getTitles();
        
        return Array.from({ length: count }, (_, i) => ({
          id: `${type}-${i}`,
          title: availableTitles[Math.floor(Math.random() * availableTitles.length)],
          year: years[Math.floor(Math.random() * years.length)],
          rating: (Math.random() * 2 + 7).toFixed(1),
          genres: [genres[Math.floor(Math.random() * genres.length)], genres[Math.floor(Math.random() * genres.length)]].filter((v, i, a) => a.indexOf(v) === i),
          posterUrl: `https://picsum.photos/300/450?random=${Math.random()}`,
          progress: Math.random() > 0.7 ? Math.floor(Math.random() * 90) : 0,
          duration: `${Math.floor(Math.random() * 30 + 20)} min`,
          isNew: isNew || Math.random() > 0.8,
          isTrending: isTrending || Math.random() > 0.7,
          isRecommended: Math.random() > 0.7
        }));
      };
      
      // Générer les données pour chaque section
      const recommended = generateContentItems(12, 'mixed', true, true);
      const trending = generateContentItems(12, 'mixed', true, true).filter(item => item.year >= 2022);
      const dramas = generateContentItems(12, 'drama');
      const animes = generateContentItems(12, 'anime');
      const bollywood = generateContentItems(12, 'bollywood');
      
      // Générer des recommandations contextuelles basées sur l'heure de la journée
      const hour = new Date().getHours();
      let contextualTitle = '';
      let contextualItems = [];
      
      if (hour >= 5 && hour < 12) {
        contextualTitle = 'Recommandés pour votre matinée';
        contextualItems = generateContentItems(12, 'mixed').filter(item => item.duration.split(' ')[0] < 30);
      } else if (hour >= 12 && hour < 18) {
        contextualTitle = 'Parfait pour votre après-midi';
        contextualItems = generateContentItems(12, 'mixed').filter(item => item.genres.includes('Comédie') || item.genres.includes('Animation'));
      } else if (hour >= 18 && hour < 22) {
        contextualTitle = 'Pour votre soirée';
        contextualItems = generateContentItems(12, 'mixed').filter(item => item.rating > 8);
      } else {
        contextualTitle = 'Sessions nocturnes';
        contextualItems = generateContentItems(12, 'mixed').filter(item => item.genres.includes('Thriller') || item.genres.includes('Fantastique'));
      }
      
      // Mettre à jour les états
      setHeroItems(heroData);
      setRecommendedContent(recommended);
      setTrendingContent(trending);
      setDramaContent(dramas);
      setAnimeContent(animes);
      setBollywoodContent(bollywood);
      setContextualContent({
        title: contextualTitle,
        items: contextualItems
      });
      
      setLoading(false);
    } catch (err) {
      console.error('Erreur lors du chargement des données:', err);
      setError('Une erreur est survenue lors du chargement des données. Veuillez réessayer.');
      setLoading(false);
    }
  };
  
  // Effet pour charger les données au montage du composant
  useEffect(() => {
    fetchData();
    
    // Nettoyage des intervalles à la destruction du composant
    return () => {
      clearAllIntervals();
    };
  }, []);
  
  // Effet pour gérer la rotation automatique du carrousel héroïque
  useEffect(() => {
    if (heroItems.length > 0 && !loading) {
      heroIntervalRef.current = setInterval(() => {
        setCurrentHeroIndex(prevIndex => (prevIndex + 1) % heroItems.length);
      }, 8000); // Rotation toutes les 8 secondes
      
      return () => {
        if (heroIntervalRef.current) {
          clearInterval(heroIntervalRef.current);
        }
      };
    }
  }, [heroItems, loading]);
  
  // Effet pour configurer l'Intersection Observer
  useEffect(() => {
    if (!loading) {
      const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
      };
      
      const observerCallback = (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      };
      
      const observer = new IntersectionObserver(observerCallback, observerOptions);
      
      // Observer toutes les sections
      Object.values(sectionRefs.current).forEach(ref => {
        if (ref) {
          observer.observe(ref);
        }
      });
      
      return () => {
        Object.values(sectionRefs.current).forEach(ref => {
          if (ref) {
            observer.unobserve(ref);
          }
        });
      };
    }
  }, [loading]);
  
  // Fonction pour nettoyer tous les intervalles
  const clearAllIntervals = () => {
    if (heroIntervalRef.current) clearInterval(heroIntervalRef.current);
    if (recommendedIntervalRef.current) clearInterval(recommendedIntervalRef.current);
    if (trendingIntervalRef.current) clearInterval(trendingIntervalRef.current);
    if (dramaIntervalRef.current) clearInterval(dramaIntervalRef.current);
    if (animeIntervalRef.current) clearInterval(animeIntervalRef.current);
    if (bollywoodIntervalRef.current) clearInterval(bollywoodIntervalRef.current);
    if (contextualIntervalRef.current) clearInterval(contextualIntervalRef.current);
  };
  
  // Fonction pour gérer le clic sur un indicateur du carrousel héroïque
  const handleHeroIndicatorClick = (index) => {
    setCurrentHeroIndex(index);
    
    // Réinitialiser l'intervalle
    if (heroIntervalRef.current) {
      clearInterval(heroIntervalRef.current);
      heroIntervalRef.current = setInterval(() => {
        setCurrentHeroIndex(prevIndex => (prevIndex + 1) % heroItems.length);
      }, 8000);
    }
  };
  
  // Fonction pour gérer l'ajout/suppression de la liste de visionnage
  const toggleWatchlist = (id) => {
    setHeroItems(prevItems => 
      prevItems.map(item => 
        item.id === id ? { ...item, inWatchlist: !item.inWatchlist } : item
      )
    );
  };
  
  // Composant pour la barre de navigation
  const Navbar = () => (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-left">
          <Link to="/" className="navbar-logo">
            <div className="logo-icon">FD</div>
            <span className="logo-text">FloDrama</span>
          </Link>
          <div className="navbar-links">
            <Link to="/" className="navbar-link active">Accueil</Link>
            <Link to="/dramas" className="navbar-link">Dramas</Link>
            <Link to="/films" className="navbar-link">Films</Link>
            <Link to="/animes" className="navbar-link">Animés</Link>
            <Link to="/bollywood" className="navbar-link">Bollywood</Link>
            <Link to="/ma-liste" className="navbar-link">Ma Liste</Link>
            <Link to="/app" className="navbar-link">App</Link>
          </div>
        </div>
        <div className="navbar-right">
          <button className="navbar-icon-button">
            <FaSearch />
          </button>
          <button className="navbar-icon-button">
            <FaBell />
          </button>
          <div className="navbar-user">
            <div className="user-avatar">FD</div>
          </div>
        </div>
      </div>
    </nav>
  );
  
  // Composant pour le footer
  const Footer = () => (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-top">
          <div className="footer-logo">
            <div className="logo-icon">FD</div>
            <span className="logo-text">FloDrama</span>
          </div>
          <div className="footer-links">
            <div className="footer-links-column">
              <h3>Navigation</h3>
              <Link to="/">Accueil</Link>
              <Link to="/dramas">Dramas</Link>
              <Link to="/films">Films</Link>
              <Link to="/animes">Animés</Link>
              <Link to="/bollywood">Bollywood</Link>
            </div>
            <div className="footer-links-column">
              <h3>Compte</h3>
              <Link to="/profil">Mon profil</Link>
              <Link to="/ma-liste">Ma liste</Link>
              <Link to="/historique">Historique</Link>
              <Link to="/parametres">Paramètres</Link>
            </div>
            <div className="footer-links-column">
              <h3>Aide</h3>
              <Link to="/faq">FAQ</Link>
              <Link to="/contact">Contact</Link>
              <Link to="/conditions">Conditions d'utilisation</Link>
              <Link to="/confidentialite">Confidentialité</Link>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p> 2025 FloDrama. Tous droits réservés.</p>
          <div className="footer-social">
            <a href="#" className="social-icon"><FaHeart /></a>
            <a href="#" className="social-icon"><FaShare /></a>
            <a href="#" className="social-icon"><FaBookmark /></a>
          </div>
        </div>
      </div>
    </footer>
  );
  
  // Composant pour afficher un élément du carrousel héroïque
  const HeroCarouselItem = ({ item, isActive }) => (
    <div 
      className="hero-carousel-item" 
      style={{ 
        backgroundImage: `linear-gradient(to bottom, rgba(18, 17, 24, 0.2), rgba(18, 17, 24, 0.8)), url(${item.backdropUrl})`,
        opacity: isActive ? 1 : 0,
        zIndex: isActive ? 1 : 0
      }}
    >
      <div className="hero-content">
        <h1 className="hero-title">{item.title}</h1>
        <div className="hero-metadata">
          <span className="hero-year">{item.year}</span>
          <span className="hero-rating">
            <span className="hero-star"><FaStar /></span>
            {item.rating}
          </span>
          <span className="hero-duration">{item.duration}</span>
          {item.genres.map((genre, index) => (
            <span key={index} className="hero-genre">{genre}</span>
          ))}
        </div>
        <p className="hero-description">{item.description}</p>
        <div className="hero-actions">
          <button className="hero-button hero-button-play">
            <FaPlay />
            Regarder
          </button>
          <button className="hero-button hero-button-info">
            <FaInfoCircle />
            Plus d'infos
          </button>
          <button 
            className={`hero-button hero-button-watchlist ${item.inWatchlist ? 'active' : ''}`}
            onClick={() => toggleWatchlist(item.id)}
          >
            {item.inWatchlist ? <FaCheck /> : <FaPlus />}
            {item.inWatchlist ? 'Dans ma liste' : 'Ajouter à ma liste'}
          </button>
        </div>
      </div>
    </div>
  );
  
  // Composant pour afficher un élément de carrousel de contenu
  const ContentCarouselItem = ({ item }) => (
    <div className="carousel-item">
      {item.isNew && <div className="new-badge">Nouveau</div>}
      {item.isRecommended && <div className="recommendation-badge">Recommandé</div>}
      
      <div className="carousel-item-image-container">
        <img src={item.posterUrl} alt={item.title} className="carousel-item-image" />
        
        <div className="carousel-item-overlay">
          <div className="carousel-item-actions">
            <button className="carousel-item-action carousel-item-action-play">
              <FaPlay />
            </button>
            <button className="carousel-item-action">
              <FaPlus />
            </button>
            <button className="carousel-item-action">
              <FaInfoCircle />
            </button>
            <button className="carousel-item-action">
              <FaShare />
            </button>
          </div>
        </div>
        
        {item.progress > 0 && (
          <div className="progress-bar-container">
            <div className="progress-bar" style={{ width: `${item.progress}%` }}></div>
          </div>
        )}
        
        {item.duration && <div className="time-indicator">{item.duration}</div>}
      </div>
      
      <div className="carousel-item-info">
        <h3 className="carousel-item-title">{item.title}</h3>
        <div className="carousel-item-metadata">
          <span className="carousel-item-year">{item.year}</span>
          <span className="carousel-item-rating">
            <span className="carousel-item-rating-star"><FaStar /></span>
            {item.rating}
          </span>
        </div>
        <div className="carousel-item-genres">
          {item.genres.map((genre, index) => (
            <span key={index} className="carousel-item-genre">{genre}</span>
          ))}
        </div>
      </div>
    </div>
  );
  
  // Composant pour afficher une section de contenu
  const ContentSection = ({ id, title, items }) => (
    <section 
      id={id} 
      className="content-section" 
      ref={el => sectionRefs.current[id] = el}
    >
      <h2 className="section-title">{title}</h2>
      <div className="carousel-container">
        <div className="carousel-items">
          {items.map((item, index) => (
            <ContentCarouselItem key={`${id}-${index}`} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
  
  // Affichage du chargement
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Chargement de votre expérience personnalisée...</p>
      </div>
    );
  }
  
  // Affichage de l'erreur
  if (error) {
    return (
      <div className="error-container">
        <h2>Oups ! Quelque chose s'est mal passé</h2>
        <p>{error}</p>
        <button onClick={() => { setError(null); fetchData(); }}>
          Réessayer
        </button>
      </div>
    );
  }
  
  // Affichage principal
  return (
    <div className="main-interface">
      {/* Barre de navigation */}
      <Navbar />
      
      {/* Carrousel héroïque */}
      <div className="hero-carousel-container">
        {heroItems.map((item, index) => (
          <HeroCarouselItem 
            key={item.id} 
            item={item} 
            isActive={index === currentHeroIndex} 
          />
        ))}
        
        <div className="hero-indicators">
          {heroItems.map((_, index) => (
            <button 
              key={index}
              className={`hero-indicator ${index === currentHeroIndex ? 'active' : ''}`}
              onClick={() => handleHeroIndicatorClick(index)}
              aria-label={`Slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
      
      <div className="main-content">
        {/* Section de contenu recommandé */}
        <ContentSection 
          id="section-recommended" 
          title="Recommandé pour vous" 
          items={recommendedContent} 
        />
        
        {/* Section de contenu contextuel */}
        <ContentSection 
          id="section-contextual" 
          title={contextualContent.title} 
          items={contextualContent.items} 
        />
        
        {/* Section de contenu tendance */}
        <ContentSection 
          id="section-trending" 
          title="Tendances actuelles" 
          items={trendingContent} 
        />
        
        {/* Section de dramas */}
        <ContentSection 
          id="section-dramas" 
          title="Dramas populaires" 
          items={dramaContent} 
        />
        
        {/* Section d'anime */}
        <ContentSection 
          id="section-anime" 
          title="Anime à découvrir" 
          items={animeContent} 
        />
        
        {/* Section de Bollywood */}
        <ContentSection 
          id="section-bollywood" 
          title="Cinéma Bollywood" 
          items={bollywoodContent} 
        />
      </div>
      
      {/* Footer */}
      <Footer />
    </div>
  );
};

export default MainInterface;
