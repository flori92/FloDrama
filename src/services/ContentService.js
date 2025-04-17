/**
 * Service simplifié pour la gestion des contenus de FloDrama
 * Fournit des données de démonstration pour le développement
 */

class ContentService {
  constructor() {
    this.demoContents = [
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
    
    this.dramaEpisodes = {
      'drama-1': [
        {
          id: 'drama-1-ep1',
          number: 1,
          title: 'Épisode 1',
          duration: 70,
          sources: [
            { quality: 'auto', url: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.mp4/.m3u8' },
            { quality: '1080p', url: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.mp4/.m3u8' }
          ]
        },
        {
          id: 'drama-1-ep2',
          number: 2,
          title: 'Épisode 2',
          duration: 68,
          sources: [
            { quality: 'auto', url: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.mp4/.m3u8' },
            { quality: '1080p', url: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.mp4/.m3u8' }
          ]
        }
      ],
      'drama-2': [
        {
          id: 'drama-2-ep1',
          number: 1,
          title: 'Le Gardien Solitaire',
          duration: 72,
          sources: [
            { quality: 'auto', url: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.mp4/.m3u8' },
            { quality: '1080p', url: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.mp4/.m3u8' }
          ]
        },
        {
          id: 'drama-2-ep2',
          number: 2,
          title: 'La Mariée Promise',
          duration: 70,
          sources: [
            { quality: 'auto', url: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.mp4/.m3u8' },
            { quality: '1080p', url: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.mp4/.m3u8' }
          ]
        }
      ]
    };
    
    this.animeEpisodes = {
      'anime-2': [
        {
          id: 'anime-2-ep1',
          number: 1,
          title: 'À Vous, Dans 2000 Ans',
          duration: 24,
          sources: [
            { quality: 'auto', url: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.mp4/.m3u8' },
            { quality: '1080p', url: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.mp4/.m3u8' }
          ]
        },
        {
          id: 'anime-2-ep2',
          number: 2,
          title: 'Ce Jour-là',
          duration: 24,
          sources: [
            { quality: 'auto', url: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.mp4/.m3u8' },
            { quality: '1080p', url: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.mp4/.m3u8' }
          ]
        }
      ]
    };
    
    this.watchHistory = [];
    this.myList = [];
    
    console.log('ContentService initialisé avec des données de démonstration');
  }
  
  // Initialiser le service
  async init() {
    console.log('ContentService prêt à l'utilisation');
    return true;
  }
  
  // Récupérer tous les contenus
  async getAllContents() {
    return this.demoContents;
  }
  
  // Récupérer les contenus par type
  async getContentsByType(type) {
    return this.demoContents.filter(content => content.type === type);
  }
  
  // Récupérer les détails d'un contenu
  async getContentDetails(contentId) {
    return this.demoContents.find(content => content.id === contentId);
  }
  
  // Récupérer les épisodes d'un contenu
  async getContentEpisodes(contentId) {
    const content = await this.getContentDetails(contentId);
    
    if (!content) {
      return [];
    }
    
    if (content.type === 'drama') {
      return this.dramaEpisodes[contentId] || [];
    } else if (content.type === 'anime') {
      return this.animeEpisodes[contentId] || [];
    }
    
    return [];
  }
  
  // Ajouter un contenu à l'historique de visionnage
  async addToWatchHistory(contentId, episodeId = null) {
    const timestamp = new Date().toISOString();
    
    this.watchHistory.push({
      contentId,
      episodeId,
      timestamp,
      progress: 0
    });
    
    console.log(`Ajouté à l'historique: ${contentId}${episodeId ? ` - Épisode ${episodeId}` : ''}`);
    return true;
  }
  
  // Mettre à jour la progression de visionnage
  async saveWatchProgress(contentId, episodeId, currentTime, duration) {
    const historyItem = this.watchHistory.find(
      item => item.contentId === contentId && item.episodeId === episodeId
    );
    
    if (historyItem) {
      historyItem.progress = currentTime / duration;
      historyItem.lastWatched = new Date().toISOString();
    } else {
      await this.addToWatchHistory(contentId, episodeId);
      const newItem = this.watchHistory[this.watchHistory.length - 1];
      newItem.progress = currentTime / duration;
    }
    
    return true;
  }
  
  // Ajouter/supprimer un contenu de Ma Liste
  async toggleMyList(contentId) {
    const index = this.myList.indexOf(contentId);
    
    if (index === -1) {
      this.myList.push(contentId);
      console.log(`Ajouté à Ma Liste: ${contentId}`);
    } else {
      this.myList.splice(index, 1);
      console.log(`Supprimé de Ma Liste: ${contentId}`);
    }
    
    return this.myList.includes(contentId);
  }
  
  // Récupérer Ma Liste
  async getMyList() {
    const myListContents = [];
    
    for (const contentId of this.myList) {
      const content = await this.getContentDetails(contentId);
      if (content) {
        myListContents.push(content);
      }
    }
    
    return myListContents;
  }
  
  // Récupérer l'historique de visionnage
  async getWatchHistory() {
    const historyContents = [];
    
    for (const item of this.watchHistory) {
      const content = await this.getContentDetails(item.contentId);
      if (content) {
        historyContents.push({
          ...content,
          progress: item.progress,
          lastWatched: item.lastWatched,
          episodeId: item.episodeId
        });
      }
    }
    
    return historyContents;
  }
  
  // Rechercher des contenus
  async searchContents(query) {
    query = query.toLowerCase();
    
    return this.demoContents.filter(content => 
      content.title.toLowerCase().includes(query) || 
      (content.description && content.description.toLowerCase().includes(query))
    );
  }
  
  // Précharger les données de la page d'accueil
  async preloadHomePageData() {
    return {
      popular: this.demoContents.slice(0, 4),
      dramas: this.demoContents.filter(content => content.type === 'drama'),
      animes: this.demoContents.filter(content => content.type === 'anime'),
      movies: this.demoContents.filter(content => content.type === 'film' || content.type === 'bollywood')
    };
  }
}

// Exporter une instance unique du service
const ContentDataService = new ContentService();
export default ContentDataService;
