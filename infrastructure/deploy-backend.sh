#!/bin/bash
# Script de déploiement des services backend de FloDrama sur EKS
# Ce script automatise le déploiement des services backend sur le cluster EKS

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
check_command "kubectl"
check_command "helm"
check_command "docker"

# Définir les variables d'environnement
ENV=${1:-"dev"}
TIMESTAMP=$(date +%Y%m%d%H%M%S)
BACKUP_DIR="./backups/${TIMESTAMP}_${ENV}"
KUBERNETES_DIR="./kubernetes"
ECR_REPOSITORY="flodrama-${ENV}"
CLUSTER_NAME="flodrama-${ENV}"
REGION=$(aws configure get region)

# Créer le répertoire de sauvegarde
mkdir -p $BACKUP_DIR

# Fonction pour se connecter au cluster EKS
connect_to_eks() {
  info "Connexion au cluster EKS ${CLUSTER_NAME}..."
  
  # Mettre à jour le kubeconfig
  aws eks update-kubeconfig --name $CLUSTER_NAME --region $REGION
  
  # Vérifier la connexion
  kubectl get nodes
  
  success "Connexion au cluster EKS établie avec succès"
}

# Fonction pour construire et pousser les images Docker
build_and_push_images() {
  info "Construction et envoi des images Docker vers ECR..."
  
  # Se connecter à ECR
  aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com
  
  # Construire et pousser l'image de l'API
  info "Construction de l'image de l'API..."
  docker build -t ${ECR_REPOSITORY}/api:latest ../api
  docker tag ${ECR_REPOSITORY}/api:latest ${AWS_ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${ECR_REPOSITORY}/api:latest
  docker push ${AWS_ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${ECR_REPOSITORY}/api:latest
  
  # Construire et pousser l'image du service de scraping
  info "Construction de l'image du service de scraping..."
  docker build -t ${ECR_REPOSITORY}/scraper:latest ../scraper
  docker tag ${ECR_REPOSITORY}/scraper:latest ${AWS_ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${ECR_REPOSITORY}/scraper:latest
  docker push ${AWS_ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${ECR_REPOSITORY}/scraper:latest
  
  success "Images Docker construites et envoyées avec succès"
}

# Fonction pour déployer les services sur Kubernetes
deploy_to_kubernetes() {
  info "Déploiement des services sur Kubernetes..."
  
  # Appliquer les configurations Kubernetes
  kubectl apply -f ${KUBERNETES_DIR}/namespaces.yaml
  
  # Déployer les services avec Helm
  helm upgrade --install flodrama-api ${KUBERNETES_DIR}/charts/api \
    --namespace flodrama \
    --set image.repository=${AWS_ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${ECR_REPOSITORY}/api \
    --set image.tag=latest \
    --set environment=${ENV}
  
  helm upgrade --install flodrama-scraper ${KUBERNETES_DIR}/charts/scraper \
    --namespace flodrama \
    --set image.repository=${AWS_ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${ECR_REPOSITORY}/scraper \
    --set image.tag=latest \
    --set environment=${ENV}
  
  # Déployer les services d'infrastructure
  helm upgrade --install flodrama-redis ${KUBERNETES_DIR}/charts/redis \
    --namespace flodrama-infra
  
  helm upgrade --install flodrama-mongodb ${KUBERNETES_DIR}/charts/mongodb \
    --namespace flodrama-infra
  
  success "Services déployés sur Kubernetes avec succès"
}

# Fonction pour vérifier le statut des déploiements
check_deployments() {
  info "Vérification du statut des déploiements..."
  
  kubectl get pods -n flodrama
  kubectl get pods -n flodrama-infra
  kubectl get services -n flodrama
  
  success "Vérification des déploiements terminée"
}

# Fonction principale
main() {
  info "Démarrage du déploiement des services backend de FloDrama pour l'environnement ${ENV}..."
  
  # Demander l'ID du compte AWS
  read -p "Veuillez entrer l'ID de votre compte AWS: " AWS_ACCOUNT_ID
  
  # Étape 1: Connexion au cluster EKS
  connect_to_eks
  
  # Étape 2: Construction et envoi des images Docker
  build_and_push_images
  
  # Étape 3: Déploiement sur Kubernetes
  deploy_to_kubernetes
  
  # Étape 4: Vérification des déploiements
  check_deployments
  
  success "Déploiement des services backend de FloDrama terminé avec succès pour l'environnement ${ENV}"
}

# Exécuter la fonction principale
main
