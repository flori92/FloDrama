#!/bin/bash
# Script de vérification des composants visuels et animations de FloDrama
# Auteur: Cascade AI
# Date: 2025-04-08

# Couleurs pour les logs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Vérification des composants visuels et animations de FloDrama ===${NC}"

# Créer un dossier pour les logs
LOG_DIR="logs"
mkdir -p $LOG_DIR
LOG_FILE="$LOG_DIR/verification-composants-$(date +%Y%m%d_%H%M%S).log"

# Fonction pour logger les actions
log() {
    echo -e "$1" | tee -a $LOG_FILE
}

# 1. Vérification des fichiers de composants
log "${BLUE}1. Vérification des fichiers de composants...${NC}"

# Liste des composants essentiels à vérifier
COMPOSANTS=(
    "src/components/ui/AnimatedElement.tsx"
    "src/components/ui/HoverPreview.tsx"
    "src/components/ui/MainNavigation.tsx"
    "src/components/ui/ContentCard.tsx"
    "src/components/ui/FeaturedCarousel.tsx"
    "src/components/ui/ContentRow.tsx"
    "src/components/ui/ContentSection.tsx"
    "src/components/ui/HeroBanner.tsx"
    "src/components/HomePage.tsx"
    "src/styles/theme.scss"
)

COMPOSANTS_MANQUANTS=()
for composant in "${COMPOSANTS[@]}"; do
    if [ ! -f "$composant" ]; then
        COMPOSANTS_MANQUANTS+=("$composant")
        log "${RED}Composant manquant: $composant${NC}"
    else
        log "${GREEN}Composant trouvé: $composant${NC}"
    fi
done

# 2. Vérification des animations dans les fichiers
log "${BLUE}2. Vérification des animations dans les fichiers...${NC}"

# Liste des animations à vérifier
ANIMATIONS=(
    "fade-in"
    "slide-up"
    "slide-down"
    "slide-left"
    "slide-right"
    "zoom-in"
    "zoom-out"
    "bounce"
    "pulse"
    "rotate"
)

for animation in "${ANIMATIONS[@]}"; do
    FICHIERS_AVEC_ANIMATION=$(grep -r "$animation" --include="*.tsx" --include="*.scss" src/ | wc -l)
    if [ "$FICHIERS_AVEC_ANIMATION" -gt 0 ]; then
        log "${GREEN}Animation '$animation' trouvée dans $FICHIERS_AVEC_ANIMATION fichiers${NC}"
    else
        log "${RED}Animation '$animation' non trouvée dans les fichiers${NC}"
    fi
done

# 3. Vérification des effets de survol
log "${BLUE}3. Vérification des effets de survol...${NC}"

# Liste des effets de survol à vérifier
EFFETS_SURVOL=(
    "hover:"
    "onMouseEnter"
    "onMouseLeave"
    "whileHover"
)

for effet in "${EFFETS_SURVOL[@]}"; do
    FICHIERS_AVEC_EFFET=$(grep -r "$effet" --include="*.tsx" --include="*.scss" src/ | wc -l)
    if [ "$FICHIERS_AVEC_EFFET" -gt 0 ]; then
        log "${GREEN}Effet de survol '$effet' trouvé dans $FICHIERS_AVEC_EFFET fichiers${NC}"
    else
        log "${RED}Effet de survol '$effet' non trouvé dans les fichiers${NC}"
    fi
done

# 4. Vérification des variables de couleur
log "${BLUE}4. Vérification des variables de couleur...${NC}"

# Liste des couleurs principales à vérifier
COULEURS=(
    "primary-color"
    "secondary-color"
    "background-color"
    "text-color"
    "gradient-primary"
)

for couleur in "${COULEURS[@]}"; do
    if grep -q "$couleur" src/styles/theme.scss; then
        log "${GREEN}Variable de couleur '$couleur' trouvée dans theme.scss${NC}"
    else
        log "${RED}Variable de couleur '$couleur' non trouvée dans theme.scss${NC}"
    fi
done

# 5. Vérification des polices
log "${BLUE}5. Vérification des polices...${NC}"

# Liste des polices à vérifier
POLICES=(
    "Poppins"
    "font-family"
    "font-weight"
)

for police in "${POLICES[@]}"; do
    FICHIERS_AVEC_POLICE=$(grep -r "$police" --include="*.tsx" --include="*.scss" --include="*.css" src/ | wc -l)
    if [ "$FICHIERS_AVEC_POLICE" -gt 0 ]; then
        log "${GREEN}Police '$police' trouvée dans $FICHIERS_AVEC_POLICE fichiers${NC}"
    else
        log "${RED}Police '$police' non trouvée dans les fichiers${NC}"
    fi
done

# 6. Vérification des mixins
log "${BLUE}6. Vérification des mixins...${NC}"

# Liste des mixins à vérifier
MIXINS=(
    "button-primary"
    "button-secondary"
    "card-hover"
    "gradient-text"
)

for mixin in "${MIXINS[@]}"; do
    if grep -q "$mixin" src/styles/theme.scss; then
        log "${GREEN}Mixin '$mixin' trouvé dans theme.scss${NC}"
    else
        log "${RED}Mixin '$mixin' non trouvé dans theme.scss${NC}"
    fi
done

# 7. Vérification des composants importés dans HomePage
log "${BLUE}7. Vérification des composants importés dans HomePage...${NC}"

# Liste des composants qui devraient être importés dans HomePage
IMPORTS=(
    "MainNavigation"
    "HeroBanner"
    "FeaturedCarousel"
    "ContentRow"
    "ContentSection"
    "AnimatedElement"
    "Footer"
)

