// Service de données de contenu pour FloDrama
// Gère l'accès aux données de contenu et leur mise en cache

export class ContentDataService {
  constructor() {
    this.cache = {
      allContent: null,
      contentById: {},
      contentByType: {},
      contentByCategory: {},
      lastFetched: null
    };
    this.cacheDuration = 30 * 60 * 1000; // 30 minutes
    console.log('ContentDataService initialisé');
  }

  // Récupérer tout le contenu disponible
  async getAllContent() {
    // Vérifier si les données en cache sont encore valides
    if (this.cache.allContent && this.cache.lastFetched && 
        (Date.now() - this.cache.lastFetched < this.cacheDuration)) {
      console.log('Utilisation du cache pour getAllContent');
      return this.cache.allContent;
    }
    
    try {
      // Dans un environnement réel, cela ferait un appel API
      // Pour l'instant, nous utilisons des données statiques
      const content = await this.fetchMockContent();
      
      // Mettre à jour le cache
      this.cache.allContent = content;
      this.cache.lastFetched = Date.now();
      
      // Mettre à jour les caches secondaires
      this.updateSecondaryCache(content);
      
      console.log(`${content.length} éléments de contenu récupérés`);
      return content;
    } catch (error) {
      console.error('Erreur lors de la récupération du contenu:', error);
      // Retourner le cache même s'il est périmé en cas d'erreur
      return this.cache.allContent || [];
    }
  }

  // Mettre à jour les caches secondaires
  updateSecondaryCache(content) {
    // Réinitialiser les caches secondaires
    this.cache.contentById = {};
    this.cache.contentByType = {};
    this.cache.contentByCategory = {};
    
    // Remplir les caches secondaires
    content.forEach(item => {
      // Cache par ID
      this.cache.contentById[item.id] = item;
      
      // Cache par type
      if (!this.cache.contentByType[item.type]) {
        this.cache.contentByType[item.type] = [];
      }
      this.cache.contentByType[item.type].push(item);
      
      // Cache par catégorie
      if (!this.cache.contentByCategory[item.category]) {
        this.cache.contentByCategory[item.category] = [];
      }
      this.cache.contentByCategory[item.category].push(item);
    });
  }

  // Récupérer un élément de contenu par ID
  async getContentById(id) {
    // Vérifier si l'élément est dans le cache
    if (this.cache.contentById[id]) {
      console.log(`Utilisation du cache pour getContentById(${id})`);
      return this.cache.contentById[id];
    }
    
    // Si le cache principal est valide mais l'élément n'est pas trouvé, il n'existe pas
    if (this.cache.allContent && this.cache.lastFetched && 
        (Date.now() - this.cache.lastFetched < this.cacheDuration)) {
      console.log(`Élément avec ID ${id} non trouvé`);
      return null;
    }
    
    // Sinon, récupérer tout le contenu et chercher l'élément
    const allContent = await this.getAllContent();
    return this.cache.contentById[id] || null;
  }

  // Récupérer le contenu par type
  async getContentByType(type) {
    // Vérifier si les données en cache sont encore valides
    if (this.cache.contentByType[type] && this.cache.lastFetched && 
        (Date.now() - this.cache.lastFetched < this.cacheDuration)) {
      console.log(`Utilisation du cache pour getContentByType(${type})`);
      return this.cache.contentByType[type];
    }
    
    // Sinon, récupérer tout le contenu et filtrer par type
    const allContent = await this.getAllContent();
    return this.cache.contentByType[type] || [];
  }

  // Récupérer le contenu par catégorie
  async getContentByCategory(category) {
    // Vérifier si les données en cache sont encore valides
    if (this.cache.contentByCategory[category] && this.cache.lastFetched && 
        (Date.now() - this.cache.lastFetched < this.cacheDuration)) {
      console.log(`Utilisation du cache pour getContentByCategory(${category})`);
      return this.cache.contentByCategory[category];
    }
    
    // Sinon, récupérer tout le contenu et filtrer par catégorie
    const allContent = await this.getAllContent();
    return this.cache.contentByCategory[category] || [];
  }

