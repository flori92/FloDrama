#!/bin/bash

# Script de vérification SSL pour FloDrama
# Respecte l'identité visuelle avec le dégradé signature bleu-fuchsia (#3b82f6 → #d946ef)

echo -e "\033[38;2;59;130;246m╔════════════════════════════════════════════════════════════╗\033[0m"
echo -e "\033[38;2;59;130;246m║\033[38;2;217;70;239m            Vérification SSL pour FloDrama                 \033[38;2;59;130;246m║\033[0m"
echo -e "\033[38;2;59;130;246m╚════════════════════════════════════════════════════════════╝\033[0m"

# Vérification du certificat SSL
echo -e "\033[38;2;59;130;246m[1/3]\033[0m Vérification du certificat SSL pour flodrama.com..."
SSL_CHECK=$(curl -sI https://flodrama.com | head -n 1)

if [[ $SSL_CHECK == *"200 OK"* ]]; then
  echo -e "\033[38;2;217;70;239m✓\033[0m Le certificat SSL est correctement configuré !"
  echo -e "   Le site est accessible en HTTPS : \033[38;2;217;70;239mhttps://flodrama.com\033[0m"
elif [[ $SSL_CHECK == *"301 Moved Permanently"* ]]; then
  echo -e "\033[38;2;217;70;239m✓\033[0m Redirection HTTPS configurée, mais vérifiez la destination."
else
  echo -e "\033[38;2;217;70;239m!\033[0m Le certificat SSL n'est pas encore actif."
  echo -e "   Statut actuel : $SSL_CHECK"
  echo -e "   GitHub Pages peut prendre jusqu'à 24 heures pour émettre le certificat."
fi

# Vérification de la configuration GitHub Pages
echo -e "\033[38;2;59;130;246m[2/3]\033[0m Vérification de la configuration GitHub Pages..."
PAGES_CONFIG=$(gh api repos/flori92/FloDrama/pages 2>/dev/null)

if [[ $PAGES_CONFIG == *"\"https_enforced\":true"* ]]; then
  echo -e "\033[38;2;217;70;239m✓\033[0m HTTPS est activé dans la configuration GitHub Pages"
else
  echo -e "\033[38;2;217;70;239m!\033[0m HTTPS n'est pas encore activé dans la configuration GitHub Pages"
  echo -e "   Tentative d'activation HTTPS..."
  
  HTTPS_RESULT=$(gh api -X PUT repos/flori92/FloDrama/pages --input - << EOF
{
  "https_enforced": true
}
EOF 2>&1)
  
  if [[ $HTTPS_RESULT == *"certificate does not exist yet"* ]]; then
    echo -e "   \033[38;2;217;70;239m!\033[0m Le certificat SSL n'a pas encore été émis par GitHub Pages."
  elif [[ $HTTPS_RESULT == *"error"* || $HTTPS_RESULT == *"Error"* ]]; then
    echo -e "   \033[31m✗\033[0m Erreur lors de l'activation HTTPS: $HTTPS_RESULT"
  else
    echo -e "   \033[38;2;217;70;239m✓\033[0m HTTPS activé avec succès"
  fi
fi

# Instructions pour la période de transition
echo -e "\033[38;2;59;130;246m[3/3]\033[0m Instructions pour la période de transition..."
echo -e "En attendant l'activation complète du certificat SSL, vous pouvez :"
echo -e "1. Accéder au site via l'URL GitHub Pages standard :"
echo -e "   \033[38;2;217;70;239mhttps://flori92.github.io/FloDrama/\033[0m"
echo -e "2. Continuer à utiliser CloudFront temporairement si nécessaire"
echo -e "3. Vérifier régulièrement l'état du certificat SSL avec ce script"

echo -e "\033[38;2;59;130;246m╔════════════════════════════════════════════════════════════╗\033[0m"
echo -e "\033[38;2;59;130;246m║\033[38;2;217;70;239m                Vérification terminée                       \033[38;2;59;130;246m║\033[0m"
echo -e "\033[38;2;59;130;246m╚════════════════════════════════════════════════════════════╝\033[0m"
