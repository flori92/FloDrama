/**
 * Processeur d'images adaptatif pour FloDrama
 * Ce module permet d'optimiser et de styliser les images selon l'identité visuelle de FloDrama,
 * tout en adaptant les formats et tailles aux différents appareils et conditions réseau.
 */

// Importation des dépendances
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { getDeviceSpecs } from './deviceDetection';
import { getNetworkConditions } from './networkAnalysis';
import { uploadToStorage, getImageUrl } from '../services/storageService';

/**
 * Classe de traitement d'image adaptatif pour FloDrama
 */
class FloDramaImageProcessor {
  constructor() {
    // Identité visuelle FloDrama
    this.signatureGradient = {
      start: '#3b82f6', // Bleu signature
      end: '#d946ef'    // Fuchsia accent
    };
    this.cornerRadius = 8;   // px
    this.transitionDuration = 0.3;  // secondes
    
    // Configuration des tailles d'images
    this.imageSizes = {
      poster: {
        small: { width: 185, height: 278 },
        medium: { width: 342, height: 513 },
        large: { width: 500, height: 750 }
      },
      backdrop: {
        small: { width: 300, height: 169 },
        medium: { width: 780, height: 439 },
        large: { width: 1280, height: 720 }
      },
      thumbnail: {
        small: { width: 100, height: 56 },
        medium: { width: 220, height: 124 },
        large: { width: 356, height: 200 }
      },
      logo: {
        small: { width: 92, height: 45 },
        medium: { width: 185, height: 90 },
        large: { width: 300, height: 145 }
      }
    };
    
    // Configuration des formats d'image
    this.imageFormats = {
      webp: { quality: 80 },
      jpeg: { quality: 85 },
      avif: { quality: 70 }
    };
    
    // Configuration des effets visuels
    this.visualEffects = {
      posterGradientOverlay: true,
      backdropDarken: true,
      thumbnailSharpen: true,
      posterShadow: true
    };
  }
  
  /**
   * Calcule la taille optimale pour un appareil donné
   * @param {Object} targetDevice - Informations sur l'appareil cible
   * @param {string} imageType - Type d'image (poster, backdrop, thumbnail, logo)
   * @returns {Object} - Dimensions optimales
   */
  calculateOptimalSize(targetDevice, imageType = 'poster') {
    try {
      const deviceSpecs = getDeviceSpecs(targetDevice);
      const { screenWidth, screenHeight, pixelRatio, deviceCategory } = deviceSpecs;
      
      // Sélection de la taille de base selon le type d'appareil
      let sizeCategory;
      if (deviceCategory === 'mobile' || screenWidth < 768) {
        sizeCategory = 'small';
      } else if (deviceCategory === 'tablet' || screenWidth < 1200) {
        sizeCategory = 'medium';
      } else {
        sizeCategory = 'large';
      }
      
      // Récupération des dimensions de base
      const baseSize = this.imageSizes[imageType][sizeCategory];
      
      // Ajustement selon le ratio de pixels de l'appareil
      const adjustedWidth = Math.round(baseSize.width * pixelRatio);
      const adjustedHeight = Math.round(baseSize.height * pixelRatio);
      
      return {
        width: adjustedWidth,
        height: adjustedHeight,
        sizeCategory,
        pixelRatio
      };
    } catch (error) {
      console.error('Erreur lors du calcul de la taille optimale:', error);
      // Retour des dimensions par défaut en cas d'erreur
      return this.imageSizes[imageType].medium;
    }
  }
  
