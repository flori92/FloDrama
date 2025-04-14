const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Port explicitement défini à 8090
const PORT = 8090;

// Fonction pour déterminer le type MIME
function getMimeType(filePath) {
  const extname = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.webp': 'image/webp',
    '.webm': 'video/webm',
    '.mp4': 'video/mp4',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'font/otf',
    '.txt': 'text/plain'
  };

  return mimeTypes[extname] || 'application/octet-stream';
}

// Page d'erreur 404 respectant l'identité visuelle de FloDrama
const notFoundPage = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Page non trouvée - FloDrama</title>
  <style>
    :root {
      --primary-blue: #3b82f6;
      --primary-fuchsia: #d946ef;
      --bg-dark: #121118;
      --bg-secondary: #1A1926;
    }
    
    body {
      font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: var(--bg-dark);
      color: white;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      text-align: center;
    }
    
    .error-container {
      max-width: 600px;
      padding: 2rem;
      background-color: var(--bg-secondary);
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
    }
    
    .error-code {
      font-size: 8rem;
      font-weight: bold;
      margin: 0;
      background: linear-gradient(to right, var(--primary-blue), var(--primary-fuchsia));
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
    }
    
    .error-title {
      font-size: 2rem;
      margin: 1rem 0;
    }
    
    .error-message {
      font-size: 1.1rem;
      margin-bottom: 2rem;
      opacity: 0.8;
    }
    
    .back-button {
      display: inline-block;
      padding: 0.8rem 1.5rem;
      background: linear-gradient(to right, var(--primary-blue), var(--primary-fuchsia));
      color: white;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 500;
      transition: all 0.3s ease;
    }
    
    .back-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
    }
    
    .logo {
      font-size: 2rem;
      font-weight: bold;
      margin-bottom: 2rem;
      background: linear-gradient(to right, var(--primary-blue), var(--primary-fuchsia));
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
    }
  </style>
</head>
<body>
  <div class="logo">FloDrama</div>
  <div class="error-container">
    <h1 class="error-code">404</h1>
    <h2 class="error-title">Page non trouvée</h2>
    <p class="error-message">La page que vous recherchez n'existe pas ou a été déplacée.</p>
    <a href="/" class="back-button">Retour à l'accueil</a>
  </div>
