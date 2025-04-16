// Configuration AWS pour FloDrama
// Créé le 26-03-2025

// Exporter la configuration AWS pour l'application
export const AWS_CONFIG = {
  region: 'us-east-1',
  apiGateway: {
    REGION: 'us-east-1',
    URL: 'https://7la2pq33ej.execute-api.us-east-1.amazonaws.com/production',
  },
  cognito: {
    REGION: 'us-east-1',
    USER_POOL_ID: 'us-east-1_xxxxxxxx', // À remplacer par votre ID de pool d'utilisateurs
    APP_CLIENT_ID: 'xxxxxxxxxxxxxxxxxxxxxxxxxx', // À remplacer par votre ID client d'application
  },
  s3: {
    REGION: 'us-east-1',
    BUCKET: 'flodrama-app-bucket-us-east1-us-east1',
  },
  cloudFront: {
    URL: 'https://d1323ouxr1qbdp.cloudfront.net',
  },
  mediaUrl: 'https://d1323ouxr1qbdp.cloudfront.net',
};

// Configuration par défaut pour AWS SDK
if (typeof window !== 'undefined' && typeof window.AWS !== 'undefined') {
  window.AWS.config.region = AWS_CONFIG.region;
  console.log('[AWS Config] Configuration AWS initialisée avec la région:', AWS_CONFIG.region);
}

export default AWS_CONFIG;
