const { handleRequest } = require('../flodrama-content-api');
const AnimeController = require('../anime/controllers/AnimeController');
const DramaController = require('../drama/controllers/DramaController');
const BollywoodController = require('../bollywood/controllers/BollywoodController');

// Mocks pour les contrôleurs
jest.mock('../anime/controllers/AnimeController');
jest.mock('../drama/controllers/DramaController');
jest.mock('../bollywood/controllers/BollywoodController');

describe('FloDrama Content API Gateway', () => {
  let mockAnimeController;
  let mockDramaController;
  let mockBollywoodController;
  let mockRequest;
  let mockEnv;
  let mockCtx;
  
  beforeEach(() => {
    // Réinitialiser les mocks
    jest.clearAllMocks();
    
    // Configurer les mocks pour les contrôleurs
    mockAnimeController = {
      getAnimeById: jest.fn(),
      getAnimeEpisodes: jest.fn(),
      getAnimeCharacters: jest.fn(),
      searchAnime: jest.fn(),
      getTrendingAnime: jest.fn(),
      getRecentAnime: jest.fn(),
      getRandomAnime: jest.fn(),
      getAnimeRecommendations: jest.fn(),
      getAnimeStreaming: jest.fn()
    };
    
    mockDramaController = {
      getDramaById: jest.fn(),
      getDramaEpisodes: jest.fn(),
      getDramaCast: jest.fn(),
      searchDramas: jest.fn(),
      getTrendingDramas: jest.fn(),
      getRecentDramas: jest.fn(),
      getPopularDramas: jest.fn(),
      getDramasByGenre: jest.fn(),
      getDramasByCountry: jest.fn()
    };
    
    mockBollywoodController = {
      getMovieById: jest.fn(),
      searchMovies: jest.fn(),
      getTrendingMovies: jest.fn(),
      getRecentMovies: jest.fn(),
      getPopularMovies: jest.fn(),
      getMoviesByGenre: jest.fn(),
      getMoviesByActor: jest.fn(),
      getMoviesByDirector: jest.fn()
    };
    
    // Injecter les mocks dans les constructeurs
    AnimeController.mockImplementation(() => mockAnimeController);
    DramaController.mockImplementation(() => mockDramaController);
    BollywoodController.mockImplementation(() => mockBollywoodController);
    
    // Configurer les mocks pour la requête et l'environnement
    mockRequest = {
      method: 'GET',
      url: 'https://api.flodrama.com/api',
    };
    
    mockEnv = {};
    mockCtx = {};
  });
  
  test('devrait gérer les requêtes OPTIONS (CORS preflight)', async () => {
    mockRequest.method = 'OPTIONS';
    
    const response = await handleRequest(mockRequest, mockEnv, mockCtx);
    
    expect(response.status).toBe(204);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(response.headers.get('Access-Control-Allow-Methods')).toBe('GET, POST, OPTIONS');
    expect(response.headers.get('Access-Control-Allow-Headers')).toBe('Content-Type');
  });
  
  test('devrait retourner les informations de l\'API pour la route racine', async () => {
    mockRequest.url = 'https://api.flodrama.com/api';
    
    const response = await handleRequest(mockRequest, mockEnv, mockCtx);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.name).toBe('FloDrama Content API');
    expect(data.version).toBe('1.0.0');
    expect(data.endpoints).toBeDefined();
    expect(data.endpoints.anime).toBeDefined();
    expect(data.endpoints.drama).toBeDefined();
    expect(data.endpoints.bollywood).toBeDefined();
  });
  
  test('devrait retourner une erreur 404 pour une route non trouvée', async () => {
    mockRequest.url = 'https://api.flodrama.com/invalid-route';
    
    const response = await handleRequest(mockRequest, mockEnv, mockCtx);
    const data = await response.json();
    
    expect(response.status).toBe(404);
    expect(data.error).toBe('Endpoint non trouvé');
  });
  
  test('devrait gérer la route /api/anime/:id', async () => {
    const animeId = '1';
    const animeData = { id: animeId, title: 'Cowboy Bebop' };
    
    mockRequest.url = `https://api.flodrama.com/api/anime/${animeId}`;
    mockAnimeController.getAnimeById.mockResolvedValueOnce(animeData);
    
    const response = await handleRequest(mockRequest, mockEnv, mockCtx);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(mockAnimeController.getAnimeById).toHaveBeenCalledWith(animeId, false);
    expect(data).toEqual(animeData);
  });
  
  test('devrait gérer la route /api/anime/search', async () => {
    const searchQuery = 'cowboy';
    const searchResults = {
      data: [
        { id: '1', title: 'Cowboy Bebop' },
        { id: '5', title: 'Cowboy Bebop: The Movie' }
      ],
      pagination: { has_next_page: false }
    };
    
    mockRequest.url = `https://api.flodrama.com/api/anime/search?q=${searchQuery}`;
    mockAnimeController.searchAnime.mockResolvedValueOnce(searchResults);
    
    const response = await handleRequest(mockRequest, mockEnv, mockCtx);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(mockAnimeController.searchAnime).toHaveBeenCalledWith({ q: searchQuery });
    expect(data).toEqual(searchResults);
  });
  
  test('devrait gérer la route /api/anime/trending', async () => {
    const trendingAnimes = [
      { id: '1', title: 'Anime 1', is_trending: true },
      { id: '2', title: 'Anime 2', is_trending: true }
    ];
    
    mockRequest.url = 'https://api.flodrama.com/api/anime/trending';
    mockAnimeController.getTrendingAnime.mockResolvedValueOnce(trendingAnimes);
    
    const response = await handleRequest(mockRequest, mockEnv, mockCtx);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(mockAnimeController.getTrendingAnime).toHaveBeenCalledWith(15);
    expect(data).toEqual({ data: trendingAnimes });
  });
  
  test('devrait gérer la route /api/drama/:id', async () => {
    const dramaId = '1';
    const dramaData = { id: dramaId, title: 'Crash Landing on You' };
    
    mockRequest.url = `https://api.flodrama.com/api/drama/${dramaId}`;
    mockDramaController.getDramaById.mockResolvedValueOnce(dramaData);
    
    const response = await handleRequest(mockRequest, mockEnv, mockCtx);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(mockDramaController.getDramaById).toHaveBeenCalledWith(dramaId);
    expect(data).toEqual(dramaData);
  });
  
  test('devrait gérer la route /api/bollywood/:id', async () => {
    const movieId = '1';
    const movieData = { id: movieId, title: '3 Idiots' };
    
    mockRequest.url = `https://api.flodrama.com/api/bollywood/${movieId}`;
    mockBollywoodController.getMovieById.mockResolvedValueOnce(movieData);
    
    const response = await handleRequest(mockRequest, mockEnv, mockCtx);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(mockBollywoodController.getMovieById).toHaveBeenCalledWith(movieId);
    expect(data).toEqual(movieData);
  });
  
  test('devrait gérer les erreurs des contrôleurs', async () => {
    const animeId = '999999';
    
    mockRequest.url = `https://api.flodrama.com/api/anime/${animeId}`;
    mockAnimeController.getAnimeById.mockRejectedValueOnce(new Error('Anime non trouvé'));
    
    const response = await handleRequest(mockRequest, mockEnv, mockCtx);
    const data = await response.json();
    
    expect(response.status).toBe(500);
    expect(data.error).toBe('Anime non trouvé');
  });
});
