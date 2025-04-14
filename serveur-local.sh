#!/bin/bash

# Script de serveur local pour FloDrama
# Respecte l'identité visuelle avec le dégradé signature bleu-fuchsia (#3b82f6 → #d946ef)

echo -e "\033[38;2;59;130;246m╔════════════════════════════════════════════════════════════╗\033[0m"
echo -e "\033[38;2;59;130;246m║\033[38;2;217;70;239m            Serveur local pour FloDrama                    \033[38;2;59;130;246m║\033[0m"
echo -e "\033[38;2;59;130;246m╚════════════════════════════════════════════════════════════╝\033[0m"

# Fonction pour afficher les messages d'étape
function etape() {
  echo -e "\033[38;2;59;130;246m[$1/$2]\033[0m $3"
}

# Fonction pour afficher les succès
function succes() {
  echo -e "\033[38;2;217;70;239m✓\033[0m $1"
}

# Vérification de l'installation de serve
etape 1 3 "Vérification de l'installation de serve..."
if ! command -v serve &> /dev/null; then
  echo "Installation de serve..."
  npm install -g serve
  succes "serve installé avec succès"
else
  succes "serve déjà installé"
fi

# Compilation du projet
etape 2 3 "Compilation du projet..."
if [ ! -d "dist" ] || [ -z "$(ls -A dist 2>/dev/null)" ]; then
  echo "Compilation du projet avec npm run build..."
  npm run build
  succes "Projet compilé avec succès"
else
  succes "Projet déjà compilé (dossier dist existant)"
fi

# Démarrage du serveur local
etape 3 3 "Démarrage du serveur local..."
echo -e "\033[38;2;217;70;239m!\033[0m Le serveur va démarrer sur le port 3000"
echo -e "\033[38;2;217;70;239m!\033[0m Accédez à FloDrama à l'adresse : \033[38;2;217;70;239mhttp://localhost:3000\033[0m"
echo -e "\033[38;2;217;70;239m!\033[0m Appuyez sur Ctrl+C pour arrêter le serveur"
echo ""

# Démarrage du serveur avec désactivation de la redirection
HOSTNAME=localhost serve -s dist -l 3000
