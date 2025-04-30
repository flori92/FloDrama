#!/bin/bash
# Script de déploiement simple pour FloDrama
# Ce script automatise le processus de déploiement de l'application

# Couleurs pour les messages
VERT='\033[0;32m'
ROUGE='\033[0;31m'
JAUNE='\033[0;33m'
NC='\033[0m' # Pas de couleur

# Fonction pour afficher les messages
afficher_message() {
  echo -e "${VERT}[FloDrama]${NC} $1"
}

afficher_erreur() {
  echo -e "${ROUGE}[ERREUR]${NC} $1"
}

afficher_avertissement() {
  echo -e "${JAUNE}[AVERTISSEMENT]${NC} $1"
}

# Vérifier si nous sommes dans le répertoire du projet
if [ ! -f "package.json" ]; then
  afficher_erreur "Ce script doit être exécuté depuis le répertoire racine du projet FloDrama"
  echo "Utilisez: cd /chemin/vers/FloDrama && ./scripts/deploiement-simple.sh"
  exit 1
fi

# Vérifier si Vercel CLI est installé
if ! command -v vercel &> /dev/null; then
  afficher_avertissement "Vercel CLI n'est pas installé. Installation en cours..."
  npm install -g vercel
  if [ $? -ne 0 ]; then
    afficher_erreur "Impossible d'installer Vercel CLI. Veuillez l'installer manuellement avec 'npm install -g vercel'"
    exit 1
  fi
fi

# Créer un timestamp pour la sauvegarde
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="./backups"
BACKUP_FILE="${BACKUP_DIR}/${TIMESTAMP}_backup_flodrama.zip"

# Créer le répertoire de sauvegarde s'il n'existe pas
mkdir -p "$BACKUP_DIR"

# Créer une sauvegarde du projet
afficher_message "Création d'une sauvegarde du projet..."
zip -r "$BACKUP_FILE" . -x "node_modules/*" "dist/*" ".git/*" "backups/*" &> /dev/null
if [ $? -eq 0 ]; then
  afficher_message "Sauvegarde créée avec succès: $BACKUP_FILE"
else
  afficher_erreur "Échec de la création de la sauvegarde"
  exit 1
fi

# Installer les dépendances
afficher_message "Installation des dépendances..."
npm install
if [ $? -ne 0 ]; then
  afficher_erreur "Échec de l'installation des dépendances"
  exit 1
fi

# Construire l'application
afficher_message "Construction de l'application..."
npm run build
if [ $? -ne 0 ]; then
  afficher_erreur "Échec de la construction de l'application"
  exit 1
fi

# Déployer sur Vercel
afficher_message "Déploiement sur Vercel..."
vercel --prod
if [ $? -ne 0 ]; then
  afficher_erreur "Échec du déploiement sur Vercel"
  exit 1
fi

# Commit et push des changements si Git est configuré
if [ -d ".git" ]; then
  afficher_message "Commit des changements..."
  git add .
  git commit -m "✨ [DEPLOY] Déploiement automatique du $(date +"%d/%m/%Y à %H:%M")"
  
  afficher_message "Push vers le dépôt distant..."
  git push origin main
  if [ $? -ne 0 ]; then
    afficher_avertissement "Impossible de pousser les changements vers le dépôt distant"
    afficher_message "Vous pouvez pousser manuellement avec 'git push origin main'"
  fi
else
  afficher_avertissement "Ce projet n'est pas un dépôt Git. Les changements n'ont pas été enregistrés."
fi

afficher_message "Déploiement terminé avec succès!"
afficher_message "L'application est maintenant disponible sur votre domaine Vercel"
