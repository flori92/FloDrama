#!/bin/bash

# Couleurs pour les messages
VERT='\033[0;32m'
ROUGE='\033[0;31m'
JAUNE='\033[0;33m'
BLEU='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages
afficher_message() {
  echo -e "${BLEU}[$(date +"%H:%M:%S")] ${1}${NC}"
}

# Fonction pour afficher les erreurs
afficher_erreur() {
  echo -e "${ROUGE}[$(date +"%H:%M:%S")] ERREUR: ${1}${NC}"
}

# Fonction pour afficher les succès
afficher_succes() {
  echo -e "${VERT}[$(date +"%H:%M:%S")] SUCCÈS: ${1}${NC}"
}

# ID de la distribution CloudFront
DISTRIBUTION_ID="E5XC74WR62W9Z"

# Nom du bucket S3
BUCKET_NAME="flodrama-app-bucket"

# Région AWS
REGION="eu-west-3"

# Vérifier les identifiants AWS
afficher_message "Vérification des identifiants AWS..."
if ! aws sts get-caller-identity &> /dev/null; then
  afficher_erreur "Les identifiants AWS ne sont pas configurés correctement. Exécutez 'aws configure' pour les configurer."
  exit 1
fi

# Créer un sujet SNS pour les alertes
afficher_message "Création du sujet SNS pour les alertes..."
SNS_TOPIC_ARN=$(aws sns create-topic --name FloDrama-Alertes --region $REGION --output json | jq -r '.TopicArn')

if [ -z "$SNS_TOPIC_ARN" ]; then
  afficher_erreur "Échec de la création du sujet SNS."
  exit 1
fi

afficher_succes "Sujet SNS créé avec succès: $SNS_TOPIC_ARN"

# Demander l'adresse e-mail pour les notifications
read -p "Entrez l'adresse e-mail pour recevoir les alertes: " EMAIL

# S'abonner à l'adresse e-mail
afficher_message "Abonnement de l'adresse e-mail $EMAIL aux alertes..."
SUBSCRIPTION_ARN=$(aws sns subscribe --topic-arn $SNS_TOPIC_ARN --protocol email --notification-endpoint $EMAIL --region $REGION --output json | jq -r '.SubscriptionArn')

afficher_message "Un e-mail de confirmation a été envoyé à $EMAIL. Veuillez confirmer l'abonnement pour recevoir les alertes."

# Créer une alarme pour les erreurs 5xx
afficher_message "Création d'une alarme pour les erreurs 5xx..."
aws cloudwatch put-metric-alarm \
  --alarm-name "FloDrama-5xxErrors" \
  --alarm-description "Alerte si le taux d'erreurs 5xx dépasse 5%" \
  --metric-name "5xxErrorRate" \
  --namespace "AWS/CloudFront" \
  --statistic "Average" \
  --dimensions Name=DistributionId,Value=$DISTRIBUTION_ID \
  --period 300 \
  --evaluation-periods 1 \
  --threshold 5 \
  --comparison-operator GreaterThanThreshold \
  --alarm-actions $SNS_TOPIC_ARN \
  --region $REGION

afficher_succes "Alarme pour les erreurs 5xx créée avec succès."

# Créer une alarme pour les erreurs 4xx
afficher_message "Création d'une alarme pour les erreurs 4xx..."
aws cloudwatch put-metric-alarm \
  --alarm-name "FloDrama-4xxErrors" \
  --alarm-description "Alerte si le taux d'erreurs 4xx dépasse 10%" \
  --metric-name "4xxErrorRate" \
  --namespace "AWS/CloudFront" \
  --statistic "Average" \
  --dimensions Name=DistributionId,Value=$DISTRIBUTION_ID \
  --period 300 \
  --evaluation-periods 1 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold \
  --alarm-actions $SNS_TOPIC_ARN \
  --region $REGION

afficher_succes "Alarme pour les erreurs 4xx créée avec succès."

