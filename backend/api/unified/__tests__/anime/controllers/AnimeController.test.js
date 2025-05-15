const AnimeController = require('../../../anime/controllers/AnimeController');
const JikanService = require('../../../anime/services/JikanService');
const AnimeApiService = require('../../../anime/services/AnimeApiService');
const Anime = require('../../../core/models/Anime');

// Mocks pour les services
jest.mock('../../../anime/services/JikanService');
jest.mock('../../../anime/services/AnimeApiService');

describe('AnimeController', () => {
  let animeController;
  let mockJikanService;
  let mockAnimeApiService;
  
  beforeEach(() => {
    // Réinitialiser les mocks
    jest.clearAllMocks();
    
    // Configurer les mocks pour les services
    mockJikanService = {
      getAnime: jest.fn(),
      getAnimeFullById: jest.fn(),
      getAnimeEpisodes: jest.fn(),
      getAnimeCharacters: jest.fn(),
      searchAnime: jest.fn(),
      getTopAnime: jest.fn(),
      getRandomAnime: jest.fn(),
      getAnimeRecommendations: jest.fn(),
      source: 'jikan'
    };
    
    mockAnimeApiService = {
      getAnime: jest.fn(),
      getAnimeEpisodes: jest.fn(),
      getAnimeCharacters: jest.fn(),
      searchAnime: jest.fn(),
      getTrendingAnime: jest.fn(),
      getRecentAnime: jest.fn(),
      getAnimeStreaming: jest.fn(),
      source: 'anime-api'
    };
    
    // Injecter les mocks dans les constructeurs
    JikanService.mockImplementation(() => mockJikanService);
    AnimeApiService.mockImplementation(() => mockAnimeApiService);
    
    // Créer une nouvelle instance d'AnimeController
    animeController = new AnimeController();
  });
  
  test('devrait initialiser correctement le contrôleur', () => {
    expect(animeController.jikanService).toBeDefined();
    expect(animeController.animeApiService).toBeDefined();
  });
  
  test('devrait récupérer un anime par ID avec Jikan', async () => {
    const animeId = 1;
    const animeData = new Anime({ mal_id: 1, title: 'Cowboy Bebop' }, 'jikan');
    
    // Simuler une réponse de Jikan
    mockJikanService.getAnime.mockResolvedValueOnce(animeData);
    
    const result = await animeController.getAnimeById(animeId);
    
    // Vérifier que la méthode de Jikan a été appelée
    expect(mockJikanService.getAnime).toHaveBeenCalledWith(animeId);
    
    // Vérifier que la méthode d'AnimeAPI n'a pas été appelée
    expect(mockAnimeApiService.getAnime).not.toHaveBeenCalled();
    
    // Vérifier que le résultat est correct
    expect(result).toBe(animeData);
  });
  
  test('devrait récupérer un anime par ID avec AnimeAPI si Jikan échoue', async () => {
    const animeId = 1;
    const animeData = new Anime({ id: 1, title: 'Cowboy Bebop' }, 'anime-api');
    
    // Simuler une erreur de Jikan
    mockJikanService.getAnime.mockRejectedValueOnce(new Error('Jikan error'));
    
    // Simuler une réponse d'AnimeAPI
    mockAnimeApiService.getAnime.mockResolvedValueOnce(animeData);
    
    const result = await animeController.getAnimeById(animeId);
    
    // Vérifier que les deux méthodes ont été appelées
    expect(mockJikanService.getAnime).toHaveBeenCalledWith(animeId);
    expect(mockAnimeApiService.getAnime).toHaveBeenCalledWith(animeId);
    
    // Vérifier que le résultat est correct
    expect(result).toBe(animeData);
  });
  
  test('devrait lancer une erreur si les deux services échouent', async () => {
    const animeId = 1;
    
    // Simuler des erreurs pour les deux services
    mockJikanService.getAnime.mockRejectedValueOnce(new Error('Jikan error'));
    mockAnimeApiService.getAnime.mockRejectedValueOnce(new Error('AnimeAPI error'));
    
    await expect(animeController.getAnimeById(animeId)).rejects.toThrow(`Anime non trouvé: ${animeId}`);
  });
  
  test('devrait récupérer les épisodes d\'un anime', async () => {
    const animeId = 1;
    const page = 1;
    const episodesData = {
      data: [
        { mal_id: 1, title: 'Episode 1' },
        { mal_id: 2, title: 'Episode 2' }
      ]
    };
    
    // Simuler une réponse de Jikan
    mockJikanService.getAnimeEpisodes.mockResolvedValueOnce(episodesData);
    
    const result = await animeController.getAnimeEpisodes(animeId, page);
    
    // Vérifier que la méthode de Jikan a été appelée
    expect(mockJikanService.getAnimeEpisodes).toHaveBeenCalledWith(animeId, page);
    
    // Vérifier que le résultat est correct
    expect(result).toBe(episodesData);
  });
  
  test('devrait rechercher des animes avec Jikan', async () => {
    const searchParams = { q: 'cowboy', page: 1, limit: 10 };
    const searchResults = {
      data: [
        new Anime({ mal_id: 1, title: 'Cowboy Bebop' }, 'jikan'),
        new Anime({ mal_id: 5, title: 'Cowboy Bebop: The Movie' }, 'jikan')
      ],
      pagination: { has_next_page: false }
    };
    
    // Simuler une réponse de Jikan
    mockJikanService.searchAnime.mockResolvedValueOnce(searchResults);
    
    const result = await animeController.searchAnime(searchParams);
    
    // Vérifier que la méthode de Jikan a été appelée avec les bons paramètres
    expect(mockJikanService.searchAnime).toHaveBeenCalledWith({
      q: 'cowboy',
      page: 1,
      limit: 10,
      sfw: true
    });
    
    // Vérifier que le résultat est correct
    expect(result).toBe(searchResults);
  });
  
  test('devrait récupérer les animes en tendance', async () => {
    const limit = 10;
    const trendingAnimes = [
      new Anime({ id: 1, title: 'Anime 1', is_trending: true }, 'anime-api'),
      new Anime({ id: 2, title: 'Anime 2', is_trending: true }, 'anime-api')
    ];
    
    // Simuler une réponse d'AnimeAPI
    mockAnimeApiService.getTrendingAnime.mockResolvedValueOnce(trendingAnimes);
    
    const result = await animeController.getTrendingAnime(limit);
    
    // Vérifier que la méthode d'AnimeAPI a été appelée
    expect(mockAnimeApiService.getTrendingAnime).toHaveBeenCalled();
    
    // Vérifier que le résultat est correct
    expect(result).toBe(trendingAnimes);
  });
  
  test('devrait récupérer les animes récents', async () => {
    const limit = 10;
    const recentAnimes = [
      new Anime({ id: 1, title: 'Anime 1' }, 'anime-api'),
      new Anime({ id: 2, title: 'Anime 2' }, 'anime-api')
    ];
    
    // Simuler une réponse d'AnimeAPI
    mockAnimeApiService.getRecentAnime.mockResolvedValueOnce(recentAnimes);
    
    const result = await animeController.getRecentAnime(limit);
    
    // Vérifier que la méthode d'AnimeAPI a été appelée
    expect(mockAnimeApiService.getRecentAnime).toHaveBeenCalled();
    
    // Vérifier que le résultat est correct
    expect(result).toBe(recentAnimes);
  });
  
  test('devrait récupérer un anime aléatoire', async () => {
    const randomAnime = new Anime({ mal_id: 1, title: 'Random Anime' }, 'jikan');
    
    // Simuler une réponse de Jikan
    mockJikanService.getRandomAnime.mockResolvedValueOnce(randomAnime);
    
    const result = await animeController.getRandomAnime();
    
    // Vérifier que la méthode de Jikan a été appelée
    expect(mockJikanService.getRandomAnime).toHaveBeenCalled();
    
    // Vérifier que le résultat est correct
    expect(result).toBe(randomAnime);
  });
  
  test('devrait récupérer les informations de streaming d\'un anime', async () => {
    const animeId = 1;
    const episode = 1;
    const streamingData = {
      sources: [
        { url: 'https://example.com/stream1', quality: '720p' },
        { url: 'https://example.com/stream2', quality: '1080p' }
      ]
    };
    
    // Simuler une réponse d'AnimeAPI
    mockAnimeApiService.getAnimeStreaming.mockResolvedValueOnce(streamingData);
    
    const result = await animeController.getAnimeStreaming(animeId, episode);
    
    // Vérifier que la méthode d'AnimeAPI a été appelée
    expect(mockAnimeApiService.getAnimeStreaming).toHaveBeenCalledWith(animeId, episode);
    
    // Vérifier que le résultat est correct
    expect(result).toBe(streamingData);
  });
});
