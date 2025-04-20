/**
 * Script d'optimisation des images pour FloDrama
 * Ce script convertit les images en WebP et génère des placeholders pour les images manquantes
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { createCanvas } = require('canvas');

// Chemins des répertoires
const ROOT_DIR = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const STATIC_DIR = path.join(PUBLIC_DIR, 'static');
const IMAGES_DIR = path.join(STATIC_DIR, 'images');
const PLACEHOLDERS_DIR = path.join(STATIC_DIR, 'placeholders');
const CACHE_DIR = path.join(STATIC_DIR, 'cache');

// Configuration
const IMAGE_SIZES = {
  poster: { width: 500, height: 750 },
  backdrop: { width: 1280, height: 720 },
  thumbnail: { width: 500, height: 281 }
};

// Couleurs par type de contenu
const CONTENT_COLORS = {
  drama: '#9D4EDD', // Violet
  movie: '#5F5FFF', // Bleu
  anime: '#4361EE', // Bleu anime
  bollywood: '#FB5607' // Orange
};

// Création des répertoires s'ils n'existent pas
console.log('🔍 Vérification des répertoires d\'images...');
[STATIC_DIR, IMAGES_DIR, PLACEHOLDERS_DIR, CACHE_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    console.log(`📁 Création du répertoire ${dir}`);
    fs.mkdirSync(dir, { recursive: true });
  }
});

/**
 * Génère un placeholder pour une image manquante
 * @param {string} type - Type de contenu (drama, anime, etc.)
 * @param {string} imageType - Type d'image (poster, backdrop, thumbnail)
 * @param {string} text - Texte à afficher sur l'image
 * @returns {Promise<Buffer>} - Buffer de l'image générée
 */
async function generatePlaceholder(type, imageType, text) {
  const { width, height } = IMAGE_SIZES[imageType] || IMAGE_SIZES.poster;
  const color = CONTENT_COLORS[type] || CONTENT_COLORS.drama;
  
  // Créer un canvas pour générer l'image
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  
  // Remplir le fond avec la couleur du type de contenu
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, width, height);
  
  // Ajouter un dégradé
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, 'rgba(24, 24, 36, 0.3)');
  gradient.addColorStop(1, 'rgba(247, 37, 133, 0.1)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  // Ajouter le texte
  ctx.fillStyle = 'white';
  ctx.font = `bold ${Math.floor(width / 15)}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, width / 2, height / 2);
  
  // Convertir le canvas en buffer WebP
  return await sharp(canvas.toBuffer('image/png'))
    .webp({ quality: 80 })
    .toBuffer();
}

/**
 * Optimise une image et la met en cache
 * @param {string} imagePath - Chemin de l'image source
 * @param {string} type - Type de contenu (drama, anime, etc.)
 * @param {string} imageType - Type d'image (poster, backdrop, thumbnail)
 * @returns {Promise<string>} - Chemin de l'image optimisée
 */
async function optimizeImage(imagePath, type, imageType) {
  try {
    // Vérifier si l'image existe
    if (!fs.existsSync(imagePath)) {
      throw new Error(`Image non trouvée: ${imagePath}`);
    }
    
    // Calculer le hash du fichier pour le cache
    const fileBuffer = fs.readFileSync(imagePath);
    const fileHash = require('crypto')
      .createHash('md5')
      .update(fileBuffer)
      .digest('hex');
    
    // Chemin de l'image en cache
    const cachePath = path.join(CACHE_DIR, `${fileHash}_${imageType}.webp`);
    
    // Vérifier si l'image est déjà en cache
    if (fs.existsSync(cachePath)) {
      console.log(`✅ Image déjà en cache: ${cachePath}`);
      return cachePath;
    }
    
    // Dimensions cibles
    const { width, height } = IMAGE_SIZES[imageType] || IMAGE_SIZES.poster;
    
    // Optimiser l'image
    console.log(`🔄 Optimisation de l'image: ${imagePath}`);
    await sharp(imagePath)
      .resize(width, height, { fit: 'cover' })
      .webp({ quality: 80 })
      .toFile(cachePath);
    
    console.log(`✅ Image optimisée: ${cachePath}`);
    return cachePath;
  } catch (error) {
    console.error(`❌ Erreur lors de l'optimisation de l'image: ${error.message}`);
    
    // Générer un placeholder en cas d'erreur
    const placeholderText = `${type} ${imageType}`;
    const placeholderBuffer = await generatePlaceholder(type, imageType, placeholderText);
    
    // Chemin du placeholder
    const placeholderPath = path.join(PLACEHOLDERS_DIR, `${type}1-${imageType === 'poster' ? '' : imageType}.webp`);
    
    // Sauvegarder le placeholder
    await sharp(placeholderBuffer).toFile(placeholderPath);
    
    console.log(`✅ Placeholder généré: ${placeholderPath}`);
    return placeholderPath;
  }
}

