#!/bin/bash
# Script de nettoyage de l'ancienne architecture FloDrama
# Créé le 29-03-2025

# Couleurs pour les messages
ROUGE='\033[0;31m'
VERT='\033[0;32m'
JAUNE='\033[0;33m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages
log() {
  echo -e "${VERT}[$(date +"%Y-%m-%d %H:%M:%S")] $1${NC}"
}

erreur() {
  echo -e "${ROUGE}[$(date +"%Y-%m-%d %H:%M:%S")] ERREUR: $1${NC}"
}

attention() {
  echo -e "${JAUNE}[$(date +"%Y-%m-%d %H:%M:%S")] ATTENTION: $1${NC}"
}

# Vérifier si le script est exécuté avec les droits d'administrateur
if [ "$EUID" -ne 0 ]; then
  attention "Ce script doit être exécuté avec les droits d'administrateur pour certaines opérations."
  attention "Certaines opérations pourraient échouer."
fi

# Définir les chemins
ANCIEN_PROJET_DIR="/Users/floriace/FLO_DRAMA/FloDrama"
NOUVEAU_PROJET_DIR="/Users/floriace/FLO_DRAMA/FloDrama-Monorepo"
BACKUP_DIR="/Users/floriace/FLO_DRAMA/FloDrama-Backup-$(date +"%Y%m%d_%H%M%S")"

# Vérifier que le nouveau projet existe
if [ ! -d "$NOUVEAU_PROJET_DIR" ]; then
  erreur "Le nouveau projet n'existe pas à l'emplacement $NOUVEAU_PROJET_DIR"
  erreur "Assurez-vous que la migration a été effectuée avec succès avant d'exécuter ce script."
  exit 1
fi

# Créer un répertoire de sauvegarde
log "Création du répertoire de sauvegarde: $BACKUP_DIR"
mkdir -p "$BACKUP_DIR"

# Sauvegarder l'ancienne architecture
log "Sauvegarde de l'ancienne architecture..."
rsync -av --exclude="node_modules" --exclude=".git" "$ANCIEN_PROJET_DIR/" "$BACKUP_DIR/" || {
  erreur "Échec de la sauvegarde de l'ancienne architecture"
  exit 1
}
log "Sauvegarde terminée avec succès dans $BACKUP_DIR"

# Vérifier si des processus utilisent l'ancien projet
log "Vérification des processus utilisant l'ancien projet..."
PROCESSES=$(lsof +D "$ANCIEN_PROJET_DIR" 2>/dev/null | awk '{print $2}' | sort -u | tail -n +2)

if [ -n "$PROCESSES" ]; then
  attention "Les processus suivants utilisent encore l'ancien projet:"
  for PID in $PROCESSES; do
    PS_INFO=$(ps -p "$PID" -o pid,ppid,user,command | tail -n +2)
    attention "$PS_INFO"
  done
  
  read -p "Voulez-vous tenter de terminer ces processus? (o/n): " KILL_PROCESSES
  if [ "$KILL_PROCESSES" = "o" ] || [ "$KILL_PROCESSES" = "O" ]; then
    for PID in $PROCESSES; do
      log "Tentative de terminer le processus $PID..."
      kill -15 "$PID" 2>/dev/null || attention "Impossible de terminer le processus $PID"
    done
  else
    attention "Certains fichiers peuvent être verrouillés. Le nettoyage pourrait être incomplet."
  fi
fi

# Créer un fichier de migration pour référence future
log "Création d'un fichier de référence de migration..."
cat > "$BACKUP_DIR/MIGRATION_INFO.md" << EOF
# Information de Migration FloDrama

## Date de migration
$(date +"%Y-%m-%d %H:%M:%S")

