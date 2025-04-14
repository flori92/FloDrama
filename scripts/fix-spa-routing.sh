#!/bin/bash

# Configuration des couleurs pour les logs
ROUGE='\033[0;31m'
VERT='\033[0;32m'
JAUNE='\033[1;33m'
NC='\033[0m'

# Configuration
BUCKET_FRONTEND="flodrama-app-bucket"
REGION="us-east-1"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/Users/floriace/Trae/sauvegardes/fix-spa-routing_${TIMESTAMP}"

# Fonction de logging
log() {
    local type=$1
    local message=$2
    local color=$NC
    
    case $type in
        "INFO") color=$VERT;;
        "WARN") color=$JAUNE;;
        "ERROR") color=$ROUGE;;
    esac
    
    echo -e "${color}[$(date '+%Y-%m-%d %H:%M:%S')] [$type] $message${NC}"
}

# Création d'une sauvegarde
creer_sauvegarde() {
    log "INFO" "Création d'une sauvegarde..."
    mkdir -p "$BACKUP_DIR"
    
    # Sauvegarde du service worker actuel sur S3
    aws s3 cp "s3://${BUCKET_FRONTEND}/service-worker.js" "${BACKUP_DIR}/service-worker.js.backup" || log "WARN" "Impossible de sauvegarder service-worker.js depuis S3"
    
    # Sauvegarde locale
    cp -f /Users/floriace/Trae/flodrama-react-lynx/public/service-worker.js "${BACKUP_DIR}/service-worker.js.local" || log "WARN" "Impossible de créer une sauvegarde locale"
    
    log "INFO" "Sauvegarde créée dans ${BACKUP_DIR}"
}

# Déploiement du service worker mis à jour
deployer_service_worker() {
    log "INFO" "Déploiement du service worker mis à jour..."
    
    # Vérifier si le bucket S3 existe
    if ! aws s3 ls "s3://${BUCKET_FRONTEND}" &> /dev/null; then
        log "ERROR" "Le bucket S3 ${BUCKET_FRONTEND} n'existe pas."
        return 1
    fi
    
    # Copier le service worker vers S3
    if aws s3 cp /Users/floriace/Trae/flodrama-react-lynx/public/service-worker.js "s3://${BUCKET_FRONTEND}/service-worker.js"; then
        log "INFO" "Service worker mis à jour avec succès"
    else
        log "ERROR" "Échec de la mise à jour du service worker"
        return 1
    fi
    
    # Trouver l'ID de distribution CloudFront
    DISTRIBUTION_ID=$(aws cloudfront list-distributions --query "DistributionList.Items[?Origins.Items[?DomainName=='${BUCKET_FRONTEND}.s3.amazonaws.com']].Id" --output text)
    
    if [ -n "$DISTRIBUTION_ID" ]; then
        # Invalider le cache CloudFront
        if aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/service-worker.js" "/*"; then
            log "INFO" "Invalidation CloudFront réussie pour la distribution $DISTRIBUTION_ID"
        else
            log "ERROR" "Échec de l'invalidation CloudFront"
            return 1
        fi
    else
        log "WARN" "Aucune distribution CloudFront trouvée pour ce bucket, l'invalidation du cache est ignorée"
    fi
    
    return 0
}

# Fonction principale
main() {
    log "INFO" "Début de la correction du routage SPA pour FloDrama..."
    
    # Créer une sauvegarde
    creer_sauvegarde
    
    # Déployer le service worker mis à jour
    if deployer_service_worker; then
        log "INFO" "Correction du routage SPA terminée avec succès"
    else
        log "ERROR" "Échec de la correction du routage SPA"
        return 1
    fi
    
    log "INFO" "Pour tester, accédez directement à https://flodrama.com/movies ou une autre route et vérifiez qu'il n'y a plus d'erreur JavaScript"
    
    return 0
}

# Exécution du script
main
