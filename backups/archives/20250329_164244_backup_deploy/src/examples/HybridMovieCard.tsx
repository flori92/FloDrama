import React, { useState } from 'react';
import { HybridComponentProvider, HybridComponent, useHybridSystem } from '../components/HybridComponentProvider';
import { getCardStyles } from '../styles/themeUtils';

// Type pour les données d'un film
interface MovieData {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  releaseYear: number;
  rating: number;
  duration: string;
  genres: string[];
}

// Composant React pour afficher une carte de film
const ReactMovieCard: React.FC<{ movie: MovieData }> = ({ movie }) => {
  // État pour gérer l'animation au survol (utilisé dans les classes CSS)
  const [, setIsHovered] = useState(false);
  
  // Générer les étoiles pour la notation
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<span key={i} className="text-yellow-400">★</span>);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<span key={i} className="text-yellow-400">⯨</span>);
      } else {
        stars.push(<span key={i} className="text-gray-400">☆</span>);
      }
    }
    
    return stars;
  };
  
  // Injecter les styles de carte
  const cardStyleId = 'react-movie-card';
  React.useEffect(() => {
    const cardStyles = getCardStyles('default', false);
    const hoverStyles = `
      .${cardStyleId}:hover .movie-card-overlay {
        opacity: 1;
      }
      .${cardStyleId}:hover .movie-card-image {
        transform: scale(1.05);
      }
    `;
    
    const styleElement = document.createElement('style');
    styleElement.id = `flodrama-style-${cardStyleId}`;
    styleElement.textContent = `.${cardStyleId} { ${cardStyles} } ${hoverStyles}`;
    document.head.appendChild(styleElement);
    
    return () => {
      const element = document.getElementById(`flodrama-style-${cardStyleId}`);
      if (element) {
        document.head.removeChild(element);
      }
    };
  }, []);
  
  return (
    <div 
      className={`${cardStyleId} relative overflow-hidden`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image du film avec effet de zoom au survol */}
      <div className="relative h-80 overflow-hidden">
        <img 
          src={movie.imageUrl} 
          alt={movie.title} 
          className="movie-card-image w-full h-full object-cover transition-transform duration-300"
        />
        
        {/* Overlay avec informations détaillées au survol */}
        <div 
          className="movie-card-overlay absolute inset-0 bg-black bg-opacity-70 flex flex-col justify-end p-4 opacity-0 transition-opacity duration-300"
        >
          <div className="mb-2 flex items-center">
            <span className="mr-2 text-sm bg-blue-600 text-white px-2 py-0.5 rounded-full">
              {movie.releaseYear}
            </span>
            <span className="mr-2 text-sm bg-gray-700 text-white px-2 py-0.5 rounded-full">
              {movie.duration}
            </span>
          </div>
          
          <p className="text-white text-sm mb-2">{movie.description}</p>
          
          <div className="flex flex-wrap gap-1 mb-3">
            {movie.genres.map((genre, index) => (
              <span 
                key={index} 
                className="text-xs bg-gray-800 text-gray-300 px-2 py-0.5 rounded"
              >
                {genre}
              </span>
            ))}
          </div>
          
          <button 
            className="w-full py-2 rounded-full bg-gradient-to-r from-blue-500 to-fuchsia-500 text-white font-medium"
            onClick={() => alert(`Lecture de ${movie.title}`)}
          >
            Regarder
          </button>
        </div>
      </div>
      
      {/* Informations de base toujours visibles */}
      <div className="p-4">
        <h3 className="font-bold text-lg text-white mb-1">{movie.title}</h3>
        <div className="flex items-center">
          {renderStars(movie.rating)}
          <span className="ml-2 text-sm text-gray-400">{movie.rating.toFixed(1)}</span>
        </div>
      </div>
    </div>
  );
};

// Composant fictif Lynx pour afficher une carte de film
// Dans un cas réel, ce serait importé depuis @lynx/react
const LynxMovieCard: React.FC<{ movie: MovieData }> = ({ movie }) => {
  // Simuler un composant Lynx avec un style légèrement différent
  return (
    <div className="bg-gray-900 rounded-xl overflow-hidden shadow-lg" style={{ maxWidth: '300px' }}>
      <div className="relative">
        <img 
          src={movie.imageUrl} 
          alt={movie.title} 
          className="w-full h-64 object-cover"
        />
        <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
          {movie.releaseYear}
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="font-bold text-lg text-white mb-1">{movie.title}</h3>
        <div className="flex items-center mb-2">
          <div className="text-yellow-400 mr-1">{'★'.repeat(Math.round(movie.rating))}</div>
          <div className="text-gray-600">{'☆'.repeat(5 - Math.round(movie.rating))}</div>
          <span className="ml-2 text-sm text-gray-400">{movie.rating.toFixed(1)}</span>
        </div>
        
        <p className="text-gray-400 text-sm line-clamp-2 mb-3">{movie.description}</p>
        
        <div className="flex flex-wrap gap-1 mb-3">
          {movie.genres.slice(0, 3).map((genre, index) => (
            <span 
              key={index} 
              className="text-xs bg-gray-800 text-gray-300 px-2 py-0.5 rounded"
            >
              {genre}
            </span>
          ))}
        </div>
        
        <button 
          className="w-full py-2 rounded-full bg-blue-600 text-white font-medium"
          onClick={() => alert(`Lecture de ${movie.title} (Lynx)`)}
        >
          Regarder
        </button>
      </div>
    </div>
  );
};

