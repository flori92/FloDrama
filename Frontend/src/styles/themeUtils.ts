/**
 * Utilitaires pour appliquer le thème FloDrama
 * Compatible avec Lynx et React
 */

import theme from './theme';

/**
 * Génère des classes CSS pour un bouton selon le thème FloDrama
 * @param variant Variante du bouton
 * @param size Taille du bouton
 * @param isLynx Indique si le composant est rendu via Lynx
 */
export function getButtonStyles(
  variant: 'primary' | 'secondary' | 'outline' | 'ghost' | 'link' | 'danger' = 'primary',
  size: 'small' | 'medium' | 'large' | 'icon' = 'medium',
  isLynx: boolean = false
): string {
  // Styles de base communs
  let baseStyles = `
    font-family: ${theme.typography.fontFamily};
    border-radius: ${theme.borders.radius.full};
    transition: all ${theme.animations.durations.normal} ${theme.animations.easings.easeInOut};
    font-weight: ${theme.typography.fontWeights.medium};
    position: relative;
    overflow: hidden;
  `;

  // Styles spécifiques à la variante
  let variantStyles = '';
  switch (variant) {
    case 'primary':
      variantStyles = `
        background: ${theme.effects.gradients.primary};
        color: ${theme.colors.text.primary};
        border: none;
      `;
      break;
    case 'secondary':
      variantStyles = `
        background: rgba(255, 255, 255, 0.1);
        color: ${theme.colors.text.primary};
        border: none;
      `;
      break;
    case 'outline':
      variantStyles = `
        background: transparent;
        color: ${theme.colors.text.primary};
        border: ${theme.borders.width[1]} solid rgba(255, 255, 255, 0.2);
      `;
      break;
    case 'ghost':
      variantStyles = `
        background: transparent;
        color: ${theme.colors.text.primary};
        border: none;
      `;
      break;
    case 'link':
      variantStyles = `
        background: transparent;
        color: ${theme.colors.primary.blue};
        border: none;
        text-decoration: underline;
      `;
      break;
    case 'danger':
      variantStyles = `
        background: ${theme.colors.status.error};
        color: ${theme.colors.text.primary};
        border: none;
      `;
      break;
  }

  // Styles spécifiques à la taille
  let sizeStyles = '';
  switch (size) {
    case 'small':
      sizeStyles = `
        padding: ${theme.spacing[1.5]} ${theme.spacing[3]};
        font-size: ${theme.typography.fontSizes.sm};
      `;
      break;
    case 'medium':
      sizeStyles = `
        padding: ${theme.spacing[2]} ${theme.spacing[4]};
        font-size: ${theme.typography.fontSizes.base};
      `;
      break;
    case 'large':
      sizeStyles = `
        padding: ${theme.spacing[3]} ${theme.spacing[6]};
        font-size: ${theme.typography.fontSizes.lg};
      `;
      break;
    case 'icon':
      sizeStyles = `
        padding: ${theme.spacing[2]};
        aspect-ratio: 1/1;
        display: flex;
        align-items: center;
        justify-content: center;
      `;
      break;
  }

  // Styles d'état (hover, focus, etc.)
  let stateStyles = `
    &:hover {
      transform: translateY(-2px);
      box-shadow: ${theme.shadows.md};
    }
    
    &:active {
      transform: translateY(0);
    }
    
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }
  `;

  // Effet de ripple (ondulation)
  let rippleEffect = `
    .ripple {
      position: absolute;
      border-radius: 50%;
      background-color: rgba(255, 255, 255, 0.3);
      transform: scale(0);
      animation: ripple 0.6s ${theme.animations.easings.easeOut};
      pointer-events: none;
    }
    
    @keyframes ripple {
      to {
        transform: scale(4);
        opacity: 0;
      }
    }
  `;

  // Adapter les styles pour Lynx si nécessaire
  if (isLynx) {
    // Ajustements spécifiques pour Lynx
    // (à compléter selon les spécificités de Lynx)
  }

  return `${baseStyles} ${variantStyles} ${sizeStyles} ${stateStyles} ${rippleEffect}`;
}

/**
 * Génère des classes CSS pour une carte de contenu selon le thème FloDrama
 * @param variant Variante de la carte
 * @param isLynx Indique si le composant est rendu via Lynx
 */
