#!/bin/bash

# Script de téléversement des images pour FloDrama
# Respecte l'identité visuelle avec le dégradé signature bleu-fuchsia (#3b82f6 → #d946ef)

echo -e "\033[38;2;59;130;246m╔════════════════════════════════════════════════════════════╗\033[0m"
echo -e "\033[38;2;59;130;246m║\033[38;2;217;70;239m        Téléversement des images pour FloDrama             \033[38;2;59;130;246m║\033[0m"
echo -e "\033[38;2;59;130;246m╚════════════════════════════════════════════════════════════╝\033[0m"

# Fonction pour afficher les messages d'étape
function etape() {
  echo -e "\033[38;2;59;130;246m[$1/$2]\033[0m $3"
}

# Fonction pour afficher les succès
function succes() {
  echo -e "\033[38;2;217;70;239m✓\033[0m $1"
}

# Fonction pour afficher les avertissements
function avertissement() {
  echo -e "\033[38;2;217;70;239m!\033[0m $1"
}

# Fonction pour afficher les erreurs
function erreur() {
  echo -e "\033[31m✗\033[0m $1"
}

# 1. Retour à la branche principale
etape 1 5 "Retour à la branche principale..."
git checkout github-pages-clean
succes "Retour à la branche principale effectué"

# 2. Création des répertoires nécessaires
etape 2 5 "Création des répertoires nécessaires..."
mkdir -p public/assets/images/hero
mkdir -p public/assets/images/posters
mkdir -p public/assets/images/cards
mkdir -p public/assets/images/thumbnails
mkdir -p public/assets/icons
succes "Répertoires créés avec succès"

# 3. Copie des images existantes
etape 3 5 "Copie des images existantes..."

# Logo et icônes
cp -f logo.svg public/
cp -f logo192.png public/
cp -f logo512.png public/

# Images du dossier public
if [ -d "public/assets/images" ]; then
  find public/assets/images -type f \( -name "*.jpg" -o -name "*.png" -o -name "*.webp" -o -name "*.svg" \) -exec cp -f {} public/assets/images/ \;
  succes "Images existantes copiées avec succès"
else
  avertissement "Aucune image existante trouvée dans public/assets/images"
fi

# Images du dossier src
if [ -d "src/assets" ]; then
  find src/assets -type f \( -name "*.jpg" -o -name "*.png" -o -name "*.webp" -o -name "*.svg" \) -exec cp -f {} public/assets/images/ \;
  succes "Images de src/assets copiées avec succès"
else
  avertissement "Aucune image existante trouvée dans src/assets"
fi

# 4. Ajout des images au dépôt Git
etape 4 5 "Ajout des images au dépôt Git..."
git add public/logo.svg public/logo192.png public/logo512.png
git add public/assets/images
git add public/assets/icons

# Vérification des fichiers ajoutés
added_files=$(git status --porcelain | grep -E "^A.*\.(jpg|png|webp|svg)$" | wc -l)
if [ "$added_files" -gt 0 ]; then
  succes "$added_files fichiers d'images ajoutés au dépôt Git"
else
  avertissement "Aucun nouveau fichier d'image ajouté au dépôt Git"
fi

# 5. Validation et envoi des modifications
etape 5 5 "Validation et envoi des modifications..."
git commit -m "✨ [ASSETS] Ajout des images du carrousel hero, des cartes et des affiches"
git push origin github-pages-clean

succes "Images téléversées avec succès"

echo -e "\033[38;2;59;130;246m╔════════════════════════════════════════════════════════════╗\033[0m"
echo -e "\033[38;2;59;130;246m║\033[38;2;217;70;239m                Téléversement terminé                       \033[38;2;59;130;246m║\033[0m"
echo -e "\033[38;2;59;130;246m╚════════════════════════════════════════════════════════════╝\033[0m"
echo -e "Les images du carrousel hero, des cartes et des affiches ont été téléversées avec succès."
echo -e "Elles seront disponibles sur GitHub Pages après le déploiement automatique."
