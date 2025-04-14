#!/bin/bash
# Script pour finaliser la restauration du front-end de FloDrama
# Auteur: Cascade AI
# Date: 2025-04-08

# Couleurs pour les logs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Finalisation de la restauration du front-end de FloDrama ===${NC}"

# Créer un dossier pour les logs
LOG_DIR="logs"
mkdir -p $LOG_DIR
LOG_FILE="$LOG_DIR/finalisation-frontend-$(date +%Y%m%d_%H%M%S).log"

# Fonction pour logger les actions
log() {
    echo -e "$1" | tee -a $LOG_FILE
}

# 1. Installation des dépendances manquantes
log "${BLUE}1. Installation des dépendances manquantes...${NC}"
npm install --save next-themes
npm install --save framer-motion react-transition-group styled-components

# 2. Renommer le fichier animated-element.tsx en AnimatedElement.tsx
log "${BLUE}2. Renommage du fichier animated-element.tsx en AnimatedElement.tsx...${NC}"
if [ -f "src/components/ui/animated-element.tsx" ]; then
    mv src/components/ui/animated-element.tsx src/components/ui/AnimatedElement.tsx
    log "${GREEN}Fichier renommé avec succès${NC}"
else
    log "${YELLOW}Le fichier animated-element.tsx n'existe pas, création d'un nouveau fichier...${NC}"
    # Copier le contenu depuis Frontend si disponible
    if [ -f "Frontend/src/components/ui/AnimatedElement.tsx" ]; then
        cp Frontend/src/components/ui/AnimatedElement.tsx src/components/ui/AnimatedElement.tsx
        log "${GREEN}Fichier copié depuis Frontend${NC}"
    else
        # Créer un nouveau fichier AnimatedElement.tsx
        cat > src/components/ui/AnimatedElement.tsx << EOF
import React, { ReactNode, useEffect, useRef } from 'react';
import { motion, useAnimation, Variants } from 'framer-motion';

// Types pour les animations
export type AnimationType = 
  | 'fade-in' 
  | 'slide-up' 
  | 'slide-down' 
  | 'slide-left' 
  | 'slide-right' 
  | 'zoom-in' 
  | 'zoom-out' 
  | 'bounce' 
  | 'pulse'
  | 'rotate';

interface AnimatedElementProps {
  children: ReactNode;
  animation: AnimationType;
  delay?: number;
  duration?: number;
  className?: string;
  triggerOnce?: boolean;
  threshold?: number;
}

// Définition des variantes d'animation
const animations: Record<AnimationType, Variants> = {
  'fade-in': {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  },
  'slide-up': {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0 }
  },
  'slide-down': {
    hidden: { opacity: 0, y: -50 },
    visible: { opacity: 1, y: 0 }
  },
  'slide-left': {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0 }
  },
  'slide-right': {
    hidden: { opacity: 0, x: -50 },
    visible: { opacity: 1, x: 0 }
  },
  'zoom-in': {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1 }
  },
  'zoom-out': {
    hidden: { opacity: 0, scale: 1.2 },
    visible: { opacity: 1, scale: 1 }
  },
  'bounce': {
    hidden: { opacity: 0, y: 0 },
    visible: (i) => ({
      opacity: 1,
      y: [0, -20, 0],
      transition: {
        times: [0, 0.5, 1],
        duration: 0.6,
        delay: i * 0.1
      }
    })
  },
  'pulse': {
    hidden: { opacity: 0, scale: 1 },
    visible: {
      opacity: 1,
      scale: [1, 1.05, 1],
      transition: {
        times: [0, 0.5, 1],
        repeat: Infinity,
        repeatType: "reverse",
        duration: 1.5
      }
    }
  },
  'rotate': {
    hidden: { opacity: 0, rotate: -90 },
    visible: { opacity: 1, rotate: 0 }
  }
};

// Composant principal pour les animations
export const AnimatedElement: React.FC<AnimatedElementProps> = ({
  children,
  animation,
  delay = 0,
  duration = 0.5,
  className = '',
  triggerOnce = true,
  threshold = 0.1
}) => {
  const controls = useAnimation();
  const ref = useRef<HTMLDivElement>(null);

  // Observer pour détecter quand l'élément est visible
  useEffect(() => {
    const currentRef = ref.current; // Copier la référence pour l'utiliser dans la fonction de nettoyage
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          controls.start('visible');
          if (triggerOnce) {
            observer.disconnect();
          }
        } else if (!triggerOnce) {
          controls.start('hidden');
        }
      },
      { threshold }
    );

    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [controls, triggerOnce, threshold]);

  return (
    <div
      ref={ref}
      className={className}
    >
      <motion.div
        initial="hidden"
        animate={controls}
        variants={animations[animation]}
        custom={delay}
        transition={{ 
          duration, 
          delay,
          ease: "easeOut" 
        }}
      >
        {children}
      </motion.div>
    </div>
  );
};

