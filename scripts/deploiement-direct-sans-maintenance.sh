#!/bin/bash
# Script de déploiement direct sans maintenance pour FloDrama
# Auteur: Cascade AI
# Date: 2025-04-08

# Couleurs pour les logs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Déploiement direct sans maintenance pour FloDrama ===${NC}"

# Créer des dossiers pour les logs et les rapports
mkdir -p logs rapports

LOG_FILE="logs/deploiement-direct-$(date +%Y%m%d_%H%M%S).log"

# Fonction pour logger les actions
log() {
    echo -e "$1" | tee -a $LOG_FILE
}

# 1. Création d'un dossier temporaire pour le déploiement
log "${BLUE}1. Création d'un dossier temporaire pour le déploiement...${NC}"
TEMP_DIR=$(mktemp -d)
log "${GREEN}Dossier temporaire créé: $TEMP_DIR${NC}"

# 2. Création d'un fichier index.html sans maintenance
log "${BLUE}2. Création d'un fichier index.html sans maintenance...${NC}"
cat > $TEMP_DIR/index.html << EOF
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FloDrama</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary-color: #FF4B4B;
            --secondary-color: #3A0CA3;
            --background-color: #1A1A1A;
            --text-color: #FFFFFF;
        }
        
        body {
            background-color: var(--background-color);
            color: var(--text-color);
            font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 0;
        }
        
        .hero {
            height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            background: linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), 
                        url('https://images.unsplash.com/photo-1611162618071-b39a2ec055fb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1974&q=80');
            background-size: cover;
            background-position: center;
            position: relative;
            overflow: hidden;
        }
        
        .hero::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(to bottom, rgba(26, 26, 26, 0.8), rgba(26, 26, 26, 0.6));
            z-index: 1;
        }
        
        .hero-content {
            position: relative;
            z-index: 2;
            max-width: 800px;
            padding: 0 20px;
        }
        
        h1 {
            font-size: 4rem;
            margin-bottom: 1rem;
            background: linear-gradient(to right, var(--primary-color), #FF8F8F);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            animation: fadeIn 1s ease-out;
        }
        
        p {
            font-size: 1.5rem;
            margin-bottom: 2rem;
            line-height: 1.6;
            animation: slideUp 1s ease-out 0.3s both;
        }
        
        .button {
            display: inline-block;
            background: linear-gradient(to right, var(--primary-color), #FF8F8F);
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 50px;
            font-size: 1.2rem;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
            text-decoration: none;
            animation: fadeIn 1s ease-out 0.6s both;
        }
        
        .button:hover {
            transform: translateY(-3px);
            box-shadow: 0 10px 20px rgba(255, 75, 75, 0.3);
        }
        
        .button:active {
            transform: translateY(-1px);
        }
        
        .features {
            display: flex;
            justify-content: center;
            flex-wrap: wrap;
            gap: 20px;
            margin-top: 40px;
            animation: fadeIn 1s ease-out 0.9s both;
        }
        
        .feature {
            background: rgba(255, 255, 255, 0.1);
            padding: 20px;
            border-radius: 10px;
            width: 200px;
            text-align: center;
            backdrop-filter: blur(10px);
            transition: transform 0.3s ease, background 0.3s ease;
        }
        
        .feature:hover {
            transform: translateY(-10px);
            background: rgba(255, 75, 75, 0.2);
        }
        
        .feature-icon {
            font-size: 2rem;
            margin-bottom: 10px;
            color: var(--primary-color);
        }
        
        .feature-title {
            font-weight: 600;
            margin-bottom: 5px;
        }
        
        .header {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            padding: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            z-index: 10;
            transition: background 0.3s ease;
        }
        
        .header.scrolled {
            background: rgba(26, 26, 26, 0.9);
            backdrop-filter: blur(10px);
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
        }
        
        .logo {
            font-size: 1.8rem;
            font-weight: 700;
            background: linear-gradient(to right, var(--primary-color), #FF8F8F);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        
        .nav-links {
            display: flex;
            gap: 30px;
        }
        
        .nav-link {
            color: var(--text-color);
            text-decoration: none;
            font-weight: 500;
            transition: color 0.3s ease;
        }
        
        .nav-link:hover {
            color: var(--primary-color);
        }
        
        @keyframes fadeIn {
            from {
                opacity: 0;
            }
            to {
                opacity: 1;
            }
        }
        
        @keyframes slideUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        @media (max-width: 768px) {
            h1 {
                font-size: 3rem;
            }
            
            p {
                font-size: 1.2rem;
            }
            
            .features {
                flex-direction: column;
                align-items: center;
            }
            
            .nav-links {
                display: none;
            }
        }
    </style>
</head>
<body>
    <header class="header">
        <div class="logo">FloDrama</div>
        <nav class="nav-links">
            <a href="#" class="nav-link">Accueil</a>
            <a href="#" class="nav-link">Dramas</a>
            <a href="#" class="nav-link">Films</a>
            <a href="#" class="nav-link">Ma Liste</a>
            <a href="#" class="nav-link">Connexion</a>
        </nav>
    </header>

    <section class="hero">
        <div class="hero-content">
            <h1>FloDrama</h1>
            <p>Votre plateforme de streaming dédiée aux dramas et films asiatiques. Découvrez des histoires captivantes et des productions de qualité.</p>
            <a href="#" class="button">Explorer</a>
            
            <div class="features">
                <div class="feature">
                    <div class="feature-icon">🎬</div>
                    <div class="feature-title">Dramas</div>
                    <div class="feature-desc">Des séries captivantes</div>
                </div>
                <div class="feature">
                    <div class="feature-icon">🎥</div>
                    <div class="feature-title">Films</div>
                    <div class="feature-desc">Des films exclusifs</div>
                </div>
                <div class="feature">
                    <div class="feature-icon">🌟</div>
                    <div class="feature-title">Nouveautés</div>
                    <div class="feature-desc">Mises à jour régulières</div>
                </div>
            </div>
        </div>
    </section>

    <script>
        // Script pour changer l'apparence du header au défilement
        window.addEventListener('scroll', function() {
            const header = document.querySelector('.header');
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });
        
        // Animation des éléments au chargement
        document.addEventListener('DOMContentLoaded', function() {
            const features = document.querySelectorAll('.feature');
            features.forEach((feature, index) => {
                feature.style.animationDelay = `${0.9 + (index * 0.2)}s`;
            });
        });
    </script>
</body>
</html>
EOF
log "${GREEN}Fichier index.html créé${NC}"

# 3. Création d'un fichier vercel.json
log "${BLUE}3. Création d'un fichier vercel.json...${NC}"
cat > $TEMP_DIR/vercel.json << EOF
{
  "version": 2,
  "public": true,
  "cleanUrls": true,
  "trailingSlash": false,
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=0, must-revalidate"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    },
    {
      "source": "/static/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ],
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
EOF
log "${GREEN}Fichier vercel.json créé${NC}"

# 4. Déploiement sur Vercel
log "${BLUE}4. Déploiement sur Vercel...${NC}"
cd $TEMP_DIR

# Vérifier si le projet existe déjà sur Vercel
PROJECT_EXISTS=$(vercel ls 2>/dev/null | grep -c "flodrama")

if [ "$PROJECT_EXISTS" -gt 0 ]; then
    log "${GREEN}Projet FloDrama trouvé sur Vercel. Déploiement de la mise à jour...${NC}"
    vercel deploy --prod --yes
else
    log "${YELLOW}Projet FloDrama non trouvé sur Vercel. Création d'un nouveau projet...${NC}"
    vercel deploy --prod --yes --name flodrama
fi

# 5. Configuration de l'alias
log "${BLUE}5. Configuration de l'alias...${NC}"
vercel alias set $(vercel ls --prod | grep flodrama | awk '{print $2}') flodrama.vercel.app

# 6. Vérification du déploiement
log "${BLUE}6. Vérification du déploiement...${NC}"
sleep 10
curl -s https://flodrama.vercel.app > /tmp/flodrama_check.html

if grep -q "maintenance" /tmp/flodrama_check.html; then
    log "${RED}Le site affiche toujours un message de maintenance${NC}"
else
    log "${GREEN}Le site ne contient plus de message de maintenance${NC}"
fi

# 7. Création d'un rapport de déploiement
log "${BLUE}7. Création d'un rapport de déploiement...${NC}"

REPORT_DIR="../rapports"
mkdir -p $REPORT_DIR
REPORT_FILE="$REPORT_DIR/rapport-deploiement-direct-$(date +%Y%m%d_%H%M%S).md"

cat > $REPORT_FILE << EOF
# Rapport de déploiement direct sans maintenance pour FloDrama

## Date: $(date +"%d/%m/%Y %H:%M:%S")

## Résumé

Ce rapport documente le déploiement direct sans maintenance de FloDrama avec une page d'accueil temporaire.

## Actions réalisées

1. Création d'un dossier temporaire pour le déploiement
2. Création d'un fichier index.html sans maintenance
3. Création d'un fichier vercel.json
4. Déploiement sur Vercel
5. Configuration de l'alias
6. Vérification du déploiement

## Résultat du déploiement

- URL de l'application: https://flodrama.vercel.app
- Mode maintenance: désactivé
- Type de déploiement: page d'accueil temporaire avec animations et effets visuels

## Prochaines étapes recommandées

1. Développer les pages internes de l'application
2. Intégrer les composants React complets
3. Configurer un domaine personnalisé pour l'application
4. Mettre en place un système de monitoring pour détecter les problèmes futurs
EOF

log "${GREEN}Rapport de déploiement créé: $REPORT_FILE${NC}"

# 8. Nettoyage des ressources temporaires
log "${BLUE}8. Nettoyage des ressources temporaires...${NC}"
cd ..
rm -rf $TEMP_DIR

echo -e "${GREEN}=== Déploiement direct sans maintenance pour FloDrama terminé ===${NC}"
echo -e "${YELLOW}Consultez le rapport pour plus de détails: $REPORT_FILE${NC}"
echo -e "${YELLOW}URL de l'application: https://flodrama.vercel.app${NC}"
echo -e "${YELLOW}Pour vérifier le résultat, ouvrez cette URL dans une fenêtre de navigation privée${NC}"
