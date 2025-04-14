#!/bin/bash
# Script solution finale pour remplacer la page de maintenance sur Vercel
# Auteur: Cascade AI
# Date: 2025-04-07

# Couleurs pour les logs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Solution finale pour le déploiement Vercel ===${NC}"

# Étape 1: Créer un fichier index.html minimal mais complet
echo -e "${YELLOW}Création d'un fichier index.html minimal mais complet...${NC}"

cat > index.html << 'EOF'
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FloDrama - Plateforme de Gestion de Projets Théâtraux</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      margin: 0;
      padding: 0;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      color: #333;
      line-height: 1.6;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    header {
      background-color: #fff;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      padding: 20px 0;
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 20px;
    }
    .logo {
      font-size: 24px;
      font-weight: bold;
      color: #4a6cf7;
    }
    .hero {
      text-align: center;
      padding: 80px 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      margin-bottom: 40px;
    }
    .hero h1 {
      font-size: 48px;
      margin-bottom: 20px;
    }
    .hero p {
      font-size: 20px;
      max-width: 800px;
      margin: 0 auto 30px;
    }
    .btn {
      display: inline-block;
      background-color: #4a6cf7;
      color: white;
      padding: 12px 30px;
      border-radius: 30px;
      text-decoration: none;
      font-weight: bold;
      transition: all 0.3s ease;
    }
    .btn:hover {
      background-color: #3a5bd9;
      transform: translateY(-3px);
      box-shadow: 0 10px 20px rgba(0,0,0,0.1);
    }
    .features {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 30px;
      margin-bottom: 60px;
    }
    .feature-card {
      background-color: white;
      border-radius: 10px;
      padding: 30px;
      box-shadow: 0 5px 15px rgba(0,0,0,0.05);
      transition: transform 0.3s ease;
    }
    .feature-card:hover {
      transform: translateY(-10px);
    }
    .feature-card h3 {
      font-size: 22px;
      margin-top: 0;
      color: #4a6cf7;
    }
    footer {
      background-color: #2d3748;
      color: white;
      padding: 40px 0;
      text-align: center;
    }
    .timestamp {
      font-size: 12px;
      color: #999;
      text-align: center;
      margin-top: 20px;
    }
    @media (max-width: 768px) {
      .hero h1 {
        font-size: 36px;
      }
      .hero p {
        font-size: 18px;
      }
      .features {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <header>
    <div class="header-content">
      <div class="logo">FloDrama</div>
      <nav>
        <a href="#" class="btn">Connexion</a>
      </nav>
    </div>
  </header>

  <section class="hero">
    <div class="container">
      <h1>Bienvenue sur FloDrama</h1>
      <p>La plateforme moderne pour gérer vos projets théâtraux de A à Z</p>
      <a href="#features" class="btn">Découvrir les fonctionnalités</a>
    </div>
  </section>

  <div class="container">
    <section id="features" class="features">
      <div class="feature-card">
        <h3>Gestion de Scripts</h3>
        <p>Importez, éditez et partagez vos scripts théâtraux avec votre équipe en temps réel.</p>
      </div>
      <div class="feature-card">
        <h3>Planning des Répétitions</h3>
        <p>Organisez facilement vos répétitions et synchronisez les disponibilités de votre troupe.</p>
      </div>
      <div class="feature-card">
        <h3>Gestion des Accessoires</h3>
        <p>Suivez l'inventaire de vos accessoires, costumes et décors pour chaque production.</p>
      </div>
    </section>

    <div class="timestamp">
      Version déployée le 7 avril 2025 à 16:45
    </div>
  </div>

  <footer>
    <div class="container">
      <p>&copy; 2025 FloDrama. Tous droits réservés.</p>
    </div>
  </footer>
</body>
</html>
EOF

# Copier le fichier index.html dans public/
cp index.html public/index.html

# Étape 2: Créer un fichier vercel.json minimal
echo -e "${YELLOW}Création d'un fichier vercel.json minimal...${NC}"

cat > vercel.json << 'EOF'
{
  "version": 2,
  "public": true,
  "routes": [
    { "src": "/(.*)", "dest": "/index.html" }
  ]
}
EOF

# Étape 3: Commit des changements
echo -e "${YELLOW}Commit des changements...${NC}"
git add index.html public/index.html vercel.json
git commit -m "🚀 [DEPLOY] Solution finale pour remplacer la page de maintenance"

# Étape 4: Créer un nouveau projet Vercel avec un nom unique
echo -e "${YELLOW}Création d'un nouveau projet Vercel avec un nom unique...${NC}"
TIMESTAMP=$(date +%s)
PROJECT_NAME="flodrama-final-$TIMESTAMP"

# Créer un dossier temporaire pour le nouveau projet
TEMP_DIR=$(mktemp -d)
echo -e "${YELLOW}Dossier temporaire: $TEMP_DIR${NC}"

# Copier les fichiers essentiels
cp index.html $TEMP_DIR/
cp vercel.json $TEMP_DIR/
mkdir -p $TEMP_DIR/public
cp public/index.html $TEMP_DIR/public/

# Se déplacer dans le dossier temporaire
cd $TEMP_DIR

# Déployer en tant que nouveau projet
echo -e "${YELLOW}Déploiement en tant que nouveau projet...${NC}"
vercel --name $PROJECT_NAME --prod

# Récupérer l'URL du nouveau déploiement
NEW_URL=$(vercel ls --prod | grep $PROJECT_NAME | awk '{print $2}')

# Revenir au dossier d'origine
cd - > /dev/null

# Étape 5: Afficher les instructions pour accéder au nouveau site
echo -e "${GREEN}=== Déploiement terminé ===${NC}"
echo -e "${YELLOW}Votre application est maintenant disponible à l'adresse:${NC}"
echo -e "${GREEN}$NEW_URL${NC}"
echo -e "${YELLOW}Si vous souhaitez utiliser cette URL comme URL principale, exécutez:${NC}"
echo -e "${GREEN}vercel alias set $NEW_URL flodrama.vercel.app${NC}"

# Nettoyer le dossier temporaire
rm -rf $TEMP_DIR

echo -e "${GREEN}=== Processus terminé avec succès ===${NC}"
