import { ContentType } from './apiService';

// Types pour les données mockées
export interface MockContent {
  id: string;
  title: string;
  description: string;
  type: ContentType;
  posterUrl: string;
  imageUrl?: string;
  videoUrl?: string;
  releaseDate: string;
  releaseYear?: number;
  duration: string;
  rating: number;
  genres: string[];
  language: string;
  subtitles: string[];
  featured?: boolean;
  category?: string;
  progress?: number;
}

// Données de démonstration pour les films
export const mockMovies: MockContent[] = [
  {
    id: 'movie1',
    title: 'Le Dernier Samouraï',
    description: 'Un ancien capitaine américain est engagé pour entraîner l\'armée japonaise et se retrouve à embrasser le mode de vie des samouraïs qu\'il a été chargé de combattre.',
    type: 'film',
    posterUrl: 'https://via.placeholder.com/500x750?text=Le+Dernier+Samourai',
    imageUrl: 'https://via.placeholder.com/500x750?text=Le+Dernier+Samourai',
    videoUrl: 'https://example.com/videos/lastsamurai.mp4',
    releaseDate: '2003-12-05',
    releaseYear: 2003,
    duration: '2h 34min',
    rating: 4.5,
    genres: ['Action', 'Drame', 'Historique'],
    language: 'Anglais',
    subtitles: ['Français', 'Anglais'],
    featured: true,
    category: 'film'
  },
  {
    id: 'movie2',
    title: 'Parasite',
    description: 'Une famille pauvre s\'immisce subtilement dans une famille riche, jusqu\'à ce qu\'un incident imprévu ne chamboule leur relation symbiotique.',
    type: 'film',
    posterUrl: 'https://via.placeholder.com/500x750?text=Parasite',
    imageUrl: 'https://via.placeholder.com/500x750?text=Parasite',
    videoUrl: 'https://example.com/videos/parasite.mp4',
    releaseDate: '2019-05-30',
    releaseYear: 2019,
    duration: '2h 12min',
    rating: 4.8,
    genres: ['Drame', 'Thriller', 'Comédie noire'],
    language: 'Coréen',
    subtitles: ['Français', 'Anglais'],
    category: 'film'
  },
  {
    id: 'movie3',
    title: 'Your Name',
    description: 'Deux adolescents que tout oppose se découvrent liés par un phénomène étrange : ils échangent leurs corps pendant leur sommeil.',
    type: 'film',
    posterUrl: 'https://via.placeholder.com/500x750?text=Your+Name',
    imageUrl: 'https://via.placeholder.com/500x750?text=Your+Name',
    videoUrl: 'https://example.com/videos/yourname.mp4',
    releaseDate: '2016-08-26',
    releaseYear: 2016,
    duration: '1h 46min',
    rating: 4.7,
    genres: ['Animation', 'Drame', 'Fantastique'],
    language: 'Japonais',
    subtitles: ['Français', 'Anglais'],
    featured: true,
    category: 'film'
  }
];

// Données de démonstration pour les dramas
export const mockDramas: MockContent[] = [
  {
    id: 'drama1',
    title: 'Crash Landing on You',
    description: 'Une héritière sud-coréenne atterrit accidentellement en Corée du Nord après un accident de parapente et tombe amoureuse d\'un officier nord-coréen.',
    type: 'drama',
    posterUrl: 'https://via.placeholder.com/500x750?text=Crash+Landing+on+You',
    imageUrl: 'https://via.placeholder.com/500x750?text=Crash+Landing+on+You',
    videoUrl: 'https://example.com/videos/cloy.mp4',
    releaseDate: '2019-12-14',
    releaseYear: 2019,
    duration: '16 épisodes',
    rating: 4.9,
    genres: ['Romance', 'Comédie', 'Drame'],
    language: 'Coréen',
    subtitles: ['Français', 'Anglais'],
    featured: true,
    category: 'drama'
  },
  {
    id: 'drama2',
    title: 'Itaewon Class',
    description: 'Un ex-détenu et ses amis luttent pour réussir dans le quartier d\'Itaewon tout en poursuivant le puissant PDG qui a détruit sa vie.',
    type: 'drama',
    posterUrl: 'https://via.placeholder.com/500x750?text=Itaewon+Class',
    imageUrl: 'https://via.placeholder.com/500x750?text=Itaewon+Class',
    videoUrl: 'https://example.com/videos/itaewon.mp4',
    releaseDate: '2020-01-31',
    releaseYear: 2020,
    duration: '16 épisodes',
    rating: 4.6,
    genres: ['Drame', 'Entrepreneuriat'],
    language: 'Coréen',
    subtitles: ['Français', 'Anglais'],
    category: 'drama'
  },
  {
    id: 'drama3',
    title: 'Reply 1988',
    description: 'Cinq familles vivent dans la même ruelle du quartier Ssangmun-dong à Séoul en 1988, partageant leurs joies et leurs peines.',
    type: 'drama',
    posterUrl: 'https://via.placeholder.com/500x750?text=Reply+1988',
    imageUrl: 'https://via.placeholder.com/500x750?text=Reply+1988',
    videoUrl: 'https://example.com/videos/reply1988.mp4',
    releaseDate: '2015-11-06',
    releaseYear: 2015,
    duration: '20 épisodes',
    rating: 4.8,
    genres: ['Comédie', 'Drame', 'Famille'],
    language: 'Coréen',
    subtitles: ['Français', 'Anglais'],
    category: 'drama'
  }
];

