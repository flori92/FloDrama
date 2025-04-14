#!/bin/bash

# Script de configuration du plan de reprise d'activité pour FloDrama
# Ce script configure les sauvegardes automatiques et les procédures de restauration

set -e

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Configuration du plan de reprise d'activité pour FloDrama ===${NC}"

# Vérifier si AWS CLI est installé
if ! command -v aws &> /dev/null; then
    echo -e "${RED}AWS CLI n'est pas installé. Veuillez l'installer d'abord.${NC}"
    exit 1
fi

# Création du bucket de sauvegarde
BACKUP_BUCKET="flodrama-backups"
REGION="us-east-1"

echo -e "${YELLOW}Création du bucket de sauvegarde S3...${NC}"
aws s3api create-bucket \
    --bucket $BACKUP_BUCKET \
    --region $REGION

# Activer le versioning sur le bucket
aws s3api put-bucket-versioning \
    --bucket $BACKUP_BUCKET \
    --versioning-configuration Status=Enabled

# Configurer la réplication vers une autre région pour la redondance
REPLICA_BUCKET="flodrama-backups-replica"
echo -e "${YELLOW}Création du bucket de réplication S3...${NC}"
aws s3api create-bucket \
    --bucket $REPLICA_BUCKET \
    --region eu-west-3 \
    --create-bucket-configuration LocationConstraint=eu-west-3

# Activer le versioning sur le bucket de réplication
aws s3api put-bucket-versioning \
    --bucket $REPLICA_BUCKET \
    --versioning-configuration Status=Enabled

# Créer un rôle IAM pour la réplication
REPLICATION_ROLE="FloDrama-S3-Replication-Role"
echo -e "${YELLOW}Création du rôle IAM pour la réplication...${NC}"
aws iam create-role \
    --role-name $REPLICATION_ROLE \
    --assume-role-policy-document '{
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Principal": {
                    "Service": "s3.amazonaws.com"
                },
                "Action": "sts:AssumeRole"
            }
        ]
    }'

# Attacher la politique de réplication au rôle
aws iam put-role-policy \
    --role-name $REPLICATION_ROLE \
    --policy-name S3ReplicationPolicy \
    --policy-document '{
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": [
                    "s3:GetReplicationConfiguration",
                    "s3:ListBucket"
                ],
                "Resource": [
                    "arn:aws:s3:::flodrama-backups"
                ]
            },
            {
                "Effect": "Allow",
                "Action": [
                    "s3:GetObjectVersion",
                    "s3:GetObjectVersionAcl",
                    "s3:GetObjectVersionTagging"
                ],
                "Resource": [
                    "arn:aws:s3:::flodrama-backups/*"
                ]
            },
            {
                "Effect": "Allow",
                "Action": [
                    "s3:ReplicateObject",
                    "s3:ReplicateDelete",
                    "s3:ReplicateTags"
                ],
                "Resource": "arn:aws:s3:::flodrama-backups-replica/*"
            }
        ]
    }'

# Configurer la réplication
aws s3api put-bucket-replication \
    --bucket $BACKUP_BUCKET \
    --replication-configuration '{
        "Role": "arn:aws:iam::108782079729:role/FloDrama-S3-Replication-Role",
        "Rules": [
            {
                "Status": "Enabled",
                "Priority": 1,
                "DeleteMarkerReplication": { "Status": "Enabled" },
                "Destination": {
                    "Bucket": "arn:aws:s3:::flodrama-backups-replica",
                    "StorageClass": "STANDARD"
                }
            }
        ]
    }'

# Créer une règle de cycle de vie pour les sauvegardes
echo -e "${YELLOW}Configuration des règles de cycle de vie...${NC}"
aws s3api put-bucket-lifecycle-configuration \
    --bucket $BACKUP_BUCKET \
    --lifecycle-configuration '{
        "Rules": [
            {
                "ID": "ArchiveOldBackups",
                "Status": "Enabled",
                "Prefix": "daily/",
                "Transitions": [
                    {
                        "Days": 30,
                        "StorageClass": "STANDARD_IA"
                    },
                    {
                        "Days": 90,
                        "StorageClass": "GLACIER"
                    }
                ],
                "Expiration": {
                    "Days": 365
                }
            },
            {
                "ID": "DeleteOldVersions",
                "Status": "Enabled",
                "NoncurrentVersionExpiration": {
                    "NoncurrentDays": 90
                }
            }
        ]
    }'

# Créer un script de sauvegarde quotidienne
echo -e "${YELLOW}Création du script de sauvegarde quotidienne...${NC}"
cat > ./scripts/backup-quotidien.sh << 'EOL'
#!/bin/bash

# Script de sauvegarde quotidienne pour FloDrama
DATE=$(date +%Y-%m-%d)
BACKUP_BUCKET="flodrama-backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Sauvegarder la configuration Amplify
echo "Sauvegarde de la configuration Amplify..."
mkdir -p ./backups/$TIMESTAMP
amplify status > ./backups/$TIMESTAMP/amplify-status.txt
amplify env list > ./backups/$TIMESTAMP/amplify-env-list.txt
amplify meta > ./backups/$TIMESTAMP/amplify-meta.json

# Sauvegarder le code source
echo "Sauvegarde du code source..."
tar -czf ./backups/$TIMESTAMP/source-code.tar.gz --exclude="node_modules" --exclude=".git" --exclude="dist" --exclude="build" .

# Sauvegarder les données DynamoDB
echo "Sauvegarde des tables DynamoDB..."
aws dynamodb export-table-to-point-in-time \
    --table-arn arn:aws:dynamodb:us-east-1:108782079729:table/FloDrama-Users-production \
    --s3-bucket $BACKUP_BUCKET \
    --s3-prefix "daily/dynamodb/users/$DATE" \
    --export-format DYNAMODB_JSON

