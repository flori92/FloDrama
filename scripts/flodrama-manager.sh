#!/bin/bash
# Script de gestion complet pour FloDrama
# Ce script permet de déployer, lancer et gérer l'application FloDrama

# Couleurs pour les messages
ROUGE='\033[0;31m'
VERT='\033[0;32m'
BLEU='\033[0;34m'
JAUNE='\033[0;33m'
NC='\033[0m' # No Color

# Fonction pour afficher des messages
log() {
  echo -e "${BLEU}[$(date +"%Y-%m-%d %H:%M:%S")]${NC} $1"
}

succes() {
  echo -e "${VERT}[SUCCÈS]${NC} $1"
}

erreur() {
  echo -e "${ROUGE}[ERREUR]${NC} $1"
}

attention() {
  echo -e "${JAUNE}[ATTENTION]${NC} $1"
}

# Obtenir le chemin absolu du répertoire du script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( dirname "$SCRIPT_DIR" )"

# Configuration
PORT=8765
DIST_DIR="${PROJECT_ROOT}/dist"
BACKUP_DIR="${PROJECT_ROOT}/backups"

# Fonction pour créer une sauvegarde
faire_sauvegarde() {
  log "Sauvegarde du code actuel..."
  TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
  BACKUP_FILE="${BACKUP_DIR}/flodrama_backup_${TIMESTAMP}.zip"

  mkdir -p "${BACKUP_DIR}"
  if zip -r "${BACKUP_FILE}" "${PROJECT_ROOT}" -x "*/node_modules/*" -x "*/dist/*" -x "*/backups/*" > /dev/null; then
    succes "Sauvegarde créée: ${BACKUP_FILE}"
    return 0
  else
    erreur "Échec de la création de la sauvegarde"
    return 1
  fi
}

# Fonction pour construire l'application
construire_app() {
  log "Construction de l'application..."
  cd "${PROJECT_ROOT}" && npm run build
  
  if [ $? -ne 0 ]; then
    erreur "Échec de la construction de l'application"
    return 1
  else
    succes "Application construite avec succès"
    return 0
  fi
}

# Fonction pour préparer les métadonnées
preparer_metadonnees() {
  # Vérifier si le dossier data existe dans dist
  if [ ! -d "${DIST_DIR}/data" ]; then
    log "Création du dossier data..."
    mkdir -p "${DIST_DIR}/data"
  fi

  # Vérifier si le dossier assets/data existe dans dist
  if [ ! -d "${DIST_DIR}/assets/data" ]; then
    log "Création du dossier assets/data..."
    mkdir -p "${DIST_DIR}/assets/data"
  fi

  # Copier le fichier metadata.json dans dist/data
  if [ -f "${PROJECT_ROOT}/public/assets/data/metadata.json" ]; then
    log "Copie du fichier metadata.json dans les dossiers nécessaires..."
    cp "${PROJECT_ROOT}/public/assets/data/metadata.json" "${DIST_DIR}/data/"
    cp "${PROJECT_ROOT}/public/assets/data/metadata.json" "${DIST_DIR}/assets/data/"
    succes "Fichier metadata.json copié avec succès"
    return 0
  else
    erreur "Fichier metadata.json introuvable dans public/assets/data/"
    return 1
  fi
}

# Fonction pour lancer le serveur local
lancer_serveur() {
  # Vérifier si le port est déjà utilisé
  if nc -z localhost $PORT 2>/dev/null; then
    attention "Le port $PORT est déjà utilisé. Tentative avec un autre port..."
    # Essayer avec un port aléatoire entre 8000 et 9000
    PORT=$(( ( RANDOM % 1000 ) + 8000 ))
    log "Nouveau port sélectionné: $PORT"
  fi

  log "Lancement du serveur sur le port $PORT..."
  log "L'application sera accessible à l'adresse: http://localhost:$PORT"
  log "Pour arrêter le serveur, appuyez sur Ctrl+C"
  echo ""

  # Changer de répertoire et lancer le serveur
  cd "${DIST_DIR}" && python3 -m http.server $PORT
}