## Ancienne architecture
\`$ANCIEN_PROJET_DIR\`

## Nouvelle architecture
\`$NOUVEAU_PROJET_DIR\`

## Contenu de la sauvegarde
Cette sauvegarde contient une copie complète de l'ancienne architecture FloDrama avant sa suppression.

## Notes importantes
- Les dépendances node_modules n'ont pas été sauvegardées
- Le répertoire .git n'a pas été sauvegardé
- Pour restaurer l'ancienne architecture, utilisez la commande:
  \`\`\`
  rsync -av "$BACKUP_DIR/" "$ANCIEN_PROJET_DIR/"
  \`\`\`
EOF

# Nettoyer les ressources AWS de l'ancienne architecture
log "Nettoyage des ressources AWS..."
attention "IMPORTANT: Cette étape nécessite la configuration d'AWS CLI et des autorisations appropriées."

# Vérifier si AWS CLI est installé
if command -v aws &> /dev/null; then
  # Liste des buckets S3 à nettoyer (à adapter selon votre configuration)
  S3_BUCKETS=("flodrama-app-bucket")
  
  # Liste des distributions CloudFront à invalider (à adapter selon votre configuration)
  CLOUDFRONT_DISTRIBUTIONS=("E1MU6L4S4UVUSS")
  
  # Demander confirmation avant de procéder
  read -p "Voulez-vous nettoyer les ressources AWS? (o/n): " CLEAN_AWS
  if [ "$CLEAN_AWS" = "o" ] || [ "$CLEAN_AWS" = "O" ]; then
    # Invalider le cache CloudFront
    for DIST_ID in "${CLOUDFRONT_DISTRIBUTIONS[@]}"; do
      log "Invalidation du cache CloudFront pour la distribution $DIST_ID..."
      aws cloudfront create-invalidation --distribution-id "$DIST_ID" --paths "/*" || {
        attention "Échec de l'invalidation du cache CloudFront pour la distribution $DIST_ID"
      }
    done
    
    # Vider les buckets S3 (mais ne pas les supprimer)
    for BUCKET in "${S3_BUCKETS[@]}"; do
      log "Vidage du bucket S3 $BUCKET..."
      aws s3 rm "s3://$BUCKET" --recursive || {
        attention "Échec du vidage du bucket S3 $BUCKET"
      }
    done
  else
    log "Nettoyage des ressources AWS ignoré."
  fi
else
  attention "AWS CLI n'est pas installé. Impossible de nettoyer les ressources AWS."
fi

# Nettoyer les dépendances et les fichiers générés
log "Nettoyage des dépendances et des fichiers générés..."
find "$ANCIEN_PROJET_DIR" -name "node_modules" -type d -exec rm -rf {} +
find "$ANCIEN_PROJET_DIR" -name "build" -type d -exec rm -rf {} +
find "$ANCIEN_PROJET_DIR" -name "dist" -type d -exec rm -rf {} +
find "$ANCIEN_PROJET_DIR" -name ".next" -type d -exec rm -rf {} +
find "$ANCIEN_PROJET_DIR" -name ".cache" -type d -exec rm -rf {} +
find "$ANCIEN_PROJET_DIR" -name "*.log" -type f -delete

# Archiver l'ancien projet
log "Archivage de l'ancien projet..."
ARCHIVE_NAME="FloDrama-Archive-$(date +"%Y%m%d").tar.gz"
tar -czf "$BACKUP_DIR/$ARCHIVE_NAME" -C "$(dirname "$ANCIEN_PROJET_DIR")" "$(basename "$ANCIEN_PROJET_DIR")" || {
  erreur "Échec de l'archivage de l'ancien projet"
}

# Demander confirmation avant de supprimer l'ancien projet
read -p "Voulez-vous supprimer l'ancien projet? (o/n): " DELETE_PROJECT
if [ "$DELETE_PROJECT" = "o" ] || [ "$DELETE_PROJECT" = "O" ]; then
  log "Suppression de l'ancien projet..."
  rm -rf "$ANCIEN_PROJET_DIR" || {
    erreur "Échec de la suppression de l'ancien projet"
  }
  log "Ancien projet supprimé avec succès."
else
  log "L'ancien projet n'a pas été supprimé."
  log "Vous pouvez le supprimer manuellement plus tard avec la commande:"
  log "rm -rf \"$ANCIEN_PROJET_DIR\""
fi

# Créer un lien symbolique vers le nouveau projet (optionnel)
read -p "Voulez-vous créer un lien symbolique de l'ancien emplacement vers le nouveau projet? (o/n): " CREATE_SYMLINK
if [ "$CREATE_SYMLINK" = "o" ] || [ "$CREATE_SYMLINK" = "O" ]; then
  log "Création d'un lien symbolique..."
  ln -s "$NOUVEAU_PROJET_DIR" "$ANCIEN_PROJET_DIR" || {
    erreur "Échec de la création du lien symbolique"
  }
  log "Lien symbolique créé avec succès."
fi

log "Nettoyage terminé avec succès!"
log "Une sauvegarde complète est disponible dans: $BACKUP_DIR"
log "Un archive de l'ancien projet est disponible dans: $BACKUP_DIR/$ARCHIVE_NAME"
