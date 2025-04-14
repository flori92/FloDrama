#!/bin/bash

# Configuration des couleurs pour les logs
ROUGE='\033[0;31m'
VERT='\033[0;32m'
JAUNE='\033[1;33m'
NC='\033[0m'

# Configuration
BUCKET_FRONTEND="flodrama-app-bucket"
REGION="us-east-1"
DISTRIBUTION_ID="" # Sera détecté automatiquement

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

# Vérification des prérequis
verifier_prerequis() {
    log "INFO" "Vérification des prérequis..."
    
    # Vérifier Node.js
    if ! command -v node &> /dev/null; then
        log "ERROR" "Node.js n'est pas installé"
        exit 1
    fi
    
    # Vérifier npm
    if ! command -v npm &> /dev/null; then
        log "ERROR" "npm n'est pas installé"
        exit 1
    fi
    
    # Vérifier AWS CLI
    if ! command -v aws &> /dev/null; then
        log "ERROR" "AWS CLI n'est pas installé"
        exit 1
    fi
    
    # Vérifier les accès AWS
    if ! aws sts get-caller-identity &> /dev/null; then
        log "ERROR" "Impossible de se connecter à AWS. Vérifiez vos credentials."
        exit 1
    fi
}

# Création d'une sauvegarde
creer_sauvegarde() {
    log "INFO" "Création d'une sauvegarde..."
    
    BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p $BACKUP_DIR
    
    # Sauvegarder les fichiers importants
    cp -r build/ $BACKUP_DIR/build 2>/dev/null || true
    cp -r dist/ $BACKUP_DIR/dist 2>/dev/null || true
    
    log "INFO" "Sauvegarde créée dans $BACKUP_DIR"
}

# Build de l'application
build_application() {
    log "INFO" "Build de l'application..."
    
    if npm run build; then
        log "INFO" "Build réussi"
        return 0
    else
        log "ERROR" "Échec du build"
        return 1
    fi
}

# Déploiement web sur AWS
deployer_web() {
    log "INFO" "Déploiement de la version web sur AWS..."
    
    # Vérifier si le bucket S3 existe
    if ! aws s3 ls "s3://${BUCKET_FRONTEND}" &> /dev/null; then
        log "ERROR" "Le bucket S3 ${BUCKET_FRONTEND} n'existe pas. Veuillez utiliser le bucket existant."
        return 1
    fi
    
    # Synchroniser avec S3
    if aws s3 sync dist/ "s3://${BUCKET_FRONTEND}" --delete; then
        log "INFO" "Synchronisation S3 réussie"
    else
        log "ERROR" "Échec de la synchronisation S3"
        return 1
    fi
    
    # Vérifier si la distribution CloudFront existe
    DISTRIBUTION_ID=$(aws cloudfront list-distributions --query "DistributionList.Items[?Aliases.Items!=null] | [?contains(Aliases.Items, '${BUCKET_FRONTEND}.s3-website-${REGION}.amazonaws.com')].Id" --output text)
    
    if [ -z "$DISTRIBUTION_ID" ]; then
        # Essayer de trouver la distribution par l'origine S3
        DISTRIBUTION_ID=$(aws cloudfront list-distributions --query "DistributionList.Items[?Origins.Items[?DomainName=='${BUCKET_FRONTEND}.s3.amazonaws.com']].Id" --output text)
    fi
    
    if [ -n "$DISTRIBUTION_ID" ]; then
        # Invalider le cache CloudFront
        if aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/*"; then
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
    log "INFO" "=== DÉPLOIEMENT FLODRAMA LYNX ==="
    
    # Vérifier les prérequis
    verifier_prerequis
    
    # Créer une sauvegarde
    creer_sauvegarde
    
    # Variables pour suivre les résultats
    RESULTAT_BUILD="échec"
    RESULTAT_DEPLOY="échec"
    
    # Build de l'application
    if build_application; then
        RESULTAT_BUILD="succès"
        
        # Déploiement web
        if deployer_web; then
            RESULTAT_DEPLOY="succès"
        fi
    fi
    
    # Afficher le résumé
    log "INFO" "=== RÉSUMÉ DU DÉPLOIEMENT ==="
    
    if [ "$RESULTAT_BUILD" == "succès" ]; then
        log "INFO" "Build: $RESULTAT_BUILD"
    else
        log "ERROR" "Build: $RESULTAT_BUILD"
    fi
    
    if [ "$RESULTAT_DEPLOY" == "succès" ]; then
        log "INFO" "Déploiement: $RESULTAT_DEPLOY"
    else
        log "ERROR" "Déploiement: $RESULTAT_DEPLOY"
    fi
    
    # Vérifier si tout a réussi
    if [ "$RESULTAT_BUILD" == "succès" ] && [ "$RESULTAT_DEPLOY" == "succès" ]; then
        log "INFO" "Déploiement terminé avec succès"
        return 0
    else
        log "ERROR" "Le déploiement a échoué"
        return 1
    fi
}

# Exécution du script
main