  // Récupérer les tendances
  async getTrending(limit = 8) {
    const allContent = await this.getAllContent();
    
    // Dans un système réel, cela serait basé sur des métriques de popularité
    // Pour l'instant, nous utilisons une sélection aléatoire
    const shuffled = [...allContent].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, limit);
  }

  // Récupérer les nouveautés
  async getNewReleases(limit = 8) {
    const allContent = await this.getAllContent();
    
    // Trier par année (décroissant) puis par ID (décroissant) pour simuler la date d'ajout
    const sorted = [...allContent].sort((a, b) => {
      if (b.year !== a.year) {
        return parseInt(b.year) - parseInt(a.year);
      }
      return b.id - a.id;
    });
    
    return sorted.slice(0, limit);
  }

  // Récupérer du contenu similaire
  async getSimilarContent(contentItem, limit = 6) {
    if (!contentItem) return [];
    
    const allContent = await this.getAllContent();
    
    // Filtrer l'élément actuel
    const otherContent = allContent.filter(item => item.id !== contentItem.id);
    
    // Filtrer par type et catégorie
    const filtered = otherContent.filter(item => 
      item.type === contentItem.type || item.category === contentItem.category
    );
    
    // Si nous n'avons pas assez d'éléments, utiliser une sélection aléatoire
    if (filtered.length < limit) {
      const additional = otherContent
        .filter(item => !filtered.includes(item))
        .sort(() => 0.5 - Math.random())
        .slice(0, limit - filtered.length);
      
      return [...filtered, ...additional];
    }
    
    // Sinon, mélanger et limiter
    const shuffled = [...filtered].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, limit);
  }

  // Simuler la récupération de données depuis une API
  async fetchMockContent() {
    // Simuler un délai réseau
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Générer des données de contenu mock basées sur les images générées
    return [
      // Trending
      ...this.generateMockItems('trending', 8, 'Drama'),
      
      // Recommended
      ...this.generateMockItems('recommended', 8, 'Divers'),
      
      // Korean Dramas
      ...this.generateMockItems('korean', 8, 'Drama'),
      
      // Movies
      ...this.generateMockItems('movies', 8, 'Film'),
      
      // Anime
      ...this.generateMockItems('anime', 8, 'Anime'),
      
      // Bollywood
      ...this.generateMockItems('bollywood', 8, 'Bollywood')
    ];
  }

  // Générer des éléments mock pour une catégorie
  generateMockItems(category, count, type) {
    const items = [];
    const currentYear = new Date().getFullYear();
    
    // Définir les titres et genres selon la catégorie
    const titles = {
      trending: [
        'Crash Landing on You', 'Squid Game', 'Demon Slayer', 
        'Vincenzo', 'My Name', 'Itaewon Class', 'Kingdom', 'Jujutsu Kaisen'
      ],
      recommended: [
        'Hospital Playlist', 'Reply 1988', 'Attack on Titan', 
        'It\'s Okay to Not Be Okay', 'Hometown Cha-Cha-Cha', 
        'My Hero Academia', 'Goblin', 'Naruto Shippuden'
      ],
      korean: [
        'Descendants of the Sun', 'True Beauty', 'Signal', 
        'Mr. Queen', 'Flower of Evil', 'Start-Up', 'My Mister', 
        'The King: Eternal Monarch'
      ],
      movies: [
        'Parasite', 'Train to Busan', 'The Handmaiden', 
        'Oldboy', 'I Saw the Devil', 'A Taxi Driver', 
        'The Wailing', 'Burning'
      ],
      anime: [
        'One Piece', 'Death Note', 'Fullmetal Alchemist', 
        'Hunter x Hunter', 'Steins;Gate', 'Your Name', 
        'Violet Evergarden', 'Demon Slayer: Mugen Train'
      ],
      bollywood: [
        '3 Idiots', 'Dangal', 'PK', 'Bajrangi Bhaijaan', 
        'Lagaan', 'Kabhi Khushi Kabhie Gham', 
        'Dilwale Dulhania Le Jayenge', 'Kuch Kuch Hota Hai'
      ]
    };
    
    const genres = {
      trending: ['Action', 'Drame', 'Thriller', 'Fantaisie'],
      recommended: ['Comédie', 'Romance', 'Aventure', 'Science-Fiction'],
      korean: ['Romance', 'Comédie', 'Thriller', 'Historique'],
      movies: ['Drame', 'Thriller', 'Horreur', 'Action'],
      anime: ['Aventure', 'Action', 'Fantaisie', 'Science-Fiction'],
      bollywood: ['Romance', 'Comédie', 'Drame', 'Action']
    };
    
    const durations = {
      trending: ['1h20', '50min', '24min', '1h10'],
      recommended: ['1h30', '1h10', '24min', '2h'],
      korean: ['1h', '1h10', '1h20', '1h30'],
      movies: ['2h12', '1h58', '2h25', '2h'],
      anime: ['24min', '25min', '1h46', '1h57'],
      bollywood: ['2h50', '2h41', '3h44', '3h10']
    };

    // Couleurs de gradient pour les placeholders d'images
    const gradients = [
      'linear-gradient(135deg, #6366F1 0%, #FB7185 100%)',
      'linear-gradient(135deg, #3B82F6 0%, #10B981 100%)',
      'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
      'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)',
      'linear-gradient(135deg, #06B6D4 0%, #8B5CF6 100%)',
      'linear-gradient(135deg, #10B981 0%, #6366F1 100%)',
      'linear-gradient(135deg, #EC4899 0%, #F59E0B 100%)',
      'linear-gradient(135deg, #6366F1 0%, #10B981 100%)'
    ];
    
    // Descriptions plus détaillées
    const descriptions = {
      trending: [
        "Une histoire d'amour inattendue entre une sud-coréenne et un officier nord-coréen.",
        "Un jeu mortel où 456 participants risquent leur vie pour un prix colossal.",
        "Un jeune escrimeur devient chasseur de démons après la tragédie de sa famille.",
        "Un avocat italien revient en Corée pour prendre sa revanche.",
        "Une femme infiltre un gang de drogue pour venger son père.",
        "Un jeune entrepreneur déterminé à transformer un quartier.",
        "Des morts mystérieusement revenus à la vie dans la Corée médiévale.",
        "Un lycéen rejoint une école d'exorcistes après une rencontre paranormale."
      ],
      recommended: [
        "Les hauts et bas de cinq médecins amis depuis l'université.",
        "Chroniques d'une famille et de leurs voisins dans le Séoul des années 1980.",
        "L'humanité lutte pour sa survie contre des titans dévoreurs d'hommes.",
        "La romance entre une écrivaine traumatisée et un gardien d'asile psychiatrique.",
        "Un dentiste de la ville s'installe dans un village côtier paisible.",
        "Un garçon sans pouvoir dans un monde où 80% des gens en possèdent.",
        "Un dieu de la mort s'éprend d'une humaine, mais leur amour est maudit.",
        "Les aventures d'un ninja aux pouvoirs extraordinaires."
      ]
    };
    
    // Générer les éléments
    for (let i = 1; i <= count; i++) {
      const titleIndex = i - 1;
      const genreIndex = Math.floor(Math.random() * genres[category].length);
      const durationIndex = Math.floor(Math.random() * durations[category].length);
      const yearOffset = Math.floor(Math.random() * 5);
      const gradientIndex = i % gradients.length;
      
      // Utiliser des descriptions personnalisées quand disponibles
      const description = (descriptions[category] && descriptions[category][titleIndex]) || 
                          `Une histoire captivante de ${type.toLowerCase()} ${genres[category][genreIndex].toLowerCase()}.`;
      
      items.push({
        id: parseInt(`${category.charCodeAt(0)}${i}`), // ID unique basé sur la catégorie et l'index
        title: titles[category][titleIndex] || `${type} ${i}`,
        type: type.toLowerCase(),
        category: genres[category][genreIndex],
        genre: [genres[category][genreIndex]],
        year: (currentYear - yearOffset).toString(),
        duration: durations[category][durationIndex],
        // Utiliser un gradient CSS comme fallback quand les images ne sont pas disponibles
        image: gradients[gradientIndex],
        imageStyle: 'gradient', // Indique que c'est un gradient et pas une URL
        rating: (Math.floor(Math.random() * 20) + 70) / 10, // Note entre 7.0 et 9.0
        actors: ['Acteur 1', 'Acteur 2', 'Acteur 3'],
        director: 'Réalisateur',
        description: description,
        tags: [type, genres[category][genreIndex]]
      });
    }
    
    return items;
  }

  // Vider le cache
  clearCache() {
    this.cache = {
      allContent: null,
      contentById: {},
      contentByType: {},
      contentByCategory: {},
      lastFetched: null
    };
    console.log('Cache vidé');
  }
}