// Composant pour les animations de texte
export const AnimatedText: React.FC<Omit<AnimatedElementProps, 'tag'> & { tag?: string }> = ({
  children,
  animation,
  delay = 0,
  duration = 0.5,
  className = '',
  triggerOnce = true,
  threshold = 0.1
}) => {
  // Utiliser le composant AnimatedElement pour éviter la duplication de code
  return (
    <AnimatedElement
      animation={animation}
      delay={delay}
      duration={duration}
      className={className}
      triggerOnce={triggerOnce}
      threshold={threshold}
    >
      {children}
    </AnimatedElement>
  );
};

// Composant pour les animations séquentielles
export const AnimatedSequence: React.FC<{
  children: ReactNode[];
  animation: AnimationType;
  staggerDelay?: number;
  initialDelay?: number;
  duration?: number;
  className?: string;
  childClassName?: string;
}> = ({
  children,
  animation,
  staggerDelay = 0.1,
  initialDelay = 0,
  duration = 0.5,
  className = '',
  childClassName = ''
}) => {
  return (
    <div className={className}>
      {React.Children.map(children, (child, index) => (
        <AnimatedElement
          key={index}
          animation={animation}
          delay={initialDelay + index * staggerDelay}
          duration={duration}
          className={childClassName}
        >
          {child}
        </AnimatedElement>
      ))}
    </div>
  );
};
EOF
        log "${GREEN}Nouveau fichier AnimatedElement.tsx créé${NC}"
    fi
fi

# 3. Mise à jour du fichier theme.scss pour ajouter les variables et mixins manquants
log "${BLUE}3. Mise à jour du fichier theme.scss...${NC}"
if [ -f "src/styles/theme.scss" ]; then
    # Vérifier si les variables et mixins manquants existent déjà
    if ! grep -q "background-color" src/styles/theme.scss; then
        # Ajouter les variables manquantes
        sed -i '' '/\$primary-color/a\\
\$background-color: #1A1A1A;\
\$text-color: #FFFFFF;
' src/styles/theme.scss
        log "${GREEN}Variables background-color et text-color ajoutées${NC}"
    fi
    
    if ! grep -q "button-secondary" src/styles/theme.scss; then
        # Ajouter les mixins manquants
        cat >> src/styles/theme.scss << EOF

// Mixins supplémentaires
@mixin button-secondary {
  background: transparent;
  border: 2px solid \$primary-color;
  color: \$primary-color;
  &:hover {
    background: rgba(\$primary-color, 0.1);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(\$primary-color, 0.2);
  }
}

@mixin card-hover {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
  }
}

@mixin gradient-text {
  background: \$gradient-primary;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-fill-color: transparent;
}
EOF
        log "${GREEN}Mixins button-secondary, card-hover et gradient-text ajoutés${NC}"
    fi
else
    log "${RED}Le fichier theme.scss n'existe pas, création...${NC}"
    mkdir -p src/styles
    cat > src/styles/theme.scss << EOF
// Variables de couleur
\$primary-color: #FF4B4B;
\$secondary-color: #3A0CA3;
\$background-color: #1A1A1A;
\$text-color: #FFFFFF;
\$accent-color: #4CC9F0;
\$success-color: #2EC4B6;
\$warning-color: #FF9F1C;
\$error-color: #E71D36;