</body>
</html>
`;

// Page d'accueil de secours respectant l'identité visuelle de FloDrama
const fallbackHomePage = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="theme-color" content="#121118">
  <title>FloDrama - Streaming de dramas et films asiatiques</title>
  <link rel="icon" type="image/svg+xml" href="/logo.svg">
  <link rel="apple-touch-icon" href="/logo192.png">
  <link rel="manifest" href="/manifest.json">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'SF Pro Display', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: #121118;
      color: white;
      margin: 0;
      padding: 0;
    }
    
    .header {
      background-color: rgba(26, 25, 38, 0.8);
      backdrop-filter: blur(10px);
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      padding: 16px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      z-index: 100;
    }
    
    .logo {
      display: flex;
      align-items: center;
      font-weight: bold;
      font-size: 24px;
      background: linear-gradient(to right, #3b82f6, #d946ef);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      text-fill-color: transparent;
    }
    
    .nav {
      display: flex;
      gap: 24px;
    }
    
    .nav a {
      color: white;
      text-decoration: none;
      font-weight: 500;
      transition: opacity 0.3s ease;
    }
    
    .nav a:hover {
      opacity: 0.8;
    }
    
    .hero {
      height: 80vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      padding: 0 24px;
      background: linear-gradient(rgba(18, 17, 24, 0.7), rgba(18, 17, 24, 1)), url('/backdrop.jpg');
      background-size: cover;
      background-position: center;
    }
    
    .hero h1 {
      font-size: 48px;
      margin-bottom: 16px;
      max-width: 800px;
    }
    
    .hero p {
      font-size: 18px;
      margin-bottom: 32px;
      max-width: 600px;
      opacity: 0.8;
    }
    
    .button {
      display: inline-block;
      background: linear-gradient(to right, #3b82f6, #d946ef);
      color: white;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 28px;
      font-weight: 600;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }
    
    .button:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(217, 70, 239, 0.4);
    }
    
    .button.secondary {
      background: transparent;
      border: 2px solid rgba(255, 255, 255, 0.2);
      margin-left: 16px;
    }
    
    .button.secondary:hover {
      border-color: rgba(255, 255, 255, 0.4);
    }
    
    .content {
      padding: 80px 24px;
      max-width: 1200px;
      margin: 0 auto;
    }
    
    .section-title {
      font-size: 32px;
      margin-bottom: 40px;
      position: relative;
      display: inline-block;
    }
    
    .section-title::after {
      content: '';
      position: absolute;
      bottom: -8px;
      left: 0;
      width: 60px;
      height: 4px;
      background: linear-gradient(to right, #3b82f6, #d946ef);
      border-radius: 2px;
    }
    
    .cards {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 24px;
    }
    
    .card {
      background-color: #1A1926;
      border-radius: 8px;
      overflow: hidden;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }
    
    .card:hover {
      transform: translateY(-5px);
      box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
    }
    
    .card-image {
      width: 100%;
      height: 280px;
      background-color: #2a293a;
      background-image: linear-gradient(45deg, #3b82f6, #d946ef);
      position: relative;
      overflow: hidden;
    }
    
    .card-content {
      padding: 16px;
    }
    
    .card-title {
      font-weight: 600;
      margin-bottom: 8px;
    }
    
    .card-info {
      font-size: 14px;
      opacity: 0.7;
    }
    
    .footer {
      background-color: #1A1926;
      padding: 40px 24px;
      text-align: center;
    }
    
    .footer p {
      opacity: 0.7;
      margin-top: 16px;
    }
    
    .maintenance-notice {
      background: linear-gradient(to right, rgba(59, 130, 246, 0.1), rgba(217, 70, 239, 0.1));
      border-left: 4px solid #d946ef;
      padding: 16px 24px;
      margin: 40px 0;
      border-radius: 0 8px 8px 0;
    }
    
    @media (max-width: 768px) {
      .hero h1 {
        font-size: 36px;
      }
      
      .nav {
        display: none;
      }
      
      .cards {
        grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      }
      
      .card-image {
        height: 220px;
      }
    }
  </style>
</head>
<body>
  <header class="header">
    <div class="logo">FloDrama</div>
    <nav class="nav">
      <a href="/">Accueil</a>
      <a href="/dramas">Dramas</a>
      <a href="/films">Films</a>
      <a href="/animes">Animés</a>
    </nav>
  </header>
  
  <section class="hero">
    <h1>Découvrez le meilleur du streaming asiatique</h1>
    <p>FloDrama vous propose une sélection de dramas coréens, films asiatiques et animés japonais en streaming.</p>
    <div>
      <a href="#" class="button">Explorer le catalogue</a>
      <a href="#" class="button secondary">En savoir plus</a>
    </div>
  </section>
  
  <div class="content">
    <div class="maintenance-notice">
      <h3>Site en maintenance</h3>
      <p>FloDrama est actuellement en cours de maintenance pour vous offrir une meilleure expérience. Certaines fonctionnalités peuvent être temporairement indisponibles.</p>
    </div>
    
    <h2 class="section-title">Tendances</h2>
    <div class="cards">
      <div class="card">
        <div class="card-image"></div>
        <div class="card-content">
          <div class="card-title">Crash Landing on You</div>
          <div class="card-info">2020 • Drame, Romance</div>
        </div>
      </div>
      <div class="card">
        <div class="card-image"></div>
        <div class="card-content">
          <div class="card-title">Parasite</div>
          <div class="card-info">2019 • Thriller, Drame</div>
        </div>
      </div>
      <div class="card">
        <div class="card-image"></div>
        <div class="card-content">
          <div class="card-title">Demon Slayer</div>
          <div class="card-info">2019 • Action, Fantastique</div>
        </div>
      </div>
      <div class="card">
        <div class="card-image"></div>
        <div class="card-content">
          <div class="card-title">It's Okay to Not Be Okay</div>
          <div class="card-info">2020 • Drame, Romance</div>
        </div>
      </div>
      <div class="card">
        <div class="card-image"></div>
        <div class="card-content">
          <div class="card-title">Your Name</div>
          <div class="card-info">2016 • Animation, Romance</div>
        </div>
      </div>
    </div>
  </div>
  
  <footer class="footer">
    <div class="logo">FloDrama</div>
    <p> 2025 FloDrama. Tous droits réservés.</p>
  </footer>
</body>
</html>
`;

