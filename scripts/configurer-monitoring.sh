#!/bin/bash

# Script de configuration du monitoring et de la sécurité pour FloDrama
# Ce script configure CloudWatch et AWS WAF pour surveiller et protéger l'application

set -e

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Configuration du monitoring et de la sécurité pour FloDrama ===${NC}"

# Vérifier si AWS CLI est installé
if ! command -v aws &> /dev/null; then
    echo -e "${RED}AWS CLI n'est pas installé. Veuillez l'installer d'abord.${NC}"
    exit 1
fi

# Obtenir l'ID de l'application Amplify
APP_ID=$(aws amplify list-apps --query "apps[?name=='FloDrama'].appId" --output text)
if [ -z "$APP_ID" ]; then
    echo -e "${RED}Application FloDrama non trouvée dans AWS Amplify.${NC}"
    exit 1
fi

# Obtenir l'ID de la distribution CloudFront
CF_DIST_ID=$(aws cloudfront list-distributions --query "DistributionList.Items[?Aliases.Items[?contains(@, 'flodrama.com')]].Id" --output text)
if [ -z "$CF_DIST_ID" ]; then
    echo -e "${YELLOW}Distribution CloudFront pour flodrama.com non trouvée. Utilisation de la distribution par défaut d'Amplify.${NC}"
    CF_DIST_ID=$(aws cloudfront list-distributions --query "DistributionList.Items[?Comment=='Created by AWS Amplify'].Id" --output text | head -n 1)
fi

echo -e "${YELLOW}Configuration des alarmes CloudWatch...${NC}"

# Créer une alarme pour les erreurs 5xx
aws cloudwatch put-metric-alarm \
    --alarm-name "FloDrama-5xxErrors" \
    --alarm-description "Alerte pour les erreurs 5xx sur FloDrama" \
    --metric-name "5xxErrorRate" \
    --namespace "AWS/CloudFront" \
    --statistic "Average" \
    --dimensions Name=DistributionId,Value=$CF_DIST_ID Name=Region,Value=Global \
    --period 300 \
    --evaluation-periods 1 \
    --threshold 5 \
    --comparison-operator GreaterThanThreshold \
    --alarm-actions "arn:aws:sns:us-east-1:108782079729:FloDrama-Alerts" \
    --ok-actions "arn:aws:sns:us-east-1:108782079729:FloDrama-Alerts"

# Créer une alarme pour les erreurs 4xx
aws cloudwatch put-metric-alarm \
    --alarm-name "FloDrama-4xxErrors" \
    --alarm-description "Alerte pour les erreurs 4xx sur FloDrama" \
    --metric-name "4xxErrorRate" \
    --namespace "AWS/CloudFront" \
    --statistic "Average" \
    --dimensions Name=DistributionId,Value=$CF_DIST_ID Name=Region,Value=Global \
    --period 300 \
    --evaluation-periods 1 \
    --threshold 20 \
    --comparison-operator GreaterThanThreshold \
    --alarm-actions "arn:aws:sns:us-east-1:108782079729:FloDrama-Alerts" \
    --ok-actions "arn:aws:sns:us-east-1:108782079729:FloDrama-Alerts"

# Créer une alarme pour le temps de latence
aws cloudwatch put-metric-alarm \
    --alarm-name "FloDrama-Latency" \
    --alarm-description "Alerte pour la latence élevée sur FloDrama" \
    --metric-name "TotalLatency" \
    --namespace "AWS/CloudFront" \
    --statistic "Average" \
    --dimensions Name=DistributionId,Value=$CF_DIST_ID Name=Region,Value=Global \
    --period 300 \
    --evaluation-periods 1 \
    --threshold 1000 \
    --comparison-operator GreaterThanThreshold \
    --alarm-actions "arn:aws:sns:us-east-1:108782079729:FloDrama-Alerts" \
    --ok-actions "arn:aws:sns:us-east-1:108782079729:FloDrama-Alerts"

echo -e "${YELLOW}Configuration de AWS WAF...${NC}"

# Créer un ACL Web pour WAF
WEB_ACL_ID=$(aws wafv2 create-web-acl \
    --name "FloDrama-WebACL" \
    --scope "CLOUDFRONT" \
    --default-action Allow={} \
    --visibility-config SampledRequestsEnabled=true,CloudWatchMetricsEnabled=true,MetricName=FloDramaWebACL \
    --rules '[
        {
            "Name": "AWSManagedRulesCommonRuleSet",
            "Priority": 0,
            "Statement": {
                "ManagedRuleGroupStatement": {
                    "VendorName": "AWS",
                    "Name": "AWSManagedRulesCommonRuleSet"
                }
            },
            "OverrideAction": {
                "None": {}
            },
            "VisibilityConfig": {
                "SampledRequestsEnabled": true,
                "CloudWatchMetricsEnabled": true,
                "MetricName": "AWSManagedRulesCommonRuleSet"
            }
        },
        {
            "Name": "AWSManagedRulesKnownBadInputsRuleSet",
            "Priority": 1,
            "Statement": {
                "ManagedRuleGroupStatement": {
                    "VendorName": "AWS",
                    "Name": "AWSManagedRulesKnownBadInputsRuleSet"
                }
            },
            "OverrideAction": {
                "None": {}
            },
            "VisibilityConfig": {
                "SampledRequestsEnabled": true,
                "CloudWatchMetricsEnabled": true,
                "MetricName": "AWSManagedRulesKnownBadInputsRuleSet"
            }
        },
        {
            "Name": "RateLimit",
            "Priority": 2,
            "Statement": {
                "RateBasedStatement": {
                    "Limit": 1000,
                    "AggregateKeyType": "IP"
                }
            },
            "Action": {
                "Block": {}
            },
            "VisibilityConfig": {
                "SampledRequestsEnabled": true,
                "CloudWatchMetricsEnabled": true,
                "MetricName": "RateLimit"
            }
        }
    ]' \
    --region us-east-1 \
    --query "Summary.WebACLId" \
    --output text)

# Associer le WAF à la distribution CloudFront
aws wafv2 associate-web-acl \
    --web-acl-arn "arn:aws:wafv2:us-east-1:108782079729:global/webacl/FloDrama-WebACL/$WEB_ACL_ID" \
    --resource-arn "arn:aws:cloudfront::108782079729:distribution/$CF_DIST_ID" \
    --region us-east-1

echo -e "${YELLOW}Configuration des budgets AWS...${NC}"

# Créer un budget pour surveiller les coûts
aws budgets create-budget \
    --account-id 108782079729 \
    --budget "BudgetName=FloDrama-Monthly,BudgetLimit={Amount=100,Unit=USD},TimeUnit=MONTHLY,BudgetType=COST,CostFilters={Service=[AWSAmplify,AmazonCloudFront,AmazonS3,AmazonDynamoDB]}" \
    --notification-with-subscribers "Notification={NotificationType=ACTUAL,ComparisonOperator=GREATER_THAN,Threshold=80,ThresholdType=PERCENTAGE},Subscribers=[{SubscriptionType=EMAIL,Address=admin@flodrama.com}]"

echo -e "${GREEN}Configuration du monitoring et de la sécurité terminée !${NC}"
echo -e "${BLUE}=== Fin de la configuration ===${NC}"