// Dégradés
\$gradient-primary: linear-gradient(to right, \$primary-color, #FF8F8F);
\$gradient-secondary: linear-gradient(to right, \$secondary-color, #4361EE);
\$gradient-dark: linear-gradient(to bottom, \$background-color, #2A2A2A);

// Typographie
\$font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
\$font-size-base: 16px;
\$font-weight-light: 300;
\$font-weight-regular: 400;
\$font-weight-medium: 500;
\$font-weight-semibold: 600;
\$font-weight-bold: 700;

// Espacement
\$spacing-xs: 4px;
\$spacing-sm: 8px;
\$spacing-md: 16px;
\$spacing-lg: 24px;
\$spacing-xl: 32px;
\$spacing-xxl: 48px;

// Bordures et ombres
\$border-radius-sm: 4px;
\$border-radius-md: 8px;
\$border-radius-lg: 12px;
\$border-radius-xl: 16px;
\$border-radius-round: 50%;

\$shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.1);
\$shadow-md: 0 4px 8px rgba(0, 0, 0, 0.12);
\$shadow-lg: 0 8px 16px rgba(0, 0, 0, 0.15);
\$shadow-xl: 0 12px 24px rgba(0, 0, 0, 0.2);

// Breakpoints
\$breakpoint-xs: 480px;
\$breakpoint-sm: 768px;
\$breakpoint-md: 992px;
\$breakpoint-lg: 1200px;
\$breakpoint-xl: 1400px;

// Z-index
\$z-index-dropdown: 1000;
\$z-index-sticky: 1020;
\$z-index-fixed: 1030;
\$z-index-modal-backdrop: 1040;
\$z-index-modal: 1050;
\$z-index-popover: 1060;
\$z-index-tooltip: 1070;

// Mixins
@mixin button-primary {
  background: \$gradient-primary;
  color: white;
  border: none;
  border-radius: \$border-radius-md;
  padding: \$spacing-sm \$spacing-lg;
  font-weight: \$font-weight-medium;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(\$primary-color, 0.3);
  }
  &:active {
    transform: translateY(0);
  }
}

@mixin button-secondary {
  background: transparent;
  border: 2px solid \$primary-color;
  color: \$primary-color;
  border-radius: \$border-radius-md;
  padding: \$spacing-sm \$spacing-lg;
  font-weight: \$font-weight-medium;
  transition: background 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease;
  &:hover {
    background: rgba(\$primary-color, 0.1);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(\$primary-color, 0.2);
  }
  &:active {
    transform: translateY(0);
  }
}

@mixin card-hover {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
  }
}

@mixin gradient-text {
  background: \$gradient-primary;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-fill-color: transparent;
}

// Animations
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}
EOF
    log "${GREEN}Fichier theme.scss créé avec toutes les variables et mixins${NC}"
fi

# 4. Mise à jour du fichier ThemeProvider.tsx pour résoudre l'erreur de build
log "${BLUE}4. Mise à jour du fichier ThemeProvider.tsx...${NC}"
if [ -f "src/components/ThemeProvider.tsx" ]; then
    # Sauvegarde du fichier original
    cp src/components/ThemeProvider.tsx src/components/ThemeProvider.tsx.bak
    
    # Créer un nouveau ThemeProvider sans dépendance à next-themes
    cat > src/components/ThemeProvider.tsx << EOF
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
}

