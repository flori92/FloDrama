#!/bin/bash
# Script de création de l'infrastructure backend pour FloDrama
# Créé le $(date +"%Y-%m-%d")

# Couleurs pour les messages
VERT='\033[0;32m'
ROUGE='\033[0;31m'
JAUNE='\033[0;33m'
BLEU='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REGION="us-east-1"
CLUSTER_NAME="flodrama-cluster"
NAMESPACE_APP="flodrama"
NAMESPACE_INFRA="flodrama-infra"
ECR_REPO="flodrama"
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
  echo "Création infrastructure backend du $(date)" > "../backups/${TIMESTAMP}_backup_infrastructure-backend.txt"
  echo "Statut: $1" >> "../backups/${TIMESTAMP}_backup_infrastructure-backend.txt"
  echo "Détails: $2" >> "../backups/${TIMESTAMP}_backup_infrastructure-backend.txt"
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

# Vérifier les identifiants AWS
log_message "Vérification des identifiants AWS..."
if ! aws sts get-caller-identity &> /dev/null; then
  log_erreur "Identifiants AWS non configurés ou invalides. Veuillez exécuter 'aws configure'."
  sauvegarder_logs "ÉCHEC" "Identifiants AWS invalides"
  exit 1
fi
log_succes "Identifiants AWS valides."

# Création du dépôt ECR
log_message "Création du dépôt ECR ${ECR_REPO}..."
if ! aws ecr describe-repositories --repository-names ${ECR_REPO} --region ${REGION} &> /dev/null; then
  if aws ecr create-repository --repository-name ${ECR_REPO} --region ${REGION}; then
    log_succes "Dépôt ECR créé avec succès."
  else
    log_erreur "Échec de la création du dépôt ECR."
    sauvegarder_logs "ÉCHEC" "Création du dépôt ECR échouée"
    exit 1
  fi
else
  log_message "Le dépôt ECR existe déjà."
fi

# Création du cluster EKS
log_message "Création du cluster EKS ${CLUSTER_NAME}..."
if ! aws eks describe-cluster --name ${CLUSTER_NAME} --region ${REGION} &> /dev/null; then
  log_message "Le cluster n'existe pas. Création en cours..."
  
  # Créer un rôle IAM pour le cluster EKS
  log_message "Création du rôle IAM pour EKS..."
  
  # Créer une politique de confiance
  cat > /tmp/eks-trust-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "eks.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF
  
  # Créer le rôle
  ROLE_NAME="flodrama-eks-cluster-role"
  if aws iam get-role --role-name ${ROLE_NAME} &> /dev/null; then
    log_message "Le rôle IAM ${ROLE_NAME} existe déjà."
  else
    if aws iam create-role --role-name ${ROLE_NAME} --assume-role-policy-document file:///tmp/eks-trust-policy.json; then
      log_succes "Rôle IAM créé avec succès."
      
      # Attacher les politiques nécessaires
      aws iam attach-role-policy --role-name ${ROLE_NAME} --policy-arn arn:aws:iam::aws:policy/AmazonEKSClusterPolicy
    else
      log_erreur "Échec de la création du rôle IAM."
      sauvegarder_logs "ÉCHEC" "Création du rôle IAM échouée"
      exit 1
    fi
  fi
  
  # Créer un groupe de sécurité pour le cluster
  VPC_ID=$(aws ec2 describe-vpcs --filters "Name=isDefault,Values=true" --query "Vpcs[0].VpcId" --output text)
  SG_NAME="flodrama-eks-cluster-sg"
  
  # Vérifier si le groupe de sécurité existe déjà
  SG_ID=$(aws ec2 describe-security-groups --filters "Name=group-name,Values=${SG_NAME}" --query "SecurityGroups[0].GroupId" --output text)
  
  if [ "$SG_ID" == "None" ] || [ -z "$SG_ID" ]; then
    log_message "Création du groupe de sécurité ${SG_NAME}..."
    SG_ID=$(aws ec2 create-security-group --group-name ${SG_NAME} --description "Security group for FloDrama EKS cluster" --vpc-id ${VPC_ID} --query "GroupId" --output text)
    
    # Ajouter les règles nécessaires
    aws ec2 authorize-security-group-ingress --group-id ${SG_ID} --protocol tcp --port 443 --cidr 0.0.0.0/0
    log_succes "Groupe de sécurité créé avec succès."
  else
    log_message "Le groupe de sécurité ${SG_NAME} existe déjà."
  fi
  
  # Obtenir les sous-réseaux dans les zones de disponibilité supportées
  SUBNETS=$(aws ec2 describe-subnets \
    --filters "Name=vpc-id,Values=${VPC_ID}" "Name=availability-zone,Values=us-east-1a,us-east-1b,us-east-1c,us-east-1d,us-east-1f" \
    --query "Subnets[*].SubnetId" --output text | tr '\t' ',')
  
  # Créer le cluster avec des zones de disponibilité spécifiques
  log_message "Création du cluster EKS. Cela peut prendre 15-20 minutes..."
  if aws eks create-cluster \
    --name ${CLUSTER_NAME} \
    --role-arn "arn:aws:iam::$(aws sts get-caller-identity --query "Account" --output text):role/${ROLE_NAME}" \
    --resources-vpc-config subnetIds=${SUBNETS},securityGroupIds=${SG_ID} \
    --kubernetes-version 1.29; then
    
    log_message "Cluster EKS en cours de création. Attente de la fin du provisionnement..."
    
    # Attendre que le cluster soit actif
    aws eks wait cluster-active --name ${CLUSTER_NAME} --region ${REGION}
    
    log_succes "Cluster EKS créé avec succès."
  else
    log_erreur "Échec de la création du cluster EKS."
    sauvegarder_logs "ÉCHEC" "Création du cluster EKS échouée"
    exit 1
  fi
