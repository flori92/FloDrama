// Composant de recommandations personnalisées pour FloDrama
// Implémente l'interface utilisateur pour les recommandations basées sur l'IA
// Ce composant peut être utilisé indépendamment du framework (vanilla JS)
// mais peut également être intégré avec React via un wrapper

export class RecommendationComponent {
  /**
   * Constructeur du composant de recommandations
   * @param {Object} recommendationService - Service de recommandations
   * @param {Object} contentDataService - Service de données de contenu
   */
  constructor(recommendationService, contentDataService) {
    this.recommendationService = recommendationService;
    this.contentDataService = contentDataService;
    this.recommendations = [];
    this.similarContent = [];
    this.aiRecommendations = [];
    console.log('RecommendationComponent initialisé');
  }

  /**
   * Rendre le composant de recommandations
   * @param {HTMLElement} container - Conteneur pour le composant
   * @returns {HTMLElement} Le conteneur du composant
   */
  async render(container) {
    // Créer le conteneur principal
    const recommendationsContainer = document.createElement('div');
    recommendationsContainer.className = 'recommendations-container';
    recommendationsContainer.style = `
      width: 100%;
      max-width: 1440px;
      margin: 0 auto;
      padding: 2rem;
    `;

    // Titre avec dégradé
    const title = document.createElement('h2');
    title.className = 'recommendations-title';
    title.textContent = 'Recommandations pour vous';
    title.style = `
      font-size: 2rem;
      font-weight: 700;
      margin-bottom: 2rem;
      background: linear-gradient(to right, #3b82f6, #d946ef);
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
    `;

    // Conteneur des recommandations personnalisées
    const personalizedContainer = document.createElement('div');
    personalizedContainer.className = 'personalized-recommendations';
    personalizedContainer.style = `
      margin-bottom: 3rem;
    `;

    // Sous-titre des recommandations personnalisées
    const personalizedTitle = document.createElement('h3');
    personalizedTitle.className = 'section-title';
    personalizedTitle.textContent = 'Basé sur votre historique';
    personalizedTitle.style = `
      font-size: 1.5rem;
      font-weight: 600;
      margin-bottom: 1.5rem;
      color: white;
    `;

    // Grille des recommandations personnalisées
    const personalizedGrid = document.createElement('div');
    personalizedGrid.className = 'recommendations-grid';
    personalizedGrid.style = `
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 1.5rem;
    `;

    // Message de chargement
    const loadingMessage = document.createElement('div');
    loadingMessage.className = 'loading-message';
    loadingMessage.textContent = 'Chargement des recommandations...';
    loadingMessage.style = `
      text-align: center;
      padding: 3rem;
      color: rgba(255, 255, 255, 0.7);
      font-size: 1.1rem;
    `;

    // Assembler la section des recommandations personnalisées
    personalizedContainer.appendChild(personalizedTitle);
    personalizedContainer.appendChild(loadingMessage);

    // Conteneur des recommandations IA
    const aiContainer = document.createElement('div');
    aiContainer.className = 'ai-recommendations';
    aiContainer.style = `
      margin-bottom: 3rem;
    `;

    // Sous-titre des recommandations IA
    const aiTitle = document.createElement('h3');
    aiTitle.className = 'section-title';
    aiTitle.textContent = 'Découvrez avec l\'IA';
    aiTitle.style = `
      font-size: 1.5rem;
      font-weight: 600;
      margin-bottom: 1.5rem;
      color: white;
    `;

    // Formulaire de requête IA
    const aiForm = document.createElement('div');
    aiForm.className = 'ai-form';
    aiForm.style = `
      display: flex;
      gap: 1rem;
      margin-bottom: 1.5rem;
    `;

    // Champ de saisie
    const aiInput = document.createElement('input');
    aiInput.type = 'text';
    aiInput.placeholder = 'Décrivez ce que vous aimeriez regarder...';
    aiInput.className = 'ai-input';
    aiInput.style = `
      flex: 1;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      background-color: rgba(255, 255, 255, 0.1);
      color: white;
      font-size: 1rem;
    `;

    // Bouton de recherche
    const aiButton = document.createElement('button');
    aiButton.className = 'ai-button';
    aiButton.textContent = 'Trouver';
    aiButton.style = `
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      border: none;
      background: linear-gradient(to right, #3b82f6, #d946ef);
      color: white;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.3s ease;
    `;

    // Grille des recommandations IA
    const aiGrid = document.createElement('div');
    aiGrid.className = 'ai-grid';
    aiGrid.style = `
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 1.5rem;
    `;

    // Assembler le formulaire IA
    aiForm.appendChild(aiInput);
    aiForm.appendChild(aiButton);

    // Assembler la section des recommandations IA
    aiContainer.appendChild(aiTitle);
    aiContainer.appendChild(aiForm);
    aiContainer.appendChild(aiGrid);

    // Assembler le composant
    recommendationsContainer.appendChild(title);
    recommendationsContainer.appendChild(personalizedContainer);
    recommendationsContainer.appendChild(aiContainer);

    // Ajouter à la page
    container.appendChild(recommendationsContainer);

    // Charger les recommandations personnalisées
    this.loadPersonalizedRecommendations(personalizedContainer, loadingMessage);

    // Ajouter l'événement de recherche IA
    aiButton.addEventListener('click', () => {
      this.getAIRecommendations(aiInput.value, aiGrid);
    });

    aiInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.getAIRecommendations(aiInput.value, aiGrid);
      }
    });

    return recommendationsContainer;
  }

  /**
   * Charger les recommandations personnalisées
   * @param {HTMLElement} container - Conteneur pour les recommandations
   * @param {HTMLElement} loadingMessage - Message de chargement
   */
  async loadPersonalizedRecommendations(container, loadingMessage) {
    try {
      // Récupérer les recommandations
      this.recommendations = await this.recommendationService.getPersonalizedRecommendations(10);

      // Supprimer le message de chargement
      if (loadingMessage) {
        loadingMessage.remove();
      }

      // Créer la grille si elle n'existe pas
      let recommendationsGrid = container.querySelector('.recommendations-grid');
      if (!recommendationsGrid) {
        recommendationsGrid = document.createElement('div');
        recommendationsGrid.className = 'recommendations-grid';
        recommendationsGrid.style = `
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 1.5rem;
        `;
        container.appendChild(recommendationsGrid);
      }

      // Vérifier si nous avons des recommandations
      if (this.recommendations.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'empty-recommendations';
        emptyMessage.textContent = 'Regardez plus de contenu pour obtenir des recommandations personnalisées.';
        emptyMessage.style = `
          text-align: center;
          padding: 3rem;
          color: rgba(255, 255, 255, 0.7);
          font-size: 1.1rem;
          grid-column: 1 / -1;
        `;
        recommendationsGrid.appendChild(emptyMessage);
        return;
      }

      // Ajouter chaque recommandation à la grille
      this.recommendations.forEach(recommendation => {
        const card = this.createContentCard(recommendation);
        recommendationsGrid.appendChild(card);
      });
    } catch (error) {
      console.error('Erreur lors du chargement des recommandations:', error);

      // Afficher un message d'erreur
      if (loadingMessage) {
        loadingMessage.textContent = 'Erreur lors du chargement des recommandations.';
        loadingMessage.style.color = '#f87171';
      }
    }
  }

  /**
   * Obtenir des recommandations basées sur l'IA
   * @param {string} query - Requête pour les recommandations
   * @param {HTMLElement} gridContainer - Conteneur pour les recommandations
   */
  async getAIRecommendations(query, gridContainer) {
    // Vider la grille
    gridContainer.innerHTML = '';

    // Afficher un message de chargement
    const loadingMessage = document.createElement('div');
    loadingMessage.className = 'loading-message';
    loadingMessage.textContent = 'L\'IA recherche du contenu pour vous...';
    loadingMessage.style = `
      text-align: center;
      padding: 3rem;
      color: rgba(255, 255, 255, 0.7);
      font-size: 1.1rem;
      grid-column: 1 / -1;
    `;
    gridContainer.appendChild(loadingMessage);

    try {
      // Récupérer les recommandations IA
      this.aiRecommendations = await this.recommendationService.getAIRecommendations(query, 8);

      // Supprimer le message de chargement
      loadingMessage.remove();

      // Vérifier si nous avons des recommandations
      if (this.aiRecommendations.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'empty-recommendations';
        emptyMessage.textContent = 'Aucune recommandation trouvée pour cette requête.';
        emptyMessage.style = `
          text-align: center;
          padding: 3rem;
          color: rgba(255, 255, 255, 0.7);
          font-size: 1.1rem;
          grid-column: 1 / -1;
        `;
        gridContainer.appendChild(emptyMessage);
        return;
      }

      // Ajouter chaque recommandation à la grille
      this.aiRecommendations.forEach(recommendation => {
        const card = this.createContentCard(recommendation);
        gridContainer.appendChild(card);
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des recommandations IA:', error);

      // Afficher un message d'erreur
      loadingMessage.textContent = 'Erreur lors de la récupération des recommandations.';
      loadingMessage.style.color = '#f87171';
    }
  }

  /**
   * Obtenir du contenu similaire à un élément
   * @param {Object} contentItem - Élément de contenu
   * @param {HTMLElement} container - Conteneur pour le contenu similaire
   */
  async getSimilarContent(contentItem, container) {
    // Vider le conteneur
    container.innerHTML = '';

    // Afficher un message de chargement
    const loadingMessage = document.createElement('div');
    loadingMessage.className = 'loading-message';
    loadingMessage.textContent = 'Chargement du contenu similaire...';
    loadingMessage.style = `
      text-align: center;
      padding: 3rem;
      color: rgba(255, 255, 255, 0.7);
      font-size: 1.1rem;
    `;
    container.appendChild(loadingMessage);

    try {
      // Récupérer le contenu similaire
      this.similarContent = await this.recommendationService.getSimilarContent(contentItem, 6);

      // Supprimer le message de chargement
      loadingMessage.remove();

      // Vérifier si nous avons du contenu similaire
      if (this.similarContent.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'empty-similar';
        emptyMessage.textContent = 'Aucun contenu similaire trouvé.';
        emptyMessage.style = `
          text-align: center;
          padding: 3rem;
          color: rgba(255, 255, 255, 0.7);
          font-size: 1.1rem;
        `;
        container.appendChild(emptyMessage);
        return;
      }

      // Créer une grille pour le contenu similaire
      const similarGrid = document.createElement('div');
      similarGrid.className = 'similar-grid';
      similarGrid.style = `
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 1.5rem;
      `;

      // Ajouter chaque élément similaire à la grille
      this.similarContent.forEach(item => {
        const card = this.createContentCard(item);
        similarGrid.appendChild(card);
      });

      // Ajouter la grille au conteneur
      container.appendChild(similarGrid);
    } catch (error) {
      console.error('Erreur lors du chargement du contenu similaire:', error);

      // Afficher un message d'erreur
      loadingMessage.textContent = 'Erreur lors du chargement du contenu similaire.';
      loadingMessage.style.color = '#f87171';
    }
  }

  /**
   * Créer une carte de contenu
   * @param {Object} item - Élément de contenu
   * @returns {HTMLElement} La carte de contenu
   */
  createContentCard(item) {
    const card = document.createElement('div');
    card.className = 'content-card';
    card.dataset.id = item.id;
    card.style = `
      position: relative;
      border-radius: 8px;
      overflow: hidden;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
      cursor: pointer;
      background-color: #1A1926;
    `;

    // Image
    const imageContainer = document.createElement('div');
    imageContainer.className = 'card-image-container';
    imageContainer.style = `
      position: relative;
      width: 100%;
      height: 300px;
      overflow: hidden;
    `;

    const image = document.createElement('img');
    image.src = item.image;
    image.alt = item.title;
    image.style = `
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    `;

    // Overlay
    const overlay = document.createElement('div');
    overlay.className = 'card-overlay';
    overlay.style = `
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      padding: 1rem;
      background: linear-gradient(to top, rgba(26, 25, 38, 1), rgba(26, 25, 38, 0));
    `;

    // Titre
    const title = document.createElement('h3');
    title.className = 'card-title';
    title.textContent = item.title;
    title.style = `
      margin: 0 0 0.5rem;
      font-size: 1rem;
      font-weight: 600;
      color: white;
    `;

    // Infos
    const info = document.createElement('div');
    info.className = 'card-info';
    info.style = `
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.8rem;
      color: rgba(255, 255, 255, 0.7);
    `;

    // Année
    const year = document.createElement('span');
    year.textContent = item.year;

    // Séparateur
    const separator = document.createElement('span');
    separator.textContent = '•';

    // Catégorie
    const category = document.createElement('span');
    category.textContent = item.category;

    // Assembler les infos
    info.appendChild(year);
    info.appendChild(separator);
    info.appendChild(category);

    // Assembler l'overlay
    overlay.appendChild(title);
    overlay.appendChild(info);

    // Assembler la carte
    imageContainer.appendChild(image);
    imageContainer.appendChild(overlay);
    card.appendChild(imageContainer);

    // Ajouter les événements
    card.addEventListener('mouseover', () => {
      card.style.transform = 'scale(1.05)';
      card.style.boxShadow = '0 10px 20px rgba(0, 0, 0, 0.3)';
      image.style.transform = 'scale(1.1)';
    });

    card.addEventListener('mouseout', () => {
      card.style.transform = 'scale(1)';
      card.style.boxShadow = 'none';
      image.style.transform = 'scale(1)';
    });

    card.addEventListener('click', () => {
      // Simuler l'ouverture de la page de détails
      alert(`Ouverture des détails pour: ${item.title}`);
    });

    return card;
  }
}
