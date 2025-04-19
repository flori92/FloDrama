// Script de pont pour FloDrama
// Permet d'intégrer les composants vanilla JS avec les services existants
// et de les utiliser dans différents contextes (React ou vanilla JS)

import { RecommendationComponent } from './components/RecommendationComponent.js';
import { SearchComponent } from './components/SearchComponent.js';
import { FavoritesComponent } from './components/FavoritesComponent.js';

/**
 * Classe Bridge pour FloDrama
 * Permet d'intégrer les composants vanilla JS avec les services existants
 */
export class FloDramaBridge {
  /**
   * Constructeur du pont
   * @param {Object} services - Services existants
   */
  constructor(services = {}) {
    // Récupérer les services existants ou créer des instances par défaut
    this.services = {
      recommendationService: services.recommendationService || null,
      contentDataService: services.contentDataService || null,
      favoritesService: services.favoritesService || null,
      searchService: services.searchService || null
    };
    
    // Initialiser les composants avec les services appropriés
    this.components = {
      recommendation: this.services.recommendationService && this.services.contentDataService 
        ? new RecommendationComponent(this.services.recommendationService, this.services.contentDataService)
        : null,
      search: this.services.searchService && this.services.contentDataService
        ? new SearchComponent(this.services.searchService, this.services.contentDataService)
        : null,
      favorites: this.services.favoritesService && this.services.contentDataService
        ? new FavoritesComponent(this.services.favoritesService, this.services.contentDataService)
        : null
    };
    
    console.log('FloDramaBridge initialisé');
  }
  
  /**
   * Vérifier si un composant est disponible
   * @param {string} componentName - Nom du composant
   * @returns {boolean} - True si le composant est disponible
   */
  hasComponent(componentName) {
    return !!this.components[componentName];
  }
  
  /**
   * Rendre un composant dans un conteneur
   * @param {string} componentName - Nom du composant
   * @param {HTMLElement} container - Conteneur pour le composant
   * @returns {Promise<HTMLElement>} - Le conteneur du composant
   */
  async renderComponent(componentName, container) {
    if (!this.hasComponent(componentName)) {
      console.error(`Le composant ${componentName} n'est pas disponible`);
      return null;
    }
    
    try {
      return await this.components[componentName].render(container);
    } catch (error) {
      console.error(`Erreur lors du rendu du composant ${componentName}:`, error);
      return null;
    }
  }
  
  /**
   * Créer un wrapper React pour un composant vanilla JS
   * @param {string} componentName - Nom du composant
   * @returns {Function} - Composant React
   */
  createReactWrapper(componentName) {
    if (!this.hasComponent(componentName)) {
      console.error(`Le composant ${componentName} n'est pas disponible`);
      return null;
    }
    
    // Cette fonction sera utilisée dans un contexte React
    // Elle retourne une fonction qui peut être utilisée comme un composant React
    const ReactWrapper = (props) => {
      if (typeof window !== 'undefined' && window.React) {
        // Créer une référence au conteneur DOM
        const containerRef = window.React.useRef(null);
        
        // Utiliser useEffect pour rendre le composant vanilla JS
        window.React.useEffect(() => {
          if (containerRef.current) {
            this.renderComponent(componentName, containerRef.current);
          }
        }, [containerRef]);
        
        // Retourner un élément div qui servira de conteneur
        return window.React.createElement('div', {
          ref: containerRef,
          className: `flodrama-${componentName}-wrapper`,
          ...props
        });
      }
      
      console.error('React n\'est pas disponible dans l\'environnement actuel');
      return null;
    };
    
    // Ajouter un displayName pour le débogage
    ReactWrapper.displayName = `FloDrama${componentName.charAt(0).toUpperCase() + componentName.slice(1)}`;
    
    return ReactWrapper;
  }
  
  /**
   * Obtenir une instance d'un composant
   * @param {string} componentName - Nom du composant
   * @returns {Object} - Instance du composant
   */
  getComponent(componentName) {
    if (!this.hasComponent(componentName)) {
      console.error(`Le composant ${componentName} n'est pas disponible`);
      return null;
    }
    
    return this.components[componentName];
  }
}

/**
 * Fonction d'initialisation du pont avec les services existants
 * @param {Object} services - Services existants
 * @returns {FloDramaBridge} - Instance du pont
 */
export function initializeBridge(services = {}) {
  return new FloDramaBridge(services);
}

// Exemple d'utilisation:
/*
// Importer les services existants
import { RecommendationService } from './services/RecommendationService.js';
import { ContentDataService } from './services/ContentDataService.js';
import { FavoritesService } from './services/FavoritesService.js';
import { SearchService } from './services/SearchService.js';

// Initialiser les services
const contentDataService = new ContentDataService();
const favoritesService = new FavoritesService();
const searchService = new SearchService(contentDataService);
const recommendationService = new RecommendationService(contentDataService, favoritesService);

// Initialiser le pont
const bridge = initializeBridge({
  recommendationService,
  contentDataService,
  favoritesService,
  searchService
});

// Utilisation en vanilla JS
const container = document.getElementById('recommendation-container');
bridge.renderComponent('recommendation', container);

// Utilisation avec React
const RecommendationComponent = bridge.createReactWrapper('recommendation');
// Puis dans un composant React:
// <RecommendationComponent />
*/
