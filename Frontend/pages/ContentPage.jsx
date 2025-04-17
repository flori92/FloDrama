import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import '../styles/ContentPage.css';

/**
 * Page de détail d'un contenu (film, série, anime)
 * Affiche les informations détaillées et les options de lecture
 */
const ContentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [content, setContent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isInWatchlist, setIsInWatchlist] = useState(false);

  useEffect(() => {
    // Récupérer l'ID du contenu depuis les paramètres d'URL
    const searchParams = new URLSearchParams(location.search);
    const contentId = searchParams.get('id');
    
    if (!contentId) {
      setError('Aucun identifiant de contenu spécifié');
      setIsLoading(false);
      return;
    }
    
    // Simuler le chargement des données depuis l'API
    const fetchContentDetails = async () => {
      try {
        // Simuler un délai réseau
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Données mockées pour l'exemple
        const mockContent = {
          id: contentId,
          title: 'Crash Landing on You',
          originalTitle: '사랑의 불시착',
          type: 'drama',
          year: 2019,
          country: 'Corée du Sud',
          genres: ['Romance', 'Comédie', 'Drame'],
          rating: 4.8,
          episodes: 16,
          duration: '70 min',
          status: 'Terminé',
          description: 'Une héritière sud-coréenne atterrit accidentellement en Corée du Nord après un accident de parapente. Elle y rencontre un officier de l\'armée nord-coréenne qui décide de l\'aider à retourner chez elle.',
          image: '/assets/placeholder.jpg',
          backdrop: '/assets/placeholder-wide.jpg',
          trailer: 'https://www.youtube.com/watch?v=eXMjTXL2Vks',
          cast: [
            { name: 'Son Ye-jin', role: 'Yoon Se-ri', image: '/assets/placeholder-actor.jpg' },
            { name: 'Hyun Bin', role: 'Ri Jeong-hyeok', image: '/assets/placeholder-actor.jpg' },
            { name: 'Seo Ji-hye', role: 'Seo Dan', image: '/assets/placeholder-actor.jpg' },
            { name: 'Kim Jung-hyun', role: 'Gu Seung-jun', image: '/assets/placeholder-actor.jpg' }
          ],
          director: 'Lee Jeong-hyo',
          writer: 'Park Ji-eun',
          streamingUrl: 'https://example.com/stream/12345',
          related: [
            { id: 'rel1', title: 'Goblin', type: 'drama', image: '/assets/placeholder.jpg' },
            { id: 'rel2', title: 'Itaewon Class', type: 'drama', image: '/assets/placeholder.jpg' },
            { id: 'rel3', title: 'Descendants of the Sun', type: 'drama', image: '/assets/placeholder.jpg' }
          ]
        };
        
        setContent(mockContent);
        // Vérifier si le contenu est dans la liste de l'utilisateur (simulé)
        setIsInWatchlist(Math.random() > 0.5);
      } catch (err) {
        console.error('Erreur lors du chargement des détails du contenu:', err);
        setError('Impossible de charger les détails du contenu');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchContentDetails();
  }, [location.search]);

  const handlePlay = () => {
    if (content) {
      navigate(`/player?id=${content.id}&title=${encodeURIComponent(content.title)}`);
    }
  };

  const toggleWatchlist = () => {
    setIsInWatchlist(prev => !prev);
    // Ici, vous appelleriez normalement une API pour mettre à jour la liste de l'utilisateur
  };

  if (isLoading) {
    return (
      <div className="content-loading">
        <div className="loading-spinner"></div>
        <p>Chargement du contenu...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="content-error">
        <h2>Erreur</h2>
        <p>{error}</p>
        <Link to="/" className="back-home-link">Retour à l'accueil</Link>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="content-error">
        <h2>Contenu non trouvé</h2>
        <p>Le contenu demandé n'existe pas ou a été supprimé.</p>
        <Link to="/" className="back-home-link">Retour à l'accueil</Link>
      </div>
    );
  }

  return (
    <div className="content-page">
      <div className="content-backdrop" style={{ backgroundImage: `url(${content.backdrop})` }}>
        <div className="backdrop-overlay"></div>
      </div>
      
      <header className="content-header">
        <Link to="/" className="back-button">
          <i className="fas fa-arrow-left"></i> Retour
        </Link>
      </header>
      
      <div className="content-container">
        <div className="content-poster">
          <img src={content.image} alt={content.title} />
        </div>
        
        <div className="content-details">
          <h1 className="content-title">{content.title}</h1>
          {content.originalTitle && (
            <h2 className="content-original-title">{content.originalTitle}</h2>
          )}
          
          <div className="content-meta">
            <span className="content-year">{content.year}</span>
            <span className="content-country">{content.country}</span>
            {content.episodes && (
              <span className="content-episodes">{content.episodes} épisodes</span>
            )}
            <span className="content-duration">{content.duration}</span>
            <span className="content-status">{content.status}</span>
          </div>
          
          <div className="content-genres">
            {content.genres.map((genre, index) => (
              <span key={index} className="genre-tag">{genre}</span>
            ))}
          </div>
          
          <div className="content-rating">
            <div className="rating-stars">
              {'★'.repeat(Math.floor(content.rating))}
              {'☆'.repeat(5 - Math.floor(content.rating))}
            </div>
            <span className="rating-value">{content.rating}/5</span>
          </div>
          
          <p className="content-description">{content.description}</p>
          
          <div className="content-credits">
            {content.director && (
              <div className="credit-item">
                <span className="credit-label">Réalisateur:</span>
                <span className="credit-value">{content.director}</span>
              </div>
            )}
            {content.writer && (
              <div className="credit-item">
                <span className="credit-label">Scénariste:</span>
                <span className="credit-value">{content.writer}</span>
              </div>
            )}
          </div>
          
          <div className="content-actions">
            <button className="play-button" onClick={handlePlay}>
              <i className="fas fa-play"></i> Regarder maintenant
            </button>
            <button 
              className={`watchlist-button ${isInWatchlist ? 'in-list' : ''}`} 
              onClick={toggleWatchlist}
            >
              <i className={`fas ${isInWatchlist ? 'fa-check' : 'fa-plus'}`}></i>
              {isInWatchlist ? 'Dans ma liste' : 'Ajouter à ma liste'}
            </button>
            {content.trailer && (
              <a href={content.trailer} target="_blank" rel="noopener noreferrer" className="trailer-button">
                <i className="fas fa-film"></i> Bande-annonce
              </a>
            )}
          </div>
        </div>
      </div>
      
      <div className="content-sections">
        <section className="cast-section">
          <h3>Distribution</h3>
          <div className="cast-list">
            {content.cast.map((actor, index) => (
              <div key={index} className="cast-item">
                <div className="cast-photo">
                  <img src={actor.image} alt={actor.name} />
                </div>
                <div className="cast-info">
                  <span className="cast-name">{actor.name}</span>
                  <span className="cast-role">{actor.role}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
        
        <section className="related-section">
          <h3>Contenu similaire</h3>
          <div className="related-list">
            {content.related.map((item, index) => (
              <Link 
                key={index} 
                to={`/content?id=${item.id}`} 
                className="related-item"
              >
                <img src={item.image} alt={item.title} />
                <div className="related-info">
                  <span className="related-title">{item.title}</span>
                  <span className="related-type">{item.type}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default ContentPage;
