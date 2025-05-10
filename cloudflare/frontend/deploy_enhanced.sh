#!/bin/bash

echo "🚀 Démarrage du déploiement amélioré de FloDrama Frontend sur Cloudflare Pages"
echo "=============================================================================="

# Vérification des dépendances
echo "📦 Vérification des dépendances Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé. Veuillez l'installer avant de continuer."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm n'est pas installé. Veuillez l'installer avant de continuer."
    exit 1
fi

# Vérification des fichiers essentiels
echo "🔍 Vérification des fichiers essentiels..."
if [ ! -f "vite.config.js" ]; then
    echo "❌ Le fichier vite.config.js est manquant."
    exit 1
fi

if [ ! -f "package.json" ]; then
    echo "❌ Le fichier package.json est manquant."
    exit 1
fi

if [ ! -d "src" ]; then
    echo "❌ Le dossier src est manquant."
    exit 1
fi

# Vérification des fichiers de secours et placeholders
echo "🔎 Vérification des fichiers de secours et placeholders..."

# Vérifier les placeholders
if [ ! -d "public/assets" ]; then
    echo "🚨 Le dossier public/assets est manquant. Création..."
    mkdir -p public/assets
fi

# Vérifier les fichiers SVG de placeholder
placeholder_files=("placeholder-poster.svg" "placeholder-backdrop.svg" "placeholder-thumbnail.svg" "placeholder-image.svg")
for file in "${placeholder_files[@]}"; do
    if [ ! -f "public/assets/$file" ]; then
        echo "🚨 Le fichier $file est manquant."
        echo "Assurez-vous que tous les placeholders sont présents dans public/assets/"
        exit 1
    fi
done

# Vérifier les fichiers JSON de données de secours
data_files=("drama.json" "anime.json" "films.json" "bollywood.json")
for file in "${data_files[@]}"; do
    if [ ! -f "src/data/$file" ]; then
        echo "🚨 Le fichier de données $file est manquant dans src/data/"
        exit 1
    fi
done

# Installation des dépendances
echo "📦 Installation des dépendances..."
npm install

# Construction du projet avec logs détaillés
echo "🏗️ Construction du projet..."
NODE_ENV=production npm run build | tee build.log

# Vérification du build
echo "🔍 Vérification du résultat du build..."
if [ ! -d "dist" ]; then
    echo "❌ Le dossier dist n'a pas été créé. Le build a échoué."
    echo "Consultez le fichier build.log pour plus de détails."
    exit 1
fi

if [ ! -f "dist/index.html" ]; then
    echo "❌ Le fichier dist/index.html est manquant. Le build est incomplet."
    echo "Consultez le fichier build.log pour plus de détails."
    exit 1
fi

# Copie des fichiers JSON de secours dans le dossier de build
echo "💾 Copie des fichiers JSON de secours dans le build..."
mkdir -p dist/src/data
cp src/data/*.json dist/src/data/

# Vérification que les placeholders sont dans le build
echo "📷 Vérification des images placeholder dans le build..."
if [ ! -d "dist/assets" ]; then
    echo "🔄 Création du dossier assets dans le build..."
    mkdir -p dist/assets
fi

# Copie des placeholders s'ils ne sont pas dans le build
for file in "${placeholder_files[@]}"; do
    if [ ! -f "dist/assets/$file" ]; then
        echo "💾 Copie de $file vers le dossier de build..."
        cp "public/assets/$file" "dist/assets/"
    fi
done

# Liste des fichiers générés
echo "📄 Contenu du dossier dist :"
find dist -type f | sort

# Calcul de la taille totale
total_size=$(du -sh dist | cut -f1)
echo "💾 Taille totale du build : $total_size"

# Suppression de toute configuration existante
echo "🧹 Suppression des configurations Wrangler existantes..."
rm -rf ~/.wrangler/config

# Déploiement avec Wrangler en mode OAuth
echo "🚀 Déploiement sur Cloudflare Pages..."
NODE_ENV=production CLOUDFLARE_API_TOKEN="" npx wrangler pages deploy dist --project-name flodrama-frontend --commit-dirty=true --branch=main

echo "✅ Processus de déploiement terminé."
echo "📝 Consultez les logs ci-dessus pour vérifier le statut du déploiement."
echo "🌐 URL du site déployé : https://flodrama.com (si le domaine est configuré)"
echo "   ou https://flodrama-frontend.pages.dev"
