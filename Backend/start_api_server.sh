#!/bin/bash
# Script de lancement de l'API dynamique FloDrama (Flask)
# Usage : ./start_api_server.sh

cd "$(dirname "$0")"

# Création d'un venv si besoin
if [ ! -d ".venv" ]; then
  python3 -m venv .venv
fi
source .venv/bin/activate

pip install --upgrade pip
pip install flask

# Lancement du serveur API
export FLASK_APP=api_server.py
export FLASK_ENV=development
flask run --host=0.0.0.0 --port=5000
