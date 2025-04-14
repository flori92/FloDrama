#!/bin/bash

# Configuration
VENV_DIR="venv"
REQUIREMENTS_FILE="requirements.txt"

# Création du fichier requirements.txt
cat > $REQUIREMENTS_FILE << EOL
requests==2.31.0
EOL

# Vérification de Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 n'est pas installé. Veuillez l'installer avant de continuer."
    exit 1
fi

# Création et activation de l'environnement virtuel
echo "🔧 Configuration de l'environnement virtuel..."
python3 -m venv $VENV_DIR
source $VENV_DIR/bin/activate

# Installation des dépendances
echo "📦 Installation des dépendances..."
pip install -r $REQUIREMENTS_FILE

# Exécution du script de récupération
echo "🚀 Récupération des informations des repos Lynx..."
python3 scripts/fetch_lynx_repos.py

# Désactivation de l'environnement virtuel
deactivate

echo "✅ Terminé!"