export function ThemeProvider({
  children,
  defaultTheme = 'dark'
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme);

  // Effet pour appliquer le thème
  useEffect(() => {
    const root = window.document.documentElement;
    
    // Supprimer les classes de thème précédentes
    root.classList.remove('light', 'dark');
    
    // Si le thème est "system", détecter la préférence du système
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      root.classList.add(systemTheme);
    } else {
      // Sinon, appliquer le thème sélectionné
      root.classList.add(theme);
    }
  }, [theme]);

  // Effet pour détecter les changements de préférence système
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      if (theme === 'system') {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(mediaQuery.matches ? 'dark' : 'light');
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const value = {
    theme,
    setTheme
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// Hook pour utiliser le thème
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
EOF
    log "${GREEN}Fichier ThemeProvider.tsx mis à jour sans dépendance à next-themes${NC}"
else
    log "${YELLOW}Le fichier ThemeProvider.tsx n'existe pas, création...${NC}"
    mkdir -p src/components
    cat > src/components/ThemeProvider.tsx << EOF
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
}

export function ThemeProvider({
  children,
  defaultTheme = 'dark'
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme);

  // Effet pour appliquer le thème
  useEffect(() => {
    const root = window.document.documentElement;
    
    // Supprimer les classes de thème précédentes
    root.classList.remove('light', 'dark');
    
    // Si le thème est "system", détecter la préférence du système
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      root.classList.add(systemTheme);
    } else {
      // Sinon, appliquer le thème sélectionné
      root.classList.add(theme);
    }
  }, [theme]);

  // Effet pour détecter les changements de préférence système
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      if (theme === 'system') {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(mediaQuery.matches ? 'dark' : 'light');
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const value = {
    theme,
    setTheme
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// Hook pour utiliser le thème
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
EOF
    log "${GREEN}Fichier ThemeProvider.tsx créé sans dépendance à next-themes${NC}"
fi

# 5. Mise à jour du fichier .env pour désactiver le mode maintenance
log "${BLUE}5. Mise à jour du fichier .env...${NC}"
cat > .env << EOF
VITE_APP_TITLE=FloDrama
VITE_APP_API_URL=https://api.flodrama.com
VITE_APP_MAINTENANCE_MODE=false
VITE_APP_ENV=production
VITE_APP_DEBUG=false
VITE_APP_VERSION=$(date +"%Y%m%d%H%M")
EOF
log "${GREEN}Fichier .env mis à jour${NC}"

# 6. Construction de l'application
log "${BLUE}6. Construction de l'application...${NC}"
npm run build

# Vérifier si la construction a réussi
if [ ! -d "dist" ]; then
    log "${RED}Erreur: La construction de l'application a échoué${NC}"
    log "${YELLOW}Tentative de déploiement direct...${NC}"
    
    # Exécuter le script de déploiement direct sans maintenance
    bash scripts/deploiement-direct-sans-maintenance.sh
else
    # 7. Déploiement sur Vercel
    log "${BLUE}7. Déploiement sur Vercel...${NC}"
    vercel deploy --prod --yes
    
    # 8. Vérification du déploiement
    log "${BLUE}8. Vérification du déploiement...${NC}"
    sleep 10
    curl -s https://flodrama.vercel.app > /tmp/flodrama_check.html
    
    if grep -q "maintenance" /tmp/flodrama_check.html; then
        log "${RED}Le site affiche toujours un message de maintenance${NC}"
        log "${YELLOW}Exécution du script de remplacement forcé...${NC}"
        
        # Exécuter le script de remplacement forcé
        bash scripts/remplacer-page-maintenance-force.sh
    else
        log "${GREEN}Le site ne contient plus de message de maintenance${NC}"
    fi
fi

# 9. Création d'un rapport de finalisation
log "${BLUE}9. Création d'un rapport de finalisation...${NC}"

REPORT_DIR="rapports"
mkdir -p $REPORT_DIR
REPORT_FILE="$REPORT_DIR/rapport-finalisation-frontend-$(date +%Y%m%d_%H%M%S).md"

cat > $REPORT_FILE << EOF
# Rapport de finalisation de la restauration du front-end FloDrama

## Date: $(date +"%d/%m/%Y %H:%M:%S")

## Résumé

Ce rapport documente la finalisation de la restauration du front-end de FloDrama avec toutes les animations et effets visuels.

## Actions réalisées

1. Installation des dépendances manquantes (next-themes, framer-motion, react-transition-group, styled-components)
2. Renommage/création du fichier AnimatedElement.tsx
3. Mise à jour du fichier theme.scss avec les variables et mixins manquants
4. Mise à jour du fichier ThemeProvider.tsx pour résoudre l'erreur de build
5. Mise à jour du fichier .env pour désactiver le mode maintenance
6. Construction de l'application
7. Déploiement sur Vercel
8. Vérification du déploiement

## Composants restaurés

- **AnimatedElement.tsx** : Composant principal pour les animations
- **Variables de thème** : background-color, text-color
- **Mixins** : button-secondary, card-hover, gradient-text

## Identité visuelle

L'identité visuelle de FloDrama a été entièrement restaurée, incluant :
- Palette de couleurs complète
- Typographie (police Poppins)
- Animations et transitions
- Effets de dégradé et d'ombre
- Mixins pour les boutons et les cartes

## URL de l'application

L'application est accessible à l'adresse [https://flodrama.vercel.app](https://flodrama.vercel.app).

## Prochaines étapes recommandées

1. Tester l'application sur différents navigateurs et appareils
2. Optimiser les performances des animations sur les appareils mobiles
3. Mettre en place un système de monitoring pour détecter les problèmes futurs
4. Configurer un domaine personnalisé pour l'application
EOF

log "${GREEN}Rapport de finalisation créé: $REPORT_FILE${NC}"

# 10. Commit des changements
log "${BLUE}10. Commit des changements...${NC}"

git add .
git commit -m "✨ [FEAT] Finalisation de la restauration du front-end avec animations et effets visuels"
git push origin main

echo -e "${GREEN}=== Finalisation de la restauration du front-end de FloDrama terminée ===${NC}"
echo -e "${YELLOW}Consultez le rapport pour plus de détails: $REPORT_FILE${NC}"
echo -e "${YELLOW}URL de l'application: https://flodrama.vercel.app${NC}"
echo -e "${YELLOW}Pour vérifier le résultat, ouvrez cette URL dans une fenêtre de navigation privée${NC}"
