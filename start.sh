#!/bin/bash
# Script de démarrage pour FloDrama
# Ce script lance tous les services nécessaires pour le développement

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

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
if [ ! -d "Frontend" ]; then
  print_message "❌ Le répertoire Frontend n'existe pas." "$RED"
  exit 1
fi

if [ ! -d "Backend" ]; then
  print_message "❌ Le répertoire Backend n'existe pas." "$RED"
  exit 1
fi

# Préparer les données
print_message "🔄 Préparation des données..." "$YELLOW"
cd Frontend && npm run prepare-data
if [ $? -ne 0 ]; then
  print_message "⚠️ Erreur lors de la préparation des données, mais on continue..." "$YELLOW"
fi

# Optimiser les images
print_message "🔄 Optimisation des images..." "$YELLOW"
cd Frontend && npm run optimize-images
if [ $? -ne 0 ]; then
  print_message "⚠️ Erreur lors de l'optimisation des images, mais on continue..." "$YELLOW"
fi

# Exporter les données du backend vers le frontend
print_message "🔄 Exportation des données du backend vers le frontend..." "$YELLOW"
cd .. && python3 scripts/export_content_for_frontend.py
if [ $? -ne 0 ]; then
  print_message "⚠️ Erreur lors de l'exportation des données, mais on continue..." "$YELLOW"
fi

# Démarrer le frontend
print_message "🚀 Démarrage du frontend avec Webpack..." "$GREEN"
cd Frontend && npm run dev &
FRONTEND_PID=$!

# Attendre que le frontend soit prêt
print_message "⏳ Attente du démarrage du frontend..." "$YELLOW"
sleep 5

# Vérifier si le frontend est en cours d'exécution
if is_process_running "next dev"; then
  print_message "✅ Frontend démarré avec succès!" "$GREEN"
  print_message "📱 Frontend disponible à l'adresse: http://localhost:3000" "$GREEN"
else
  print_message "❌ Erreur lors du démarrage du frontend." "$RED"
fi

# Informations finales
print_message "\n📋 Informations:" "$BLUE"
print_message "- Pour arrêter tous les services, appuyez sur Ctrl+C" "$BLUE"
print_message "- Les données sont générées automatiquement" "$BLUE"
print_message "- Les images sont optimisées automatiquement" "$BLUE"
print_message "- L'application utilise Webpack au lieu de Turbopack pour éviter les erreurs" "$BLUE"

# Attendre que l'utilisateur appuie sur Ctrl+C
trap "kill $FRONTEND_PID 2>/dev/null" EXIT
wait