else
  log_message "Le cluster EKS existe déjà."
fi

# Configurer kubectl pour se connecter au cluster
log_message "Configuration de kubectl pour se connecter au cluster..."
if aws eks update-kubeconfig --name ${CLUSTER_NAME} --region ${REGION}; then
  log_succes "kubectl configuré avec succès."
else
  log_erreur "Échec de la configuration de kubectl."
  sauvegarder_logs "ÉCHEC" "Configuration de kubectl échouée"
  exit 1
fi

# Création des namespaces
log_message "Création des namespaces Kubernetes..."
if ! kubectl get namespace ${NAMESPACE_APP} &> /dev/null; then
  kubectl create namespace ${NAMESPACE_APP}
  log_succes "Namespace ${NAMESPACE_APP} créé avec succès."
else
  log_message "Le namespace ${NAMESPACE_APP} existe déjà."
fi

if ! kubectl get namespace ${NAMESPACE_INFRA} &> /dev/null; then
  kubectl create namespace ${NAMESPACE_INFRA}
  log_succes "Namespace ${NAMESPACE_INFRA} créé avec succès."
else
  log_message "Le namespace ${NAMESPACE_INFRA} existe déjà."
fi

# Création des services d'infrastructure
log_message "Création des services d'infrastructure..."

# Créer le répertoire kubernetes s'il n'existe pas
mkdir -p kubernetes

# Créer le déploiement Redis
cat > kubernetes/redis-deployment.yaml << EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: redis
  namespace: ${NAMESPACE_INFRA}
spec:
  replicas: 1
  selector:
    matchLabels:
      app: redis
  template:
    metadata:
      labels:
        app: redis
    spec:
      containers:
      - name: redis
        image: redis:alpine
        ports:
        - containerPort: 6379
        resources:
          limits:
            cpu: "0.5"
            memory: "512Mi"
          requests:
            cpu: "0.2"
            memory: "256Mi"
---
apiVersion: v1
kind: Service
metadata:
  name: redis
  namespace: ${NAMESPACE_INFRA}
spec:
  selector:
    app: redis
  ports:
  - port: 6379
    targetPort: 6379
  type: ClusterIP
EOF

# Créer le déploiement MongoDB
cat > kubernetes/mongodb-deployment.yaml << EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mongodb
  namespace: ${NAMESPACE_INFRA}
spec:
  replicas: 1
  selector:
    matchLabels:
      app: mongodb
  template:
    metadata:
      labels:
        app: mongodb
    spec:
      containers:
      - name: mongodb
        image: mongo:5
        ports:
        - containerPort: 27017
        env:
        - name: MONGO_INITDB_ROOT_USERNAME
          value: "flodrama"
        - name: MONGO_INITDB_ROOT_PASSWORD
          value: "flodramaPassword"
        resources:
          limits:
            cpu: "1"
            memory: "1Gi"
          requests:
            cpu: "0.5"
            memory: "512Mi"
        volumeMounts:
        - name: mongodb-data
          mountPath: /data/db
      volumes:
      - name: mongodb-data
        emptyDir: {}
---
apiVersion: v1
kind: Service
metadata:
  name: mongodb
  namespace: ${NAMESPACE_INFRA}
spec:
  selector:
    app: mongodb
  ports:
  - port: 27017
    targetPort: 27017
  type: ClusterIP
EOF

# Appliquer les déploiements
log_message "Déploiement des services d'infrastructure..."
kubectl apply -f kubernetes/redis-deployment.yaml
kubectl apply -f kubernetes/mongodb-deployment.yaml

log_succes "Infrastructure backend créée avec succès !"
echo -e "${JAUNE}Informations de l'infrastructure :${NC}"
echo -e "  ${BLEU}Cluster EKS:${NC} ${CLUSTER_NAME}"
echo -e "  ${BLEU}Dépôt ECR:${NC} ${ECR_REPO}"
echo -e "  ${BLEU}Namespace application:${NC} ${NAMESPACE_APP}"
echo -e "  ${BLEU}Namespace infrastructure:${NC} ${NAMESPACE_INFRA}"

# Sauvegarder les informations
sauvegarder_logs "SUCCÈS" "Infrastructure backend créée avec succès"
echo "Cluster EKS: ${CLUSTER_NAME}" >> "../backups/${TIMESTAMP}_backup_infrastructure-backend.txt"
echo "Dépôt ECR: ${ECR_REPO}" >> "../backups/${TIMESTAMP}_backup_infrastructure-backend.txt"
echo "Namespace application: ${NAMESPACE_APP}" >> "../backups/${TIMESTAMP}_backup_infrastructure-backend.txt"
echo "Namespace infrastructure: ${NAMESPACE_INFRA}" >> "../backups/${TIMESTAMP}_backup_infrastructure-backend.txt"

log_message "Vous pouvez maintenant exécuter le script deploy-backend.sh pour déployer les services backend."

exit 0
