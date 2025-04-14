#!/bin/bash

# Script de diagnostic et correction des problèmes SSL pour FloDrama
# Ce script aide à identifier et résoudre les problèmes de certificat SSL

echo "🔒 Diagnostic et correction des problèmes SSL pour FloDrama"
echo "==========================================================="

# Couleurs pour l'identité visuelle FloDrama
BLUE="#3b82f6"
FUCHSIA="#d946ef"

# Fonction pour afficher les messages avec le style FloDrama
function flodrama_echo() {
  echo -e "\033[38;2;59;130;246m▶\033[0m \033[38;2;217;70;239m$1\033[0m"
}

# Vérifier le domaine
DOMAIN="flodrama.com"
flodrama_echo "Vérification du domaine $DOMAIN..."

# Vérifier les enregistrements DNS
flodrama_echo "Vérification des enregistrements DNS..."
echo "Enregistrements A:"
dig +short A $DOMAIN

echo "Enregistrements CNAME:"
dig +short CNAME $DOMAIN
dig +short CNAME www.$DOMAIN

# Vérifier la configuration SSL
flodrama_echo "Vérification du certificat SSL..."
echo "Informations sur le certificat:"
echo | openssl s_client -servername $DOMAIN -connect $DOMAIN:443 2>/dev/null | openssl x509 -noout -text | grep -A 2 "Subject Alternative Name"

# Vérifier la redirection HTTP vers HTTPS
flodrama_echo "Vérification de la redirection HTTP vers HTTPS..."
curl -I -L http://$DOMAIN

# Vérifier les en-têtes de sécurité
flodrama_echo "Vérification des en-têtes de sécurité..."
curl -I -L https://$DOMAIN

# Recommandations pour GitHub Pages
flodrama_echo "Recommandations pour GitHub Pages:"
echo "1. Assurez-vous que le fichier CNAME existe dans le dossier public/ ou à la racine du dépôt"
echo "2. Dans les paramètres du dépôt GitHub, vérifiez que:"
echo "   - Le domaine personnalisé est configuré comme $DOMAIN"
echo "   - L'option 'Enforce HTTPS' est activée"
echo "3. Attendez que GitHub génère automatiquement un certificat SSL (peut prendre jusqu'à 24h)"

# Recommandations pour CloudFront
flodrama_echo "Recommandations pour CloudFront:"
echo "1. Vérifiez que le certificat SSL dans AWS Certificate Manager couvre $DOMAIN"
echo "2. Assurez-vous que la distribution CloudFront est configurée avec:"
echo "   - Le bon certificat SSL"
echo "   - Les comportements de cache appropriés"
echo "   - La redirection HTTP vers HTTPS"

# Vérification de la fonction Lambda security-headers
flodrama_echo "Vérification de la fonction Lambda security-headers..."
if [ -f "../src/lambda/security-headers.js" ]; then
  echo "✅ La fonction Lambda security-headers existe"
  echo "Assurez-vous qu'elle est correctement déployée et associée à la distribution CloudFront"
else
  echo "❌ La fonction Lambda security-headers n'existe pas"
fi

echo ""
flodrama_echo "Résumé des actions à entreprendre:"
echo "1. Appliquer la configuration DNS recommandée chez votre registraire de domaine"
echo "2. Vérifier la configuration GitHub Pages ou CloudFront selon votre hébergement"
echo "3. Attendre la propagation DNS et la génération du certificat SSL (24-48h)"
echo "4. Vérifier à nouveau avec les outils de test SSL (SSL Labs, Security Headers)"

echo ""
echo "🎉 Une fois ces étapes terminées, votre site FloDrama devrait être accessible en HTTPS!"
