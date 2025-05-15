const JikanService = require('../../../anime/services/JikanService');
const Anime = require('../../../core/models/Anime');

// Mock pour le cache
jest.mock('../../../core/cache/Cache', () => {
  return jest.fn().mockImplementation(() => {
    return {
      get: jest.fn(),
      set: jest.fn()
    };
  });
});

describe('JikanService', () => {
  let jikanService;
  let mockFetch;
  
  beforeEach(() => {
    // Réinitialiser les mocks
    jest.clearAllMocks();
    
    // Créer une nouvelle instance de JikanService
    jikanService = new JikanService();
    
    // Mock pour fetch
    mockFetch = global.fetch;
  });
  
  test('devrait initialiser correctement le service', () => {
    expect(jikanService.baseUrl).toBe('https://api.jikan.moe/v4');
    expect(jikanService.source).toBe('jikan');
    expect(jikanService.lastRequestTime).toBe(0);
    expect(jikanService.requestDelay).toBe(1000);
    expect(jikanService.cache).toBeDefined();
  });
  
  test('devrait gérer la limitation de débit', async () => {
    const now = Date.now();
    jest.spyOn(Date, 'now').mockImplementation(() => now);
    
    // Simuler un appel récent
    jikanService.lastRequestTime = now - 500; // 500ms depuis la dernière requête
    
    const waitPromise = jikanService.handleRateLimit();
    
    // Avancer le temps de 500ms
    jest.spyOn(Date, 'now').mockImplementation(() => now + 500);
    
    await waitPromise;
    
    // La méthode devrait avoir attendu 500ms
    expect(jikanService.lastRequestTime).toBe(now + 500);
    
    // Réinitialiser le mock
    jest.spyOn(Date, 'now').mockRestore();
  });
  
  test('devrait récupérer des données depuis l\'API avec mise en cache', async () => {
    const endpoint = '/anime/1';
    const responseData = { data: { mal_id: 1, title: 'Cowboy Bebop' } };
    
    // Simuler une réponse de l'API
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce(responseData)
    });
    
    const result = await jikanService.fetchFromAPI(endpoint);
    
    // Vérifier que fetch a été appelé avec la bonne URL
    expect(mockFetch).toHaveBeenCalledWith('https://api.jikan.moe/v4/anime/1');
    
    // Vérifier que les données sont mises en cache
    expect(jikanService.cache.set).toHaveBeenCalledWith(
      expect.stringContaining('jikan_api_'),
      JSON.stringify(responseData),
      86400
    );
    
    // Vérifier que le résultat est correct
    expect(result).toEqual(responseData);
  });
  
  test('devrait utiliser le cache si disponible', async () => {
    const endpoint = '/anime/1';
    const cachedData = JSON.stringify({ data: { mal_id: 1, title: 'Cowboy Bebop' } });
    
    // Simuler une réponse du cache
    jikanService.cache.get.mockResolvedValueOnce(cachedData);
    
    const result = await jikanService.fetchFromAPI(endpoint);
    
    // Vérifier que fetch n'a pas été appelé
    expect(mockFetch).not.toHaveBeenCalled();
    
    // Vérifier que le résultat est correct
    expect(result).toEqual(JSON.parse(cachedData));
  });
  
  test('devrait gérer les erreurs de l\'API', async () => {
    const endpoint = '/anime/999999';
    
    // Simuler une erreur de l'API
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      json: jest.fn().mockResolvedValueOnce({ message: 'Resource not found' })
    });
    
    await expect(jikanService.fetchFromAPI(endpoint)).rejects.toThrow('Resource not found');
  });
  
  test('devrait récupérer un anime par ID', async () => {
    const animeId = 1;
    const responseData = {
      data: {
        mal_id: 1,
        title: 'Cowboy Bebop',
        synopsis: 'Space cowboys',
        images: { jpg: { image_url: 'https://example.com/cowboy.jpg' } },
        score: 8.8
      }
    };
    
    // Simuler une réponse de l'API
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce(responseData)
    });
    
    const result = await jikanService.getAnime(animeId);
    
    // Vérifier que le résultat est une instance d'Anime
    expect(result).toBeInstanceOf(Anime);
    expect(result.id).toBe('1');
    expect(result.title).toBe('Cowboy Bebop');
    expect(result.source).toBe('jikan');
  });
  
  test('devrait récupérer les épisodes d\'un anime', async () => {
    const animeId = 1;
    const page = 1;
    const responseData = {
      data: [
        { mal_id: 1, title: 'Episode 1', aired: '1998-10-24' },
        { mal_id: 2, title: 'Episode 2', aired: '1998-10-31' }
      ],
      pagination: { has_next_page: false }
    };
    
    // Simuler une réponse de l'API
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce(responseData)
    });
    
    const result = await jikanService.getAnimeEpisodes(animeId, page);
    
    // Vérifier que fetch a été appelé avec la bonne URL
    expect(mockFetch).toHaveBeenCalledWith('https://api.jikan.moe/v4/anime/1/episodes?page=1');
    
    // Vérifier que le résultat est correct
    expect(result).toEqual(responseData);
  });
  
  test('devrait récupérer les personnages d\'un anime', async () => {
    const animeId = 1;
    const responseData = {
      data: [
        { character: { mal_id: 1, name: 'Spike Spiegel' } },
        { character: { mal_id: 2, name: 'Jet Black' } }
      ]
    };
    
    // Simuler une réponse de l'API
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce(responseData)
    });
    
    const result = await jikanService.getAnimeCharacters(animeId);
    
    // Vérifier que fetch a été appelé avec la bonne URL
    expect(mockFetch).toHaveBeenCalledWith('https://api.jikan.moe/v4/anime/1/characters');
    
    // Vérifier que le résultat est correct
    expect(result).toEqual(responseData);
  });
  
  test('devrait rechercher des animes', async () => {
    const searchParams = { q: 'cowboy', page: 1, limit: 10 };
    const responseData = {
      data: [
        { mal_id: 1, title: 'Cowboy Bebop' },
        { mal_id: 5, title: 'Cowboy Bebop: The Movie' }
      ],
      pagination: { has_next_page: false }
    };
    
    // Simuler une réponse de l'API
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce(responseData)
    });
    
    const result = await jikanService.searchAnime(searchParams);
    
    // Vérifier que fetch a été appelé avec la bonne URL
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.jikan.moe/v4/anime?q=cowboy&page=1&limit=10'
    );
    
    // Vérifier que le résultat contient des instances d'Anime
    expect(result.data[0]).toBeInstanceOf(Anime);
    expect(result.data[1]).toBeInstanceOf(Anime);
    expect(result.data[0].title).toBe('Cowboy Bebop');
    expect(result.data[1].title).toBe('Cowboy Bebop: The Movie');
  });
  
  test('devrait récupérer un anime aléatoire', async () => {
    const responseData = {
      data: {
        mal_id: 1,
        title: 'Cowboy Bebop',
        synopsis: 'Space cowboys',
        images: { jpg: { image_url: 'https://example.com/cowboy.jpg' } },
        score: 8.8
      }
    };
    
    // Simuler une réponse de l'API
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce(responseData)
    });
    
    const result = await jikanService.getRandomAnime();
    
    // Vérifier que fetch a été appelé avec la bonne URL
    expect(mockFetch).toHaveBeenCalledWith('https://api.jikan.moe/v4/random/anime');
    
    // Vérifier que le résultat est une instance d'Anime
    expect(result).toBeInstanceOf(Anime);
    expect(result.id).toBe('1');
    expect(result.title).toBe('Cowboy Bebop');
  });
});