export function getCardStyles(
  variant: 'default' | 'featured' | 'minimal' = 'default',
  isLynx: boolean = false
): string {
  // Styles de base communs
  let baseStyles = `
    background-color: ${theme.colors.background.card};
    border-radius: ${theme.borders.radius['2xl']};
    overflow: hidden;
    transition: all ${theme.animations.durations.normal} ${theme.animations.easings.easeInOut};
  `;

  // Styles spécifiques à la variante
  let variantStyles = '';
  switch (variant) {
    case 'default':
      variantStyles = `
        box-shadow: ${theme.shadows.md};
      `;
      break;
    case 'featured':
      variantStyles = `
        box-shadow: ${theme.shadows.lg};
        border: ${theme.borders.width[1]} solid rgba(59, 130, 246, 0.3);
      `;
      break;
    case 'minimal':
      variantStyles = `
        box-shadow: none;
        background-color: rgba(18, 18, 18, 0.6);
      `;
      break;
  }

  // Styles d'état (hover, focus, etc.)
  let stateStyles = `
    &:hover {
      transform: translateY(-4px) scale(1.02);
      box-shadow: ${theme.shadows.xl};
    }
  `;

  // Adapter les styles pour Lynx si nécessaire
  if (isLynx) {
    // Ajustements spécifiques pour Lynx
    // (à compléter selon les spécificités de Lynx)
  }

  return `${baseStyles} ${variantStyles} ${stateStyles}`;
}

/**
 * Génère des classes CSS pour une section héro selon le thème FloDrama
 * @param height Hauteur de la section
 * @param alignment Alignement du contenu
 * @param isLynx Indique si le composant est rendu via Lynx
 */
export function getHeroStyles(
  height: 'small' | 'medium' | 'large' | 'full' = 'medium',
  alignment: 'left' | 'center' | 'right' = 'center',
  isLynx: boolean = false
): string {
  // Styles de base communs
  let baseStyles = `
    position: relative;
    overflow: hidden;
    color: ${theme.colors.text.primary};
  `;

  // Styles spécifiques à la hauteur
  let heightStyles = '';
  switch (height) {
    case 'small':
      heightStyles = `
        min-height: 300px;
      `;
      break;
    case 'medium':
      heightStyles = `
        min-height: 500px;
      `;
      break;
    case 'large':
      heightStyles = `
        min-height: 700px;
      `;
      break;
    case 'full':
      heightStyles = `
        min-height: 100vh;
      `;
      break;
  }

  // Styles spécifiques à l'alignement
  let alignmentStyles = '';
  switch (alignment) {
    case 'left':
      alignmentStyles = `
        text-align: left;
        align-items: flex-start;
      `;
      break;
    case 'center':
      alignmentStyles = `
        text-align: center;
        align-items: center;
      `;
      break;
    case 'right':
      alignmentStyles = `
        text-align: right;
        align-items: flex-end;
      `;
      break;
  }

  // Styles pour l'overlay
  let overlayStyles = `
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: ${theme.effects.gradients.dark};
      z-index: 1;
    }
    
    .hero-content {
      position: relative;
      z-index: 2;
    }
  `;

  // Adapter les styles pour Lynx si nécessaire
  if (isLynx) {
    // Ajustements spécifiques pour Lynx
    // (à compléter selon les spécificités de Lynx)
  }

  return `${baseStyles} ${heightStyles} ${alignmentStyles} ${overlayStyles}`;
}

/**
 * Génère des classes CSS pour une animation de texte selon le thème FloDrama
 * @param variant Variante de l'animation
 * @param speed Vitesse de l'animation
 * @param isLynx Indique si le composant est rendu via Lynx
 */
