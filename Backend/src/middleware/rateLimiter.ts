import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';
import { logger } from '../utils/logger';

interface RateLimitOptions {
  windowMs: number;    // Durée de la fenêtre en millisecondes
  max: number;         // Nombre maximum de requêtes par fenêtre
  message?: string;    // Message d'erreur personnalisé
  keyPrefix?: string;  // Préfixe pour les clés Redis
}

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD
});

export const rateLimiter = (options: RateLimitOptions) => {
  const {
    windowMs = 60 * 1000, // 1 minute par défaut
    max = 100,           // 100 requêtes par défaut
    message = 'Trop de requêtes, veuillez réessayer plus tard',
    keyPrefix = 'rate-limit:'
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Générer une clé unique pour l'utilisateur
      const key = `${keyPrefix}${req.ip}`;
      
      // Obtenir le nombre actuel de requêtes
      const current = await redis.get(key);
      
      if (!current) {
        // Premier accès, initialiser le compteur
        await redis.setex(key, Math.floor(windowMs / 1000), '1');
        return next();
      }

      const count = parseInt(current);
      
      if (count >= max) {
        // Limite atteinte
        const ttl = await redis.ttl(key);
        
        return res.status(429).json({
          status: 'error',
          message,
          resetIn: ttl
        });
      }

      // Incrémenter le compteur
      await redis.incr(key);
      
      next();
    } catch (error) {
      logger.error('Erreur dans le rate limiter:', error);
      
      // En cas d'erreur, laisser passer la requête
      // mais logger l'erreur pour le monitoring
      next();
    }
  };
};

// Middleware de nettoyage périodique des clés expirées
const cleanupInterval = 60 * 60 * 1000; // 1 heure
setInterval(async () => {
  try {
    const pattern = 'rate-limit:*';
    const keys = await redis.keys(pattern);
    
    for (const key of keys) {
      const ttl = await redis.ttl(key);
      if (ttl <= 0) {
        await redis.del(key);
      }
    }
  } catch (error) {
    logger.error('Erreur lors du nettoyage des clés de rate limit:', error);
  }
}, cleanupInterval);

// Middleware de gestion des erreurs Redis
redis.on('error', (error) => {
  logger.error('Erreur de connexion Redis:', error);
});

// Middleware de surveillance de la connexion Redis
redis.on('connect', () => {
  logger.info('Connexion Redis établie pour le rate limiter');
});

export default rateLimiter;