# Créer une alarme pour la latence
afficher_message "Création d'une alarme pour la latence..."
aws cloudwatch put-metric-alarm \
  --alarm-name "FloDrama-Latence" \
  --alarm-description "Alerte si la latence dépasse 1000ms" \
  --metric-name "TotalRequestLatency" \
  --namespace "AWS/CloudFront" \
  --statistic "Average" \
  --dimensions Name=DistributionId,Value=$DISTRIBUTION_ID \
  --period 300 \
  --evaluation-periods 1 \
  --threshold 1000 \
  --comparison-operator GreaterThanThreshold \
  --alarm-actions $SNS_TOPIC_ARN \
  --region $REGION

afficher_succes "Alarme pour la latence créée avec succès."

# Créer un tableau de bord CloudWatch
afficher_message "Création d'un tableau de bord CloudWatch..."

# Définition du tableau de bord
DASHBOARD_BODY=$(cat <<EOF
{
  "widgets": [
    {
      "type": "metric",
      "x": 0,
      "y": 0,
      "width": 12,
      "height": 6,
      "properties": {
        "metrics": [
          [ "AWS/CloudFront", "Requests", "DistributionId", "$DISTRIBUTION_ID", "Region", "Global" ]
        ],
        "period": 300,
        "stat": "Sum",
        "region": "$REGION",
        "title": "Nombre de requêtes"
      }
    },
    {
      "type": "metric",
      "x": 12,
      "y": 0,
      "width": 12,
      "height": 6,
      "properties": {
        "metrics": [
          [ "AWS/CloudFront", "TotalErrorRate", "DistributionId", "$DISTRIBUTION_ID", "Region", "Global" ],
          [ ".", "4xxErrorRate", ".", ".", ".", "." ],
          [ ".", "5xxErrorRate", ".", ".", ".", "." ]
        ],
        "period": 300,
        "stat": "Average",
        "region": "$REGION",
        "title": "Taux d'erreurs"
      }
    },
    {
      "type": "metric",
      "x": 0,
      "y": 6,
      "width": 12,
      "height": 6,
      "properties": {
        "metrics": [
          [ "AWS/CloudFront", "BytesDownloaded", "DistributionId", "$DISTRIBUTION_ID", "Region", "Global" ]
        ],
        "period": 300,
        "stat": "Sum",
        "region": "$REGION",
        "title": "Octets téléchargés"
      }
    },
    {
      "type": "metric",
      "x": 12,
      "y": 6,
      "width": 12,
      "height": 6,
      "properties": {
        "metrics": [
          [ "AWS/CloudFront", "TotalRequestLatency", "DistributionId", "$DISTRIBUTION_ID", "Region", "Global" ]
        ],
        "period": 300,
        "stat": "Average",
        "region": "$REGION",
        "title": "Latence des requêtes"
      }
    }
  ]
}
EOF
)

# Créer le tableau de bord
aws cloudwatch put-dashboard \
  --dashboard-name "FloDrama-Dashboard" \
  --dashboard-body "$DASHBOARD_BODY" \
  --region $REGION

afficher_succes "Tableau de bord CloudWatch créé avec succès."

# Créer un budget AWS
afficher_message "Création d'un budget AWS..."

# Demander le montant maximum du budget
read -p "Entrez le montant maximum du budget mensuel en USD (par défaut: 50): " BUDGET_AMOUNT
BUDGET_AMOUNT=${BUDGET_AMOUNT:-50}

# Créer le budget
aws budgets create-budget \
  --account-id $(aws sts get-caller-identity --query "Account" --output text) \
  --budget "BudgetName=FloDrama-Budget,BudgetLimit={Amount=$BUDGET_AMOUNT,Unit=USD},TimeUnit=MONTHLY,BudgetType=COST,CostFilters={}" \
  --notification-with-subscribers "Notification={NotificationType=ACTUAL,ComparisonOperator=GREATER_THAN,Threshold=80,ThresholdType=PERCENTAGE},Subscribers=[{SubscriptionType=EMAIL,Address=$EMAIL}]" \
  --region $REGION

afficher_succes "Budget AWS créé avec succès."

afficher_message "Configuration de la surveillance terminée."
afficher_message "Vous pouvez accéder au tableau de bord CloudWatch à l'adresse suivante:"
afficher_message "https://$REGION.console.aws.amazon.com/cloudwatch/home?region=$REGION#dashboards:name=FloDrama-Dashboard"
