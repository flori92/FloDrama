/**
 * @file HomeContentComponent.js
 * @description Composant pour afficher les contenus sur la page d'accueil de FloDrama
 * Intègre le service de scraping intelligent et affiche les contenus dans différentes sections
 */

import { ContentDisplayComponent } from './ContentDisplayComponent.js';
import { SmartScrapingService } from '../../src/features/scraping/services/SmartScrapingService.js';

export class HomeContentComponent {
  /**
   * Initialise le composant de contenu pour la page d'accueil
   * @param {Object} options - Options de configuration
   */
  constructor(options = {}) {
    this.containerId = options.containerId || 'main-content';
    this.container = document.getElementById(this.containerId);
    
    if (!this.container) {
      console.error(`Conteneur avec l'ID ${this.containerId} non trouvé.`);
      return;
    }
    
    this.scrapingService = new SmartScrapingService();
    this.contentSections = [
      {
        id: 'trending-content',
        title: 'Tendances',
        contentType: 'all',
        limit: 12,
        useCarousel: true
      },
      {
        id: 'recommended-content',
        title: 'Recommandé pour vous',
        contentType: 'recommended',
        limit: 12,
        useCarousel: true
      },
      {
        id: 'drama-content',
        title: 'Dramas populaires',
        contentType: 'drama',
        limit: 12,
        useCarousel: true
      },
      {
        id: 'movie-content',
        title: 'Films à découvrir',
        contentType: 'movie',
        limit: 12,
        useCarousel: true
      },
      {
        id: 'anime-content',
        title: 'Animes du moment',
        contentType: 'anime',
        limit: 12,
        useCarousel: true
      },
      {
        id: 'tvshow-content',
        title: 'Séries TV',
        contentType: 'tvshow',
        limit: 12,
        useCarousel: true
      }
    ];
    
    this.init();
  }
  
  /**
   * Initialise le composant et charge les données
   */
  async init() {
    try {
      // Afficher un indicateur de chargement
      this.showLoadingState();
      
      // Vérifier si une mise à jour des données est nécessaire
      await this.checkAndUpdateContent();
      
      // Créer les sections de contenu
      this.createContentSections();
    } catch (error) {
      console.error('Erreur lors de l\'initialisation du composant de contenu:', error);
      this.showErrorState(error);
    }
  }
  
  /**
   * Vérifie si une mise à jour des données est nécessaire et l'effectue si besoin
   */
  async checkAndUpdateContent() {
    try {
      // Vérifier si les données sont déjà en cache
      const cacheStatus = await this.scrapingService.getCacheStatus();
      
      // Si le cache est vide ou trop ancien (plus de 24h), mettre à jour les données
      if (!cacheStatus.isValid || cacheStatus.isEmpty || 
          (Date.now() - cacheStatus.lastUpdate > 24 * 60 * 60 * 1000)) {
        
        // Afficher un message de mise à jour
        this.showUpdateMessage();
        
        // Configurer le service de scraping
        await this.scrapingService.configure({
          useCache: true,
          cacheFile: 'scraping-cache.json',
          proxy: { useProxy: false }
        });
        
        // Mettre à jour la base de données de contenu
        await this.scrapingService.updateContentDatabase();
      }
    } catch (error) {
      console.error('Erreur lors de la vérification/mise à jour du contenu:', error);
      // Continuer avec les données en cache si disponibles
    }
  }
  
  /**
   * Crée les sections de contenu sur la page
   */
  createContentSections() {
    // Vider le conteneur
    this.container.innerHTML = '';
    
    // Créer un conteneur pour chaque section
    this.contentSections.forEach(section => {
      const sectionContainer = document.createElement('section');
      sectionContainer.id = section.id;
      sectionContainer.className = 'content-section';
      this.container.appendChild(sectionContainer);
      
      // Initialiser le composant d'affichage pour cette section
      new ContentDisplayComponent({
        containerId: section.id,
        contentType: section.contentType,
        limit: section.limit,
        useCarousel: section.useCarousel,
        title: section.title
      });
    });
  }
  
  /**
   * Affiche un état de chargement
   */
  showLoadingState() {
    this.container.innerHTML = `
      <div class="home-loading">
        <div class="loading-spinner"></div>
        <h2>Chargement de votre contenu</h2>
        <p>Nous préparons vos dramas et films préférés...</p>
      </div>
    `;
  }
  
  /**
   * Affiche un message de mise à jour des données
   */
  showUpdateMessage() {
    const updateMessage = document.createElement('div');
    updateMessage.className = 'update-message';
    updateMessage.innerHTML = `
      <div class="update-icon">🔄</div>
      <div class="update-text">
        <h3>Mise à jour du contenu</h3>
        <p>Nous récupérons les derniers dramas et films pour vous...</p>
      </div>
      <div class="update-progress">
        <div class="progress-bar"></div>
      </div>
    `;
    
    // Ajouter le message au début du conteneur
    if (this.container.firstChild) {
      this.container.insertBefore(updateMessage, this.container.firstChild);
    } else {
      this.container.appendChild(updateMessage);
    }
    
    // Animer la barre de progression
    const progressBar = updateMessage.querySelector('.progress-bar');
    progressBar.style.width = '0%';
    
    // Simuler une progression
    let progress = 0;
    const interval = setInterval(() => {
      progress += 1;
      progressBar.style.width = `${progress}%`;
      
      if (progress >= 100) {
        clearInterval(interval);
        // Supprimer le message après un délai
        setTimeout(() => {
          updateMessage.classList.add('fade-out');
          setTimeout(() => updateMessage.remove(), 500);
        }, 1000);
      }
    }, 50);
    
    // Écouter les événements du service de scraping pour mettre à jour la progression réelle
    this.scrapingService.events.addEventListener('updateProgress', (event) => {
      const { current, total } = event.detail;
      const realProgress = Math.round((current / total) * 100);
      progress = realProgress;
      progressBar.style.width = `${progress}%`;
    });
  }
  
  /**
   * Affiche un état d'erreur
   * @param {Error} error - L'erreur survenue
   */
  showErrorState(error) {
    this.container.innerHTML = `
      <div class="home-error">
        <div class="error-icon">⚠️</div>
        <h2>Une erreur est survenue</h2>
        <p>${error.message || 'Impossible de charger le contenu. Veuillez réessayer plus tard.'}</p>
        <button class="retry-button">Réessayer</button>
      </div>
    `;
    
    // Ajouter un gestionnaire d'événement pour le bouton de réessai
    const retryButton = this.container.querySelector('.retry-button');
    if (retryButton) {
      retryButton.addEventListener('click', () => this.init());
    }
  }
}

// Exporter la classe pour une utilisation dans d'autres modules
export default HomeContentComponent;