# Fonction pour déployer sur AWS S3
deployer_aws() {
  log "Déploiement sur AWS S3..."
  
  # Vérifier si le script de déploiement AWS existe
  if [ -f "${SCRIPT_DIR}/deploy-aws-simplified.sh" ]; then
    bash "${SCRIPT_DIR}/deploy-aws-simplified.sh"
    
    if [ $? -ne 0 ]; then
      erreur "Échec du déploiement sur AWS S3"
      return 1
    else
      succes "Déploiement sur AWS S3 réussi"
      return 0
    fi
  else
    erreur "Script de déploiement AWS introuvable"
    return 1
  fi
}

# Fonction pour déployer sur flodrama.com
deployer_flodrama_com() {
  log "Déploiement sur flodrama.com..."
  
  # Vérifier si le script de déploiement flodrama.com existe
  if [ -f "${SCRIPT_DIR}/deploy-flodrama-com.sh" ]; then
    bash "${SCRIPT_DIR}/deploy-flodrama-com.sh"
    
    if [ $? -ne 0 ]; then
      erreur "Échec du déploiement sur flodrama.com"
      return 1
    else
      succes "Déploiement sur flodrama.com réussi"
      return 0
    fi
  else
    erreur "Script de déploiement flodrama.com introuvable"
    return 1
  fi
}

# Fonction pour synchroniser les assets avec AWS S3
synchroniser_assets() {
  log "Synchronisation des assets avec AWS S3..."
  
  # Vérifier si le script de synchronisation AWS existe
  if [ -f "${SCRIPT_DIR}/sync-assets-aws-simplified.sh" ]; then
    bash "${SCRIPT_DIR}/sync-assets-aws-simplified.sh"
    
    if [ $? -ne 0 ]; then
      erreur "Échec de la synchronisation des assets"
      return 1
    else
      succes "Synchronisation des assets réussie"
      return 0
    fi
  else
    erreur "Script de synchronisation AWS introuvable"
    return 1
  fi
}

# Fonction pour nettoyer les buckets AWS
nettoyer_buckets() {
  log "Nettoyage des buckets AWS S3..."
  
  # Vérifier si le script de nettoyage AWS existe
  if [ -f "${SCRIPT_DIR}/cleanup-s3-buckets.sh" ]; then
    bash "${SCRIPT_DIR}/cleanup-s3-buckets.sh"
    
    if [ $? -ne 0 ]; then
      erreur "Échec du nettoyage des buckets"
      return 1
    else
      succes "Nettoyage des buckets réussi"
      return 0
    fi
  else
    erreur "Script de nettoyage AWS introuvable"
    return 1
  fi
}

# Fonction d'aide
afficher_aide() {
  echo "FloDrama Manager - Outil de gestion pour FloDrama"
  echo ""
  echo "Usage: $0 [option]"
  echo ""
  echo "Options:"
  echo "  local       Construit et lance l'application en local"
  echo "  build       Construit uniquement l'application"
  echo "  deploy      Déploie l'application sur AWS S3"
  echo "  flodrama    Déploie l'application sur flodrama.com"
  echo "  sync        Synchronise les assets avec AWS S3"
  echo "  clean       Nettoie les buckets AWS S3 inutilisés"
  echo "  backup      Crée une sauvegarde du code actuel"
  echo "  help        Affiche cette aide"
  echo ""
  echo "Exemples:"
  echo "  $0 local    # Lance l'application en local"
  echo "  $0 deploy   # Déploie l'application sur AWS S3"
  echo "  $0 flodrama # Déploie l'application sur flodrama.com"
}

# Vérifier les arguments
if [ $# -eq 0 ]; then
  afficher_aide
  exit 1
fi

# Traiter les arguments
case "$1" in
  local)
    faire_sauvegarde
    construire_app && preparer_metadonnees && lancer_serveur
    ;;
  build)
    faire_sauvegarde
    construire_app
    ;;
  deploy)
    faire_sauvegarde
    construire_app && deployer_aws
    ;;
  flodrama)
    faire_sauvegarde
    construire_app && deployer_flodrama_com
    ;;
  sync)
    synchroniser_assets
    ;;
  clean)
    nettoyer_buckets
    ;;
  backup)
    faire_sauvegarde
    ;;
  help)
    afficher_aide
    ;;
  *)
    erreur "Option invalide: $1"
    afficher_aide
    exit 1
    ;;
esac

# Ce code ne sera exécuté que si le serveur est arrêté ou si une autre commande est terminée
echo ""
log "Opération terminée"
