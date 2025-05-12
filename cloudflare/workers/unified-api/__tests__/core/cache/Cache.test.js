const Cache = require('../../../core/cache/Cache');

// Mock pour le stockage KV de Cloudflare
const mockKV = {
  get: jest.fn(),
  put: jest.fn()
};

// Mock pour l'environnement global
global.caches = {
  default: {
    match: jest.fn(),
    put: jest.fn()
  }
};

describe('Cache', () => {
  let cache;
  
  beforeEach(() => {
    // Réinitialiser les mocks
    jest.clearAllMocks();
    
    // Créer une nouvelle instance de Cache
    cache = new Cache();
    
    // Injecter le mock KV
    cache.kv = mockKV;
  });
  
  test('devrait stocker des données dans le cache', async () => {
    const key = 'test-key';
    const value = JSON.stringify({ data: 'test-value' });
    const ttl = 3600;
    
    await cache.set(key, value, ttl);
    
    // Vérifier que la méthode put a été appelée avec les bons arguments
    expect(mockKV.put).toHaveBeenCalledWith(key, value, { expirationTtl: ttl });
    
    // Si KV n'est pas disponible, vérifier que le cache du navigateur est utilisé
    mockKV.put.mockImplementationOnce(() => {
      throw new Error('KV not available');
    });
    
    await cache.set(key, value, ttl);
    
    const cacheUrl = new URL(`https://flodrama-api.com/cache/${key}`);
    const response = new Response(value, {
      headers: {
        'Cache-Control': `max-age=${ttl}`,
        'Content-Type': 'application/json'
      }
    });
    
    expect(global.caches.default.put).toHaveBeenCalledWith(cacheUrl, response);
  });
  
  test('devrait récupérer des données du cache', async () => {
    const key = 'test-key';
    const value = JSON.stringify({ data: 'test-value' });
    
    // Simuler une réponse du KV
    mockKV.get.mockResolvedValueOnce(value);
    
    const result = await cache.get(key);
    
    // Vérifier que la méthode get a été appelée avec le bon argument
    expect(mockKV.get).toHaveBeenCalledWith(key);
    
    // Vérifier que la valeur retournée est correcte
    expect(result).toBe(value);
    
    // Simuler une erreur KV et une réponse du cache du navigateur
    mockKV.get.mockImplementationOnce(() => {
      throw new Error('KV not available');
    });
    
    const mockResponse = new Response(value);
    global.caches.default.match.mockResolvedValueOnce(mockResponse);
    
    const result2 = await cache.get(key);
    
    const cacheUrl = new URL(`https://flodrama-api.com/cache/${key}`);
    expect(global.caches.default.match).toHaveBeenCalledWith(cacheUrl);
    
    // Vérifier que la valeur retournée est correcte
    expect(result2).toBe(value);
  });
  
  test('devrait retourner null si la clé n\'existe pas dans le cache', async () => {
    const key = 'non-existent-key';
    
    // Simuler une absence de réponse du KV
    mockKV.get.mockResolvedValueOnce(null);
    
    const result = await cache.get(key);
    
    // Vérifier que la méthode get a été appelée avec le bon argument
    expect(mockKV.get).toHaveBeenCalledWith(key);
    
    // Vérifier que la valeur retournée est null
    expect(result).toBeNull();
    
    // Simuler une erreur KV et une absence de réponse du cache du navigateur
    mockKV.get.mockImplementationOnce(() => {
      throw new Error('KV not available');
    });
    
    global.caches.default.match.mockResolvedValueOnce(undefined);
    
    const result2 = await cache.get(key);
    
    // Vérifier que la valeur retournée est null
    expect(result2).toBeNull();
  });
  
  test('devrait gérer les erreurs lors de l\'accès au cache', async () => {
    const key = 'error-key';
    const value = JSON.stringify({ data: 'test-value' });
    
    // Simuler une erreur lors de l'accès au KV
    mockKV.get.mockRejectedValueOnce(new Error('KV error'));
    
    // Simuler une erreur lors de l'accès au cache du navigateur
    global.caches.default.match.mockRejectedValueOnce(new Error('Cache error'));
    
    const result = await cache.get(key);
    
    // Vérifier que null est retourné en cas d'erreur
    expect(result).toBeNull();
    
    // Simuler une erreur lors de la mise en cache
    mockKV.put.mockRejectedValueOnce(new Error('KV error'));
    global.caches.default.put.mockRejectedValueOnce(new Error('Cache error'));
    
    // Vérifier que l'erreur est gérée sans crash
    await expect(cache.set(key, value, 3600)).resolves.not.toThrow();
  });
});