/**
 * Génère tous les placeholders pour tous les types de contenu
 */
async function generateAllPlaceholders() {
  console.log('🔄 Génération des placeholders pour tous les types de contenu...');
  
  const contentTypes = Object.keys(CONTENT_COLORS);
  const imageTypes = Object.keys(IMAGE_SIZES);
  
  for (const type of contentTypes) {
    for (const imageType of imageTypes) {
      const placeholderText = `${type} ${imageType}`;
      const placeholderBuffer = await generatePlaceholder(type, imageType, placeholderText);
      
      // Chemin du placeholder
      const placeholderPath = path.join(PLACEHOLDERS_DIR, `${type}1-${imageType === 'poster' ? '' : imageType}.webp`);
      
      // Sauvegarder le placeholder
      await sharp(placeholderBuffer).toFile(placeholderPath);
      
      console.log(`✅ Placeholder généré: ${placeholderPath}`);
    }
  }
  
  console.log('✅ Tous les placeholders ont été générés');
}

/**
 * Optimise toutes les images dans le répertoire d'images
 */
async function optimizeAllImages() {
  console.log('🔄 Optimisation de toutes les images...');
  
  // Lire le répertoire d'images
  const files = fs.readdirSync(IMAGES_DIR);
  
  // Filtrer les images
  const imageFiles = files.filter(file => {
    const ext = path.extname(file).toLowerCase();
    return ['.jpg', '.jpeg', '.png', '.webp'].includes(ext);
  });
  
  console.log(`🔍 ${imageFiles.length} images trouvées`);
  
  // Optimiser chaque image
  for (const file of imageFiles) {
    const filePath = path.join(IMAGES_DIR, file);
    const fileName = path.basename(file, path.extname(file));
    
    // Déterminer le type de contenu et d'image à partir du nom de fichier
    let type = 'drama';
    let imageType = 'poster';
    
    if (fileName.includes('anime')) type = 'anime';
    if (fileName.includes('movie')) type = 'movie';
    if (fileName.includes('bollywood')) type = 'bollywood';
    
    if (fileName.includes('backdrop')) imageType = 'backdrop';
    if (fileName.includes('thumbnail') || fileName.includes('thumb')) imageType = 'thumbnail';
    
    await optimizeImage(filePath, type, imageType);
  }
  
  console.log('✅ Toutes les images ont été optimisées');
}

/**
 * Fonction principale
 */
async function main() {
  console.log('\n🖼️  Optimisation des images pour FloDrama\n');
  
  try {
    // Générer tous les placeholders
    await generateAllPlaceholders();
    
    // Optimiser toutes les images si le répertoire n'est pas vide
    if (fs.existsSync(IMAGES_DIR) && fs.readdirSync(IMAGES_DIR).length > 0) {
      await optimizeAllImages();
    } else {
      console.log('⚠️ Aucune image trouvée dans le répertoire d\'images');
    }
    
    console.log('\n✅ Optimisation des images terminée avec succès');
  } catch (error) {
    console.error(`\n❌ Erreur lors de l'optimisation des images: ${error.message}`);
    process.exit(1);
  }
}

// Exécuter la fonction principale
main();
