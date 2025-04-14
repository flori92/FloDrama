#!/bin/bash

# Script pour configurer le domaine flodrama.com directement dans Vercel
# Cette approche contourne les problèmes de configuration CloudFront

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Variables
DOMAIN="flodrama.com"
PROJECT="flodrama-app"
TEAM="flodrama-projects"
TIMESTAMP=$(date +%s)

echo -e "${GREEN}[$(date +"%Y-%m-%d %H:%M:%S")] Configuration du domaine $DOMAIN directement dans Vercel${NC}"

# Étape 1: Vérifier si le domaine est déjà configuré dans Vercel
echo -e "${GREEN}[$(date +"%Y-%m-%d %H:%M:%S")] Vérification de la configuration actuelle...${NC}"
vercel domains inspect $DOMAIN --scope $TEAM

# Étape 2: Ajouter le domaine au projet Vercel
echo -e "${GREEN}[$(date +"%Y-%m-%d %H:%M:%S")] Ajout du domaine $DOMAIN au projet $PROJECT...${NC}"
vercel domains add $DOMAIN --scope $TEAM

# Étape 3: Récupérer les instructions de vérification
echo -e "${GREEN}[$(date +"%Y-%m-%d %H:%M:%S")] Récupération des instructions de vérification...${NC}"
VERIFICATION=$(vercel domains verify $DOMAIN --scope $TEAM)

echo -e "${YELLOW}$VERIFICATION${NC}"

# Étape 4: Configurer les enregistrements DNS dans Route 53
echo -e "${GREEN}[$(date +"%Y-%m-%d %H:%M:%S")] Configuration des enregistrements DNS dans Route 53...${NC}"

# Récupérer l'ID de la zone hébergée pour flodrama.com
HOSTED_ZONE_ID=$(aws route53 list-hosted-zones --query "HostedZones[?Name=='flodrama.com.'].Id" --output text | cut -d'/' -f3)

if [ -z "$HOSTED_ZONE_ID" ]; then
    echo -e "${RED}[ERREUR] Impossible de trouver la zone hébergée pour $DOMAIN${NC}"
    exit 1
fi

echo -e "${YELLOW}Zone hébergée ID: $HOSTED_ZONE_ID${NC}"

# Créer un fichier de changement pour Route 53
cat > /tmp/route53-changes-$TIMESTAMP.json << EOF
{
  "Changes": [
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "$DOMAIN",
        "Type": "A",
        "TTL": 300,
        "ResourceRecords": [
          {
            "Value": "76.76.21.21"
          }
        ]
      }
    },
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "www.$DOMAIN",
        "Type": "CNAME",
        "TTL": 300,
        "ResourceRecords": [
          {
            "Value": "cname.vercel-dns.com"
          }
        ]
      }
    }
  ]
}
EOF

# Appliquer les changements
aws route53 change-resource-record-sets --hosted-zone-id $HOSTED_ZONE_ID --change-batch file:///tmp/route53-changes-$TIMESTAMP.json

if [ $? -ne 0 ]; then
    echo -e "${RED}[ERREUR] Échec de la mise à jour des enregistrements DNS${NC}"
    exit 1
fi

echo -e "${GREEN}[$(date +"%Y-%m-%d %H:%M:%S")] Configuration DNS terminée avec succès!${NC}"
echo -e "${YELLOW}La propagation des modifications DNS peut prendre jusqu'à 48 heures.${NC}"
echo -e "${YELLOW}Une fois la propagation terminée, $DOMAIN pointera directement vers votre application Vercel.${NC}"

# Nettoyage
rm -f /tmp/route53-changes-$TIMESTAMP.json

exit 0
