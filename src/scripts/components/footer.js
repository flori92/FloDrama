/**
 * FloDrama - Composant de pied de page
 * Gère l'affichage et le comportement du footer
 */

class FooterComponent {
  constructor() {
    this.isInitialized = false;
    this.year = new Date().getFullYear();
    console.log('FooterComponent initialisé');
  }

  /**
   * Initialise le footer
   */
  init() {
    if (this.isInitialized) return;
    
    this.updateCopyright();
    this.setupFooterLinks();
    
    this.isInitialized = true;
    console.log('FooterComponent complètement initialisé');
  }

  /**
   * Met à jour l'année de copyright
   */
  updateCopyright() {
    const copyrightElements = document.querySelectorAll('.footer-copyright');
    
    copyrightElements.forEach(element => {
      // Remplacer l'année si elle est présente
      const content = element.textContent;
      if (content.includes('FloDrama')) {
        element.textContent = content.replace(/\d{4}/, this.year);
      }
    });
  }

  /**
   * Configure les liens du footer
   */
  setupFooterLinks() {
    const footerLinks = document.querySelectorAll('.footer-link');
    
    footerLinks.forEach(link => {
      // Ajouter des attributs pour l'accessibilité
      const linkText = link.textContent.trim();
      link.setAttribute('aria-label', linkText);
      
      // Gérer les liens externes
      const href = link.getAttribute('href');
      if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer');
      }
    });
  }

  /**
   * Ajoute un lien personnalisé au footer
   * @param {string} text - Texte du lien
   * @param {string} href - URL du lien
   * @param {boolean} isExternal - Si le lien est externe
   */
  addCustomLink(text, href, isExternal = false) {
    const footerLinks = document.querySelector('.footer-links');
    if (!footerLinks) return;
    
    const link = document.createElement('a');
    link.className = 'footer-link';
    link.textContent = text;
    link.setAttribute('href', href);
    link.setAttribute('aria-label', text);
    
    if (isExternal) {
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
    }
    
    footerLinks.appendChild(link);
    console.log(`Lien "${text}" ajouté au footer`);
  }
}

// Exporter une instance unique du composant
const footerComponent = new FooterComponent();

document.addEventListener('DOMContentLoaded', () => {
  footerComponent.init();
});

export default footerComponent;
