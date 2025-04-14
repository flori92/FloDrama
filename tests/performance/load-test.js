import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Métriques personnalisées
const errorRate = new Rate('errors');

// Configuration des scénarios de test
export const options = {
  scenarios: {
    // Test de charge standard
    average_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 100 },  // Montée progressive à 100 utilisateurs
        { duration: '5m', target: 100 },  // Maintien à 100 utilisateurs
        { duration: '2m', target: 0 },    // Réduction progressive à 0
      ],
      gracefulRampDown: '30s',
    },
    // Test de pics de charge
    stress_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 200 },  // Pic rapide à 200 utilisateurs
        { duration: '30s', target: 200 }, // Maintien du pic
        { duration: '1m', target: 0 },    // Réduction rapide
      ],
      gracefulRampDown: '30s',
      startTime: '10m',                   // Commence après le test de charge standard
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<500'],     // 95% des requêtes doivent être sous 500ms
    http_req_failed: ['rate<0.01'],       // Moins de 1% d'erreurs
    errors: ['rate<0.05'],                // Moins de 5% d'erreurs personnalisées
  },
};

// Données de test
const TEST_DATA = {
  validUser: {
    email: 'test@flodrama.com',
    password: 'TestPassword123!',
  },
  contentIds: [
    'content1',
    'content2',
    'content3',
    'content4',
    'content5',
  ],
};

// Configuration de l'environnement
const BASE_URL = __ENV.API_URL || 'https://api.flodrama.com';
const API_VERSION = 'v1';

// Headers par défaut
const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};

// Fonction principale de test
export default function() {
  // Test d'authentification
  const loginRes = http.post(`${BASE_URL}/${API_VERSION}/auth/login`, JSON.stringify(TEST_DATA.validUser), {
    headers: DEFAULT_HEADERS,
  });

  check(loginRes, {
    'login successful': (r) => r.status === 200,
    'has access token': (r) => r.json('accessToken') !== undefined,
  });

  if (loginRes.status !== 200) {
    errorRate.add(1);
    sleep(1);
    return;
  }

  const authToken = loginRes.json('accessToken');
  const authHeaders = {
    ...DEFAULT_HEADERS,
    'Authorization': `Bearer ${authToken}`,
  };

  // Test de récupération du profil
  const profileRes = http.get(`${BASE_URL}/${API_VERSION}/users/profile`, {
    headers: authHeaders,
  });

  check(profileRes, {
    'profile retrieved': (r) => r.status === 200,
    'profile has required fields': (r) => {
      const json = r.json();
      return json.id !== undefined && 
             json.email !== undefined && 
             json.preferences !== undefined;
    },
  });

  // Test de récupération des recommandations
  const recoRes = http.get(`${BASE_URL}/${API_VERSION}/recommendations`, {
    headers: authHeaders,
  });

  check(recoRes, {
    'recommendations retrieved': (r) => r.status === 200,
    'has recommendations': (r) => r.json('items').length > 0,
  });

  // Test de recherche de contenu
  const searchRes = http.post(`${BASE_URL}/${API_VERSION}/content/search`, JSON.stringify({
    query: 'action',
    limit: 10,
  }), {
    headers: authHeaders,
  });

  check(searchRes, {
    'search successful': (r) => r.status === 200,
    'has search results': (r) => r.json('results').length > 0,
  });

  // Test de récupération des détails d'un contenu
  const contentId = TEST_DATA.contentIds[Math.floor(Math.random() * TEST_DATA.contentIds.length)];
  const contentRes = http.get(`${BASE_URL}/${API_VERSION}/content/${contentId}`, {
    headers: authHeaders,
  });

  check(contentRes, {
    'content retrieved': (r) => r.status === 200,
    'content has required fields': (r) => {
      const json = r.json();
      return json.id !== undefined && 
             json.title !== undefined && 
             json.description !== undefined;
    },
  });

  // Test d'interaction avec le contenu
  const interactionRes = http.post(`${BASE_URL}/${API_VERSION}/interactions`, JSON.stringify({
    contentId: contentId,
    type: 'view',
    duration: 300,
  }), {
    headers: authHeaders,
  });

  check(interactionRes, {
    'interaction recorded': (r) => r.status === 200,
  });

  // Pause entre les itérations
  sleep(Math.random() * 3 + 2); // Pause aléatoire entre 2 et 5 secondes
}

// Fonction de nettoyage
export function teardown(data) {
  // Nettoyage des données de test si nécessaire
}

// Fonction de configuration
export function setup() {
  // Préparation des données de test si nécessaire
  return {};
}
