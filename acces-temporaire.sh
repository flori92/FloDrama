#!/bin/bash

# Script d'accès temporaire à FloDrama pendant la migration
# Respecte l'identité visuelle avec le dégradé signature bleu-fuchsia (#3b82f6 → #d946ef)

echo -e "\033[38;2;59;130;246m╔════════════════════════════════════════════════════════════╗\033[0m"
echo -e "\033[38;2;59;130;246m║\033[38;2;217;70;239m            Accès temporaire à FloDrama                    \033[38;2;59;130;246m║\033[0m"
echo -e "\033[38;2;59;130;246m╚════════════════════════════════════════════════════════════╝\033[0m"

# Vérification de l'état du déploiement
echo -e "\033[38;2;59;130;246m[1/3]\033[0m Vérification de l'état du déploiement temporaire..."
DEPLOY_STATUS=$(gh api repos/flori92/FloDrama/pages/builds/latest | jq -r '.status')

if [[ $DEPLOY_STATUS == "built" ]]; then
  echo -e "\033[38;2;217;70;239m✓\033[0m Version temporaire déployée avec succès"
else
  echo -e "\033[38;2;217;70;239m!\033[0m Déploiement en cours (statut: $DEPLOY_STATUS)"
  echo -e "   Veuillez patienter quelques minutes..."
  
  # Tentative de déclenchement d'un nouveau build
  gh api -X POST repos/flori92/FloDrama/pages/builds > /dev/null
  echo -e "\033[38;2;217;70;239m✓\033[0m Nouveau déploiement déclenché"
fi

# Configuration de l'accès temporaire
echo -e "\033[38;2;59;130;246m[2/3]\033[0m Configuration de l'accès temporaire..."

# Vérification de la branche actuelle
CURRENT_BRANCH=$(git branch --show-current)
if [[ $CURRENT_BRANCH != "acces-temporaire" ]]; then
  echo -e "\033[38;2;217;70;239m!\033[0m Basculement vers la branche d'accès temporaire..."
  git checkout acces-temporaire
else
  echo -e "\033[38;2;217;70;239m✓\033[0m Déjà sur la branche d'accès temporaire"
fi

# Vérification de l'absence du fichier CNAME
if [ -f "CNAME" ]; then
  echo -e "\033[38;2;217;70;239m!\033[0m Suppression du fichier CNAME pour éviter la redirection..."
  git rm CNAME
  git commit -m "🔧 [CONFIG] Suppression temporaire du CNAME pour accès direct"
  git push origin acces-temporaire
else
  echo -e "\033[38;2;217;70;239m✓\033[0m Fichier CNAME absent, pas de redirection"
fi

# Instructions pour l'accès temporaire
echo -e "\033[38;2;59;130;246m[3/3]\033[0m Instructions pour l'accès temporaire..."
echo -e "Pour accéder à FloDrama sans redirection, utilisez l'URL suivante :"
echo -e "\033[38;2;217;70;239mhttps://flori92.github.io/FloDrama/\033[0m"
echo -e ""
echo -e "Cette URL devrait fonctionner dans les prochaines minutes (temps de déploiement GitHub)."
echo -e "Si vous êtes toujours redirigé vers flodrama.com, essayez :"
echo -e "1. Vider le cache de votre navigateur"
echo -e "2. Utiliser une fenêtre de navigation privée"
echo -e "3. Attendre quelques minutes supplémentaires pour la propagation"

echo -e "\033[38;2;59;130;246m╔════════════════════════════════════════════════════════════╗\033[0m"
echo -e "\033[38;2;59;130;246m║\033[38;2;217;70;239m                Configuration terminée                      \033[38;2;59;130;246m║\033[0m"
echo -e "\033[38;2;59;130;246m╚════════════════════════════════════════════════════════════╝\033[0m"
echo -e "Pour revenir à la configuration normale une fois le certificat SSL actif :"
echo -e "\033[38;2;217;70;239mgit checkout github-pages-clean\033[0m"
