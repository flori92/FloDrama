/**
 * Registre des composants UI pour FloDrama
 * Permet de configurer les composants hybrides et leurs propriétés par défaut
 */

// Types de composants disponibles
export type ComponentName = 
  | 'Button'
  | 'Carousel'
  | 'ContentCard'
  | 'HeroSection'
  | 'AnimatedElement';

// Type générique pour les props des composants
export type ComponentProps<T extends ComponentName> = 
  T extends 'Button' ? ButtonProps :
  T extends 'Carousel' ? CarouselProps :
  T extends 'ContentCard' ? ContentCardProps :
  T extends 'HeroSection' ? HeroSectionProps :
  T extends 'AnimatedElement' ? AnimatedElementProps :
  Record<string, any>;

// Interface pour la configuration des composants
interface ComponentConfig<T extends ComponentName> {
  name: T;
  defaultProps?: Partial<ComponentProps<T>>;
  adaptProps?: (props: ComponentProps<T>, isLynx: boolean) => ComponentProps<T>;
}

// Types spécifiques pour chaque composant
export interface ButtonProps {
  children?: React.ReactNode;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  asChild?: boolean;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  [key: string]: any;
}

export interface CarouselProps {
  children: React.ReactNode[];
  autoPlay?: boolean;
  interval?: number;
  showArrows?: boolean;
  showDots?: boolean;
  className?: string;
}

export interface ContentCardProps {
  title: string;
  description?: string;
  imageUrl: string;
  category?: string;
  date?: string;
  onClick?: () => void;
  className?: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'default' | 'featured' | 'minimal';
}

export interface HeroSectionProps {
  title: string;
  subtitle?: string;
  backgroundImage: string;
  ctaText?: string;
  ctaAction?: () => void;
  overlayOpacity?: number;
  className?: string;
  height?: 'small' | 'medium' | 'large' | 'full';
  alignment?: 'left' | 'center' | 'right';
}

export interface AnimatedElementProps {
  children: React.ReactNode;
  animation: string;
  delay?: number;
  duration?: number;
  className?: string;
  triggerOnce?: boolean;
  threshold?: number;
}

// Registre des composants avec leur configuration
const componentRegistry: Record<ComponentName, ComponentConfig<any>> = {
  Button: {
    name: 'Button',
    defaultProps: {
      variant: 'default',
      size: 'default'
    },
    adaptProps: (props: ButtonProps, isLynx: boolean) => {
      if (isLynx) {
        // Adapter les props pour Lynx
        return {
          ...props,
          // Conversion des variantes React vers Lynx
          variant: props.variant === 'default' ? 'primary' : 
                  props.variant === 'destructive' ? 'danger' : 
                  props.variant === 'outline' ? 'outline' : 
                  props.variant === 'secondary' ? 'secondary' : 
                  props.variant === 'ghost' ? 'ghost' : 
                  props.variant === 'link' ? 'link' : 'primary',
          // Conversion des tailles React vers Lynx
          size: props.size === 'default' ? 'medium' : 
                props.size === 'sm' ? 'small' : 
                props.size === 'lg' ? 'large' : 
                props.size === 'icon' ? 'icon' : 'medium'
        };
      }
      return props;
    }
  },
  Carousel: {
    name: 'Carousel',
    defaultProps: {
      autoPlay: true,
      interval: 5000,
      showArrows: true,
      showDots: true
    }
  },
  ContentCard: {
    name: 'ContentCard',
    defaultProps: {
      size: 'medium',
      variant: 'default'
    }
  },
  HeroSection: {
    name: 'HeroSection',
    defaultProps: {
      height: 'medium',
      alignment: 'center',
      overlayOpacity: 0.5
    }
  },
  AnimatedElement: {
    name: 'AnimatedElement',
    defaultProps: {
      animation: 'fade-in',
      delay: 0,
      duration: 0.5,
      triggerOnce: true,
      threshold: 0.1
    }
  }
};

/**
 * Récupère la configuration d'un composant
 */
export function getComponentConfig<T extends ComponentName>(componentName: T): ComponentConfig<T> | undefined {
  return componentRegistry[componentName] as ComponentConfig<T> | undefined;
}

/**
 * Vérifie si un composant a besoin d'utiliser la version React
 */
export async function needsReactFallback(componentName: ComponentName): Promise<boolean> {
  try {
    // Essayer d'importer @lynx/core pour vérifier sa disponibilité
    await import('@lynx/core');
    return false; // Si l'import réussit, on peut utiliser Lynx
  } catch (error) {
    console.warn(`[ComponentRegistry] Lynx not available for ${componentName}, using React fallback`);
    return true; // Si l'import échoue, on doit utiliser React
  }
}
