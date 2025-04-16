// Créez ce nouveau fichier pour gérer le chargement optimisé des images
export const optimizeImageLoading = () => {
  // Détecte si le navigateur prend en charge les fonctionnalités modernes
  const hasIntersectionObserver = 'IntersectionObserver' in window;
  
  if (hasIntersectionObserver) {
    const lazyImages = document.querySelectorAll('.lazy-image');
    
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          const src = img.dataset.src;
          
          if (src) {
            img.src = src;
            img.classList.add('loaded');
            imageObserver.unobserve(img);
          }
        }
      });
    }, {
      rootMargin: '50px 0px',
      threshold: 0.01
    });
    
    lazyImages.forEach(img => {
      imageObserver.observe(img);
    });
  } else {
    // Fallback pour les navigateurs qui ne prennent pas en charge IntersectionObserver
    const lazyImages = document.querySelectorAll('.lazy-image');
    lazyImages.forEach(img => {
      img.src = img.dataset.src;
      img.classList.add('loaded');
    });
  }
}; 