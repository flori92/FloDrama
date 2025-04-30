#!/bin/bash
# Script de démarrage pour FloDrama
# Ce script lance tous les services nécessaires pour le développement

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Ports pour les services
BACKEND_PORT=3001
FRONTEND_PORT=3002

# Fonction pour afficher un message avec une couleur
print_message() {
  echo -e "${2}${1}${NC}"
}

# Fonction pour afficher une bannière
print_banner() {
  echo -e "${BLUE}"
  echo "╔════════════════════════════════════════════════╗"
  echo "║                                                ║"
  echo "║   FloDrama - Plateforme de Streaming           ║"
  echo "║                                                ║"
  echo "╚════════════════════════════════════════════════╝"
  echo -e "${NC}"
}

# Fonction pour vérifier si un processus est en cours d'exécution
is_process_running() {
  pgrep -f "$1" > /dev/null
  return $?
}

# Fonction pour vérifier si un port est en écoute
is_port_listening() {
  nc -z localhost $1 >/dev/null 2>&1
  return $?
}

# Fonction pour tuer les processus sur un port spécifique
kill_process_on_port() {
  lsof -ti tcp:$1 | xargs kill -9 2>/dev/null
}

# Définir le répertoire de base
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="${BASE_DIR}/Frontend"
BACKEND_DIR="${BASE_DIR}/Backend"
BACKEND_API_DIR="${BACKEND_DIR}/api"

# Afficher la bannière
print_banner

# Vérifier si Node.js est installé
if ! command -v node &> /dev/null; then
  print_message "❌ Node.js n'est pas installé. Veuillez l'installer pour continuer." "$RED"
  exit 1
fi

# Vérifier si Python est installé
if ! command -v python3 &> /dev/null; then
  print_message "❌ Python 3 n'est pas installé. Veuillez l'installer pour continuer." "$RED"
  exit 1
fi

# Vérifier si les répertoires existent
if [ ! -d "$FRONTEND_DIR" ]; then
  print_message "❌ Le répertoire Frontend n'existe pas." "$RED"
  exit 1
fi

if [ ! -d "$BACKEND_DIR" ]; then
  print_message "❌ Le répertoire Backend n'existe pas." "$RED"
  exit 1
fi

# Vérifier si le fichier .env existe dans le backend
if [ ! -f "${BACKEND_API_DIR}/.env" ]; then
  print_message "⚠️ Le fichier .env n'existe pas dans le backend, création à partir du modèle..." "$YELLOW"
  if [ -f "${BACKEND_API_DIR}/.env.example" ]; then
    cp "${BACKEND_API_DIR}/.env.example" "${BACKEND_API_DIR}/.env"
    print_message "✅ Fichier .env créé avec succès!" "$GREEN"
  else
    print_message "❌ Le fichier .env.example n'existe pas dans le backend." "$RED"
    exit 1
  fi
fi

# Vérifier si les ports sont déjà utilisés
if is_port_listening $BACKEND_PORT; then
  print_message "⚠️ Le port $BACKEND_PORT est déjà utilisé. Tentative de libération..." "$YELLOW"
  kill_process_on_port $BACKEND_PORT
  sleep 2
fi

if is_port_listening $FRONTEND_PORT; then
  print_message "⚠️ Le port $FRONTEND_PORT est déjà utilisé. Tentative de libération..." "$YELLOW"
  kill_process_on_port $FRONTEND_PORT
  sleep 2
fi

# Préparer les données
print_message "🔄 Préparation des données..." "$YELLOW"
cd "$FRONTEND_DIR" && npm run prepare-data
if [ $? -ne 0 ]; then
  print_message "⚠️ Erreur lors de la préparation des données, mais on continue..." "$YELLOW"
fi

# Optimiser les images
print_message "🔄 Optimisation des images..." "$YELLOW"
cd "$FRONTEND_DIR" && npm run optimize-images
if [ $? -ne 0 ]; then
  print_message "⚠️ Erreur lors de l'optimisation des images, mais on continue..." "$YELLOW"
fi

# Exporter les données du backend vers le frontend
print_message "🔄 Exportation des données du backend vers le frontend..." "$YELLOW"
cd "$BASE_DIR" && python3 scripts/export_content_for_frontend.py
if [ $? -ne 0 ]; then
  print_message "⚠️ Erreur lors de l'exportation des données, mais on continue..." "$YELLOW"
fi

# Installer les dépendances manquantes dans le backend
print_message "🔄 Installation des dépendances du backend..." "$YELLOW"
cd "$BACKEND_API_DIR" && npm install
if [ $? -ne 0 ]; then
  print_message "⚠️ Erreur lors de l'installation des dépendances du backend, mais on continue..." "$YELLOW"
fi

# Démarrer le backend API
print_message "🚀 Démarrage du backend API sur le port $BACKEND_PORT..." "$GREEN"
cd "$BACKEND_API_DIR" && PORT=$BACKEND_PORT node contentDistributionAPI.js &
BACKEND_PID=$!

# Attendre que le backend soit prêt
print_message "⏳ Attente du démarrage du backend API..." "$YELLOW"
sleep 5

# Vérifier si le backend est en cours d'exécution
if is_port_listening $BACKEND_PORT; then
  print_message "✅ Backend API démarré avec succès!" "$GREEN"
  print_message "🔌 Backend API disponible à l'adresse: http://localhost:$BACKEND_PORT/api" "$GREEN"
else
  print_message "⚠️ Le backend API ne semble pas répondre sur le port $BACKEND_PORT, mais on continue..." "$YELLOW"
fi

# Démarrer le frontend
print_message "🚀 Démarrage du frontend sur le port $FRONTEND_PORT..." "$GREEN"
cd "$FRONTEND_DIR" && VITE_PORT=$FRONTEND_PORT npm run dev &
FRONTEND_PID=$!

# Attendre que le frontend soit prêt
print_message "⏳ Attente du démarrage du frontend..." "$YELLOW"
sleep 5

# Vérifier si le frontend est en cours d'exécution
if is_port_listening $FRONTEND_PORT; then
  print_message "✅ Frontend démarré avec succès!" "$GREEN"
  print_message "📱 Frontend disponible à l'adresse: http://localhost:$FRONTEND_PORT" "$GREEN"
else
  print_message "❌ Erreur lors du démarrage du frontend." "$RED"
fi

# Informations finales
print_message "\n📋 Informations:" "$BLUE"
print_message "- Pour arrêter tous les services, appuyez sur Ctrl+C" "$BLUE"
print_message "- Les données sont générées automatiquement" "$BLUE"
print_message "- Les images sont optimisées automatiquement" "$BLUE"
print_message "- Le backend API est configuré pour fonctionner avec le frontend" "$BLUE"
print_message "- En cas d'erreur de connexion au backend, le frontend utilisera des données mockées" "$BLUE"
print_message "- Backend API: http://localhost:$BACKEND_PORT/api" "$BLUE"
print_message "- Frontend: http://localhost:$FRONTEND_PORT" "$BLUE"

# Attendre que l'utilisateur appuie sur Ctrl+C
trap "kill $FRONTEND_PID $BACKEND_PID 2>/dev/null" EXIT
wait
