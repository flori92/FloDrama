#!/bin/bash

# Script d'inventaire des ressources AWS pour FloDrama
# Ce script liste toutes les ressources AWS existantes pour le projet

echo "✨ [CHORE] Inventaire des ressources AWS pour FloDrama"

# Configuration
REGION="eu-west-3"  # Région Paris

echo "🔍 Recherche des buckets S3..."
aws s3 ls

echo ""
echo "🔍 Recherche des distributions CloudFront..."
aws cloudfront list-distributions --query "DistributionList.Items[].{Id:Id, Domain:DomainName, Origin:Origins.Items[0].DomainName, Enabled:Enabled}" --output table

echo ""
echo "🔍 Recherche des API Gateway..."
aws apigateway get-rest-apis --query "items[].{Id:id, Name:name}" --output table

echo ""
echo "✅ Inventaire terminé."
