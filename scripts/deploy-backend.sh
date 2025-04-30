#!/bin/bash
# Script de déploiement du backend pour FloDrama
# Créé le $(date +"%Y-%m-%d")

# Couleurs pour les messages
VERT='\033[0;32m'
ROUGE='\033[0;31m'
JAUNE='\033[0;33m'
BLEU='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REGION="us-east-1"
ECR_REPO="flodrama"
CLUSTER_NAME="flodrama-cluster"
NAMESPACE_APP="flodrama"
NAMESPACE_INFRA="flodrama-infra"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Fonction pour afficher les messages
log_message() {
  echo -e "${BLEU}[$(date +"%H:%M:%S")] ${1}${NC}"
}

# Fonction pour afficher les erreurs
log_erreur() {
  echo -e "${ROUGE}[$(date +"%H:%M:%S")] ERREUR: ${1}${NC}"
}

# Fonction pour afficher les succès
log_succes() {
  echo -e "${VERT}[$(date +"%H:%M:%S")] SUCCÈS: ${1}${NC}"
}

# Fonction pour sauvegarder les logs
sauvegarder_logs() {
  mkdir -p ../backups
  echo "Déploiement backend du $(date)" > "../backups/${TIMESTAMP}_backup_deploiement-backend.txt"
  echo "Statut: $1" >> "../backups/${TIMESTAMP}_backup_deploiement-backend.txt"
  echo "Détails: $2" >> "../backups/${TIMESTAMP}_backup_deploiement-backend.txt"
}

# Se positionner dans le répertoire du projet
cd "$(dirname "$0")/.." || {
  log_erreur "Impossible d'accéder au répertoire du projet"
  sauvegarder_logs "ÉCHEC" "Impossible d'accéder au répertoire du projet"
  exit 1
}

# Vérifier si AWS CLI est installé
if ! command -v aws &> /dev/null; then
  log_erreur "AWS CLI n'est pas installé. Veuillez l'installer avant de continuer."
  sauvegarder_logs "ÉCHEC" "AWS CLI non installé"
  exit 1
fi

# Vérifier si kubectl est installé
if ! command -v kubectl &> /dev/null; then
  log_erreur "kubectl n'est pas installé. Veuillez l'installer avant de continuer."
  sauvegarder_logs "ÉCHEC" "kubectl non installé"
  exit 1
fi

# Vérifier si Docker est installé
if ! command -v docker &> /dev/null; then
  log_erreur "Docker n'est pas installé. Veuillez l'installer avant de continuer."
  sauvegarder_logs "ÉCHEC" "Docker non installé"
  exit 1
fi

# Vérifier les identifiants AWS
log_message "Vérification des identifiants AWS..."
if ! aws sts get-caller-identity &> /dev/null; then
  log_erreur "Identifiants AWS non configurés ou invalides. Veuillez exécuter 'aws configure'."
  sauvegarder_logs "ÉCHEC" "Identifiants AWS invalides"
  exit 1
fi
log_succes "Identifiants AWS valides."

# Connexion au cluster EKS
log_message "Connexion au cluster EKS ${CLUSTER_NAME}..."
if ! aws eks update-kubeconfig --name ${CLUSTER_NAME} --region ${REGION}; then
  log_erreur "Impossible de se connecter au cluster EKS. Vérifiez que le cluster existe."
  sauvegarder_logs "ÉCHEC" "Connexion au cluster EKS échouée"
  exit 1
fi
log_succes "Connexion au cluster EKS réussie."

# Vérifier et créer les namespaces si nécessaire
log_message "Vérification des namespaces Kubernetes..."
if ! kubectl get namespace ${NAMESPACE_APP} &> /dev/null; then
  log_message "Création du namespace ${NAMESPACE_APP}..."
  kubectl create namespace ${NAMESPACE_APP}
fi

if ! kubectl get namespace ${NAMESPACE_INFRA} &> /dev/null; then
  log_message "Création du namespace ${NAMESPACE_INFRA}..."
  kubectl create namespace ${NAMESPACE_INFRA}
fi
log_succes "Namespaces vérifiés et créés si nécessaire."

# Connexion à ECR
log_message "Connexion à Amazon ECR..."
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com"

aws ecr get-login-password --region ${REGION} | docker login --username AWS --password-stdin ${ECR_REGISTRY}
log_succes "Connexion à ECR réussie."

# Vérifier si le dépôt ECR existe, sinon le créer
if ! aws ecr describe-repositories --repository-names ${ECR_REPO} --region ${REGION} &> /dev/null; then
  log_message "Création du dépôt ECR ${ECR_REPO}..."
  aws ecr create-repository --repository-name ${ECR_REPO} --region ${REGION}
  log_succes "Dépôt ECR créé avec succès."