aws dynamodb export-table-to-point-in-time \
    --table-arn arn:aws:dynamodb:us-east-1:108782079729:table/FloDrama-Watchlist-production \
    --s3-bucket $BACKUP_BUCKET \
    --s3-prefix "daily/dynamodb/watchlist/$DATE" \
    --export-format DYNAMODB_JSON

aws dynamodb export-table-to-point-in-time \
    --table-arn arn:aws:dynamodb:us-east-1:108782079729:table/FloDrama-History-production \
    --s3-bucket $BACKUP_BUCKET \
    --s3-prefix "daily/dynamodb/history/$DATE" \
    --export-format DYNAMODB_JSON

# Uploader les sauvegardes locales vers S3
echo "Upload des sauvegardes vers S3..."
aws s3 cp ./backups/$TIMESTAMP s3://$BACKUP_BUCKET/daily/app-config/$DATE/ --recursive

echo "Sauvegarde terminée avec succès !"
EOL

chmod +x ./scripts/backup-quotidien.sh

# Créer un script de restauration
echo -e "${YELLOW}Création du script de restauration...${NC}"
cat > ./scripts/restauration.sh << 'EOL'
#!/bin/bash

# Script de restauration pour FloDrama
if [ $# -ne 1 ]; then
    echo "Usage: $0 <date-de-sauvegarde>"
    echo "Format de date: YYYY-MM-DD"
    exit 1
fi

RESTORE_DATE=$1
BACKUP_BUCKET="flodrama-backups"
RESTORE_DIR="./restore_$RESTORE_DATE"

# Créer un répertoire de restauration
mkdir -p $RESTORE_DIR

# Télécharger les sauvegardes de configuration
echo "Téléchargement des sauvegardes de configuration..."
aws s3 cp s3://$BACKUP_BUCKET/daily/app-config/$RESTORE_DATE/ $RESTORE_DIR/config/ --recursive

# Télécharger le code source
echo "Extraction du code source..."
tar -xzf $RESTORE_DIR/config/source-code.tar.gz -C $RESTORE_DIR/source

# Restaurer les tables DynamoDB si nécessaire
echo "Pour restaurer les tables DynamoDB, exécutez les commandes suivantes :"
echo "aws dynamodb import-table --s3-bucket-source SourceBucket=flodrama-backups,S3KeyPrefix=daily/dynamodb/users/$RESTORE_DATE --table-creation-parameters ..."
echo "aws dynamodb import-table --s3-bucket-source SourceBucket=flodrama-backups,S3KeyPrefix=daily/dynamodb/watchlist/$RESTORE_DATE --table-creation-parameters ..."
echo "aws dynamodb import-table --s3-bucket-source SourceBucket=flodrama-backups,S3KeyPrefix=daily/dynamodb/history/$RESTORE_DATE --table-creation-parameters ..."

echo "Restauration terminée. Les fichiers sont disponibles dans $RESTORE_DIR"
EOL

chmod +x ./scripts/restauration.sh

# Configurer une tâche CloudWatch Events pour exécuter la sauvegarde quotidienne
echo -e "${YELLOW}Configuration de la tâche de sauvegarde automatique...${NC}"
aws events put-rule \
    --name "FloDrama-DailyBackup" \
    --schedule-expression "cron(0 2 * * ? *)" \
    --state ENABLED

# Créer un document de procédure de reprise d'activité
echo -e "${YELLOW}Création de la documentation de reprise d'activité...${NC}"
cat > ./docs/PLAN_REPRISE_ACTIVITE.md << 'EOL'
# Plan de Reprise d'Activité FloDrama

## Objectifs

Ce document définit les procédures à suivre en cas d'incident majeur affectant l'application FloDrama. Il vise à minimiser l'impact sur les utilisateurs et à restaurer le service dans les meilleurs délais.

## Scénarios de sinistre

### Scénario 1: Perte de données

**Procédure de restauration:**
1. Identifier la dernière sauvegarde valide
2. Exécuter le script de restauration: `./scripts/restauration.sh YYYY-MM-DD`
3. Vérifier l'intégrité des données restaurées
4. Redéployer l'application si nécessaire

### Scénario 2: Indisponibilité de l'application

**Procédure de restauration:**
1. Vérifier les journaux CloudWatch pour identifier la cause
2. Si problème de configuration Amplify:
   - Restaurer la dernière configuration fonctionnelle
   - Redéployer avec `amplify publish`
3. Si problème d'infrastructure AWS:
   - Contacter le support AWS
   - Activer le site de secours si disponible

### Scénario 3: Faille de sécurité

**Procédure:**
1. Isoler les composants compromis
2. Révoquer les clés d'accès potentiellement compromises
3. Restaurer à partir d'une sauvegarde antérieure à la compromission
4. Appliquer les correctifs de sécurité nécessaires
5. Effectuer un audit de sécurité complet avant remise en service

## Contacts d'urgence

- Responsable technique: tech@flodrama.com
- Support AWS: https://console.aws.amazon.com/support/home
- Équipe de sécurité: security@flodrama.com

## Tests de reprise

Un test de reprise complet doit être effectué tous les trimestres pour valider les procédures et former l'équipe.

## Métriques de reprise

- **RPO (Recovery Point Objective)**: 24 heures maximum
- **RTO (Recovery Time Objective)**: 4 heures maximum
EOL

echo -e "${GREEN}Configuration du plan de reprise d'activité terminée !${NC}"
echo -e "${BLUE}=== Fin de la configuration ===${NC}"
