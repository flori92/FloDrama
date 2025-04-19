/**
 * Script d'initialisation des images de contenu pour FloDrama
 * Ce script assure que toutes les cartes de contenu sont correctement initialisées
 * avec les attributs nécessaires pour le chargement des images.
 */

document.addEventListener('DOMContentLoaded', function() {
  console.log('Initialisation des images de contenu FloDrama...');
  
  // Initialiser les cartes de contenu si le système d'images est chargé
  if (window.FloDramaImageSystem && typeof window.FloDramaImageSystem.initContentCards === 'function') {
    // Attendre un court instant pour s'assurer que le DOM est complètement chargé
    setTimeout(() => {
      window.FloDramaImageSystem.initContentCards();
      
      // Vérifier s'il y a des éléments avec data-content-id qui n'ont pas d'image
      const contentElements = document.querySelectorAll('[data-content-id]');
      console.log(`Vérification de ${contentElements.length} éléments de contenu...`);
      
      contentElements.forEach(element => {
        const contentId = element.getAttribute('data-content-id');
        const type = element.getAttribute('data-type') || 'poster';
        
        // Si l'élément n'a pas de src ou si c'est une div sans image enfant
        if ((element.tagName.toLowerCase() === 'img' && (!element.src || element.src === '')) ||
            (element.tagName.toLowerCase() !== 'img' && !element.querySelector('img'))) {
          
          console.log(`Chargement de l'image pour ${contentId} (${type})...`);
          
          // Générer les sources d'images
          const sources = window.FloDramaImageSystem.generateImageSources(contentId, type);
          
          // Si c'est une image, définir la source
          if (element.tagName.toLowerCase() === 'img') {
            if (sources.length > 0) {
              element.src = sources[0];
            }
          } 
          // Si c'est un div, créer une image à l'intérieur
          else {
            const img = document.createElement('img');
            img.className = 'content-image';
            img.setAttribute('data-content-id', contentId);
            img.setAttribute('data-type', type);
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'cover';
            
            // Ajouter l'image au conteneur
            element.appendChild(img);
            
            // Définir la source
            if (sources.length > 0) {
              img.src = sources[0];
            }
          }
        }
      });
    }, 100);
  } else {
    console.warn('Le système d\'images FloDrama n\'est pas chargé. Les images de contenu ne seront pas initialisées.');
  }
});
