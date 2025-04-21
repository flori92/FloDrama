#!/bin/bash
# Script d'installation des dépendances nécessaires au scraping FloDrama (Backend AWS)
# Usage : ./install_scraping_deps.sh

set -e

# Installation des dépendances système (optionnel)
echo "[INFO] Mise à jour des paquets et installation des dépendances système..."
if command -v apt-get >/dev/null 2>&1; then
  sudo apt-get update
  sudo apt-get install -y python3-pip python3-venv
fi

# Création d'un environnement virtuel Python
if [ ! -d ".venv" ]; then
  python3 -m venv .venv
fi
source .venv/bin/activate

# Installation des dépendances Python
pip install --upgrade pip
pip install -r requirements.txt || {
  echo "[WARN] Fichier requirements.txt absent ou incomplet. Installation manuelle des paquets principaux..."
  pip install boto3 pymongo requests aiohttp opensearch-py
}

# Installation des dépendances Node.js (si besoin pour SmartScrapingService)
if [ -f package.json ]; then
  echo "[INFO] Installation des dépendances Node.js..."
  npm install
fi

echo "[SUCCESS] Toutes les dépendances nécessaires au scraping FloDrama sont installées."
