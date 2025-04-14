const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 8090;

// Types MIME
const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.jsx': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'font/otf'
};

// Page d'erreur 404 respectant l'identité visuelle de FloDrama
const notFoundPage = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FloDrama - Page non trouvée</title>
  <style>
    body {
      font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: #121118;
      color: white;
      margin: 0;
      padding: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
    }
    .container {
      max-width: 600px;
      padding: 40px;
      text-align: center;
      background-color: #1A1926;
      border-radius: 8px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
    }
    h1 {
      margin-top: 0;
      font-size: 32px;
      background: linear-gradient(to right, #3b82f6, #d946ef);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      text-fill-color: transparent;
    }
    p {
      margin: 20px 0;
      line-height: 1.6;
    }
    .logo {
      width: 120px;
      height: 120px;
      margin: 0 auto 20px;
      background: linear-gradient(to right, #3b82f6, #d946ef);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 36px;
      font-weight: bold;
      color: white;
    }
    .button {
      display: inline-block;
      background: linear-gradient(to right, #3b82f6, #d946ef);
      color: white;
      text-decoration: none;
      padding: 12px 24px;
      border-radius: 24px;
      font-weight: 600;
      margin-top: 20px;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }
    .button:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(217, 70, 239, 0.4);
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">FD</div>
    <h1>Page non trouvée</h1>
    <p>La page que vous recherchez n'existe pas ou a été déplacée.</p>
    <p>FloDrama est en cours de maintenance pour vous offrir une meilleure expérience.</p>
    <a href="/" class="button">Retour à l'accueil</a>
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

// Fonction pour vérifier si un fichier existe dans le dossier public
function checkPublicFile(filePath) {
  const publicPath = path.join(__dirname, 'public', filePath);
  try {
    return fs.existsSync(publicPath) ? publicPath : null;
  } catch (err) {
    console.error(`Erreur lors de la vérification du fichier ${publicPath}:`, err);
    return null;
  }
}

const server = http.createServer((req, res) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  
  // Analyser l'URL pour extraire le chemin sans les paramètres de requête
  const parsedUrl = url.parse(req.url, true);
  let pathname = parsedUrl.pathname;
  
  // Normaliser l'URL
  if (pathname === '/' || pathname === '') {
    // Servir la page d'accueil
    res.writeHead(200, { 'Content-Type': 'text/html' });
    
    // Vérifier si le fichier index.html existe
    const indexPath = path.join(__dirname, 'index.html');
    if (fs.existsSync(indexPath)) {
      // Lire le fichier index.html
      fs.readFile(indexPath, (err, content) => {
        if (err) {
          console.error(`Erreur lors de la lecture de index.html: ${err}`);
          res.end(fallbackHomePage);
          return;
        }
        res.end(content);
      });
    } else {
      // Utiliser la page d'accueil de secours
      console.log('index.html non trouvé, utilisation de la page de secours');
      res.end(fallbackHomePage);
    }
    return;
  }
  
  // Vérifier d'abord si le fichier existe dans le dossier public
  const publicFilePath = checkPublicFile(pathname.substring(1)); // Enlever le / initial
  
  if (publicFilePath) {
    // Le fichier existe dans le dossier public
    const extname = path.extname(publicFilePath);
    const contentType = MIME_TYPES[extname] || 'application/octet-stream';
    
    fs.readFile(publicFilePath, (err, content) => {
      if (err) {
        res.writeHead(500);
        res.end(`Erreur serveur: ${err.code}`);
        return;
      }
      
      // Succès
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    });
    return;
  }
  
  // Si le fichier n'est pas dans public, vérifier dans le dossier racine
  const filePath = path.join(__dirname, pathname);
  const extname = path.extname(filePath);
  
  // Déterminer le type de contenu
  const contentType = MIME_TYPES[extname] || 'application/octet-stream';
  
  // Vérifier si le fichier existe
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      console.log(`Fichier non trouvé: ${filePath}`);
      
      // Gérer les cas spéciaux
      if (pathname === '/src/main.jsx' || pathname === '/src/main-fixed.js') {
        // Servir le fichier main-fixed.js
        const mainFixedPath = path.join(__dirname, 'src/main-fixed.js');
        fs.access(mainFixedPath, fs.constants.F_OK, (err) => {
          if (err) {
            // Créer un fichier JavaScript simple
            const jsContent = `
              console.log('FloDrama - Version de secours chargée');
              document.addEventListener('DOMContentLoaded', function() {
                // Supprimer le préchargeur s'il existe
                const preloader = document.querySelector('.preloader');
                if (preloader) {
                  preloader.style.opacity = '0';
                  setTimeout(() => {
                    try {
                      preloader.remove();
                    } catch (e) {
                      console.warn('Erreur lors de la suppression du preloader:', e);
                    }
                  }, 500);
                }
              });
            `;
            res.writeHead(200, { 'Content-Type': 'application/javascript' });
            res.end(jsContent);
          } else {
            // Servir le fichier main-fixed.js existant
            fs.readFile(mainFixedPath, (err, content) => {
              if (err) {
                res.writeHead(500);
                res.end('Erreur serveur');
                return;
              }
              res.writeHead(200, { 'Content-Type': 'application/javascript' });
              res.end(content);
            });
          }
        });
        return;
      }
      
      // Servir la page 404
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end(notFoundPage);
      return;
    }
    
    // Lire le fichier
    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(500);
        res.end(`Erreur serveur: ${err.code}`);
        return;
      }
      
      // Succès
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    });
  });
});

server.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
  console.log(`Ouvrez http://localhost:${PORT} dans votre navigateur`);
});
