#!/bin/bash
# Script pour configurer les secrets GitHub nécessaires au déploiement de FloDrama
# Ce script utilise GitHub CLI (gh) pour configurer les secrets directement

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Fonction pour afficher un message avec une couleur
print_message() {
  echo -e "${2}${1}${NC}"
}

# Fonction pour afficher une bannière
print_banner() {
  echo -e "${BLUE}"
  echo "╔════════════════════════════════════════════════╗"
  echo "║                                                ║"
  echo "║   FloDrama - Configuration des Secrets GitHub  ║"
  echo "║                                                ║"
  echo "╚════════════════════════════════════════════════╝"
  echo -e "${NC}"
}

# Vérifier si GitHub CLI est installé
if ! command -v gh &> /dev/null; then
  print_message "❌ GitHub CLI (gh) n'est pas installé. Veuillez l'installer pour continuer." "$RED"
  print_message "   Vous pouvez l'installer avec: brew install gh" "$YELLOW"
  exit 1
fi

# Vérifier si l'utilisateur est connecté à GitHub
if ! gh auth status &> /dev/null; then
  print_message "❌ Vous n'êtes pas connecté à GitHub CLI. Veuillez vous connecter pour continuer." "$RED"
  print_message "   Vous pouvez vous connecter avec: gh auth login" "$YELLOW"
  exit 1
fi

# Afficher la bannière
print_banner

# Récupérer le nom du dépôt GitHub
REPO_PATH=$(git config --get remote.origin.url | sed 's/.*github.com[:\/]\(.*\)\.git/\1/')

if [ -z "$REPO_PATH" ]; then
  print_message "❌ Impossible de déterminer le dépôt GitHub. Veuillez le spécifier manuellement." "$RED"
  read -p "Entrez le nom du dépôt GitHub (format: utilisateur/repo): " REPO_PATH
fi

print_message "🔍 Configuration des secrets pour le dépôt: $REPO_PATH" "$BLUE"

# Demander les informations AWS
print_message "\n📋 Informations AWS requises:" "$YELLOW"
read -p "AWS Access Key ID: " AWS_ACCESS_KEY_ID
read -sp "AWS Secret Access Key: " AWS_SECRET_ACCESS_KEY
echo ""
read -p "AWS Account ID: " AWS_ACCOUNT_ID
read -p "AWS Lambda Role ARN (format: arn:aws:iam::123456789012:role/FloDramaLambdaRole): " AWS_LAMBDA_ROLE_ARN
read -p "AWS Region [us-east-1]: " AWS_REGION
AWS_REGION=${AWS_REGION:-us-east-1}

# Configurer les secrets GitHub
print_message "\n🔄 Configuration des secrets GitHub..." "$YELLOW"

# AWS Access Key ID
print_message "🔑 Configuration de AWS_ACCESS_KEY_ID..." "$YELLOW"
echo "$AWS_ACCESS_KEY_ID" | gh secret set AWS_ACCESS_KEY_ID --repo "$REPO_PATH"
if [ $? -eq 0 ]; then
  print_message "✅ AWS_ACCESS_KEY_ID configuré avec succès!" "$GREEN"
else
  print_message "❌ Erreur lors de la configuration de AWS_ACCESS_KEY_ID" "$RED"
fi

# AWS Secret Access Key
print_message "🔑 Configuration de AWS_SECRET_ACCESS_KEY..." "$YELLOW"
echo "$AWS_SECRET_ACCESS_KEY" | gh secret set AWS_SECRET_ACCESS_KEY --repo "$REPO_PATH"
if [ $? -eq 0 ]; then
  print_message "✅ AWS_SECRET_ACCESS_KEY configuré avec succès!" "$GREEN"
else
  print_message "❌ Erreur lors de la configuration de AWS_SECRET_ACCESS_KEY" "$RED"
fi

# AWS Account ID
print_message "🔑 Configuration de AWS_ACCOUNT_ID..." "$YELLOW"
echo "$AWS_ACCOUNT_ID" | gh secret set AWS_ACCOUNT_ID --repo "$REPO_PATH"
if [ $? -eq 0 ]; then
  print_message "✅ AWS_ACCOUNT_ID configuré avec succès!" "$GREEN"
else
  print_message "❌ Erreur lors de la configuration de AWS_ACCOUNT_ID" "$RED"
fi

# AWS Lambda Role ARN
print_message "🔑 Configuration de AWS_LAMBDA_ROLE_ARN..." "$YELLOW"
echo "$AWS_LAMBDA_ROLE_ARN" | gh secret set AWS_LAMBDA_ROLE_ARN --repo "$REPO_PATH"
if [ $? -eq 0 ]; then
  print_message "✅ AWS_LAMBDA_ROLE_ARN configuré avec succès!" "$GREEN"
else
  print_message "❌ Erreur lors de la configuration de AWS_LAMBDA_ROLE_ARN" "$RED"
fi

# Récapitulatif
print_message "\n📋 Récapitulatif des secrets configurés:" "$BLUE"
print_message "- AWS_ACCESS_KEY_ID" "$BLUE"
print_message "- AWS_SECRET_ACCESS_KEY" "$BLUE"
print_message "- AWS_ACCOUNT_ID" "$BLUE"
print_message "- AWS_LAMBDA_ROLE_ARN" "$BLUE"

print_message "\n✅ Configuration des secrets GitHub terminée avec succès!" "$GREEN"
print_message "Vous pouvez maintenant exécuter le workflow de déploiement GitHub Actions." "$GREEN"
print_message "Pour déclencher manuellement le workflow, utilisez:" "$YELLOW"
print_message "gh workflow run deploy.yml --repo $REPO_PATH" "$YELLOW"