export function getTextAnimationStyles(
  variant: 'typing' | 'fade' | 'wave' | 'gradient' = 'typing',
  speed: 'slow' | 'medium' | 'fast' = 'medium',
  isLynx: boolean = false
): string {
  // Déterminer la durée selon la vitesse
  let duration = '';
  switch (speed) {
    case 'slow':
      duration = theme.animations.durations.slowest;
      break;
    case 'medium':
      duration = theme.animations.durations.normal;
      break;
    case 'fast':
      duration = theme.animations.durations.fast;
      break;
  }

  // Styles de base communs
  let baseStyles = `
    display: inline-block;
  `;

  // Styles spécifiques à la variante
  let variantStyles = '';
  switch (variant) {
    case 'typing':
      variantStyles = `
        border-right: 2px solid ${theme.colors.primary.blue};
        white-space: nowrap;
        overflow: hidden;
        animation: typing ${duration} steps(40, end),
                   blink-caret 0.75s step-end infinite;
        
        @keyframes typing {
          from { width: 0 }
          to { width: 100% }
        }
        
        @keyframes blink-caret {
          from, to { border-color: transparent }
          50% { border-color: ${theme.colors.primary.blue} }
        }
      `;
      break;
    case 'fade':
      variantStyles = `
        opacity: 0;
        animation: fadeIn ${duration} ${theme.animations.easings.easeInOut} forwards;
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `;
      break;
    case 'wave':
      variantStyles = `
        span {
          display: inline-block;
          animation: wave ${duration} ${theme.animations.easings.easeInOut} infinite;
        }
        
        @keyframes wave {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `;
      break;
    case 'gradient':
      variantStyles = `
        background: ${theme.effects.gradients.primary};
        background-size: 200% auto;
        background-clip: text;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        animation: gradient 3s ${theme.animations.easings.easeInOut} infinite;
        
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `;
      break;
  }

  // Adapter les styles pour Lynx si nécessaire
  if (isLynx) {
    // Ajustements spécifiques pour Lynx
    // (à compléter selon les spécificités de Lynx)
  }

  return `${baseStyles} ${variantStyles}`;
}

/**
 * Génère des classes CSS pour un spinner de chargement selon le thème FloDrama
 * @param size Taille du spinner
 * @param variant Variante de couleur
 * @param isLynx Indique si le composant est rendu via Lynx
 */
export function getSpinnerStyles(
  size: 'small' | 'medium' | 'large' = 'medium',
  variant: 'primary' | 'white' | 'gray' = 'primary',
  isLynx: boolean = false
): string {
  // Déterminer la taille
  let sizeValue = '';
  switch (size) {
    case 'small':
      sizeValue = '24px';
      break;
    case 'medium':
      sizeValue = '40px';
      break;
    case 'large':
      sizeValue = '64px';
      break;
  }

  // Déterminer la couleur
  let color = '';
  switch (variant) {
    case 'primary':
      color = theme.colors.primary.blue;
      break;
    case 'white':
      color = theme.colors.text.primary;
      break;
    case 'gray':
      color = theme.colors.text.secondary;
      break;
  }

  // Styles de base
  let baseStyles = `
    width: ${sizeValue};
    height: ${sizeValue};
    border-radius: 50%;
    border: 3px solid rgba(0, 0, 0, 0.1);
    border-top-color: ${color};
    animation: spin 0.8s linear infinite;
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;

  // Adapter les styles pour Lynx si nécessaire
  if (isLynx) {
    // Ajustements spécifiques pour Lynx
    // (à compléter selon les spécificités de Lynx)
  }

  return baseStyles;
}

/**
 * Applique le thème FloDrama à un élément DOM
 * @param element Élément DOM à styliser
 * @param styles Styles CSS à appliquer
 */
export function applyStyles(element: HTMLElement, styles: string): void {
  // Nettoyer les styles en supprimant les sauts de ligne et les espaces inutiles
  const cleanStyles = styles
    .replace(/\n/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  element.setAttribute('style', cleanStyles);
}

/**
 * Crée une classe CSS avec le thème FloDrama
 * @param className Nom de la classe
 * @param styles Styles CSS à appliquer
 */
export function createStyleClass(className: string, styles: string): void {
  // Vérifier si la classe existe déjà
  const existingStyle = document.getElementById(`flodrama-style-${className}`);
  if (existingStyle) {
    return;
  }
  
  // Nettoyer les styles en supprimant les sauts de ligne et les espaces inutiles
  const cleanStyles = styles
    .replace(/\n/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Créer l'élément style
  const styleElement = document.createElement('style');
  styleElement.id = `flodrama-style-${className}`;
  styleElement.textContent = `.${className} { ${cleanStyles} }`;
  
  // Ajouter l'élément style au document
  document.head.appendChild(styleElement);
}
