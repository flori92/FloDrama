#!/bin/bash

# Script d'aide à la configuration de Cloudflare pour FloDrama
# Ce script guide l'utilisateur à travers les étapes de configuration

echo "🔒 Configuration de Cloudflare pour FloDrama"
echo "==========================================="

# Couleurs pour l'identité visuelle FloDrama
BLUE="#3b82f6"
FUCHSIA="#d946ef"

# Fonction pour afficher les messages avec le style FloDrama
function flodrama_echo() {
  echo -e "\033[38;2;59;130;246m▶\033[0m \033[38;2;217;70;239m$1\033[0m"
}

# Vérifier si le fichier CNAME existe
if [ ! -f "../public/CNAME" ]; then
  flodrama_echo "Le fichier CNAME n'existe pas dans le dossier public/"
  echo "Création du fichier CNAME..."
  echo "flodrama.com" > ../public/CNAME
  echo "✅ Fichier CNAME créé avec succès."
else
  flodrama_echo "Le fichier CNAME existe déjà dans le dossier public/"
  echo "Contenu actuel: $(cat ../public/CNAME)"
fi

# Vérifier si les modifications ont été commitées
flodrama_echo "Vérification des modifications non commitées..."
cd ..
git status --porcelain | grep -q "public/CNAME"
if [ $? -eq 0 ]; then
  echo "Le fichier CNAME n'a pas été commité."
  echo "Voulez-vous commiter ce fichier maintenant? (o/n)"
  read -p "> " commit_choice
  if [ "$commit_choice" = "o" ]; then
    git add public/CNAME
    git commit -m "🔒 [SECU] Ajout du fichier CNAME pour la configuration SSL"
    git push origin github-pages-clean
    echo "✅ Fichier CNAME commité et poussé avec succès."
  fi
fi

# Générer les en-têtes de sécurité pour Cloudflare
flodrama_echo "Génération du fichier _headers pour Cloudflare..."
cat > ../public/_headers << EOL
# En-têtes de sécurité pour FloDrama
/*
  Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
  X-Content-Type-Options: nosniff
  X-Frame-Options: SAMEORIGIN
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
  Content-Security-Policy: default-src 'self'; script-src 'self' https://cdn.jsdelivr.net https://www.google-analytics.com 'unsafe-inline'; style-src 'self' https://cdn.jsdelivr.net 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https://cdn.jsdelivr.net; connect-src 'self' https://api.flodrama.com https://www.google-analytics.com; media-src 'self' blob: https://cdn.flodrama.com; frame-ancestors 'self'; upgrade-insecure-requests;
  Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()
EOL

echo "✅ Fichier _headers généré avec succès."

# Vérifier si le fichier _redirects existe, sinon le créer
if [ ! -f "../public/_redirects" ]; then
  flodrama_echo "Création du fichier _redirects pour Cloudflare..."
  cat > ../public/_redirects << EOL
# Redirections pour FloDrama
http://flodrama.com/* https://flodrama.com/:splat 301!
http://www.flodrama.com/* https://flodrama.com/:splat 301!
https://www.flodrama.com/* https://flodrama.com/:splat 301!
EOL
  echo "✅ Fichier _redirects généré avec succès."
else
  flodrama_echo "Le fichier _redirects existe déjà."
fi

# Commiter les fichiers _headers et _redirects
git status --porcelain | grep -q "_headers\|_redirects"
if [ $? -eq 0 ]; then
  echo "Les fichiers _headers et/ou _redirects n'ont pas été commités."
  echo "Voulez-vous commiter ces fichiers maintenant? (o/n)"
  read -p "> " commit_choice
  if [ "$commit_choice" = "o" ]; then
    git add public/_headers public/_redirects
    git commit -m "🔒 [SECU] Ajout des fichiers _headers et _redirects pour Cloudflare"
    git push origin github-pages-clean
    echo "✅ Fichiers commités et poussés avec succès."
  fi
fi

# Afficher les instructions pour Cloudflare
flodrama_echo "Instructions pour configurer Cloudflare:"
echo ""
echo "1. Créez un compte sur cloudflare.com si ce n'est pas déjà fait"
echo "2. Ajoutez le domaine flodrama.com"
echo "3. Configurez les enregistrements DNS suivants:"
echo "   - CNAME | @ | flori92.github.io | Proxy activé"
echo "   - CNAME | www | flori92.github.io | Proxy activé"
echo "4. Mettez à jour les serveurs de noms chez votre registraire"
echo "5. Activez les paramètres de sécurité recommandés:"
echo "   - SSL/TLS: Full"
echo "   - Always Use HTTPS: Activé"
echo "   - HTTP/3: Activé"
echo "   - TLS 1.3: Activé"
echo "   - HSTS: Activé"
echo ""
echo "Une fois configuré, votre site sera accessible via HTTPS et obtiendra une excellente note sur les tests de sécurité."
echo ""
echo "Pour plus de détails, consultez le fichier cloudflare-setup.md"