  /**
   * Applique le style FloDrama à une image
   * @param {Buffer} imageData - Données de l'image
   * @param {Object} size - Dimensions cibles
   * @param {string} imageType - Type d'image (poster, backdrop, thumbnail, logo)
   * @returns {Promise<Buffer>} - Image stylisée
   */
  async applyFloDramaStyle(imageData, size, imageType = 'poster') {
    try {
      // Initialisation du traitement avec Sharp
      let imageProcessor = sharp(imageData);
      
      // Redimensionnement avec préservation du ratio
      imageProcessor = imageProcessor.resize({
        width: size.width,
        height: size.height,
        fit: 'cover',
        position: 'centre'
      });
      
      // Application des coins arrondis pour les posters et thumbnails
      if ((imageType === 'poster' || imageType === 'thumbnail') && this.cornerRadius > 0) {
        // Création d'un masque avec coins arrondis
        const roundedCorners = Buffer.from(
          `<svg><rect x="0" y="0" width="${size.width}" height="${size.height}" rx="${this.cornerRadius}" ry="${this.cornerRadius}"/></svg>`
        );
        
        imageProcessor = imageProcessor.composite([{
          input: roundedCorners,
          blend: 'dest-in'
        }]);
      }
      
      // Application des effets spécifiques selon le type d'image
      if (imageType === 'poster' && this.visualEffects.posterGradientOverlay) {
        // Création d'un dégradé pour les posters
        const gradientOverlay = Buffer.from(
          `<svg width="${size.width}" height="${size.height}">
            <defs>
              <linearGradient id="flodrama-gradient" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stop-color="${this.signatureGradient.start}" stop-opacity="0.7"/>
                <stop offset="100%" stop-color="${this.signatureGradient.end}" stop-opacity="0.3"/>
              </linearGradient>
            </defs>
            <rect width="${size.width}" height="${size.height}" fill="url(#flodrama-gradient)"/>
          </svg>`
        );
        
        imageProcessor = imageProcessor.composite([{
          input: gradientOverlay,
          blend: 'overlay'
        }]);
      }
      
      if (imageType === 'backdrop' && this.visualEffects.backdropDarken) {
        // Assombrissement léger pour les backdrops
        imageProcessor = imageProcessor.modulate({
          brightness: 0.9
        });
      }
      
      if (imageType === 'thumbnail' && this.visualEffects.thumbnailSharpen) {
        // Accentuation pour les thumbnails
        imageProcessor = imageProcessor.sharpen({
          sigma: 1.2
        });
      }
      
      // Optimisation de la qualité
      imageProcessor = imageProcessor.jpeg({
        quality: 85,
        progressive: true
      });
      
      // Traitement et retour de l'image
      return await imageProcessor.toBuffer();
    } catch (error) {
      console.error('Erreur lors de l\'application du style FloDrama:', error);
      // Retour de l'image originale en cas d'erreur
      return imageData;
    }
  }
  
  /**
   * Génère des variantes adaptatives d'une image
   * @param {Buffer} styledImage - Image stylisée
   * @param {string} imageType - Type d'image
   * @param {Object} networkConditions - Conditions réseau
   * @returns {Promise<Object>} - Variantes d'image
   */
  async generateAdaptiveVariants(styledImage, imageType = 'poster', networkConditions = null) {
    try {
      // Récupération ou détection des conditions réseau
      const network = networkConditions || await getNetworkConditions();
      
      // Initialisation des variantes
      const variants = {};
      
      // Génération des variantes selon les conditions réseau
      if (network.type === 'slow' || network.bandwidth < 1) {
        // Basse qualité pour les connexions lentes
        variants.lowQuality = await sharp(styledImage)
          .resize({ width: Math.floor(this.imageSizes[imageType].small.width * 0.7) })
          .jpeg({ quality: 60 })
          .toBuffer();
      }
      
      // Qualité standard
      variants.standard = await sharp(styledImage)
        .webp({ quality: 75 })
        .toBuffer();
      
      // Haute qualité pour les bonnes connexions
      if (network.type === 'fast' || network.bandwidth > 5) {
        variants.highQuality = await sharp(styledImage)
          .webp({ quality: 90 })
          .toBuffer();
        
        // Format AVIF pour les très bonnes connexions et navigateurs compatibles
        if (network.bandwidth > 10 && network.supportsAvif) {
          variants.avif = await sharp(styledImage)
            .avif({ quality: 80 })
            .toBuffer();
        }
      }
      
      return variants;
    } catch (error) {
      console.error('Erreur lors de la génération des variantes adaptatives:', error);
      // Retour d'un objet vide en cas d'erreur
      return {};
    }
  }
  
