const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Redis = require('ioredis-mock');
const AWS = require('aws-sdk-mock');
const app = require('../../Backend/src/app');

describe('Tests d\'Intégration API FloDrama', () => {
  let mongoServer;
  let redisClient;

  beforeAll(async () => {
    // Configuration de la base de données de test
    mongoServer = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongoServer.getUri();

    // Configuration du client Redis mock
    redisClient = new Redis();
    
    // Mock des services AWS
    AWS.mock('Personalize', 'getRecommendations', (params, callback) => {
      callback(null, {
        itemList: [
          { itemId: 'content1', score: 0.9 },
          { itemId: 'content2', score: 0.8 },
        ]
      });
    });

    AWS.mock('CognitoIdentityServiceProvider', 'initiateAuth', (params, callback) => {
      callback(null, {
        AuthenticationResult: {
          AccessToken: 'mock-token',
          IdToken: 'mock-id-token',
          RefreshToken: 'mock-refresh-token'
        }
      });
    });
  });

  afterAll(async () => {
    await mongoServer.stop();
    AWS.restore();
  });

  describe('Authentication', () => {
    const testUser = {
      email: 'test@flodrama.com',
      password: 'TestPassword123!'
    };

    test('POST /api/v1/auth/register - Inscription utilisateur', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(testUser);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('userId');
      expect(response.body).toHaveProperty('email', testUser.email);
    });

    test('POST /api/v1/auth/login - Connexion utilisateur', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(testUser);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
    });
  });

  describe('Recommandations', () => {
    let authToken;

    beforeEach(async () => {
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@flodrama.com',
          password: 'TestPassword123!'
        });
      authToken = loginResponse.body.accessToken;
    });

    test('GET /api/v1/recommendations - Récupération des recommandations', async () => {
      const response = await request(app)
        .get('/api/v1/recommendations')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('items');
      expect(Array.isArray(response.body.items)).toBe(true);
      expect(response.body.items.length).toBeGreaterThan(0);
    });

    test('GET /api/v1/recommendations/personalized - Recommandations personnalisées', async () => {
      const response = await request(app)
        .get('/api/v1/recommendations/personalized')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('items');
      expect(Array.isArray(response.body.items)).toBe(true);
      expect(response.body.items[0]).toHaveProperty('score');
    });
  });

  describe('Gestion du Contenu', () => {
    let authToken;
    let contentId;

    beforeEach(async () => {
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@flodrama.com',
          password: 'TestPassword123!'
        });
      authToken = loginResponse.body.accessToken;
    });

    test('POST /api/v1/content - Création de contenu', async () => {
      const contentData = {
        title: 'Test Drama',
        description: 'Un drama de test',
        genres: ['Action', 'Romance'],
        language: 'fr',
        duration: 3600
      };

      const response = await request(app)
        .post('/api/v1/content')
        .set('Authorization', `Bearer ${authToken}`)
        .send(contentData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('title', contentData.title);
      contentId = response.body.id;
    });

    test('GET /api/v1/content/:id - Récupération du contenu', async () => {
      const response = await request(app)
        .get(`/api/v1/content/${contentId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', contentId);
      expect(response.body).toHaveProperty('title');
      expect(response.body).toHaveProperty('description');
    });

    test('POST /api/v1/content/search - Recherche de contenu', async () => {
      const searchQuery = {
        query: 'drama',
        filters: {
          genres: ['Action'],
          language: 'fr'
        }
      };

      const response = await request(app)
        .post('/api/v1/content/search')
        .set('Authorization', `Bearer ${authToken}`)
        .send(searchQuery);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('results');
      expect(Array.isArray(response.body.results)).toBe(true);
    });
  });

  describe('Interactions Utilisateur', () => {
    let authToken;
    let contentId;

    beforeEach(async () => {
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@flodrama.com',
          password: 'TestPassword123!'
        });
      authToken = loginResponse.body.accessToken;

      const contentResponse = await request(app)
        .post('/api/v1/content')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Drama',
          description: 'Un drama de test',
          genres: ['Action'],
          language: 'fr',
          duration: 3600
        });
      contentId = contentResponse.body.id;
    });

    test('POST /api/v1/interactions - Enregistrement d\'une interaction', async () => {
      const interactionData = {
        contentId: contentId,
        type: 'view',
        duration: 300,
        progress: 0.5
      };

      const response = await request(app)
        .post('/api/v1/interactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(interactionData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });

    test('GET /api/v1/interactions/history - Historique des interactions', async () => {
      const response = await request(app)
        .get('/api/v1/interactions/history')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('interactions');
      expect(Array.isArray(response.body.interactions)).toBe(true);
      expect(response.body.interactions.length).toBeGreaterThan(0);
    });
  });

  describe('Gestion des Préférences', () => {
    let authToken;

    beforeEach(async () => {
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@flodrama.com',
          password: 'TestPassword123!'
        });
      authToken = loginResponse.body.accessToken;
    });

    test('PUT /api/v1/users/preferences - Mise à jour des préférences', async () => {
      const preferences = {
        genres: ['Romance', 'Comédie'],
        languages: ['fr', 'kr'],
        notifications: {
          email: true,
          push: false
        }
      };

      const response = await request(app)
        .put('/api/v1/users/preferences')
        .set('Authorization', `Bearer ${authToken}`)
        .send(preferences);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('preferences');
      expect(response.body.preferences).toMatchObject(preferences);
    });

    test('GET /api/v1/users/preferences - Récupération des préférences', async () => {
      const response = await request(app)
        .get('/api/v1/users/preferences')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('preferences');
      expect(response.body.preferences).toHaveProperty('genres');
      expect(response.body.preferences).toHaveProperty('languages');
      expect(response.body.preferences).toHaveProperty('notifications');
    });
  });

  describe('Gestion du Cache', () => {
    let authToken;

    beforeEach(async () => {
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@flodrama.com',
          password: 'TestPassword123!'
        });
      authToken = loginResponse.body.accessToken;
    });

    test('Vérification du cache pour les recommandations', async () => {
      // Première requête - devrait mettre en cache
      const firstResponse = await request(app)
        .get('/api/v1/recommendations')
        .set('Authorization', `Bearer ${authToken}`);

      expect(firstResponse.status).toBe(200);

      // Deuxième requête - devrait utiliser le cache
      const secondResponse = await request(app)
        .get('/api/v1/recommendations')
        .set('Authorization', `Bearer ${authToken}`);

      expect(secondResponse.status).toBe(200);
      expect(secondResponse.body).toEqual(firstResponse.body);
      // Vérification du header X-Cache
      expect(secondResponse.headers['x-cache']).toBe('HIT');
    });
  });
});
