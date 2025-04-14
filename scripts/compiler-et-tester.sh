#!/bin/bash
# Script de compilation et de test de FloDrama
# Créé le $(date +"%Y-%m-%d")

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

# Se positionner dans le répertoire du projet
cd "$(dirname "$0")/.." || exit 1

# Vérifier si Node.js est installé
if ! command -v node &> /dev/null; then
  afficher_erreur "Node.js n'est pas installé. Veuillez l'installer avant de continuer."
  exit 1
fi

# Vérifier si npm est installé
if ! command -v npm &> /dev/null; then
  afficher_erreur "npm n'est pas installé. Veuillez l'installer avant de continuer."
  exit 1
fi

# Vérifier les dépendances
afficher_message "Vérification des dépendances..."
if ! npm ls --depth=0 &> /dev/null; then
  afficher_message "Installation des dépendances manquantes..."
  if npm install; then
    afficher_succes "Dépendances installées avec succès."
  else
    afficher_erreur "Erreur lors de l'installation des dépendances."
    exit 1
  fi
else
  afficher_succes "Toutes les dépendances sont installées."
fi

# Vérification des erreurs TypeScript
afficher_message "Vérification des erreurs TypeScript..."
if npm run typecheck &> /dev/null; then
  afficher_succes "Aucune erreur TypeScript détectée."
else
  afficher_erreur "Des erreurs TypeScript ont été détectées. Correction en cours..."
  npm run typecheck
  echo -e "${JAUNE}Veuillez corriger les erreurs TypeScript avant de continuer.${NC}"
  exit 1
fi

# Exécution des tests
afficher_message "Exécution des tests..."
if npm test; then
  afficher_succes "Tous les tests ont réussi."
else
  afficher_erreur "Certains tests ont échoué."
  echo -e "${JAUNE}Veuillez corriger les tests avant de continuer.${NC}"
  exit 1
fi

# Compilation du projet
afficher_message "Compilation du projet..."
if npm run build; then
  afficher_succes "Compilation réussie."
else
  afficher_erreur "Erreur lors de la compilation."
  exit 1
fi

# Création d'une sauvegarde
afficher_message "Création d'une sauvegarde..."
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="backups/${TIMESTAMP}_backup_build"
mkdir -p "$BACKUP_DIR"

# Copie des fichiers de build dans le répertoire de sauvegarde
cp -r dist/* "$BACKUP_DIR/"
afficher_succes "Sauvegarde créée dans $BACKUP_DIR"

# Création d'un commit Git
afficher_message "Création d'un commit Git..."
if git add .; then
  if git commit -m "✨ [BUILD] Compilation réussie du $(date +"%Y-%m-%d")"; then
    afficher_succes "Commit créé avec succès."
    
    # Push vers le dépôt distant
    afficher_message "Push vers le dépôt distant..."
    if git push origin HEAD; then
      afficher_succes "Push réussi."
    else
      afficher_erreur "Erreur lors du push. Génération d'un rapport d'erreur..."
      echo "Erreur de push Git du $(date)" > "backups/${TIMESTAMP}_erreur_push.txt"
      git status >> "backups/${TIMESTAMP}_erreur_push.txt"
      git remote -v >> "backups/${TIMESTAMP}_erreur_push.txt"
      echo -e "${JAUNE}Un rapport d'erreur a été généré dans backups/${TIMESTAMP}_erreur_push.txt${NC}"
    fi
  else
    afficher_erreur "Erreur lors de la création du commit."
  fi
else
  afficher_erreur "Erreur lors de l'ajout des fichiers au commit."
fi

afficher_message "Processus de compilation et de test terminé."
echo -e "${VERT}L'application est prête à être déployée.${NC}"
echo -e "${JAUNE}Pour déployer l'application sur AWS, exécutez:${NC}"
echo -e "${BLEU}bash scripts/deployer-aws.sh${NC}"

exit 0
