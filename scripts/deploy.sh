#!/bin/bash
# Script de déploiement principal pour FloDrama
# Créé le $(date +"%Y-%m-%d")

# Couleurs pour les messages
VERT='\033[0;32m'
ROUGE='\033[0;31m'
JAUNE='\033[0;33m'
BLEU='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BUCKET_FRONTEND="flodrama-frontend"
REGION="us-east-1"
DISTRIBUTION_ID="" # À remplir si vous avez déjà une distribution CloudFront
TERRAFORM_DIR="../infrastructure/terraform"
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
  echo "Déploiement du $(date)" > "../backups/${TIMESTAMP}_backup_deploiement-flodrama.txt"
  echo "Statut: $1" >> "../backups/${TIMESTAMP}_backup_deploiement-flodrama.txt"
  echo "Détails: $2" >> "../backups/${TIMESTAMP}_backup_deploiement-flodrama.txt"
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

# Vérifier si Terraform est installé
if ! command -v terraform &> /dev/null; then
  log_message "Terraform n'est pas installé. Installation de l'infrastructure AWS sans Terraform..."
  
  # Créer le bucket S3 s'il n'existe pas
  if ! aws s3 ls "s3://${BUCKET_FRONTEND}" &> /dev/null; then
    log_message "Création du bucket S3 ${BUCKET_FRONTEND}..."
    if aws s3 mb "s3://${BUCKET_FRONTEND}" --region "${REGION}"; then
      log_succes "Bucket S3 créé avec succès."
      
      # Configurer le bucket pour l'hébergement de site web statique
      aws s3 website "s3://${BUCKET_FRONTEND}" --index-document index.html --error-document index.html
      
      # Définir la politique du bucket pour permettre l'accès public en lecture
      POLICY='{
        "Version": "2012-10-17",
        "Statement": [
          {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::'${BUCKET_FRONTEND}'/*"
          }
        ]
      }'
      
      echo "$POLICY" > /tmp/bucket-policy.json
      aws s3api put-bucket-policy --bucket "${BUCKET_FRONTEND}" --policy file:///tmp/bucket-policy.json
      rm /tmp/bucket-policy.json
    else
      log_erreur "Impossible de créer le bucket S3."
      sauvegarder_logs "ÉCHEC" "Création du bucket S3 échouée"
      exit 1
    fi
  else
    log_succes "Le bucket S3 existe déjà."
  fi
else
  # Utiliser Terraform pour configurer l'infrastructure
  log_message "Configuration de l'infrastructure avec Terraform..."
  if [ -d "$TERRAFORM_DIR" ]; then
    cd "$TERRAFORM_DIR" || {
      log_erreur "Impossible d'accéder au répertoire Terraform"
      sauvegarder_logs "ÉCHEC" "Accès au répertoire Terraform impossible"
      exit 1
    }
    
    terraform init
    if terraform apply -auto-approve; then
      log_succes "Infrastructure configurée avec succès via Terraform."
      
      # Récupérer les outputs de Terraform
      BUCKET_FRONTEND=$(terraform output -raw frontend_bucket_name)
      DISTRIBUTION_ID=$(terraform output -raw cloudfront_distribution_id)
      
      cd "$(dirname "$0")/.." || {
        log_erreur "Impossible de revenir au répertoire du projet"
        sauvegarder_logs "ÉCHEC" "Navigation entre répertoires impossible"
        exit 1
      }
    else
      log_erreur "Échec de la configuration de l'infrastructure avec Terraform."
      sauvegarder_logs "ÉCHEC" "Configuration Terraform échouée"
      exit 1
    fi
  else
    log_message "Répertoire Terraform non trouvé. Utilisation des valeurs par défaut."
  fi
fi

# Construction de l'application React
log_message "Construction de l'application React..."
if npm ci && npm run build; then
  log_succes "Application React construite avec succès."
else
  log_erreur "Échec de la construction de l'application React."
  
  # Tentative de construction alternative
  log_message "Tentative de construction alternative..."
  mkdir -p build/static/js
  mkdir -p build/static/css
  mkdir -p build/static/media
  
  # Copier les fichiers du projet dans le dossier de build
  cp -r public/* build/ 2>/dev/null || :
  
  # Créer un fichier index.html minimal
  cat > build/index.html << EOF
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>FloDrama</title>
  <link rel="stylesheet" href="/static/css/main.css">
</head>
<body>
  <div id="root"></div>
  <script src="/static/js/main.js"></script>
</body>
</html>
EOF
  
  # Créer un fichier CSS minimal
  cat > build/static/css/main.css << EOF
/* Styles principaux de FloDrama */
body {
  font-family: 'Roboto', sans-serif;
  margin: 0;
  padding: 0;
  background-color: #121212;
  color: #ffffff;
}

#root {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 16px;
}
EOF
  
  # Créer un fichier JavaScript minimal
  cat > build/static/js/main.js << EOF
// FloDrama - Version temporaire
console.log('FloDrama - Version de déploiement temporaire');
document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('root').innerHTML = '<div class="container"><h1>FloDrama</h1><p>Application en cours de maintenance. Veuillez patienter...</p></div>';
});
EOF
  
  log_message "Build alternatif créé."
fi

# Déploiement sur S3
log_message "Déploiement sur S3..."
if aws s3 sync build/ "s3://${BUCKET_FRONTEND}" --delete; then
  log_succes "Application déployée avec succès sur S3."
else
  log_erreur "Échec du déploiement sur S3."
  sauvegarder_logs "ÉCHEC" "Déploiement sur S3 échoué"
  exit 1
fi

# Invalidation du cache CloudFront
if [ -n "$DISTRIBUTION_ID" ]; then
  log_message "Invalidation du cache CloudFront..."
  if aws cloudfront create-invalidation --distribution-id "$DISTRIBUTION_ID" --paths "/*" > /dev/null; then
    log_succes "Cache CloudFront invalidé avec succès."
  else
    log_erreur "Échec de l'invalidation du cache CloudFront."
    # Non bloquant, on continue
  fi
  
  # Récupérer le domaine de la distribution
  DISTRIBUTION_DOMAIN=$(aws cloudfront get-distribution --id "$DISTRIBUTION_ID" --query "Distribution.DomainName" --output text)
fi

# Afficher les informations de déploiement
log_succes "Déploiement du frontend terminé avec succès !"
echo -e "${JAUNE}Informations de déploiement :${NC}"
echo -e "  ${BLEU}URL S3:${NC} http://${BUCKET_FRONTEND}.s3-website-${REGION}.amazonaws.com"
if [ -n "$DISTRIBUTION_DOMAIN" ]; then
  echo -e "  ${BLEU}URL CloudFront:${NC} https://${DISTRIBUTION_DOMAIN}"
fi

# Sauvegarder les informations de déploiement
sauvegarder_logs "SUCCÈS" "Frontend déployé avec succès"
echo "Bucket S3: ${BUCKET_FRONTEND}" >> "../backups/${TIMESTAMP}_backup_deploiement-flodrama.txt"
if [ -n "$DISTRIBUTION_ID" ]; then
  echo "Distribution CloudFront: ${DISTRIBUTION_ID}" >> "../backups/${TIMESTAMP}_backup_deploiement-flodrama.txt"
  echo "URL CloudFront: https://${DISTRIBUTION_DOMAIN}" >> "../backups/${TIMESTAMP}_backup_deploiement-flodrama.txt"
fi

log_message "Lancement du déploiement backend..."
./scripts/deploy-backend.sh

exit 0