// Données de démonstration pour les animes
export const mockAnimes: MockContent[] = [
  {
    id: 'anime1',
    title: 'Attack on Titan',
    description: 'Dans un monde où l\'humanité vit entourée d\'immenses murs pour se protéger de créatures gigantesques, les Titans, un jeune homme s\'engage dans l\'armée pour venger sa mère et détruire les Titans.',
    type: 'anime',
    posterUrl: 'https://via.placeholder.com/500x750?text=Attack+on+Titan',
    imageUrl: 'https://via.placeholder.com/500x750?text=Attack+on+Titan',
    videoUrl: 'https://example.com/videos/aot.mp4',
    releaseDate: '2013-04-07',
    releaseYear: 2013,
    duration: '4 saisons',
    rating: 4.9,
    genres: ['Action', 'Drame', 'Fantastique'],
    language: 'Japonais',
    subtitles: ['Français', 'Anglais'],
    featured: true,
    category: 'anime'
  },
  {
    id: 'anime2',
    title: 'Demon Slayer',
    description: 'Un jeune homme devient chasseur de démons après que sa famille a été massacrée et sa sœur transformée en démon.',
    type: 'anime',
    posterUrl: 'https://via.placeholder.com/500x750?text=Demon+Slayer',
    imageUrl: 'https://via.placeholder.com/500x750?text=Demon+Slayer',
    videoUrl: 'https://example.com/videos/demonslayer.mp4',
    releaseDate: '2019-04-06',
    releaseYear: 2019,
    duration: '2 saisons',
    rating: 4.8,
    genres: ['Action', 'Aventure', 'Surnaturel'],
    language: 'Japonais',
    subtitles: ['Français', 'Anglais'],
    category: 'anime'
  },
  {
    id: 'anime3',
    title: 'My Hero Academia',
    description: 'Dans un monde où 80% de la population possède un super-pouvoir, un jeune garçon sans pouvoir rêve de devenir un héros.',
    type: 'anime',
    posterUrl: 'https://via.placeholder.com/500x750?text=My+Hero+Academia',
    imageUrl: 'https://via.placeholder.com/500x750?text=My+Hero+Academia',
    videoUrl: 'https://example.com/videos/mha.mp4',
    releaseDate: '2016-04-03',
    releaseYear: 2016,
    duration: '5 saisons',
    rating: 4.7,
    genres: ['Action', 'Comédie', 'Super-héros'],
    language: 'Japonais',
    subtitles: ['Français', 'Anglais'],
    category: 'anime'
  }
];

