/**
 * Serveur proxy CORS pour FloDrama
 * 
 * Ce serveur permet de contourner les restrictions CORS
 * et d'accéder aux sources externes en temps réel
 */

import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

// Configuration du serveur
const PORT = process.env.PROXY_PORT || 3030;
const app = express();

// Middleware pour les logs
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Middleware CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

// Middleware pour parser le JSON
app.use(express.json());

// Route de test
app.get('/api/status', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'Serveur proxy CORS FloDrama opérationnel'
  });
});

// Middleware de proxy pour les requêtes
app.get('/api/proxy', async (req, res) => {
  const targetUrl = req.query.url;
  
  if (!targetUrl) {
    return res.status(400).json({
      error: 'URL cible manquante',
      message: 'Veuillez fournir une URL cible via le paramètre "url"'
    });
  }
  
  console.log(`📡 Proxy: Requête vers ${targetUrl}`);
  
  try {
    const response = await axios.get(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
      },
      timeout: 30000,
      maxRedirects: 5,
      validateStatus: status => status < 500, // Accepter les codes 2xx, 3xx et 4xx
    });
    
    console.log(`📡 Proxy: Réponse reçue de ${targetUrl}`);
    console.log(`📡 Proxy: Status: ${response.status}`);
    console.log(`📡 Proxy: Content-Type: ${response.headers['content-type']}`);
    console.log(`📡 Proxy: Content-Length: ${response.headers['content-length'] || 'N/A'}`);
    
    // Vérifier si le contenu est vide ou non valide
    if (!response.data || (typeof response.data === 'string' && response.data.trim().length === 0)) {
      console.error(`📡 Proxy: Contenu vide ou non valide reçu de ${targetUrl}`);
      return res.status(502).json({ error: 'Contenu vide ou non valide reçu de la source' });
    }
    
    // Vérifier si la réponse contient un code d'erreur ou une page de captcha
    if (typeof response.data === 'string' && 
        (response.data.includes('captcha') || 
         response.data.includes('cloudflare') || 
         response.data.includes('access denied') ||
         response.data.includes('blocked'))) {
      console.error(`📡 Proxy: Détection de protection anti-bot sur ${targetUrl}`);
      return res.status(403).json({ error: 'Protection anti-bot détectée' });
    }
    
    // Transférer les en-têtes de la réponse
    Object.entries(response.headers).forEach(([key, value]) => {
      // Ne pas transférer les en-têtes liés à CORS ou à la compression
      if (!['access-control-allow-origin', 'access-control-allow-methods', 
            'access-control-allow-headers', 'content-encoding', 
            'content-length', 'transfer-encoding'].includes(key.toLowerCase())) {
        res.setHeader(key, value);
      }
    });
    
    // Définir les en-têtes CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Envoyer la réponse
    return res.send(response.data);
  } catch (error) {
    console.error(`📡 Proxy: Erreur lors de la requête vers ${targetUrl}:`, error.message);
    
    // Ajouter des détails sur l'erreur
    if (error.response) {
      console.error(`📡 Proxy: Status: ${error.response.status}`);
      console.error(`📡 Proxy: Headers:`, error.response.headers);
    } else if (error.request) {
      console.error(`📡 Proxy: Aucune réponse reçue`);
    }
    
    return res.status(502).json({ 
      error: `Erreur lors de la requête vers la cible: ${error.message}`,
      details: error.response ? {
        status: error.response.status,
        headers: error.response.headers
      } : null
    });
  }
});

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur proxy CORS FloDrama démarré sur le port ${PORT}`);
  console.log(`📡 URL du proxy: http://localhost:${PORT}/api/proxy?url=URL_CIBLE`);
  console.log(`📊 Statut du serveur: http://localhost:${PORT}/api/status`);
});

export default app;
