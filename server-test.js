const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3000;
const API_GATEWAY_URL = 'https://yqek2f5uph.execute-api.us-east-1.amazonaws.com/prod/stream';

const server = http.createServer((req, res) => {
  // Activer CORS pour toutes les requêtes
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Origin, X-Requested-With, Accept, Authorization');
  
  // Gérer les requêtes OPTIONS (pré-vol CORS)
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // Analyser l'URL de la requête
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  
  // Proxy pour l'API Gateway
  if (pathname === '/api/stream') {
    console.log('Proxying request to API Gateway:', parsedUrl.query);
    
    // Construire l'URL de l'API Gateway avec les paramètres de requête
    let apiUrl = API_GATEWAY_URL;
    const queryParams = [];
    
    for (const [key, value] of Object.entries(parsedUrl.query)) {
      queryParams.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
    }
    
    if (queryParams.length > 0) {
      apiUrl += '?' + queryParams.join('&');
    }
    
    console.log('Forwarding to:', apiUrl);
    
    // Faire la requête à l'API Gateway
    const apiReq = https.request(apiUrl, (apiRes) => {
      // Copier les en-têtes de la réponse
      Object.entries(apiRes.headers).forEach(([key, value]) => {
        // Ne pas copier les en-têtes CORS de l'API, nous les gérons nous-mêmes
        if (!key.toLowerCase().startsWith('access-control')) {
          res.setHeader(key, value);
        }
      });
      
      let data = '';
      apiRes.on('data', (chunk) => {
        data += chunk;
      });
      
      apiRes.on('end', () => {
        res.writeHead(apiRes.statusCode);
        res.end(data);
        console.log(`Proxy response: ${apiRes.statusCode}`);
      });
    });
    
    apiReq.on('error', (error) => {
      console.error('Erreur de proxy API:', error);
      res.writeHead(500);
      res.end(JSON.stringify({ error: 'Erreur de proxy API', message: error.message }));
    });
    
    apiReq.end();
    return;
  }
  
  // Servir les fichiers statiques
  let filePath = '.' + pathname;
  if (filePath === './') {
    filePath = './test-integration.html';
  }

  // Déterminer le type de contenu en fonction de l'extension
  const extname = String(path.extname(filePath)).toLowerCase();
  const contentTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.woff': 'application/font-woff',
    '.ttf': 'application/font-ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'application/font-otf',
    '.wasm': 'application/wasm'
  };

  const contentType = contentTypes[extname] || 'application/octet-stream';

  // Lire le fichier
  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        // Page non trouvée
        console.log(`Fichier non trouvé: ${filePath}`);
        res.writeHead(404);
        res.end(`Fichier non trouvé: ${pathname}`);
      } else {
        // Erreur serveur
        console.error(`Erreur serveur: ${error.code}`);
        res.writeHead(500);
        res.end(`Erreur serveur: ${error.code}`);
      }
    } else {
      // Succès
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
  console.log(`Ouvrez http://localhost:${PORT}/test-integration.html dans votre navigateur`);
  console.log(`Proxy API configuré pour: ${API_GATEWAY_URL}`);
});