// Données de démonstration pour Bollywood
export const mockBollywood: MockContent[] = [
  {
    id: 'bollywood1',
    title: '3 Idiots',
    description: 'Deux amis partent à la recherche de leur camarade d\'université disparu, tout en se remémorant leur temps passé ensemble et les leçons qu\'ils ont apprises.',
    type: 'bollywood',
    posterUrl: 'https://via.placeholder.com/500x750?text=3+Idiots',
    imageUrl: 'https://via.placeholder.com/500x750?text=3+Idiots',
    videoUrl: 'https://example.com/videos/3idiots.mp4',
    releaseDate: '2009-12-25',
    releaseYear: 2009,
    duration: '2h 50min',
    rating: 4.8,
    genres: ['Comédie', 'Drame'],
    language: 'Hindi',
    subtitles: ['Français', 'Anglais'],
    featured: true,
    category: 'bollywood'
  },
  {
    id: 'bollywood2',
    title: 'Dangal',
    description: 'L\'histoire vraie de Mahavir Singh Phogat, qui a entraîné ses filles à devenir des championnes de lutte malgré les préjugés.',
    type: 'bollywood',
    posterUrl: 'https://via.placeholder.com/500x750?text=Dangal',
    imageUrl: 'https://via.placeholder.com/500x750?text=Dangal',
    videoUrl: 'https://example.com/videos/dangal.mp4',
    releaseDate: '2016-12-21',
    releaseYear: 2016,
    duration: '2h 41min',
    rating: 4.9,
    genres: ['Biographie', 'Drame', 'Sport'],
    language: 'Hindi',
    subtitles: ['Français', 'Anglais'],
    category: 'bollywood'
  },
  {
    id: 'bollywood3',
    title: 'Kabhi Khushi Kabhie Gham',
    description: 'Un fils adopté d\'une famille riche est banni après avoir épousé une femme de classe inférieure. Des années plus tard, son jeune frère entreprend de réunir la famille.',
    type: 'bollywood',
    posterUrl: 'https://via.placeholder.com/500x750?text=K3G',
    imageUrl: 'https://via.placeholder.com/500x750?text=K3G',
    videoUrl: 'https://example.com/videos/k3g.mp4',
    releaseDate: '2001-12-14',
    releaseYear: 2001,
    duration: '3h 30min',
    rating: 4.6,
    genres: ['Drame', 'Famille', 'Musical'],
    language: 'Hindi',
    subtitles: ['Français', 'Anglais'],
    category: 'bollywood'
  }
];

// Données de démonstration pour les recommandations
export const mockRecommendations: MockContent[] = [
  ...mockMovies.slice(0, 1),
  ...mockDramas.slice(0, 1),
  ...mockAnimes.slice(0, 1),
  ...mockBollywood.slice(0, 1)
];

// Données de démonstration pour le contenu en vedette
export const mockFeaturedContent: MockContent[] = [
  mockMovies.find(m => m.featured) || mockMovies[0],
  mockDramas.find(d => d.featured) || mockDramas[0],
  mockAnimes.find(a => a.featured) || mockAnimes[0],
  mockBollywood.find(b => b.featured) || mockBollywood[0]
];

// Données de démonstration pour le contenu récent
export const mockRecentContent: MockContent[] = [
  mockMovies[1],
  mockDramas[1],
  mockAnimes[1],
  mockBollywood[1]
];

// Données de démonstration pour le contenu "Continuer à regarder"
export const mockContinueWatching: MockContent[] = [
  {
    ...mockMovies[2],
    id: 'continue1',
    progress: 0.7 // 70% de progression
  },
  {
    ...mockDramas[2],
    id: 'continue2',
    progress: 0.3 // 30% de progression
  },
  {
    ...mockAnimes[2],
    id: 'continue3',
    progress: 0.5 // 50% de progression
  }
];

// Service de mock data
export const mockDataService = {
  // Récupérer le contenu par type
  getContentByType: (type: ContentType) => {
    switch (type) {
      case 'film':
        return Promise.resolve(mockMovies);
      case 'drama':
        return Promise.resolve(mockDramas);
      case 'anime':
        return Promise.resolve(mockAnimes);
      case 'bollywood':
        return Promise.resolve(mockBollywood);
      default:
        return Promise.resolve([]);
    }
  },
  
  // Récupérer le contenu en vedette
  getFeaturedContent: () => {
    return Promise.resolve(mockFeaturedContent);
  },
  
  // Récupérer le contenu récent
  getRecentContent: () => {
    return Promise.resolve(mockRecentContent);
  },
  
  // Récupérer les recommandations
  getRecommendations: () => {
    return Promise.resolve(mockRecommendations);
  },
  
  // Récupérer le contenu "Continuer à regarder"
  getContinueWatching: () => {
    return Promise.resolve(mockContinueWatching);
  },
  
  // Récupérer un élément par ID
  getContentById: (id: string) => {
    const allContent = [
      ...mockMovies,
      ...mockDramas,
      ...mockAnimes,
      ...mockBollywood,
      ...mockContinueWatching
    ];
    
    const content = allContent.find(item => item.id === id);
    return Promise.resolve(content);
  },
  
  // Rechercher du contenu
  searchContent: (query: string) => {
    const allContent = [
      ...mockMovies,
      ...mockDramas,
      ...mockAnimes,
      ...mockBollywood
    ];
    
    const results = allContent.filter(item => 
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.description.toLowerCase().includes(query.toLowerCase()) ||
      item.genres.some(genre => genre.toLowerCase().includes(query.toLowerCase()))
    );
    
    return Promise.resolve(results);
  }
};

export default mockDataService;