for import in "${IMPORTS[@]}"; do
    if grep -q "import.*$import" src/components/HomePage.tsx; then
        log "${GREEN}Import de '$import' trouvé dans HomePage.tsx${NC}"
    else
        log "${RED}Import de '$import' non trouvé dans HomePage.tsx${NC}"
    fi
done

# 8. Génération d'un rapport de vérification
log "${BLUE}8. Génération d'un rapport de vérification...${NC}"

REPORT_DIR="rapports"
mkdir -p $REPORT_DIR
REPORT_FILE="$REPORT_DIR/rapport-verification-composants-$(date +%Y%m%d_%H%M%S).md"

cat > $REPORT_FILE << EOF
# Rapport de vérification des composants visuels et animations de FloDrama

## Date: $(date +"%d/%m/%Y %H:%M:%S")

## Résumé

Ce rapport documente la vérification des composants visuels, animations et effets de survol de FloDrama.

## Composants vérifiés

EOF

if [ ${#COMPOSANTS_MANQUANTS[@]} -eq 0 ]; then
    echo "✅ Tous les composants essentiels sont présents." >> $REPORT_FILE
else
    echo "❌ Composants manquants:" >> $REPORT_FILE
    for composant in "${COMPOSANTS_MANQUANTS[@]}"; do
        echo "   - $composant" >> $REPORT_FILE
    done
fi

cat >> $REPORT_FILE << EOF

## Animations vérifiées

EOF

for animation in "${ANIMATIONS[@]}"; do
    FICHIERS_AVEC_ANIMATION=$(grep -r "$animation" --include="*.tsx" --include="*.scss" src/ | wc -l)
    if [ "$FICHIERS_AVEC_ANIMATION" -gt 0 ]; then
        echo "✅ Animation '$animation' trouvée dans $FICHIERS_AVEC_ANIMATION fichiers" >> $REPORT_FILE
    else
        echo "❌ Animation '$animation' non trouvée dans les fichiers" >> $REPORT_FILE
    fi
done

cat >> $REPORT_FILE << EOF

## Effets de survol vérifiés

EOF

for effet in "${EFFETS_SURVOL[@]}"; do
    FICHIERS_AVEC_EFFET=$(grep -r "$effet" --include="*.tsx" --include="*.scss" src/ | wc -l)
    if [ "$FICHIERS_AVEC_EFFET" -gt 0 ]; then
        echo "✅ Effet de survol '$effet' trouvé dans $FICHIERS_AVEC_EFFET fichiers" >> $REPORT_FILE
    else
        echo "❌ Effet de survol '$effet' non trouvé dans les fichiers" >> $REPORT_FILE
    fi
done

cat >> $REPORT_FILE << EOF

## Variables de couleur vérifiées

EOF

for couleur in "${COULEURS[@]}"; do
    if grep -q "$couleur" src/styles/theme.scss; then
        echo "✅ Variable de couleur '$couleur' trouvée dans theme.scss" >> $REPORT_FILE
    else
        echo "❌ Variable de couleur '$couleur' non trouvée dans theme.scss" >> $REPORT_FILE
    fi
done

cat >> $REPORT_FILE << EOF

## Polices vérifiées

EOF

for police in "${POLICES[@]}"; do
    FICHIERS_AVEC_POLICE=$(grep -r "$police" --include="*.tsx" --include="*.scss" --include="*.css" src/ | wc -l)
    if [ "$FICHIERS_AVEC_POLICE" -gt 0 ]; then
        echo "✅ Police '$police' trouvée dans $FICHIERS_AVEC_POLICE fichiers" >> $REPORT_FILE
    else
        echo "❌ Police '$police' non trouvée dans les fichiers" >> $REPORT_FILE
    fi
done

cat >> $REPORT_FILE << EOF

## Mixins vérifiés

EOF

for mixin in "${MIXINS[@]}"; do
    if grep -q "$mixin" src/styles/theme.scss; then
        echo "✅ Mixin '$mixin' trouvé dans theme.scss" >> $REPORT_FILE
    else
        echo "❌ Mixin '$mixin' non trouvé dans theme.scss" >> $REPORT_FILE
    fi
done

cat >> $REPORT_FILE << EOF

## Imports vérifiés dans HomePage

EOF

for import in "${IMPORTS[@]}"; do
    if grep -q "import.*$import" src/components/HomePage.tsx; then
        echo "✅ Import de '$import' trouvé dans HomePage.tsx" >> $REPORT_FILE
    else
        echo "❌ Import de '$import' non trouvé dans HomePage.tsx" >> $REPORT_FILE
    fi
done

cat >> $REPORT_FILE << EOF

## Recommandations

1. Pour tous les éléments marqués ❌, vérifier les fichiers correspondants et les restaurer si nécessaire.
2. Tester l'application dans différents navigateurs pour s'assurer que les animations fonctionnent correctement.
3. Vérifier la performance des animations sur les appareils mobiles.
4. S'assurer que les effets de survol sont accessibles et respectent les normes WCAG.

## Conclusion

Ce rapport fournit une vue d'ensemble de l'état actuel des composants visuels et animations de FloDrama. Utilisez-le comme référence pour compléter la restauration du front-end.
EOF

log "${GREEN}Rapport de vérification créé: $REPORT_FILE${NC}"

# 9. Lancer un serveur de développement pour tester visuellement
log "${BLUE}9. Lancement d'un serveur de développement pour tester visuellement...${NC}"
echo -e "${YELLOW}Pour lancer le serveur de développement, exécutez la commande suivante:${NC}"
echo -e "${YELLOW}cd $(pwd) && npm run dev${NC}"

echo -e "${GREEN}=== Vérification des composants visuels et animations de FloDrama terminée ===${NC}"
echo -e "${YELLOW}Consultez le rapport pour plus de détails: $REPORT_FILE${NC}"
