/**
 * FloDrama - Composant de contenu pour la page d'accueil
 * Gère l'affichage et le comportement du contenu de la page d'accueil
 */

class HomeContentComponent {
  constructor() {
    this.isInitialized = false;
    this.heroImages = [
      'https://flodrama-assets.s3.amazonaws.com/assets/images/hero/hero1.jpg',
      'https://flodrama-assets.s3.amazonaws.com/assets/images/hero/hero2.jpg',
      'https://flodrama-assets.s3.amazonaws.com/assets/images/hero/hero3.jpg'
    ];
    this.heroGradients = [
      'linear-gradient(135deg, #6366F1 0%, #FB7185 100%)',
      'linear-gradient(135deg, #3B82F6 0%, #10B981 100%)',
      'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)'
    ];
    this.currentHeroIndex = 0;
    this.heroInterval = null;
    this.useGradientFallback = false;
    
    console.log('HomeContentComponent initialisé');
  }

  /**
   * Initialise le composant de contenu de la page d'accueil
   */
  init() {
    if (this.isInitialized) return;
    
    this.setupHeroSlider();
    this.setupContentGrids();
    this.setupExploreButtons();
    
    this.isInitialized = true;
    console.log('HomeContentComponent complètement initialisé');
  }

  /**
   * Configure le slider de la section hero
   */
  setupHeroSlider() {
    const heroSection = document.querySelector('.hero');
    if (!heroSection) return;
    
    // Créer un fond avec effet de parallaxe
    const heroBackground = document.createElement('div');
    heroBackground.className = 'hero-background';
    heroBackground.style.position = 'absolute';
    heroBackground.style.top = '0';
    heroBackground.style.left = '0';
    heroBackground.style.width = '100%';
    heroBackground.style.height = '100%';
    heroBackground.style.zIndex = '-1';
    heroBackground.style.opacity = '0.6';
    
    // Test du chargement des images, utiliser des dégradés en fallback
    this.testImageLoading()
      .then(useGradients => {
        this.useGradientFallback = useGradients;
        if (useGradients) {
          console.log('Utilisation des dégradés en fallback pour les images hero');
          heroBackground.style.backgroundImage = this.heroGradients[0];
        } else {
          heroBackground.style.backgroundImage = `url('${this.heroImages[0]}')`;
        }
      });
    
    heroBackground.style.backgroundSize = 'cover';
    heroBackground.style.backgroundPosition = 'center';
    heroBackground.style.transition = 'background-image 1s ease-in-out';
    
    // Ajouter une superposition pour améliorer la lisibilité du texte
    heroBackground.style.boxShadow = 'inset 0 0 0 1000px rgba(0, 0, 0, 0.6)';
    
    // S'assurer que la section hero a position relative
    heroSection.style.position = 'relative';
    heroSection.style.overflow = 'hidden';
    
    // Ajouter le fond à la section hero
    heroSection.insertBefore(heroBackground, heroSection.firstChild);
    
    // Configurer la rotation automatique des images
    this.startHeroRotation();
    
    // Arrêter la rotation lorsque l'utilisateur quitte la page
    window.addEventListener('beforeunload', () => {
      this.stopHeroRotation();
    });
  }

  /**
   * Teste si les images peuvent être chargées, sinon utilise des dégradés
   * @returns {Promise<boolean>} True si on doit utiliser des dégradés (les images ne sont pas disponibles)
   */
  testImageLoading() {
    return new Promise(resolve => {
      const testImg = new Image();
      testImg.onload = () => resolve(false); // Image chargée avec succès, pas besoin de fallback
      testImg.onerror = () => resolve(true);  // Erreur de chargement, utiliser les fallbacks
      testImg.src = this.heroImages[0];
      
      // Timeout pour ne pas attendre trop longtemps
      setTimeout(() => resolve(true), 2000);
    });
  }

  /**
   * Démarre la rotation automatique des images hero
   */
  startHeroRotation() {
    if (this.heroInterval) return;
    
    this.heroInterval = setInterval(() => {
      this.currentHeroIndex = (this.currentHeroIndex + 1) % this.heroImages.length;
      const heroBackground = document.querySelector('.hero-background');
      
      if (heroBackground) {
        if (this.useGradientFallback) {
          heroBackground.style.backgroundImage = this.heroGradients[this.currentHeroIndex];
        } else {
          heroBackground.style.backgroundImage = `url('${this.heroImages[this.currentHeroIndex]}')`;
        }
      }
    }, 5000); // Changer toutes les 5 secondes
  }

  /**
   * Arrête la rotation automatique des images hero
   */
  stopHeroRotation() {
    if (this.heroInterval) {
      clearInterval(this.heroInterval);
      this.heroInterval = null;
    }
  }

  /**
   * Configure les grilles de contenu
   */
  setupContentGrids() {
    // Utiliser les gradients pour les cartes sans image
    const contentCards = document.querySelectorAll('.content-card');
    
    // Appliquer des effets de survol aux cartes
    contentCards.forEach(card => {
      card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-5px)';
        card.style.boxShadow = '0 10px 20px rgba(0, 0, 0, 0.2)';
        
        const poster = card.querySelector('.card-poster');
        if (poster) {
          poster.style.transform = 'scale(1.05)';
        }
      });
      
      card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0)';
        card.style.boxShadow = 'none';
        
        const poster = card.querySelector('.card-poster');
        if (poster) {
          poster.style.transform = 'scale(1)';
        }
      });
      
      // Rendre la carte cliquable
      card.style.cursor = 'pointer';
      card.addEventListener('click', () => {
        const title = card.querySelector('.card-title')?.textContent || 'Unknown';
        
        // Créer une URL propre basée sur le titre
        const slug = title.toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-');
        
        window.location.href = `/content-detail.html?title=${encodeURIComponent(title)}&slug=${slug}`;
      });
    });
  }

  /**
   * Configure les boutons d'exploration
   */
  setupExploreButtons() {
    const exploreButtons = document.querySelectorAll('.btn-primary');
    
    exploreButtons.forEach(button => {
      if (button.textContent.includes('Explorer')) {
        button.addEventListener('click', (e) => {
          e.preventDefault();
          // Défiler jusqu'à la première section de contenu
          const firstSection = document.querySelector('.section');
          if (firstSection) {
            window.scrollTo({
              top: firstSection.offsetTop - 20,
              behavior: 'smooth'
            });
          }
        });
      }
    });
  }
}

// Exporter une instance unique du composant
const homeContentComponent = new HomeContentComponent();

document.addEventListener('DOMContentLoaded', () => {
  // Vérifier si c'est bien la page d'accueil
  const isHomePage = window.location.pathname.endsWith('index.html') || 
                     window.location.pathname.endsWith('index-optimise.html') ||
                     window.location.pathname === '/' ||
                     window.location.pathname.endsWith('/');
  
  if (isHomePage) {
    homeContentComponent.init();
  }
});

export default homeContentComponent;
