/**
 * Générateur de placeholders statiques pour FloDrama
 * Ce script génère des images SVG pour les contenus populaires et les sauvegarde
 * dans le dossier /assets/placeholders/ pour une utilisation hors-ligne.
 */

// Dépendances
import fs from 'fs';
import path from 'path';

// Configuration
const CONFIG = {
  // Dossier de sortie pour les placeholders
  outputDir: path.join(__dirname, '../assets/placeholders'),
  
  // Fichier de métadonnées
  metadataFile: path.join(__dirname, '../data/content.json'),
  
  // Nombre de placeholders à générer
  maxPlaceholders: 50,
  
  // Types d'images à générer
  imageTypes: ['poster', 'backdrop', 'thumbnail'],
  
  // Dimensions des images
  dimensions: {
    poster: { width: 300, height: 450 },
    backdrop: { width: 1280, height: 720 },
    thumbnail: { width: 200, height: 113 }
  },
  
  // Couleurs selon l'identité visuelle FloDrama
  colors: {
    primary: '#3b82f6',    // Bleu signature
    secondary: '#d946ef',  // Fuchsia accent
    dark: '#121118',       // Fond principal
    darkAlt: '#1A1926',    // Fond secondaire
    light: '#ffffff',      // Texte clair
    lightAlt: 'rgba(255, 255, 255, 0.7)' // Texte secondaire
  },
  
  // Dégradés par catégorie
  gradients: {
    drama: { from: '#3b82f6', to: '#d946ef' },
    movie: { from: '#06B6D4', to: '#8B5CF6' },
    anime: { from: '#10B981', to: '#6366F1' },
    default: { from: '#F59E0B', to: '#EF4444' }
  }
};

/**
 * Génère une image SVG placeholder pour un contenu spécifique
 * @param {Object} content - Données du contenu
 * @param {string} type - Type d'image (poster, backdrop, thumbnail)
 * @returns {string} - Image SVG
 */
