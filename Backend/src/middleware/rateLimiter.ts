/**
 * Middleware de limitation de débit (rate limiting) pour Cloudflare Workers
 */
import { Request, Response, KVNamespace, ExecutionContext } from '../types/cloudflare';
import { logger } from '../utils/logger';

interface RateLimitOptions {
  windowMs?: number;    // Durée de la fenêtre en millisecondes
  max?: number;         // Nombre maximum de requêtes par fenêtre
  message?: string;    // Message d'erreur personnalisé
  statusCode?: number; // Code d'état HTTP à renvoyer (défaut: 429)
  keyGenerator?: (request: Request) => string; // Fonction pour générer une clé unique par client
  handler?: (request: Request) => Response; // Gestionnaire personnalisé pour les limites dépassées
  skipSuccessfulRequests?: boolean; // Ne pas incrémenter le compteur pour les requêtes réussies
  skipFailedRequests?: boolean;     // Ne pas incrémenter le compteur pour les requêtes échouées
  keyPrefix?: string;  // Préfixe pour les clés
}

interface RateLimitInfo {
  count: number;
  expires: number;
}

interface RateLimitStore {
  increment(key: string, windowMs: number): Promise<number>;
  decrement(key: string): Promise<void>;
  resetKey(key: string): Promise<void>;
  resetAll(): Promise<void>;
}

class CloudflareKVStore implements RateLimitStore {
  private namespace: KVNamespace;
  
  constructor(namespace: KVNamespace) {
    this.namespace = namespace;
  }
  
  async increment(key: string, windowMs: number): Promise<number> {
    const now = Date.now();
    const expiresAt = now + windowMs;
    
    // Récupérer le compteur actuel
    const currentValue = await this.namespace.get(key, 'json') as { count: number, expires: number } | null;
    
    if (!currentValue || currentValue.expires < now) {
      // Créer un nouveau compteur si inexistant ou expiré
      await this.namespace.put(key, JSON.stringify({ count: 1, expires: expiresAt }), { expirationTtl: windowMs / 1000 });
      return 1;
    } else {
      // Incrémenter le compteur existant
      const newCount = currentValue.count + 1;
      await this.namespace.put(key, JSON.stringify({ count: newCount, expires: currentValue.expires }), { expirationTtl: (currentValue.expires - now) / 1000 });
      return newCount;
    }
  }
  
  async decrement(key: string): Promise<void> {
    const currentValue = await this.namespace.get(key, 'json') as { count: number, expires: number } | null;
    
    if (currentValue && currentValue.count > 0) {
      const newCount = currentValue.count - 1;
      await this.namespace.put(key, JSON.stringify({ count: newCount, expires: currentValue.expires }), { expirationTtl: (currentValue.expires - Date.now()) / 1000 });
    }
  }
  
  async resetKey(key: string): Promise<void> {
    await this.namespace.delete(key);
  }
  
  async resetAll(): Promise<void> {
    // Cette opération est coûteuse et devrait être utilisée avec précaution
    const keys = await this.namespace.list();
    await Promise.all(keys.keys.map(key => this.namespace.delete(key.name)));
  }
}

/**
 * Middleware de limitation de débit pour Cloudflare Workers
 * Utilise Cloudflare KV pour stocker les compteurs
 * 
 * @param request - La requête à limiter
 * @param env - L'environnement Cloudflare Workers
 * @param options - Options de configuration du rate limiting
 * @returns Une promesse qui résout si la requête est autorisée, ou rejette avec une erreur si la limite est atteinte
 */
export async function rateLimiter(
  request: Request, 
  env: { CACHE: KVNamespace },
  options: RateLimitOptions = {}
): Promise<void> {
  const {
    windowMs = 60 * 1000, // 1 minute par défaut
    max = 100,           // 100 requêtes par défaut
    message = 'Trop de requêtes, veuillez réessayer plus tard',
    statusCode = 429,
    keyGenerator = (request: Request) => request.headers.get('CF-Connecting-IP') || 
               request.headers.get('X-Forwarded-For') || 
               'unknown',
    handler,
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    keyPrefix = 'rate-limit:'
  } = options;

  try {
    // Générer une clé unique pour l'utilisateur
    const key = `${keyPrefix}${keyGenerator(request)}`;
    const now = Date.now();
    
    // Récupérer le compteur actuel depuis KV
    const storedValue = await env.CACHE.get(key, { type: 'json' }) as RateLimitInfo | null;
    
    // Si aucune entrée n'existe ou si elle est expirée
    if (!storedValue || storedValue.expires < now) {
      // Premier accès ou entrée expirée, initialiser le compteur
      await env.CACHE.put(key, JSON.stringify({
        count: 1,
        expires: now + windowMs
      }), { expirationTtl: Math.ceil(windowMs / 1000) });
      return;
    }

    // Vérifier si la limite est atteinte
    if (storedValue.count >= max) {
      // Limite atteinte
      const resetIn = Math.ceil((storedValue.expires - now) / 1000);
      throw new Error(`${message} Réessayez dans ${resetIn} secondes.`);
    }

    // Incrémenter le compteur
    await env.CACHE.put(key, JSON.stringify({
      count: storedValue.count + 1,
      expires: storedValue.expires
    }), { expirationTtl: Math.ceil((storedValue.expires - now) / 1000) });
    
  } catch (error) {
    if ((error as Error).message.includes('Trop de requêtes')) {
      throw error;
    }
    
    logger.error('Erreur dans le rate limiter:', error);
    // En cas d'erreur technique, on laisse passer la requête
    // mais on log l'erreur pour le monitoring
  }
}

/**
 * Utilitaire pour obtenir les informations de rate limiting
 * 
 * @param request - La requête à analyser
 * @param env - L'environnement Cloudflare Workers
 * @param keyPrefix - Préfixe pour les clés
 * @returns Une promesse qui résout avec les informations de rate limiting
 */
export async function getRateLimitInfo(
  request: Request,
  env: { CACHE: KVNamespace },
  keyPrefix: string = 'rate-limit:'
): Promise<{ remaining: number; reset: number; limit: number }> {
  try {
    const ip = request.headers.get('CF-Connecting-IP') || 
               request.headers.get('X-Forwarded-For') || 
               'unknown';
    const key = `${keyPrefix}${ip}`;
    const now = Date.now();
    
    // Récupérer le compteur actuel depuis KV
    const storedValue = await env.CACHE.get(key, { type: 'json' }) as RateLimitInfo | null;
    
    if (!storedValue) {
      return { remaining: 100, reset: 0, limit: 100 };
    }
    
    const remaining = Math.max(0, 100 - storedValue.count);
    const reset = Math.ceil((storedValue.expires - now) / 1000);
    
    return { remaining, reset, limit: 100 };
  } catch (error) {
    logger.error('Erreur lors de la récupération des informations de rate limiting:', error);
    return { remaining: 100, reset: 0, limit: 100 };
  }
}