// Exemple de données de films
const sampleMovies: MovieData[] = [
  {
    id: '1',
    title: 'La Grande Aventure',
    description: 'Un voyage épique à travers des contrées inexplorées, rempli de dangers et de découvertes.',
    imageUrl: 'https://picsum.photos/seed/movie1/300/450',
    releaseYear: 2023,
    rating: 4.5,
    duration: '2h 15min',
    genres: ['Aventure', 'Action', 'Drame']
  },
  {
    id: '2',
    title: 'Mystères de l\'Univers',
    description: 'Une exploration fascinante des secrets de notre cosmos et des questions fondamentales de l\'existence.',
    imageUrl: 'https://picsum.photos/seed/movie2/300/450',
    releaseYear: 2022,
    rating: 4.8,
    duration: '1h 48min',
    genres: ['Documentaire', 'Science', 'Espace']
  },
  {
    id: '3',
    title: 'Amour Éternel',
    description: 'Une histoire d\'amour intemporelle qui traverse les générations et défie le destin.',
    imageUrl: 'https://picsum.photos/seed/movie3/300/450',
    releaseYear: 2021,
    rating: 4.2,
    duration: '2h 05min',
    genres: ['Romance', 'Drame', 'Historique']
  },
  {
    id: '4',
    title: 'Le Dernier Combat',
    description: 'Un guerrier solitaire doit affronter son passé pour sauver l\'avenir de son peuple.',
    imageUrl: 'https://picsum.photos/seed/movie4/300/450',
    releaseYear: 2023,
    rating: 3.9,
    duration: '2h 30min',
    genres: ['Action', 'Science-Fiction', 'Thriller']
  }
];

// Composant principal qui utilise le système hybride
const HybridMovieCardExample: React.FC = () => {
  const { isLynxAvailable, forceReactMode, toggleForceReactMode } = useHybridSystem();
  
  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold flodrama-gradient-text">FloDrama - Films à découvrir</h1>
        
        <div className="flex items-center">
          <span className="mr-3">
            Mode actuel: {(!isLynxAvailable || forceReactMode) ? 'React' : 'Lynx'}
          </span>
          <button
            onClick={toggleForceReactMode}
            disabled={!isLynxAvailable}
            className={`px-4 py-2 rounded-full text-white ${
              isLynxAvailable 
                ? 'bg-gradient-to-r from-blue-500 to-fuchsia-500 hover:from-blue-600 hover:to-fuchsia-600' 
                : 'bg-gray-500 cursor-not-allowed'
            }`}
          >
            {forceReactMode ? 'Utiliser Lynx' : 'Utiliser React'}
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {sampleMovies.map(movie => (
          <HybridComponent
            key={movie.id}
            lynxComponent={LynxMovieCard}
            reactComponent={ReactMovieCard}
            componentProps={{ movie }}
            loadingComponent={
              <div className="bg-gray-800 rounded-xl h-96 animate-pulse"></div>
            }
          />
        ))}
      </div>
      
      <div className="mt-12 p-6 bg-gray-900 rounded-lg">
        <h2 className="text-2xl font-semibold mb-4">À propos de ce composant</h2>
        <p className="mb-4">
          Ce composant démontre l'utilisation du système hybride FloDrama pour afficher des cartes de films.
          Il bascule automatiquement entre les versions Lynx et React selon la disponibilité et les préférences.
        </p>
        <p>
          L'interface utilisateur respecte l'identité visuelle de FloDrama avec le dégradé signature bleu-fuchsia,
          le fond noir, les boutons arrondis et les animations fluides.
        </p>
      </div>
    </div>
  );
};

// Exporter le composant avec son fournisseur de contexte
const HybridMovieCardWithProvider: React.FC = () => (
  <HybridComponentProvider>
    <HybridMovieCardExample />
  </HybridComponentProvider>
);

export default HybridMovieCardWithProvider;
