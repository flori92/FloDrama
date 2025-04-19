/**
 * Script d'initialisation des images de contenu pour FloDrama
 * Ce fichier assure que toutes les cartes de contenu sont correctement initialisées
 * avec les attributs nécessaires pour le chargement des images et des données réelles.
 */

// URL du fichier de métadonnées
const METADATA_URL = '/assets/data/metadata.json';

// Cache pour les métadonnées
let metadataCache = null;

// Fonction pour charger les métadonnées
async function loadMetadata() {
  if (metadataCache) {
    return metadataCache;
  }
  
  try {
    const response = await fetch(METADATA_URL);
    if (!response.ok) {
      throw new Error(`Erreur lors du chargement des métadonnées: ${response.status}`);
    }
    
    const data = await response.json();
    metadataCache = data;
    console.log(`Métadonnées chargées avec succès: ${data.items.length} éléments`);
    return data;
  } catch (error) {
    console.error('Erreur lors du chargement des métadonnées:', error);
    return { items: [] };
  }
}

// Déterminer la catégorie de contenu en fonction de l'URL
function getContentCategory() {
  const path = window.location.pathname.toLowerCase();
  
  if (path.includes('dramas') || path.includes('drama')) {
    return 'drama';
  } else if (path.includes('films') || path.includes('film') || path.includes('movie')) {
    return 'movie';
  } else if (path.includes('animes') || path.includes('anime')) {
    return 'anime';
  }
  
  // Par défaut, retourner un mix de contenu
  return 'mix';
}

// Filtrer les données de contenu en fonction de la catégorie
function filterContentByCategory(metadata, category, limit = 10) {
  if (!metadata || !metadata.items || !Array.isArray(metadata.items)) {
    console.warn('Métadonnées invalides');
    return [];
  }
  
  let filteredItems = [];
  
  if (category === 'mix') {
    // Prendre un mix de différentes catégories
    const dramas = metadata.items.filter(item => item.category === 'drama').slice(0, 4);
    const movies = metadata.items.filter(item => item.category === 'movie').slice(0, 3);
    const animes = metadata.items.filter(item => item.category === 'anime').slice(0, 3);
    
    filteredItems = [...dramas, ...movies, ...animes];
  } else {
    // Filtrer par catégorie spécifique
    filteredItems = metadata.items.filter(item => item.category === category);
  }
  
  // Limiter le nombre d'éléments
  return filteredItems.slice(0, limit);
}

document.addEventListener('DOMContentLoaded', async function() {
  console.log('Initialisation des images de contenu FloDrama avec données réelles...');
  
  // Initialiser les cartes de contenu si le système d'images est chargé
  if (window.FloDramaImageSystem && typeof window.FloDramaImageSystem.initContentCards === 'function') {
    try {
      // Charger les métadonnées
      const metadata = await loadMetadata();
      
      // Déterminer la catégorie de contenu
      const category = getContentCategory();
      console.log(`Catégorie de contenu détectée: ${category}`);
      
      // Filtrer les données de contenu
      const contentData = filterContentByCategory(metadata, category);
      console.log(`${contentData.length} éléments de contenu chargés pour la catégorie ${category}`);
      
      // Initialiser les cartes de contenu
      window.FloDramaImageSystem.initContentCards();
      
      // Mettre à jour les titres et informations des cartes
      updateContentCards(contentData);
    } catch (error) {
      console.error('Erreur lors de l\'initialisation des images de contenu:', error);
    }
  } else {
    console.warn('Le système d\'images FloDrama n\'est pas chargé. Les images de contenu ne seront pas initialisées.');
  }
});

// Mettre à jour les cartes de contenu avec les données réelles
function updateContentCards(contentData) {
  const contentCards = document.querySelectorAll('.content-card');
  
  contentCards.forEach((card, index) => {
    if (index < contentData.length) {
      const data = contentData[index];
      
      // Mettre à jour l'ID de contenu pour les images
      const poster = card.querySelector('.card-poster');
      if (poster) {
        const img = poster.querySelector('img') || poster;
        img.setAttribute('data-content-id', data.id);
        img.setAttribute('data-type', 'poster');
        
        // Forcer le rechargement de l'image avec le nouvel ID
        if (window.FloDramaImageSystem) {
          const sources = window.FloDramaImageSystem.generateImageSources(data.id, 'poster');
          if (sources.length > 0) {
            img.src = sources[0];
          }
        }
      }
      
      // Ajouter ou mettre à jour le titre
      let titleElement = card.querySelector('.card-title');
      if (!titleElement) {
        titleElement = document.createElement('div');
        titleElement.className = 'card-title';
        card.appendChild(titleElement);
      }
      titleElement.textContent = data.title;
      
      // Ajouter ou mettre à jour les métadonnées (année, genres)
      let metaElement = card.querySelector('.card-meta');
      if (!metaElement) {
        metaElement = document.createElement('div');
        metaElement.className = 'card-meta';
        card.appendChild(metaElement);
      }
      
      // Formater les métadonnées
      const year = data.year || '';
      const genres = data.genres && Array.isArray(data.genres) ? data.genres.join(', ') : '';
      metaElement.textContent = `${year}${genres ? ' • ' + genres : ''}`;
      
      // Ajouter des styles CSS si nécessaire
      if (!card.classList.contains('card-styled')) {
        card.classList.add('card-styled');
        
        // Styles pour le titre
        titleElement.style.color = '#FFFFFF';
        titleElement.style.fontWeight = 'bold';
        titleElement.style.fontSize = '0.9rem';
        titleElement.style.margin = '8px 0 4px 0';
        titleElement.style.padding = '0 8px';
        
        // Styles pour les métadonnées
        metaElement.style.color = 'rgba(255, 255, 255, 0.7)';
        metaElement.style.fontSize = '0.8rem';
        metaElement.style.padding = '0 8px 8px 8px';
      }
    }
  });
  
  console.log(`${Math.min(contentCards.length, contentData.length)} cartes de contenu mises à jour avec des données réelles`);
}
