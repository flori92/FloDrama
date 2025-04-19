/**
 * @file ContentDisplayComponent.js
 * @description Composant responsable de l'affichage des contenus récupérés par le service de scraping
 * Ce composant génère des cartes de contenu dynamiques et des carrousels pour la page d'accueil
 */

import { ContentDataService } from '../../services/content/ContentDataService.js';
import { RecommendationService } from '../../services/recommendation/RecommendationService.js';

export class ContentDisplayComponent {
  /**
   * Initialise le composant d'affichage de contenu
   * @param {Object} options - Options de configuration
   * @param {string} options.containerId - ID du conteneur où afficher les contenus
   * @param {string} options.contentType - Type de contenu à afficher (drama, movie, anime, etc.)
   * @param {number} options.limit - Nombre maximum d'éléments à afficher
   * @param {boolean} options.useCarousel - Utiliser un carrousel pour l'affichage
   * @param {string} options.title - Titre de la section
   */
  constructor(options = {}) {
    this.containerId = options.containerId || 'content-container';
    this.contentType = options.contentType || 'all';
    this.limit = options.limit || 12;
    this.useCarousel = options.useCarousel !== undefined ? options.useCarousel : true;
    this.title = options.title || 'Contenus populaires';
    
    this.contentService = new ContentDataService();
    this.recommendationService = new RecommendationService();
    
    this.container = document.getElementById(this.containerId);
    if (!this.container) {
      console.error(`Conteneur avec l'ID ${this.containerId} non trouvé.`);
      return;
    }
    
    this.init();
  }
  
  /**
   * Initialise le composant et charge les données
   */
  async init() {
    try {
      // Afficher un indicateur de chargement
      this.showLoadingState();
      
      // Récupérer les données de contenu
      let contentData;
      
      if (this.contentType === 'recommended') {
        contentData = await this.recommendationService.getPersonalizedRecommendations(this.limit);
      } else if (this.contentType === 'all') {
        contentData = await this.contentService.getAllContent(this.limit);
      } else {
        contentData = await this.contentService.getContentByType(this.contentType, this.limit);
      }
      
      // Vérifier si des données ont été récupérées
      if (!contentData || contentData.length === 0) {
        this.showEmptyState();
        return;
      }
      
      // Afficher les contenus
      this.renderContent(contentData);
    } catch (error) {
      console.error('Erreur lors du chargement des contenus:', error);
      this.showErrorState(error);
    }
  }
  
  /**
   * Affiche un état de chargement
   */
  showLoadingState() {
    this.container.innerHTML = `
      <div class="content-loading">
        <div class="loading-spinner"></div>
        <p>Chargement des contenus...</p>
      </div>
    `;
  }
  
  /**
   * Affiche un état vide lorsqu'aucun contenu n'est disponible
   */
  showEmptyState() {
    this.container.innerHTML = `
      <div class="content-empty-state">
        <div class="empty-icon">📺</div>
        <h3>Aucun contenu disponible</h3>
        <p>Nous n'avons pas trouvé de contenu correspondant à votre recherche.</p>
      </div>
    `;
  }
  
  /**
   * Affiche un état d'erreur
   * @param {Error} error - L'erreur survenue
   */
  showErrorState(error) {
    this.container.innerHTML = `
      <div class="content-error-state">
        <div class="error-icon">⚠️</div>
        <h3>Une erreur est survenue</h3>
        <p>${error.message || 'Impossible de charger les contenus. Veuillez réessayer plus tard.'}</p>
        <button class="retry-button">Réessayer</button>
      </div>
    `;
    
    // Ajouter un gestionnaire d'événement pour le bouton de réessai
    const retryButton = this.container.querySelector('.retry-button');
    if (retryButton) {
      retryButton.addEventListener('click', () => this.init());
    }
  }
  
