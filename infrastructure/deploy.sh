#!/bin/bash
# Script de déploiement pour FloDrama sur AWS
# Ce script automatise le déploiement de l'application FloDrama sur l'infrastructure AWS
# configurée avec Terraform.

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages d'information
info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

# Fonction pour afficher les messages de succès
success() {
  echo -e "${GREEN}[SUCCÈS]${NC} $1"
}

# Fonction pour afficher les messages d'avertissement
warning() {
  echo -e "${YELLOW}[ATTENTION]${NC} $1"
}

# Fonction pour afficher les messages d'erreur
error() {
  echo -e "${RED}[ERREUR]${NC} $1"
}

# Fonction pour vérifier si une commande existe
check_command() {
  if ! command -v $1 &> /dev/null; then
    error "La commande $1 n'est pas installée. Veuillez l'installer avant de continuer."
    exit 1
  fi
}

# Vérifier les dépendances
check_command "aws"
check_command "terraform"
check_command "npm"
check_command "jq"

# Définir les variables d'environnement
ENV=${1:-"dev"}
TIMESTAMP=$(date +%Y%m%d%H%M%S)
BACKUP_DIR="./backups/${TIMESTAMP}_${ENV}"
TERRAFORM_DIR="./terraform"
FRONTEND_DIR="../"
BUILD_DIR="../build"
S3_BUCKET="flodrama-${ENV}-frontend"
CLOUDFRONT_DISTRIBUTION_ID=""
DOMAINS_CONFIG_FILE="./domains-config.json"

# Créer le répertoire de sauvegarde
mkdir -p $BACKUP_DIR

# Fonction pour configurer les domaines
configure_domains() {
  info "Configuration des domaines pour FloDrama..."
  
  # Vérifier si le script de configuration des domaines existe
  if [ -f "./configure-domains.sh" ]; then
    # Exécuter le script de configuration des domaines
    ./configure-domains.sh $ENV
    
    if [ $? -ne 0 ]; then
      error "Erreur lors de la configuration des domaines"
      exit 1
    fi
    
    # Vérifier si le fichier de configuration des domaines existe
    if [ ! -f "$DOMAINS_CONFIG_FILE" ]; then
      error "Le fichier de configuration des domaines n'existe pas"
      exit 1
    fi
    
    # Extraire le domaine principal du fichier de configuration
    MAIN_DOMAIN=$(jq -r '.main_domain' "$DOMAINS_CONFIG_FILE")
    
    if [ -z "$MAIN_DOMAIN" ]; then
      error "Impossible de récupérer le domaine principal depuis le fichier de configuration"
      exit 1
    fi
    
    success "Domaines configurés avec succès"
  else
    warning "Le script de configuration des domaines n'existe pas. Utilisation des valeurs par défaut."
    
    # Demander le domaine principal
    read -p "Veuillez entrer le domaine principal pour FloDrama (ex: flodrama.com): " MAIN_DOMAIN
    
    if [ -z "$MAIN_DOMAIN" ]; then
      error "Le domaine principal est requis"
      exit 1
    fi
    
    # Créer un fichier de configuration des domaines minimal
    cat > "$DOMAINS_CONFIG_FILE" << EOF
{
  "main_domain": "$MAIN_DOMAIN",
  "environment": "$ENV"
}
EOF
  fi
}