  /**
   * Génère une image de préchargement floue
   * @param {Buffer} styledImage - Image stylisée
   * @returns {Promise<string>} - Image de préchargement en base64
   */
  async generateBlurPlaceholder(styledImage) {
    try {
      // Création d'une version très petite et floue de l'image
      const placeholder = await sharp(styledImage)
        .resize(20)
        .blur(10)
        .toBuffer();
      
      // Conversion en base64 pour l'intégration directe dans le HTML/CSS
      return `data:image/jpeg;base64,${placeholder.toString('base64')}`;
    } catch (error) {
      console.error('Erreur lors de la génération du placeholder flou:', error);
      return '';
    }
  }
  
  /**
   * Traite une affiche (poster) selon l'identité visuelle FloDrama
   * @param {Buffer|string} imageData - Données de l'image ou URL
   * @param {Object} targetDevice - Informations sur l'appareil cible
   * @returns {Promise<Object>} - Résultat du traitement
   */
  async processPoster(imageData, targetDevice) {
    try {
      // Chargement de l'image si c'est une URL
      const imgData = typeof imageData === 'string' 
        ? await this.fetchImageFromUrl(imageData)
        : imageData;
      
      // Optimisation de la taille selon l'appareil
      const optimizedSize = this.calculateOptimalSize(targetDevice, 'poster');
      
      // Application du style FloDrama
      const styledImage = await this.applyFloDramaStyle(imgData, optimizedSize, 'poster');
      
      // Génération de variantes pour différentes conditions de réseau
      const variants = await this.generateAdaptiveVariants(styledImage, 'poster');
      
      // Génération d'un placeholder flou
      const placeholder = await this.generateBlurPlaceholder(styledImage);
      
      // Génération d'identifiants uniques pour les fichiers
      const fileId = uuidv4();
      
      // Stockage des images
      const urls = {};
      
      // Stockage de l'image principale
      const mainImagePath = `posters/${fileId}/main.jpg`;
      await uploadToStorage(styledImage, mainImagePath);
      urls.original = await getImageUrl(mainImagePath);
      
      // Stockage des variantes
      for (const [key, variant] of Object.entries(variants)) {
        const variantPath = `posters/${fileId}/${key}.${key === 'avif' ? 'avif' : 'webp'}`;
        await uploadToStorage(variant, variantPath);
        urls[key] = await getImageUrl(variantPath);
      }
      
      // Retour du résultat complet
      return {
        original: urls.original,
        variants: urls,
        placeholder,
        metadata: {
          width: optimizedSize.width,
          height: optimizedSize.height,
          fileId,
          sizeCategory: optimizedSize.sizeCategory,
          cornerRadius: this.cornerRadius,
          gradient: `${this.signatureGradient.start} to ${this.signatureGradient.end}`
        }
      };
    } catch (error) {
      console.error('Erreur lors du traitement du poster:', error);
      // En cas d'erreur, retourner l'URL originale si c'est une chaîne
      if (typeof imageData === 'string') {
        return {
          original: imageData,
          variants: { standard: imageData },
          placeholder: '',
          metadata: { width: 0, height: 0 }
        };
      }
      throw error;
    }
  }
  