function generatePlaceholderSvg(content, type) {
  const { id, title, category } = content;
  const { width, height } = CONFIG.dimensions[type];
  
  // Sélectionner le dégradé en fonction de la catégorie
  const gradient = CONFIG.gradients[category] || CONFIG.gradients.default;
  
  // Extraire l'index numérique du contentId pour varier les designs
  const contentIndex = parseInt((id.match(/\d+/) || ['0'])[0], 10);
  
  // Créer un identifiant unique pour les éléments SVG
  const uniqueId = `placeholder-${id}-${type}`;
  
  // Préparer le titre pour l'affichage (limiter la longueur)
  const displayTitle = title.length > 20 ? title.substring(0, 18) + '...' : title;
  
  // Générer le SVG
  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad-${uniqueId}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${gradient.from}" />
          <stop offset="100%" stop-color="${gradient.to}" />
        </linearGradient>
        <linearGradient id="overlay-${uniqueId}" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="rgba(0,0,0,0)" />
          <stop offset="85%" stop-color="rgba(0,0,0,0.5)" />
          <stop offset="100%" stop-color="rgba(0,0,0,0.8)" />
        </linearGradient>
        <filter id="shadow-${uniqueId}">
          <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.3" />
        </filter>
      </defs>
      
      <!-- Fond avec dégradé -->
      <rect width="${width}" height="${height}" rx="8" fill="url(#grad-${uniqueId})" />
      
      <!-- Motif décoratif basé sur l'ID du contenu -->
      ${generateDecorativePattern(contentIndex, width, height, uniqueId)}
      
      <!-- Overlay pour le texte -->
      <rect width="${width}" height="${height}" rx="8" fill="url(#overlay-${uniqueId})" />
      
      ${generateFloDramaLogo(width, height, uniqueId)}
      
      <!-- Titre du contenu -->
      <text x="${width/2}" y="${height - 40}" 
            font-family="SF Pro Display, Arial, sans-serif" 
            font-size="${type === 'backdrop' ? 24 : 18}" 
            font-weight="bold"
            text-anchor="middle" 
            fill="${CONFIG.colors.light}"
            filter="url(#shadow-${uniqueId})">
        ${displayTitle}
      </text>
      
      <!-- Catégorie -->
      <text x="${width/2}" y="${height - 20}" 
            font-family="SF Pro Display, Arial, sans-serif" 
            font-size="${type === 'backdrop' ? 18 : 14}" 
            text-anchor="middle" 
            fill="${CONFIG.colors.lightAlt}">
        ${category.charAt(0).toUpperCase() + category.slice(1)}
      </text>
    </svg>
  `;
}

/**
 * Génère un motif décoratif basé sur l'index du contenu
 * @param {number} index - Index du contenu
 * @param {number} width - Largeur de l'image
 * @param {number} height - Hauteur de l'image
 * @param {string} _uniqueId - Identifiant unique (non utilisé dans cette fonction)
 * @returns {string} - Éléments SVG pour le motif
 */
function generateDecorativePattern(index, width, height, _uniqueId) {
  // Différents motifs en fonction de l'index
  const patternType = index % 4;
  
  switch (patternType) {
    case 0: // Cercles
      return `
        <circle cx="${width * 0.7}" cy="${height * 0.3}" r="${width * 0.4}" 
                fill="rgba(255,255,255,0.1)" />
        <circle cx="${width * 0.3}" cy="${height * 0.7}" r="${width * 0.2}" 
                fill="rgba(255,255,255,0.05)" />
      `;
    case 1: // Lignes diagonales
      return `
        <line x1="0" y1="0" x2="${width}" y2="${height}" 
              stroke="rgba(255,255,255,0.1)" stroke-width="30" />
        <line x1="${width}" y1="0" x2="0" y2="${height}" 
              stroke="rgba(255,255,255,0.05)" stroke-width="20" />
      `;
    case 2: // Vagues
      return `
        <path d="M0,${height * 0.4} 
                 C${width * 0.25},${height * 0.3} 
                  ${width * 0.75},${height * 0.5} 
                  ${width},${height * 0.4} 
                 V${height} H0 Z" 
              fill="rgba(255,255,255,0.1)" />
      `;
    case 3: { // Points
      let dots = '';
      for (let i = 0; i < 20; i++) {
        const x = Math.floor(Math.random() * width);
        const y = Math.floor(Math.random() * height);
        const r = Math.floor(Math.random() * 10) + 2;
        dots += `<circle cx="${x}" cy="${y}" r="${r}" fill="rgba(255,255,255,0.1)" />`;
      }
      return dots;
    }
    default:
      return '';
  }
}

/**
 * Génère le logo FloDrama pour les placeholders
 * @param {number} width - Largeur de l'image
 * @param {number} height - Hauteur de l'image
 * @param {string} uniqueId - Identifiant unique
 * @returns {string} - Éléments SVG pour le logo
 */
function generateFloDramaLogo(width, height, uniqueId) {
  const logoSize = Math.min(width, height) * 0.2;
  const logoX = width / 2 - logoSize / 2;
  const logoY = height / 2 - logoSize / 2;
  
  return `
    <g transform="translate(${logoX}, ${logoY}) scale(${logoSize/100})">
      <defs>
        <linearGradient id="logoGradient-${uniqueId}" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="${CONFIG.colors.primary}" />
          <stop offset="100%" stop-color="${CONFIG.colors.secondary}" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="45" fill="none" stroke="url(#logoGradient-${uniqueId})" stroke-width="5" />
      <path d="M30,35 L30,65 M45,35 L45,65 M30,35 Q37.5,25 45,35 M30,65 Q37.5,75 45,65" 
            stroke="url(#logoGradient-${uniqueId})" stroke-width="5" fill="none" stroke-linecap="round" />
      <path d="M55,35 L70,35 Q80,35 80,45 Q80,55 70,55 L55,55 L55,65" 
            stroke="url(#logoGradient-${uniqueId})" stroke-width="5" fill="none" stroke-linecap="round" />
    </g>
  `;
}

/**
 * Charge les métadonnées des contenus
 * @returns {Promise<Array>} - Liste des contenus
 */
async function loadContentMetadata() {
  try {
    const data = await fs.promises.readFile(CONFIG.metadataFile, 'utf8');
    const metadata = JSON.parse(data);
    
    // Trier par popularité si disponible
    if (metadata.items && Array.isArray(metadata.items)) {
      return metadata.items.sort((a, b) => {
        const popA = a.popularity || 0;
        const popB = b.popularity || 0;
        return popB - popA;
      });
    }
    
    return [];
  } catch (error) {
    console.error(`Erreur lors du chargement des métadonnées: ${error.message}`);
    return [];
  }
}

/**
 * Génère et sauvegarde les placeholders pour un contenu
 * @param {Object} content - Données du contenu
 */
async function generatePlaceholdersForContent(content) {
  try {
    for (const type of CONFIG.imageTypes) {
      const svg = generatePlaceholderSvg(content, type);
      const filePath = path.join(CONFIG.outputDir, `${content.id}_${type}.svg`);
      
      await fs.promises.writeFile(filePath, svg);
      console.log(`✅ Placeholder généré: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Erreur lors de la génération des placeholders pour ${content.id}: ${error.message}`);
  }
}

/**
 * Fonction principale
 */
async function main() {
  try {
    // Créer le dossier de sortie s'il n'existe pas
    if (!fs.existsSync(CONFIG.outputDir)) {
      await fs.promises.mkdir(CONFIG.outputDir, { recursive: true });
      console.log(`📁 Dossier créé: ${CONFIG.outputDir}`);
    }
    
    // Charger les métadonnées
    const contents = await loadContentMetadata();
    if (contents.length === 0) {
      console.error('❌ Aucun contenu trouvé dans les métadonnées');
      return;
    }
    
    console.log(`📊 ${contents.length} contenus trouvés dans les métadonnées`);
    
    // Limiter le nombre de placeholders à générer
    const contentsToProcess = contents.slice(0, CONFIG.maxPlaceholders);
    console.log(`🔍 Génération de placeholders pour ${contentsToProcess.length} contenus`);
    
    // Générer les placeholders pour chaque contenu
    for (const content of contentsToProcess) {
      await generatePlaceholdersForContent(content);
    }
    
    console.log(`✨ Génération terminée! ${contentsToProcess.length * CONFIG.imageTypes.length} placeholders générés.`);
  } catch (error) {
    console.error(`❌ Erreur lors de l'exécution du script: ${error.message}`);
  }
}

// Exécuter le script
main();
