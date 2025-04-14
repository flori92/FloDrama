#!/bin/bash
# Script de finalisation du déploiement Vercel
# Auteur: Cascade AI
# Date: 2025-04-07

# Couleurs pour les logs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Finalisation du déploiement Vercel ===${NC}"

# Récupérer l'URL du déploiement
echo -e "${YELLOW}Récupération de l'URL du déploiement Vercel...${NC}"
VERCEL_URL=$(vercel ls --prod | grep -m 1 "https://" | awk '{print $2}')

if [ -z "$VERCEL_URL" ]; then
    echo -e "${RED}Impossible de récupérer l'URL du déploiement Vercel.${NC}"
    echo -e "${YELLOW}Veuillez entrer manuellement l'URL du déploiement Vercel :${NC}"
    read -p "URL Vercel : " VERCEL_URL
fi

echo -e "${GREEN}URL du déploiement Vercel : $VERCEL_URL${NC}"

# Mettre à jour le script de test avec la nouvelle URL
echo -e "${YELLOW}Mise à jour du script de test avec la nouvelle URL...${NC}"
sed -i '' "s|VERCEL_URL=\"https://.*\"|VERCEL_URL=\"$VERCEL_URL\"|g" ./scripts/tester-deploiement-vercel.sh

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Script de test mis à jour avec succès${NC}"
else
    echo -e "${RED}❌ Erreur lors de la mise à jour du script de test${NC}"
fi

# Tester le déploiement
echo -e "${YELLOW}Test du déploiement...${NC}"
./scripts/tester-deploiement-vercel.sh

# Mise à jour du fichier de documentation
echo -e "${YELLOW}Mise à jour de la documentation...${NC}"
cat > ./docs/deploiement-reussi.md << EOF
# Déploiement réussi sur Vercel

## Informations de déploiement

- **URL de production** : $VERCEL_URL
- **Date de déploiement** : $(date +"%Y-%m-%d %H:%M:%S")
- **Méthode de déploiement** : GitHub Integration

## Accès au tableau de bord Vercel

Pour accéder au tableau de bord Vercel et gérer votre déploiement :

1. Rendez-vous sur [https://vercel.com/dashboard](https://vercel.com/dashboard)
2. Connectez-vous avec vos identifiants
3. Sélectionnez le projet "flodrama"

## Prochaines étapes

1. **Configuration d'un domaine personnalisé** :
   - Exécutez \`./scripts/configurer-domaine-vercel.sh\` pour configurer un domaine personnalisé

2. **Nettoyage des ressources AWS** :
   - Exécutez \`./scripts/nettoyer-ressources-aws.sh\` pour nettoyer les ressources AWS inutiles

3. **Mise à jour du contenu** :
   - Modifiez le fichier \`public/index.html\` pour mettre à jour le contenu de la page d'accueil
   - Déployez les modifications en les poussant sur GitHub

## Résolution des problèmes

Si vous rencontrez des problèmes avec le déploiement :

1. Vérifiez les logs de déploiement sur le tableau de bord Vercel
2. Exécutez \`./scripts/tester-deploiement-vercel.sh\` pour tester l'accessibilité du site
3. Consultez la documentation Vercel : [https://vercel.com/docs](https://vercel.com/docs)
EOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Documentation mise à jour avec succès${NC}"
else
    echo -e "${RED}❌ Erreur lors de la mise à jour de la documentation${NC}"
fi

# Commit des modifications
echo -e "${YELLOW}Commit des modifications...${NC}"
git add ./scripts/tester-deploiement-vercel.sh ./docs/deploiement-reussi.md
git commit -m "📝 [DOC] Mise à jour de la documentation et des scripts avec la nouvelle URL de déploiement"
git push origin main

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Modifications commitées et poussées avec succès${NC}"
else
    echo -e "${RED}❌ Erreur lors du commit des modifications${NC}"
fi

echo -e "${GREEN}=== Finalisation terminée ===${NC}"
echo -e "${YELLOW}Votre déploiement Vercel est maintenant configuré et documenté.${NC}"
echo -e "${YELLOW}Consultez ./docs/deploiement-reussi.md pour plus d'informations.${NC}"