  /**
   * Traite une image de fond (backdrop) selon l'identité visuelle FloDrama
   * @param {Buffer|string} imageData - Données de l'image ou URL
   * @param {Object} targetDevice - Informations sur l'appareil cible
   * @returns {Promise<Object>} - Résultat du traitement
   */
  async processBackdrop(imageData, targetDevice) {
    try {
      // Chargement de l'image si c'est une URL
      const imgData = typeof imageData === 'string' 
        ? await this.fetchImageFromUrl(imageData)
        : imageData;
      
      // Optimisation de la taille selon l'appareil
      const optimizedSize = this.calculateOptimalSize(targetDevice, 'backdrop');
      
      // Application du style FloDrama
      const styledImage = await this.applyFloDramaStyle(imgData, optimizedSize, 'backdrop');
      
      // Génération de variantes pour différentes conditions de réseau
      const variants = await this.generateAdaptiveVariants(styledImage, 'backdrop');
      
      // Génération d'un placeholder flou
      const placeholder = await this.generateBlurPlaceholder(styledImage);
      
      // Génération d'identifiants uniques pour les fichiers
      const fileId = uuidv4();
      
      // Stockage des images
      const urls = {};
      
      // Stockage de l'image principale
      const mainImagePath = `backdrops/${fileId}/main.jpg`;
      await uploadToStorage(styledImage, mainImagePath);
      urls.original = await getImageUrl(mainImagePath);
      
      // Stockage des variantes
      for (const [key, variant] of Object.entries(variants)) {
        const variantPath = `backdrops/${fileId}/${key}.${key === 'avif' ? 'avif' : 'webp'}`;
        await uploadToStorage(variant, variantPath);
        urls[key] = await getImageUrl(variantPath);
      }
      
      // Retour du résultat complet
      return {
        original: urls.original,
        variants: urls,
        placeholder,
        metadata: {
          width: optimizedSize.width,
          height: optimizedSize.height,
          fileId,
          sizeCategory: optimizedSize.sizeCategory
        }
      };
    } catch (error) {
      console.error('Erreur lors du traitement du backdrop:', error);
      // En cas d'erreur, retourner l'URL originale si c'est une chaîne
      if (typeof imageData === 'string') {
        return {
          original: imageData,
          variants: { standard: imageData },
          placeholder: '',
          metadata: { width: 0, height: 0 }
        };
      }
      throw error;
    }
  }
  
  /**
   * Traite une vignette (thumbnail) selon l'identité visuelle FloDrama
   * @param {Buffer|string} imageData - Données de l'image ou URL
   * @param {Object} targetDevice - Informations sur l'appareil cible
   * @returns {Promise<Object>} - Résultat du traitement
   */
  async processThumbnail(imageData, targetDevice) {
    try {
      // Chargement de l'image si c'est une URL
      const imgData = typeof imageData === 'string' 
        ? await this.fetchImageFromUrl(imageData)
        : imageData;
      
      // Optimisation de la taille selon l'appareil
      const optimizedSize = this.calculateOptimalSize(targetDevice, 'thumbnail');
      
      // Application du style FloDrama
      const styledImage = await this.applyFloDramaStyle(imgData, optimizedSize, 'thumbnail');
      
      // Génération de variantes pour différentes conditions de réseau
      const variants = await this.generateAdaptiveVariants(styledImage, 'thumbnail');
      
      // Génération d'un placeholder flou
      const placeholder = await this.generateBlurPlaceholder(styledImage);
      
      // Génération d'identifiants uniques pour les fichiers
      const fileId = uuidv4();
      
      // Stockage des images
      const urls = {};
      
      // Stockage de l'image principale
      const mainImagePath = `thumbnails/${fileId}/main.jpg`;
      await uploadToStorage(styledImage, mainImagePath);
      urls.original = await getImageUrl(mainImagePath);
      
      // Stockage des variantes
      for (const [key, variant] of Object.entries(variants)) {
        const variantPath = `thumbnails/${fileId}/${key}.${key === 'avif' ? 'avif' : 'webp'}`;
        await uploadToStorage(variant, variantPath);
        urls[key] = await getImageUrl(variantPath);
      }
      
      // Retour du résultat complet
      return {
        original: urls.original,
        variants: urls,
        placeholder,
        metadata: {
          width: optimizedSize.width,
          height: optimizedSize.height,
          fileId,
          sizeCategory: optimizedSize.sizeCategory,
          cornerRadius: this.cornerRadius
        }
      };
    } catch (error) {
      console.error('Erreur lors du traitement de la vignette:', error);
      // En cas d'erreur, retourner l'URL originale si c'est une chaîne
      if (typeof imageData === 'string') {
        return {
          original: imageData,
          variants: { standard: imageData },
          placeholder: '',
          metadata: { width: 0, height: 0 }
        };
      }
      throw error;
    }
  }
  
  /**
   * Récupère une image depuis une URL
   * @param {string} url - URL de l'image
   * @returns {Promise<Buffer>} - Données de l'image
   */
  async fetchImageFromUrl(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Erreur lors de la récupération de l'image: ${response.statusText}`);
      }
      return Buffer.from(await response.arrayBuffer());
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'image:', error);
      throw error;
    }
  }
}

export default FloDramaImageProcessor;
