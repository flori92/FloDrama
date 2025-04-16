// Service de gestion des assets optimisé pour React
import { optimizeImageLoading } from './imageLoader';

// Catégorisation des assets par type et priorité
const assetTypes = {
  CRITICAL: 'critical', // Chargement prioritaire (logos, images hero)
  POSTER: 'poster',     // Affiches de films/séries
  BACKGROUND: 'bg',     // Images d'arrière-plan
  ICON: 'icon'          // Icônes et éléments d'interface
};

// Configuration des chemins d'accès aux assets selon leur type
const assetPaths = {
  [assetTypes.CRITICAL]: 'critical/',
  [assetTypes.POSTER]: 'posters/',
  [assetTypes.BACKGROUND]: 'backgrounds/',
  [assetTypes.ICON]: 'icons/'
};

// Résolution intelligente des URLs d'assets
export const resolveAssetUrl = (path, type = assetTypes.POSTER) => {
  const basePath = assetPaths[type] || '';
  
  // Stratégie de résolution progressive
  return {
    primary: `${cdnConfig.baseUrl}${basePath}${path}`,
    secondary: `${cdnConfig.fallbackUrl}${basePath}${path}`,
    tertiary: `${cdnConfig.githubUrl}${basePath}${path}`
  };
};

// Hook React pour charger des images avec gestion des erreurs
export const useOptimizedImage = (path, type = assetTypes.POSTER) => {
  const [src, setSrc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  useEffect(() => {
    if (!path) return;
    setLoading(true);
    
    const urls = resolveAssetUrl(path, type);
    let cancelled = false;
    
    const loadImage = async () => {
      try {
        // Essayer d'abord l'URL primaire (CloudFront)
        await tryLoadImage(urls.primary);
        if (!cancelled) {
          setSrc(urls.primary);
          setLoading(false);
        }
      } catch (err) {
        try {
          // En cas d'échec, essayer l'URL secondaire (S3)
          await tryLoadImage(urls.secondary);
          if (!cancelled) {
            setSrc(urls.secondary);
            setLoading(false);
          }
        } catch (err) {
          // Dernier recours: GitHub Pages
          if (!cancelled) {
            setSrc(urls.tertiary);
            setLoading(false);
            setError(true);
          }
        }
      }
    };
    
    loadImage();
    
    return () => {
      cancelled = true;
    };
  }, [path, type]);
  
  return { src, loading, error };
};

// Initialiser le système de chargement paresseux
export const initializeAssetSystem = () => {
  optimizeImageLoading();
  
  // Précharger les assets critiques
  const criticalAssets = [
    'logo.svg', 
    'hero-background.jpg',
    'placeholder.jpg'
  ];
  
  criticalAssets.forEach(asset => {
    const img = new Image();
    img.src = resolveAssetUrl(asset, assetTypes.CRITICAL).primary;
  });
}; 