  /**
   * Génère l'affichage des contenus
   * @param {Array} contentData - Données de contenu à afficher
   */
  renderContent(contentData) {
    // Vider le conteneur
    this.container.innerHTML = '';
    
    // Créer l'en-tête de section
    const sectionHeader = document.createElement('div');
    sectionHeader.className = 'content-section-header';
    sectionHeader.innerHTML = `
      <h2 class="section-title">${this.title}</h2>
      ${this.useCarousel ? '<div class="carousel-controls"><button class="prev-btn">❮</button><button class="next-btn">❯</button></div>' : ''}
    `;
    this.container.appendChild(sectionHeader);
    
    // Créer le conteneur de contenu
    const contentContainer = document.createElement('div');
    contentContainer.className = this.useCarousel ? 'content-carousel' : 'content-grid';
    
    // Générer les cartes de contenu
    contentData.forEach(item => {
      const contentCard = this.createContentCard(item);
      contentContainer.appendChild(contentCard);
    });
    
    this.container.appendChild(contentContainer);
    
    // Initialiser le carrousel si nécessaire
    if (this.useCarousel) {
      this.initCarousel(contentContainer);
    }
  }
  
  /**
   * Crée une carte de contenu
   * @param {Object} item - Élément de contenu
   * @returns {HTMLElement} - Élément DOM de la carte
   */
  createContentCard(item) {
    const card = document.createElement('div');
    card.className = 'content-card';
    card.setAttribute('data-id', item.id);
    
    // Déterminer le badge à afficher (nouveau, populaire, etc.)
    let badgeHTML = '';
    if (item.isNew) {
      badgeHTML = '<span class="content-badge new">Nouveau</span>';
    } else if (item.trending) {
      badgeHTML = '<span class="content-badge trending">Populaire</span>';
    } else if (item.episodesAvailable > 1) {
      badgeHTML = `<span class="content-badge episodes">${item.episodesAvailable} Épisodes</span>`;
    }
    
    // Créer l'image avec fallback
    const imageUrl = item.posterUrl || item.thumbnailUrl || '';
    const imageFallback = this.generateImagePlaceholder(item.title);
    
    card.innerHTML = `
      <div class="card-poster">
        <img src="${imageUrl}" alt="${item.title}" onerror="this.onerror=null; this.src='${imageFallback}'">
        ${badgeHTML}
        <div class="card-overlay">
          <div class="card-actions">
            <button class="play-button" aria-label="Regarder maintenant">▶</button>
            <button class="info-button" aria-label="Plus d'informations">ℹ</button>
            <button class="favorite-button" aria-label="Ajouter aux favoris">♡</button>
          </div>
        </div>
      </div>
      <div class="card-info">
        <h3 class="card-title">${item.title}</h3>
        <div class="card-meta">
          <span class="card-year">${item.year || 'N/A'}</span>
          <span class="card-type">${this.formatContentType(item.type)}</span>
          ${item.rating ? `<span class="card-rating">★ ${item.rating}</span>` : ''}
        </div>
      </div>
    `;
    
    // Ajouter des gestionnaires d'événements
    this.attachCardEventListeners(card, item);
    
    return card;
  }
  
  /**
   * Attache les gestionnaires d'événements à une carte
   * @param {HTMLElement} card - Élément de carte
   * @param {Object} item - Données de l'élément
   */
  attachCardEventListeners(card, item) {
    // Bouton de lecture
    const playButton = card.querySelector('.play-button');
    if (playButton) {
      playButton.addEventListener('click', (event) => {
        event.stopPropagation();
        window.location.href = `/watch.html?id=${item.id}`;
      });
    }
    
    // Bouton d'information
    const infoButton = card.querySelector('.info-button');
    if (infoButton) {
      infoButton.addEventListener('click', (event) => {
        event.stopPropagation();
        window.location.href = `/details.html?id=${item.id}`;
      });
    }
    
    // Bouton favori
    const favoriteButton = card.querySelector('.favorite-button');
    if (favoriteButton) {
      favoriteButton.addEventListener('click', (event) => {
        event.stopPropagation();
        this.toggleFavorite(item.id);
        favoriteButton.textContent = favoriteButton.textContent === '♡' ? '♥' : '♡';
      });
    }
    
    // Clic sur la carte entière
    card.addEventListener('click', () => {
      window.location.href = `/details.html?id=${item.id}`;
    });
  }
  
