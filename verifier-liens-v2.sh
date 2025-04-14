#!/bin/bash

# Script de vérification des liens pour FloDrama
# Respecte l'identité visuelle avec le dégradé signature bleu-fuchsia (#3b82f6 → #d946ef)

echo -e "\033[38;2;59;130;246m╔════════════════════════════════════════════════════════════╗\033[0m"
echo -e "\033[38;2;59;130;246m║\033[38;2;217;70;239m        Vérification des liens pour FloDrama               \033[38;2;59;130;246m║\033[0m"
echo -e "\033[38;2;59;130;246m╚════════════════════════════════════════════════════════════╝\033[0m"

# Fonction pour afficher les messages d'étape
function etape() {
  echo -e "\033[38;2;59;130;246m[$1/$2]\033[0m $3"
}

# Fonction pour afficher les succès
function succes() {
  echo -e "\033[38;2;217;70;239m✓\033[0m $1"
}

# Fonction pour afficher les avertissements
function avertissement() {
  echo -e "\033[38;2;217;70;239m!\033[0m $1"
}

# Fonction pour afficher les erreurs
function erreur() {
  echo -e "\033[31m✗\033[0m $1"
}

# Fonction pour vérifier un fichier local
function verifier_fichier_local() {
  local fichier="$1"
  local description="$2"
  
  # Enlever le préfixe /FloDrama/ pour la vérification locale
  local chemin_local="${fichier#/FloDrama/}"
  
  if [ -f "$chemin_local" ]; then
    succes "$description: $fichier (fichier local existant)"
    return 0
  else
    erreur "$description: $fichier (fichier local manquant)"
    return 1
  fi
}

# Fonction pour vérifier une URL
function verifier_url() {
  local url="$1"
  local description="$2"
  local statut
  
  # Vérifier si l'URL est valide
  statut=$(curl -s -o /dev/null -w "%{http_code}" "$url")
  
  if [ "$statut" == "200" ] || [ "$statut" == "301" ] || [ "$statut" == "302" ]; then
    succes "$description: $url (statut HTTP $statut)"
    return 0
  else
    erreur "$description: $url (statut HTTP $statut)"
    return 1
  fi
}

# 1. Vérification des liens de navigation
etape 1 4 "Vérification des liens de navigation..."

# Liste des fichiers de navigation à vérifier
nav_files=(
  "/FloDrama/index.html:Lien Accueil"
  "/FloDrama/dramas.html:Lien Dramas"
  "/FloDrama/films.html:Lien Films"
  "/FloDrama/animes.html:Lien Animés"
  "/FloDrama/bollywood.html:Lien Bollywood"
  "/FloDrama/ma-liste.html:Lien Ma Liste"
  "/FloDrama/app.html:Lien App"
  "/FloDrama/contact.html:Lien Contact"
)

# Vérification de chaque fichier de navigation
erreurs_nav=0
for item in "${nav_files[@]}"; do
  IFS=':' read -r fichier description <<< "$item"
  if ! verifier_fichier_local "$fichier" "$description"; then
    ((erreurs_nav++))
  fi
done

if [ $erreurs_nav -eq 0 ]; then
  succes "Tous les liens de navigation sont valides"
else
  avertissement "$erreurs_nav liens de navigation sont invalides"
fi

# 2. Vérification des liens du footer
etape 2 4 "Vérification des liens du footer..."

# Liste des fichiers du footer à vérifier
footer_files=(
  "/FloDrama/a-propos.html:Lien À propos"
  "/FloDrama/conditions.html:Lien Conditions d'utilisation"
  "/FloDrama/confidentialite.html:Lien Confidentialité"
  "/FloDrama/contact.html:Lien Contact (footer)"
)

# Vérification de chaque fichier du footer
erreurs_footer=0
for item in "${footer_files[@]}"; do
  IFS=':' read -r fichier description <<< "$item"
  if ! verifier_fichier_local "$fichier" "$description"; then
    ((erreurs_footer++))
  fi
done

if [ $erreurs_footer -eq 0 ]; then
  succes "Tous les liens du footer sont valides"
else
  avertissement "$erreurs_footer liens du footer sont invalides"
fi

# 3. Vérification des adresses email
etape 3 4 "Vérification des adresses email..."

# Liste des adresses email à vérifier
email_addresses=(
  "contact@flodrama.com:Email de contact"
  "suggestions@flodrama.com:Email de suggestions"
  "privacy@flodrama.com:Email de confidentialité"
  "legal@flodrama.com:Email légal"
)

