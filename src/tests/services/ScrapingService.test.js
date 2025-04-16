import { Network, Cache } from '@lynx/core';
import { ScrapingService } from '../../services/ScrapingService';
import { AppConfig } from '../../app.config';

jest.mock('@lynx/core', () => ({
  Network: jest.fn(),
  Cache: jest.fn()
}));

describe('ScrapingService', () => {
  let scrapingService;
  let mockNetwork;
  let mockCache;

  beforeEach(() => {
    // Réinitialisation des mocks
    mockNetwork = {
      get: jest.fn(),
      post: jest.fn()
    };
    Network.mockImplementation(() => mockNetwork);

    mockCache = {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn()
    };
    Cache.mockImplementation(() => mockCache);

    scrapingService = new ScrapingService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Configuration', () => {
    it('devrait être configuré avec les paramètres de AppConfig', () => {
      expect(Network).toHaveBeenCalledWith({
        baseURL: AppConfig.services.scraping.baseUrl,
        timeout: AppConfig.services.scraping.timeout,
        retries: AppConfig.services.scraping.retryAttempts,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      expect(Cache).toHaveBeenCalledWith({
        namespace: 'scraping',
        duration: AppConfig.performance.cache.duration
      });
    });
  });

  describe('getPopularContent', () => {
    const mockData = {
      MAX_LENGTH: 10,
      items: [
        { id: 1, title: 'Drama 1' },
        { id: 2, title: 'Drama 2' }
      ]
    };

    it('devrait retourner les données du cache si disponibles', async () => {
      mockCache.get.mockResolvedValue(mockData);
      AppConfig.performance.cache.enabled = true;

      const result = await scrapingService.getPopularContent();

      expect(mockCache.get).toHaveBeenCalledWith('popular_content');
      expect(mockNetwork.get).not.toHaveBeenCalled();
      expect(result).toEqual(mockData);
    });

    it('devrait faire une requête réseau si le cache est vide', async () => {
      mockCache.get.mockResolvedValue(null);
      mockNetwork.get.mockResolvedValue({ data: mockData });
      AppConfig.performance.cache.enabled = true;

      const result = await scrapingService.getPopularContent();

      expect(mockNetwork.get).toHaveBeenCalledWith('/api/popular');
      expect(mockCache.set).toHaveBeenCalledWith('popular_content', mockData);
      expect(result).toEqual(mockData);
    });

    it('devrait gérer les erreurs de requête', async () => {
      mockCache.get.mockResolvedValue(null);
      mockNetwork.get.mockRejectedValue(new Error('Erreur réseau'));

      await expect(scrapingService.getPopularContent()).rejects.toThrow('Erreur réseau');
    });
  });

  describe('searchDramas', () => {
    const mockQuery = 'test drama';
    const mockResults = [
      { id: 1, title: 'Test Drama 1' },
      { id: 2, title: 'Test Drama 2' }
    ];

    it('devrait retourner un tableau vide si la requête est vide', async () => {
      const result = await scrapingService.searchDramas('');
      expect(result).toEqual([]);
      expect(mockNetwork.get).not.toHaveBeenCalled();
    });

    it('devrait effectuer une recherche avec les paramètres corrects', async () => {
      mockNetwork.get.mockResolvedValue({ data: mockResults });

      const result = await scrapingService.searchDramas(mockQuery);

      expect(mockNetwork.get).toHaveBeenCalledWith('/api/search', {
        params: { q: mockQuery }
      });
      expect(result).toEqual(mockResults);
    });

    it('devrait gérer les erreurs de recherche', async () => {
      mockNetwork.get.mockRejectedValue(new Error('Erreur de recherche'));

      await expect(scrapingService.searchDramas(mockQuery))
        .rejects.toThrow('Erreur de recherche');
    });
  });

  describe('Gestion du cache', () => {
    it('devrait invalider une entrée spécifique du cache', async () => {
      await scrapingService.invalidateCache('popular_content');
      expect(mockCache.remove).toHaveBeenCalledWith('popular_content');
    });

    it('devrait invalider tout le cache', async () => {
      await scrapingService.invalidateAllCache();
      expect(mockCache.clear).toHaveBeenCalled();
    });

    it('devrait gérer les erreurs d\'invalidation du cache', async () => {
      mockCache.remove.mockRejectedValue(new Error('Erreur cache'));
      
      await expect(scrapingService.invalidateCache('popular_content'))
        .resolves.not.toThrow();
    });
  });

  describe('Optimisations de performance', () => {
    it('devrait respecter la configuration de cache', async () => {
      AppConfig.performance.cache.enabled = false;
      mockNetwork.get.mockResolvedValue({ data: { items: [] } });

      await scrapingService.getPopularContent();

      expect(mockCache.set).not.toHaveBeenCalled();
    });

    it('devrait utiliser le cache pour les requêtes fréquentes', async () => {
      const mockData = { items: [] };
      mockCache.get.mockResolvedValue(mockData);
      AppConfig.performance.cache.enabled = true;

      // Multiples appels
      await scrapingService.getPopularContent();
      await scrapingService.getPopularContent();
      await scrapingService.getPopularContent();

      expect(mockNetwork.get).not.toHaveBeenCalled();
      expect(mockCache.get).toHaveBeenCalledTimes(3);
    });
  });

  describe('Gestion des erreurs', () => {
    it('devrait gérer les erreurs de format de réponse', async () => {
      mockCache.get.mockResolvedValue(null);
      mockNetwork.get.mockResolvedValue({ data: { invalid: true } });

      await expect(scrapingService.getPopularContent())
        .rejects.toThrow('Format de réponse invalide');
    });

    it('devrait gérer les timeouts', async () => {
      mockCache.get.mockResolvedValue(null);
      mockNetwork.get.mockRejectedValue(new Error('TIMEOUT'));

      await expect(scrapingService.getPopularContent())
        .rejects.toThrow('TIMEOUT');
    });
  });
});