  /**
   * Initialise le carrousel
   * @param {HTMLElement} carouselContainer - Conteneur du carrousel
   */
  initCarousel(carouselContainer) {
    const prevBtn = this.container.querySelector('.prev-btn');
    const nextBtn = this.container.querySelector('.next-btn');
    
    if (!prevBtn || !nextBtn) return;
    
    let scrollAmount = 0;
    const cardWidth = 200; // Largeur approximative d'une carte + marge
    
    // Gestionnaire pour le bouton précédent
    prevBtn.addEventListener('click', () => {
      scrollAmount = Math.max(scrollAmount - cardWidth * 4, 0);
      carouselContainer.scrollTo({
        left: scrollAmount,
        behavior: 'smooth'
      });
    });
    
    // Gestionnaire pour le bouton suivant
    nextBtn.addEventListener('click', () => {
      const maxScroll = carouselContainer.scrollWidth - carouselContainer.clientWidth;
      scrollAmount = Math.min(scrollAmount + cardWidth * 4, maxScroll);
      carouselContainer.scrollTo({
        left: scrollAmount,
        behavior: 'smooth'
      });
    });
    
    // Désactiver les boutons si nécessaire
    this.updateCarouselButtons(carouselContainer, prevBtn, nextBtn);
    
    // Mettre à jour l'état des boutons lors du défilement
    carouselContainer.addEventListener('scroll', () => {
      this.updateCarouselButtons(carouselContainer, prevBtn, nextBtn);
    });
  }
  
  /**
   * Met à jour l'état des boutons du carrousel
   * @param {HTMLElement} container - Conteneur du carrousel
   * @param {HTMLElement} prevBtn - Bouton précédent
   * @param {HTMLElement} nextBtn - Bouton suivant
   */
  updateCarouselButtons(container, prevBtn, nextBtn) {
    const scrollPosition = container.scrollLeft;
    const maxScroll = container.scrollWidth - container.clientWidth;
    
    // Désactiver le bouton précédent si on est au début
    if (scrollPosition <= 0) {
      prevBtn.classList.add('disabled');
    } else {
      prevBtn.classList.remove('disabled');
    }
    
    // Désactiver le bouton suivant si on est à la fin
    if (scrollPosition >= maxScroll) {
      nextBtn.classList.add('disabled');
    } else {
      nextBtn.classList.remove('disabled');
    }
  }
  
  /**
   * Bascule l'état favori d'un élément
   * @param {string} itemId - ID de l'élément
   */
  async toggleFavorite(itemId) {
    try {
      const favoritesService = await import('../../services/user/FavoritesService.js')
        .then(module => new module.FavoritesService());
      
      const isFavorite = await favoritesService.toggleFavorite(itemId);
      
      // Mettre à jour l'interface utilisateur si nécessaire
      console.log(`Élément ${itemId} ${isFavorite ? 'ajouté aux' : 'retiré des'} favoris`);
    } catch (error) {
      console.error('Erreur lors de la modification des favoris:', error);
    }
  }
  
  /**
   * Formate le type de contenu pour l'affichage
   * @param {string} type - Type de contenu
   * @returns {string} - Type formaté
   */
  formatContentType(type) {
    const typeMap = {
      'drama': 'Drama',
      'movie': 'Film',
      'anime': 'Anime',
      'kshow': 'K-Show',
      'tvshow': 'Série TV',
      'bollywood': 'Bollywood'
    };
    
    return typeMap[type.toLowerCase()] || type;
  }
  
  /**
   * Génère un placeholder d'image pour les contenus sans image
   * @param {string} title - Titre du contenu
   * @returns {string} - URL de l'image placeholder
   */
  generateImagePlaceholder(title) {
    // Générer une couleur de fond basée sur le titre
    const hash = this.hashString(title);
    const hue = hash % 360;
    
    // Créer un SVG avec les initiales du titre
    const initials = title
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
    
    const svgContent = `
      <svg xmlns="http://www.w3.org/2000/svg" width="300" height="450" viewBox="0 0 300 450">
        <rect width="300" height="450" fill="hsl(${hue}, 70%, 30%)"/>
        <text x="150" y="225" font-family="Arial" font-size="80" fill="rgba(255,255,255,0.8)" text-anchor="middle" dominant-baseline="middle">${initials}</text>
      </svg>
    `;
    
    return `data:image/svg+xml;utf8,${encodeURIComponent(svgContent)}`;
  }
  
  /**
   * Fonction de hachage simple pour générer une valeur numérique à partir d'une chaîne
   * @param {string} str - Chaîne à hacher
   * @returns {number} - Valeur de hachage
   */
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0; // Convertir en entier 32 bits
    }
    return Math.abs(hash);
  }
}

// Exporter la classe pour une utilisation dans d'autres modules
export default ContentDisplayComponent;