# Vérification de chaque adresse email (format seulement)
erreurs_email=0
for item in "${email_addresses[@]}"; do
  IFS=':' read -r email description <<< "$item"
  if [[ $email =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
    succes "$description: $email (format valide)"
  else
    erreur "$description: $email (format invalide)"
    ((erreurs_email++))
  fi
done

if [ $erreurs_email -eq 0 ]; then
  succes "Toutes les adresses email sont valides"
else
  avertissement "$erreurs_email adresses email sont invalides"
fi

# 4. Vérification des ressources statiques
etape 4 4 "Vérification des ressources statiques..."

# Liste des ressources statiques à vérifier
static_files=(
  "/FloDrama/logo.svg:Logo SVG"
  "/FloDrama/logo192.png:Logo PNG"
  "/FloDrama/manifest.json:Manifest JSON"
)

# Vérification de chaque ressource statique
erreurs_static=0
for item in "${static_files[@]}"; do
  IFS=':' read -r fichier description <<< "$item"
  if ! verifier_fichier_local "$fichier" "$description"; then
    ((erreurs_static++))
  fi
done

if [ $erreurs_static -eq 0 ]; then
  succes "Toutes les ressources statiques sont valides"
else
  avertissement "$erreurs_static ressources statiques sont invalides"
fi

# Vérification des URLs externes
etape "+" 4 "Vérification des URLs externes..."

# Liste des URLs externes à vérifier
external_urls=(
  "https://flori92.github.io/FloDrama/:URL GitHub Pages"
  "https://flodrama.com:URL du domaine personnalisé"
)

# Vérification de chaque URL externe
erreurs_url=0
for item in "${external_urls[@]}"; do
  IFS=':' read -r url description <<< "$item"
  if ! verifier_url "$url" "$description"; then
    ((erreurs_url++))
  fi
done

if [ $erreurs_url -eq 0 ]; then
  succes "Toutes les URLs externes sont accessibles"
else
  avertissement "$erreurs_url URLs externes ne sont pas accessibles"
fi

# Résumé des résultats
echo -e "\033[38;2;59;130;246m╔════════════════════════════════════════════════════════════╗\033[0m"
echo -e "\033[38;2;59;130;246m║\033[38;2;217;70;239m                Résumé des vérifications                    \033[38;2;59;130;246m║\033[0m"
echo -e "\033[38;2;59;130;246m╚════════════════════════════════════════════════════════════╝\033[0m"

total_erreurs=$((erreurs_nav + erreurs_footer + erreurs_email + erreurs_static + erreurs_url))
total_verifications=$((${#nav_files[@]} + ${#footer_files[@]} + ${#email_addresses[@]} + ${#static_files[@]} + ${#external_urls[@]}))

if [ $total_erreurs -eq 0 ]; then
  echo -e "\033[38;2;217;70;239m✓\033[0m Tous les liens ($total_verifications) sont valides !"
else
  echo -e "\033[31m✗\033[0m $total_erreurs liens sur $total_verifications sont invalides"
  
  # Suggestions de correction
  echo -e "\033[38;2;59;130;246m[Suggestions]\033[0m Voici comment corriger les problèmes :"
  
  if [ $erreurs_nav -gt 0 ]; then
    echo -e "1. Vérifiez que tous les fichiers HTML de navigation existent dans le dépôt GitHub"
    echo -e "   Assurez-vous que tous les liens commencent par /FloDrama/"
  fi
  
  if [ $erreurs_footer -gt 0 ]; then
    echo -e "2. Vérifiez que tous les fichiers HTML du footer existent dans le dépôt GitHub"
    echo -e "   Assurez-vous que tous les liens commencent par /FloDrama/"
  fi
  
  if [ $erreurs_static -gt 0 ]; then
    echo -e "3. Vérifiez que toutes les ressources statiques (logo, manifest) existent dans le dépôt GitHub"
    echo -e "   Assurez-vous que les chemins sont corrects et commencent par /FloDrama/"
  fi
  
  if [ $erreurs_url -gt 0 ]; then
    echo -e "4. Vérifiez que le site est accessible via GitHub Pages et le domaine personnalisé"
    echo -e "   Le certificat SSL peut être encore en cours de propagation (jusqu'à 24h)"
  fi
fi

# Vérification de la redirection vers HTTPS
echo -e "\n\033[38;2;59;130;246m[Vérification HTTPS]\033[0m Vérification de la redirection vers HTTPS..."
https_status=$(curl -s -o /dev/null -w "%{http_code}" "https://flodrama.com")

if [ "$https_status" == "200" ] || [ "$https_status" == "301" ] || [ "$https_status" == "302" ]; then
  succes "Le site est accessible en HTTPS (statut HTTP $https_status)"
else
  avertissement "Le site n'est pas encore accessible en HTTPS (statut HTTP $https_status)"
  echo -e "   Le certificat SSL est probablement encore en cours de propagation"
  echo -e "   Cela peut prendre jusqu'à 24 heures après la configuration DNS"
fi