// Création du serveur HTTP
const server = http.createServer((req, res) => {
  console.log(`Requête reçue: ${req.url}`);
  
  // Normaliser l'URL pour éviter les problèmes de chemin
  let requestUrl = req.url;
  
  // Rediriger vers index-optimise.html pour la racine
  if (requestUrl === '/' || requestUrl === '/index.html') {
    requestUrl = '/index-optimise.html';
  }
  
  // Gérer les fichiers spéciaux à la racine
  const rootFiles = ['/manifest.json', '/logo.svg', '/logo192.png', '/logo512.png', '/favicon.ico', '/robots.txt'];
  if (rootFiles.includes(requestUrl)) {
    // Essayer d'abord à la racine
    const rootFilePath = path.join(__dirname, requestUrl.substring(1));
    
    fs.access(rootFilePath, fs.constants.F_OK, (err) => {
      if (!err) {
        // Le fichier existe à la racine
        fs.readFile(rootFilePath, (readErr, content) => {
          if (readErr) {
            console.error(`Erreur lors de la lecture du fichier ${rootFilePath}:`, readErr);
            res.writeHead(500);
            res.end('Erreur serveur');
            return;
          }
          
          res.writeHead(200, { 'Content-Type': getMimeType(rootFilePath) });
          res.end(content);
        });
        return;
      }
      
      // Sinon, essayer dans le dossier public
      const publicFilePath = path.join(__dirname, 'public', requestUrl);
      fs.access(publicFilePath, fs.constants.F_OK, (publicErr) => {
        if (publicErr) {
          console.error(`Fichier non trouvé: ${requestUrl}`);
          res.writeHead(404);
          res.end(notFoundPage);
          return;
        }
        
        fs.readFile(publicFilePath, (readErr, content) => {
          if (readErr) {
            console.error(`Erreur lors de la lecture du fichier ${publicFilePath}:`, readErr);
            res.writeHead(500);
            res.end('Erreur serveur');
            return;
          }
          
          res.writeHead(200, { 'Content-Type': getMimeType(publicFilePath) });
          res.end(content);
        });
      });
    });
    return;
  }
  
  // Gérer les fichiers assets
  if (requestUrl.startsWith('/assets/')) {
    const assetPath = path.join(__dirname, 'public', requestUrl);
    
    fs.access(assetPath, fs.constants.F_OK, (err) => {
      if (err) {
        console.error(`Asset non trouvé: ${requestUrl}`);
        res.writeHead(404);
        res.end(notFoundPage);
        return;
      }
      
      fs.readFile(assetPath, (readErr, content) => {
        if (readErr) {
          console.error(`Erreur lors de la lecture de l'asset ${assetPath}:`, readErr);
          res.writeHead(500);
          res.end('Erreur serveur');
          return;
        }
        
        res.writeHead(200, { 'Content-Type': getMimeType(assetPath) });
        res.end(content);
      });
    });
    return;
  }
  
  // Gérer les fichiers du dossier public directement
  if (requestUrl.startsWith('/public/')) {
    const publicPath = path.join(__dirname, requestUrl.substring(1));
    
    fs.access(publicPath, fs.constants.F_OK, (err) => {
      if (err) {
        console.error(`Fichier public non trouvé: ${requestUrl}`);
        res.writeHead(404);
        res.end(notFoundPage);
        return;
      }
      
      fs.readFile(publicPath, (readErr, content) => {
        if (readErr) {
          console.error(`Erreur lors de la lecture du fichier public ${publicPath}:`, readErr);
          res.writeHead(500);
          res.end('Erreur serveur');
          return;
        }
        
        res.writeHead(200, { 'Content-Type': getMimeType(publicPath) });
        res.end(content);
      });
    });
    return;
  }
  
  // Gérer les fichiers à la racine
  const filePath = path.join(__dirname, requestUrl.substring(1));
  
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      console.error(`Fichier non trouvé: ${requestUrl}`);
      res.writeHead(404);
      res.end(notFoundPage);
      return;
    }
    
    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        console.error(`Erreur lors de la lecture du fichier ${filePath}:`, readErr);
        res.writeHead(500);
        res.end('Erreur serveur');
        return;
      }
      
      res.writeHead(200, { 'Content-Type': getMimeType(filePath) });
      res.end(content);
    });
  });
});

// Démarrer le serveur
server.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
  console.log(`Ouvrez http://localhost:${PORT} dans votre navigateur`);
});