else
  log_message "Le dépôt ECR ${ECR_REPO} existe déjà."
fi

# Construction et déploiement des services backend
SERVICES=("api" "scraper" "watch-party-service")

for SERVICE in "${SERVICES[@]}"; do
  if [ -d "backend/${SERVICE}" ]; then
    log_message "Traitement du service ${SERVICE}..."
    
    # Construction de l'image Docker
    log_message "Construction de l'image Docker pour ${SERVICE}..."
    cd "backend/${SERVICE}" || {
      log_erreur "Impossible d'accéder au répertoire du service ${SERVICE}"
      continue
    }
    
    # Vérifier si un Dockerfile existe
    if [ ! -f "Dockerfile" ]; then
      log_erreur "Dockerfile non trouvé pour ${SERVICE}. Passage au service suivant."
      cd "../.." || exit 1
      continue
    }
    
    # Construire l'image
    TAG="${ECR_REGISTRY}/${ECR_REPO}:${SERVICE}-$(date +%Y%m%d%H%M%S)"
    if docker build -t ${TAG} .; then
      log_succes "Image Docker construite avec succès pour ${SERVICE}."
      
      # Pousser l'image vers ECR
      log_message "Envoi de l'image vers ECR..."
      if docker push ${TAG}; then
        log_succes "Image envoyée avec succès vers ECR."
        
        # Mettre à jour le déploiement Kubernetes
        cd "../.." || exit 1
        
        # Vérifier si le fichier de déploiement existe
        DEPLOY_FILE="kubernetes/${SERVICE}-deployment.yaml"
        if [ -f "${DEPLOY_FILE}" ]; then
          log_message "Mise à jour du déploiement Kubernetes pour ${SERVICE}..."
          
          # Remplacer l'image dans le fichier de déploiement
          sed -i '' "s|image:.*${ECR_REPO}:${SERVICE}.*|image: ${TAG}|g" "${DEPLOY_FILE}"
          
          # Appliquer le déploiement
          if kubectl apply -f "${DEPLOY_FILE}" -n ${NAMESPACE_APP}; then
            log_succes "Déploiement de ${SERVICE} réussi."
          else
            log_erreur "Échec du déploiement de ${SERVICE}."
          fi
        else
          log_erreur "Fichier de déploiement non trouvé pour ${SERVICE}."
        fi
      else
        log_erreur "Échec de l'envoi de l'image vers ECR pour ${SERVICE}."
        cd "../.." || exit 1
      fi
    else
      log_erreur "Échec de la construction de l'image Docker pour ${SERVICE}."
      cd "../.." || exit 1
    fi
  else
    log_message "Répertoire non trouvé pour le service ${SERVICE}. Passage au suivant."
  fi
done

# Déploiement des services d'infrastructure
log_message "Déploiement des services d'infrastructure..."
INFRA_SERVICES=("redis" "mongodb")

for INFRA in "${INFRA_SERVICES[@]}"; do
  INFRA_FILE="kubernetes/${INFRA}-deployment.yaml"
  if [ -f "${INFRA_FILE}" ]; then
    log_message "Déploiement de ${INFRA}..."
    if kubectl apply -f "${INFRA_FILE}" -n ${NAMESPACE_INFRA}; then
      log_succes "Déploiement de ${INFRA} réussi."
    else
      log_erreur "Échec du déploiement de ${INFRA}."
    fi
  else
    log_message "Fichier de déploiement non trouvé pour ${INFRA}."
  fi
done

# Vérification des déploiements
log_message "Vérification des déploiements..."
kubectl get pods -n ${NAMESPACE_APP}
kubectl get pods -n ${NAMESPACE_INFRA}

# Afficher les informations de déploiement
log_succes "Déploiement du backend terminé !"
echo -e "${JAUNE}Informations de déploiement :${NC}"
echo -e "  ${BLEU}Cluster EKS:${NC} ${CLUSTER_NAME}"
echo -e "  ${BLEU}Namespace application:${NC} ${NAMESPACE_APP}"
echo -e "  ${BLEU}Namespace infrastructure:${NC} ${NAMESPACE_INFRA}"

# Sauvegarder les informations de déploiement
sauvegarder_logs "SUCCÈS" "Backend déployé avec succès"
echo "Cluster EKS: ${CLUSTER_NAME}" >> "../backups/${TIMESTAMP}_backup_deploiement-backend.txt"
echo "Namespace application: ${NAMESPACE_APP}" >> "../backups/${TIMESTAMP}_backup_deploiement-backend.txt"
echo "Namespace infrastructure: ${NAMESPACE_INFRA}" >> "../backups/${TIMESTAMP}_backup_deploiement-backend.txt"

exit 0