# Fonction pour initialiser et appliquer la configuration Terraform
setup_infrastructure() {
  info "Configuration de l'infrastructure AWS avec Terraform..."
  
  cd $TERRAFORM_DIR
  
  # Créer un fichier de variables Terraform pour les domaines
  cat > "terraform.tfvars" << EOF
# Variables générées automatiquement par le script de déploiement
environment = "${ENV}"
domain_name = "$(jq -r '.main_domain' "../../$DOMAINS_CONFIG_FILE")"
EOF
  
  # Initialiser Terraform
  info "Initialisation de Terraform..."
  terraform init
  
  # Planifier les changements
  info "Planification des changements Terraform..."
  terraform plan -out=tfplan
  
  # Appliquer les changements
  info "Application des changements Terraform..."
  terraform apply tfplan
  
  # Récupérer l'ID de distribution CloudFront
  CLOUDFRONT_DISTRIBUTION_ID=$(terraform output -json | jq -r '.cloudfront_distribution_id.value')
  
  if [ -z "$CLOUDFRONT_DISTRIBUTION_ID" ]; then
    error "Impossible de récupérer l'ID de distribution CloudFront"
    exit 1
  fi
  
  success "Infrastructure AWS configurée avec succès"
  cd ..
}

# Fonction pour construire l'application React
build_frontend() {
  info "Construction de l'application React..."
  
  cd $FRONTEND_DIR
  
  # Installer les dépendances
  info "Installation des dépendances..."
  npm install
  
  # Construire l'application
  info "Construction de l'application pour l'environnement ${ENV}..."
  npm run build
  
  success "Application React construite avec succès"
  cd -
}

# Fonction pour déployer l'application sur S3
deploy_to_s3() {
  info "Déploiement de l'application sur S3..."
  
  # Vérifier que le bucket S3 existe
  if ! aws s3 ls "s3://${S3_BUCKET}" &> /dev/null; then
    error "Le bucket S3 ${S3_BUCKET} n'existe pas"
    exit 1
  fi
  
  # Synchroniser les fichiers avec S3
  info "Synchronisation des fichiers avec S3..."
  aws s3 sync $BUILD_DIR "s3://${S3_BUCKET}" --delete
  
  success "Application déployée sur S3 avec succès"
}

# Fonction pour invalider le cache CloudFront
invalidate_cloudfront() {
  info "Invalidation du cache CloudFront..."
  
  # Créer une invalidation CloudFront
  aws cloudfront create-invalidation \
    --distribution-id $CLOUDFRONT_DISTRIBUTION_ID \
    --paths "/*"
  
  success "Cache CloudFront invalidé avec succès"
}

# Fonction pour afficher les informations de déploiement
display_deployment_info() {
  info "Informations de déploiement:"
  
  cd $TERRAFORM_DIR
  
  # Récupérer les URLs de déploiement
  FRONTEND_URL=$(terraform output -json | jq -r '.frontend_url.value')
  API_URL=$(terraform output -json | jq -r '.api_url.value')
  ADMIN_URL=$(terraform output -json | jq -r '.admin_url.value')
  MEDIA_URL=$(terraform output -json | jq -r '.media_url.value')
  
  cd ..
  
  echo "┌────────────────────────────────────────────────────────────┐"
  echo "│                 DÉPLOIEMENT FLODRAMA TERMINÉ                │"
  echo "├────────────────────────────────────────────────────────────┤"
  echo "│ Environnement: $ENV                                          "
  echo "├────────────────────────────────────────────────────────────┤"
  echo "│ Frontend:      $FRONTEND_URL                                 "
  echo "│ API:           $API_URL                                      "
  echo "│ Admin:         $ADMIN_URL                                    "
  echo "│ Médias:        $MEDIA_URL                                    "
  echo "└────────────────────────────────────────────────────────────┘"
}

# Fonction principale
main() {
  info "Démarrage du déploiement de FloDrama pour l'environnement ${ENV}..."
  
  # Étape 0: Configuration des domaines
  configure_domains
  
  # Étape 1: Configuration de l'infrastructure
  setup_infrastructure
  
  # Étape 2: Construction de l'application React
  build_frontend
  
  # Étape 3: Déploiement sur S3
  deploy_to_s3
  
  # Étape 4: Invalidation du cache CloudFront
  invalidate_cloudfront
  
  # Étape 5: Afficher les informations de déploiement
  display_deployment_info
  
  success "Déploiement de FloDrama terminé avec succès pour l'environnement ${ENV}"
}

# Exécuter la fonction principale
main
