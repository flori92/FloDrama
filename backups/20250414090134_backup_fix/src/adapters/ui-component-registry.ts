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
  | 'AnimatedElement'
  | 'LoadingSpinner'
  | 'TextAnimation'
  | 'ImageGallery'
  | 'Notification';

// Type générique pour les props des composants
export type ComponentProps<T extends ComponentName> = 
  T extends 'Button' ? ButtonProps :
  T extends 'Carousel' ? CarouselProps :
  T extends 'ContentCard' ? ContentCardProps :
  T extends 'HeroSection' ? HeroSectionProps :
  T extends 'AnimatedElement' ? AnimatedElementProps :
  T extends 'LoadingSpinner' ? LoadingSpinnerProps :
  T extends 'TextAnimation' ? TextAnimationProps :
  T extends 'ImageGallery' ? ImageGalleryProps :
  T extends 'Notification' ? NotificationProps :
  Record<string, any>;

// Interface pour la configuration des composants
interface ComponentConfig<T extends ComponentName> {
  name: T;
  defaultProps?: Partial<ComponentProps<T>>;
  adaptProps?: T extends 'Button' 
    ? (props: ButtonProps, isLynx: boolean) => ButtonProps | LynxButtonProps 
    : (props: ComponentProps<T>, isLynx: boolean) => ComponentProps<T>;
  lynxPackages?: string[]; // Packages Lynx requis pour ce composant
  fallbackStrategy?: 'react' | 'custom'; // Stratégie de repli
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

// Type pour les variantes Lynx du bouton
export interface LynxButtonProps extends Omit<ButtonProps, 'variant' | 'size'> {
  variant: 'primary' | 'secondary' | 'outline' | 'ghost' | 'link' | 'danger';
  size: 'small' | 'medium' | 'large' | 'icon';
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
  rating?: number;
  badge?: string;
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

export interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  variant?: 'primary' | 'white' | 'gray';
  className?: string;
  fullScreen?: boolean;
}

export interface TextAnimationProps {
  text: string;
  variant?: 'typing' | 'fade' | 'wave' | 'gradient';
  speed?: 'slow' | 'medium' | 'fast';
  delay?: number;
  loop?: boolean;
  className?: string;
}

export interface ImageGalleryProps {
  images: Array<{
    src: string;
    alt: string;
    caption?: string;
  }>;
  variant?: 'grid' | 'masonry' | 'carousel';
  lightbox?: boolean;
  columns?: 1 | 2 | 3 | 4;
  gap?: 'small' | 'medium' | 'large';
  className?: string;
}

export interface NotificationProps {
  id: string;
  title: string;
  message?: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
  onClose?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

// Cache pour les vérifications de disponibilité des packages
interface PackageAvailabilityCache {
  [packageName: string]: {
    available: boolean;
    timestamp: number;
  };
}

// Durée de validité du cache (en ms)
const CACHE_VALIDITY_DURATION = 3600000; // 1 heure

// Cache pour éviter de vérifier plusieurs fois les mêmes packages
const packageAvailabilityCache: PackageAvailabilityCache = {};

// Registre des composants avec leur configuration
const componentRegistry: Record<ComponentName, ComponentConfig<any>> = {
  Button: {
    name: 'Button',
    defaultProps: {
      variant: 'default',
      size: 'default'
    },
    lynxPackages: ['@lynx/core', '@lynx/react'],
    adaptProps: (props: ButtonProps, isLynx: boolean): ButtonProps | LynxButtonProps => {
      if (isLynx) {
        // Adapter les props pour Lynx
        const lynxProps: LynxButtonProps = {
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
        return lynxProps;
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
    },
    lynxPackages: ['@lynx/core', '@lynx/react']
  },
  ContentCard: {
    name: 'ContentCard',
    defaultProps: {
      size: 'medium',
      variant: 'default'
    },
    lynxPackages: ['@lynx/core', '@lynx/react']
  },
  HeroSection: {
    name: 'HeroSection',
    defaultProps: {
      height: 'medium',
      alignment: 'center',
      overlayOpacity: 0.5
    },
    lynxPackages: ['@lynx/core', '@lynx/react']
  },
  AnimatedElement: {
    name: 'AnimatedElement',
    defaultProps: {
      animation: 'fade-in',
      delay: 0,
      duration: 0.5,
      triggerOnce: true,
      threshold: 0.1
    },
    lynxPackages: ['@lynx/core', '@lynx/react', '@lynx/hooks']
  },
  LoadingSpinner: {
    name: 'LoadingSpinner',
    defaultProps: {
      size: 'medium',
      variant: 'primary',
      fullScreen: false
    },
    lynxPackages: ['@lynx/core', '@lynx/react']
  },
  TextAnimation: {
    name: 'TextAnimation',
    defaultProps: {
      variant: 'typing',
      speed: 'medium',
      delay: 0,
      loop: false
    },
    lynxPackages: ['@lynx/core', '@lynx/react', '@lynx/hooks']
  },
  ImageGallery: {
    name: 'ImageGallery',
    defaultProps: {
      variant: 'grid',
      lightbox: true,
      columns: 3,
      gap: 'medium'
    },
    lynxPackages: ['@lynx/core', '@lynx/react']
  },
  Notification: {
    name: 'Notification',
    defaultProps: {
      type: 'info',
      duration: 5000
    },
    lynxPackages: ['@lynx/core', '@lynx/react', '@lynx/hooks']
  }
};

/**
 * Récupère la configuration d'un composant
 */
export function getComponentConfig<T extends ComponentName>(componentName: T): ComponentConfig<T> | undefined {
  return componentRegistry[componentName] as ComponentConfig<T> | undefined;
}

/**
 * Vérifie si un package est disponible
 * Utilise un cache pour éviter des vérifications répétées
 */
export async function isPackageAvailable(packageName: string): Promise<boolean> {
  // Vérifier si le résultat est dans le cache et toujours valide
  const cachedResult = packageAvailabilityCache[packageName];
  const now = Date.now();
  
  if (cachedResult && (now - cachedResult.timestamp) < CACHE_VALIDITY_DURATION) {
    return cachedResult.available;
  }
  
  try {
    // Essayer d'importer le package dynamiquement
    await import(/* @vite-ignore */ packageName);
    
    // Mettre à jour le cache
    packageAvailabilityCache[packageName] = {
      available: true,
      timestamp: now
    };
    
    return true;
  } catch (error) {
    // Mettre à jour le cache
    packageAvailabilityCache[packageName] = {
      available: false,
      timestamp: now
    };
    
    console.warn(`[ComponentRegistry] Package ${packageName} n'est pas disponible`);
    return false;
  }
}

/**
 * Vérifie si tous les packages requis pour un composant sont disponibles
 */
export async function areRequiredPackagesAvailable(componentName: ComponentName): Promise<boolean> {
  const config = getComponentConfig(componentName);
  
  if (!config || !config.lynxPackages || config.lynxPackages.length === 0) {
    return false; // Si pas de configuration ou pas de packages requis, utiliser React par défaut
  }
  
  // Vérifier tous les packages requis
  const results = await Promise.all(
    config.lynxPackages.map(pkg => isPackageAvailable(pkg))
  );
  
  // Tous les packages doivent être disponibles
  return results.every(result => result === true);
}

/**
 * Vérifie si un composant a besoin d'utiliser la version React
 * Inclut un mécanisme de rollback en cas d'échec
 */
export async function needsReactFallback(componentName: ComponentName): Promise<boolean> {
  try {
    // Vérifier si les packages Lynx requis sont disponibles
    const packagesAvailable = await areRequiredPackagesAvailable(componentName);
    
    if (!packagesAvailable) {
      console.warn(`[ComponentRegistry] Packages Lynx requis pour ${componentName} non disponibles, utilisation du fallback React`);
      return true; // Utiliser React si les packages ne sont pas disponibles
    }
    
    // Si les packages sont disponibles, utiliser Lynx
    return false;
  } catch (error) {
    console.error(`[ComponentRegistry] Erreur lors de la vérification de disponibilité pour ${componentName}:`, error);
    return true; // En cas d'erreur générale, utiliser React par sécurité
  }
}

/**
 * Réinitialise le cache de disponibilité des packages
 * Utile pour forcer une nouvelle vérification après une mise à jour
 */
export function resetPackageAvailabilityCache(): void {
  Object.keys(packageAvailabilityCache).forEach(key => {
    delete packageAvailabilityCache[key];
  });
}

/**
 * Récupère les statistiques d'utilisation de Lynx vs React
 */
export function getFrameworkUsageStats(): { lynx: number, react: number, total: number } {
  const stats = {
    lynx: 0,
    react: 0,
    total: Object.keys(componentRegistry).length
  };
  
  Object.keys(packageAvailabilityCache).forEach(pkg => {
    if (pkg.includes('@lynx/') && packageAvailabilityCache[pkg].available) {
      stats.lynx++;
    } else {
      stats.react++;
    }
  });
  
  return stats;
}
