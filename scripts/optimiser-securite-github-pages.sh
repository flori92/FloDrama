#!/bin/bash

# Script d'optimisation de la sécurité pour FloDrama sur GitHub Pages
# Ce script configure les en-têtes de sécurité et les fichiers nécessaires pour GitHub Pages

echo "🔒 Optimisation de la sécurité pour FloDrama sur GitHub Pages"
echo "==========================================================="

# Couleurs pour l'identité visuelle FloDrama
BLUE="#3b82f6"
FUCHSIA="#d946ef"

# Fonction pour afficher les messages avec le style FloDrama
function flodrama_echo() {
  echo -e "\033[38;2;59;130;246m▶\033[0m \033[38;2;217;70;239m$1\033[0m"
}

# Vérifier si le fichier CNAME existe
if [ ! -f "../public/CNAME" ]; then
  flodrama_echo "Création du fichier CNAME..."
  echo "flodrama.com" > ../public/CNAME
  echo "✅ Fichier CNAME créé avec succès."
else
  flodrama_echo "Le fichier CNAME existe déjà: $(cat ../public/CNAME)"
fi

# Optimiser le fichier _headers pour la sécurité
flodrama_echo "Optimisation du fichier _headers pour la sécurité..."
cat > ../public/_headers << EOL
# En-têtes de sécurité pour FloDrama
/*
  Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://www.googletagmanager.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https://*.cloudfront.net https://*.bunnycdn.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://*.flodrama.com https://api.flodrama.com; frame-ancestors 'none'; upgrade-insecure-requests;
  Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()

/assets/*
  Cache-Control: public, max-age=31536000, immutable

/*.css
  Content-Type: text/css
  Cache-Control: public, max-age=31536000, immutable

/*.js
  Content-Type: application/javascript
  Cache-Control: public, max-age=31536000, immutable

/api/*
  Access-Control-Allow-Origin: *
  Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE
  Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control
  Access-Control-Expose-Headers: Content-Length, Content-Range
EOL
echo "✅ Fichier _headers optimisé avec succès."

# Créer le fichier _redirects pour les redirections HTTPS
flodrama_echo "Création du fichier _redirects pour les redirections..."
cat > ../public/_redirects << EOL
# Redirections pour FloDrama
http://flodrama.com/* https://flodrama.com/:splat 301!
http://www.flodrama.com/* https://flodrama.com/:splat 301!
https://www.flodrama.com/* https://flodrama.com/:splat 301!
/* /index.html 200
EOL
echo "✅ Fichier _redirects créé avec succès."

# Créer un fichier robots.txt optimisé
flodrama_echo "Optimisation du fichier robots.txt..."
cat > ../public/robots.txt << EOL
# www.robotstxt.org/

User-agent: *
Allow: /

Sitemap: https://flodrama.com/sitemap.xml
EOL
echo "✅ Fichier robots.txt optimisé avec succès."

# Vérifier si le fichier sitemap.xml existe
if [ ! -f "../public/sitemap.xml" ]; then
  flodrama_echo "Création d'un sitemap.xml basique..."
  cat > ../public/sitemap.xml << EOL
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://flodrama.com/</loc>
    <lastmod>$(date +%Y-%m-%d)</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
EOL
  echo "✅ Fichier sitemap.xml créé avec succès."
else
  flodrama_echo "Le fichier sitemap.xml existe déjà."
fi

# Vérifier si le fichier .nojekyll existe
if [ ! -f "../public/.nojekyll" ]; then
  flodrama_echo "Création du fichier .nojekyll pour GitHub Pages..."
  touch ../public/.nojekyll
  echo "✅ Fichier .nojekyll créé avec succès."
else
  flodrama_echo "Le fichier .nojekyll existe déjà."
fi

# Commiter les changements
flodrama_echo "Vérification des modifications à commiter..."
cd ..
git add public/CNAME public/_headers public/_redirects public/robots.txt public/sitemap.xml public/.nojekyll
git status --porcelain | grep -q "public/"
if [ $? -eq 0 ]; then
  echo "Des modifications ont été détectées. Voulez-vous les commiter? (o/n)"
  read -p "> " commit_choice
  if [ "$commit_choice" = "o" ]; then
    git commit -m "🔒 [SECU] Optimisation des fichiers de configuration pour GitHub Pages"
    git push origin github-pages-clean
    echo "✅ Modifications commitées et poussées avec succès."
  fi
else
  echo "Aucune modification à commiter."
fi

# Afficher les instructions pour GitHub Pages
flodrama_echo "Instructions pour GitHub Pages:"
echo ""
echo "1. Allez sur GitHub dans les paramètres du dépôt:"
echo "   https://github.com/flori92/FloDrama/settings/pages"
echo ""
echo "2. Vérifiez que la branche 'github-pages-clean' est sélectionnée"
echo ""
echo "3. Vérifiez que le domaine personnalisé est configuré comme 'flodrama.com'"
echo ""
echo "4. Si l'option 'Enforce HTTPS' est grisée, attendez que GitHub vérifie le domaine"
echo "   (cela peut prendre jusqu'à 24 heures)"
echo ""
echo "5. Une fois la vérification terminée, cochez l'option 'Enforce HTTPS'"
echo ""
echo "🎉 Votre site FloDrama sera accessible via HTTPS à l'adresse https://flodrama.com !"
