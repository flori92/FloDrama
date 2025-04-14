#!/bin/bash
# Script de nettoyage du projet FloDrama
# Ce script supprime les fichiers AWS obsolètes et organise le projet

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
ARCHIVE_DIR="${PROJECT_ROOT}/archives/aws-legacy"
mkdir -p "${ARCHIVE_DIR}/scripts"
mkdir -p "${ARCHIVE_DIR}/config"
mkdir -p "${ARCHIVE_DIR}/docs"

# Demander confirmation avant de continuer
echo ""
attention "ATTENTION: Ce script va nettoyer le projet FloDrama en:"
echo "- Déplaçant les scripts AWS obsolètes vers ${ARCHIVE_DIR}/scripts"
echo "- Déplaçant les fichiers de configuration AWS vers ${ARCHIVE_DIR}/config"
echo "- Conservant la documentation AWS dans ${ARCHIVE_DIR}/docs"
echo ""
read -p "Êtes-vous sûr de vouloir continuer? (oui/non): " confirmation
if [[ "${confirmation}" != "oui" ]]; then
  log "Opération annulée par l'utilisateur."
  exit 0
fi

# Archiver les scripts AWS
log "Archivage des scripts AWS..."
for script in $(find "${PROJECT_ROOT}/scripts" -name "*aws*" -type f); do
  script_name=$(basename "${script}")
  log "Archivage du script ${script_name}..."
  cp "${script}" "${ARCHIVE_DIR}/scripts/${script_name}"
  rm "${script}"
  succes "Script ${script_name} archivé."
done

# Archiver les fichiers de configuration AWS
log "Archivage des fichiers de configuration AWS..."
for config in $(find "${PROJECT_ROOT}/src" -name "*aws*" -type f | grep -v "aws-config.js"); do
  config_name=$(basename "${config}")
  config_dir=$(dirname "${config}" | sed "s|${PROJECT_ROOT}/||")
  mkdir -p "${ARCHIVE_DIR}/config/${config_dir}"
  log "Archivage du fichier de configuration ${config_name}..."
  cp "${config}" "${ARCHIVE_DIR}/config/${config_dir}/${config_name}"
  rm "${config}"
  succes "Fichier de configuration ${config_name} archivé."
done

# Archiver la documentation AWS
log "Archivage de la documentation AWS..."
for doc in $(find "${PROJECT_ROOT}/docs" -name "*aws*" -type f); do
  doc_name=$(basename "${doc}")
  log "Archivage du document ${doc_name}..."
  cp "${doc}" "${ARCHIVE_DIR}/docs/${doc_name}"
  succes "Document ${doc_name} archivé."
done

# Supprimer le dossier amplify s'il existe
if [ -d "${PROJECT_ROOT}/amplify" ]; then
  log "Suppression du dossier amplify..."
  rm -rf "${PROJECT_ROOT}/amplify"
  succes "Dossier amplify supprimé."
fi

# Créer un fichier README pour expliquer l'archive
cat > "${ARCHIVE_DIR}/README.md" << EOL
# Archive AWS pour FloDrama

Cette archive contient les fichiers AWS obsolètes qui ont été retirés du projet FloDrama lors de la migration vers Vercel.

## Structure de l'archive

- \`scripts/\`: Scripts de déploiement et de configuration AWS
- \`config/\`: Fichiers de configuration AWS
- \`docs/\`: Documentation sur l'architecture AWS

## Contexte

FloDrama a été initialement déployé sur AWS avec les services suivants:
- S3 pour le stockage des fichiers statiques
- CloudFront pour la distribution CDN
- DynamoDB pour les métadonnées

Le projet a été migré vers Vercel le $(date +"%d/%m/%Y") pour simplifier le déploiement et réduire les coûts.
EOL

# Mettre à jour le README principal du projet
log "Mise à jour du README principal du projet..."

# Vérifier si le README existe
if [ -f "${PROJECT_ROOT}/README.md" ]; then
  # Ajouter une section sur la migration vers Vercel
  cat >> "${PROJECT_ROOT}/README.md" << EOL

## Migration vers Vercel

Le projet FloDrama a été migré d'AWS vers Vercel le $(date +"%d/%m/%Y") pour simplifier le déploiement et réduire les coûts.

### Avantages de Vercel

- Déploiement simplifié
- Intégration continue avec GitHub
- CDN mondial intégré
- Plan gratuit généreux

### Déploiement

Pour déployer FloDrama sur Vercel:

\`\`\`bash
./scripts/deploy-vercel.sh
\`\`\`

### Ressources

- [Documentation Vercel](https://vercel.com/docs)
- [GitHub Actions pour Vercel](https://vercel.com/guides/how-can-i-use-github-actions-with-vercel)
EOL
  succes "README mis à jour avec les informations sur la migration vers Vercel."
else
  erreur "Fichier README.md non trouvé dans ${PROJECT_ROOT}."
fi

# Résumé du nettoyage
echo ""
log "Résumé du nettoyage:"
echo "- Scripts AWS archivés dans ${ARCHIVE_DIR}/scripts"
echo "- Fichiers de configuration AWS archivés dans ${ARCHIVE_DIR}/config"
echo "- Documentation AWS archivée dans ${ARCHIVE_DIR}/docs"
echo ""
succes "Nettoyage du projet terminé!"
echo ""
attention "REMARQUE: Les fichiers originaux ont été conservés dans l'archive ${ARCHIVE_DIR}."
attention "Vous pouvez supprimer cette archive si vous n'en avez plus besoin."
