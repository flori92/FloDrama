// Composant de gestion des favoris pour FloDrama
// Implémente l'interface utilisateur pour gérer les favoris des utilisateurs

export class FavoritesComponent {
  constructor(favoritesService, contentDataService) {
    this.favoritesService = favoritesService;
    this.contentDataService = contentDataService;
    this.favorites = [];
    console.log('FavoritesComponent initialisé');
  }

  // Rendre le composant de favoris
  render(container) {
    // Créer le conteneur principal
    const favoritesContainer = document.createElement('div');
    favoritesContainer.className = 'favorites-container';
    favoritesContainer.style = `
      width: 100%;
      max-width: 1440px;
      margin: 0 auto;
      padding: 2rem;
    `;

    // Titre avec dégradé
    const title = document.createElement('h2');
    title.className = 'favorites-title';
    title.textContent = 'Ma Liste';
    title.style = `
      font-size: 2rem;
      font-weight: 700;
      margin-bottom: 2rem;
      background: linear-gradient(to right, #3b82f6, #d946ef);
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
    `;

    // Message vide
    const emptyMessage = document.createElement('div');
    emptyMessage.className = 'empty-favorites';
    emptyMessage.textContent = 'Vous n\'avez pas encore ajouté de contenu à votre liste de favoris.';
    emptyMessage.style = `
      text-align: center;
      padding: 3rem;
      color: rgba(255, 255, 255, 0.7);
      font-size: 1.1rem;
      display: none;
    `;

    // Grille de favoris
    const favoritesGrid = document.createElement('div');
    favoritesGrid.className = 'favorites-grid';
    favoritesGrid.style = `
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 1.5rem;
    `;

    // Assembler le composant
    favoritesContainer.appendChild(title);
    favoritesContainer.appendChild(emptyMessage);
    favoritesContainer.appendChild(favoritesGrid);

    // Charger et afficher les favoris
    this.loadFavorites(favoritesGrid, emptyMessage);

    // Ajouter à la page
    container.appendChild(favoritesContainer);

    return favoritesContainer;
  }

  // Charger les favoris
  loadFavorites(gridContainer, emptyMessage) {
    // Récupérer tous les favoris
    this.favorites = this.favoritesService.getAllFavorites();

    // Vérifier si la liste est vide
    if (this.favorites.length === 0) {
      emptyMessage.style.display = 'block';
      return;
    }

    // Masquer le message vide
    emptyMessage.style.display = 'none';

    // Vider le conteneur
    gridContainer.innerHTML = '';

    // Ajouter chaque favori à la grille
    this.favorites.forEach(favorite => {
      const favoriteCard = this.createFavoriteCard(favorite);
      gridContainer.appendChild(favoriteCard);
    });
  }

  // Créer une carte de favori
  createFavoriteCard(item) {
    const card = document.createElement('div');
    card.className = 'favorite-card';
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

    // Actions
    const actions = document.createElement('div');
    actions.className = 'card-actions';
    actions.style = `
      display: flex;
      gap: 0.5rem;
    `;

    // Bouton de lecture
    const playButton = document.createElement('button');
    playButton.className = 'play-button';
    playButton.innerHTML = '▶';
    playButton.style = `
      width: 30px;
      height: 30px;
      border-radius: 50%;
      background: linear-gradient(to right, #3b82f6, #d946ef);
      border: none;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    `;

    // Bouton de suppression des favoris
    const removeButton = document.createElement('button');
    removeButton.className = 'remove-button';
    removeButton.innerHTML = '✕';
    removeButton.style = `
      width: 30px;
      height: 30px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.2);
      border: none;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    `;

    // Ajouter les événements
    playButton.addEventListener('click', (e) => {
      e.stopPropagation();
      // Simuler la lecture
      alert(`Lecture de: ${item.title}`);
    });

    removeButton.addEventListener('click', (e) => {
      e.stopPropagation();
      this.removeFavorite(item.id, card);
    });

    // Assembler les actions
    actions.appendChild(playButton);
    actions.appendChild(removeButton);

    // Assembler l'overlay
    overlay.appendChild(title);
    overlay.appendChild(actions);

    // Assembler la carte
    imageContainer.appendChild(image);
    imageContainer.appendChild(overlay);
    card.appendChild(imageContainer);

    // Ajouter les événements de survol
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

  // Supprimer un favori
  removeFavorite(itemId, cardElement) {
    // Demander confirmation
    if (confirm('Voulez-vous vraiment supprimer cet élément de vos favoris ?')) {
      // Supprimer du service
      const removed = this.favoritesService.removeFromFavorites(itemId);
      
      if (removed) {
        // Animation de suppression
        cardElement.style.transition = 'all 0.3s ease';
        cardElement.style.opacity = '0';
        cardElement.style.transform = 'scale(0.8)';
        
        // Supprimer l'élément après l'animation
        setTimeout(() => {
          cardElement.remove();
          
          // Vérifier si la liste est vide
          this.favorites = this.favoritesService.getAllFavorites();
          if (this.favorites.length === 0) {
            const emptyMessage = document.querySelector('.empty-favorites');
            if (emptyMessage) {
              emptyMessage.style.display = 'block';
            }
          }
        }, 300);
      }
    }
  }

  // Ajouter un favori
  addFavorite(item) {
    // Ajouter au service
    const added = this.favoritesService.addToFavorites(item);
    
    if (added) {
      // Mettre à jour l'affichage si le composant est visible
      const favoritesGrid = document.querySelector('.favorites-grid');
      const emptyMessage = document.querySelector('.empty-favorites');
      
      if (favoritesGrid && emptyMessage) {
        // Masquer le message vide
        emptyMessage.style.display = 'none';
        
        // Créer et ajouter la nouvelle carte
        const favoriteCard = this.createFavoriteCard(item);
        favoritesGrid.appendChild(favoriteCard);
        
        // Animation d'ajout
        favoriteCard.style.opacity = '0';
        favoriteCard.style.transform = 'scale(0.8)';
        
        setTimeout(() => {
          favoriteCard.style.transition = 'all 0.3s ease';
          favoriteCard.style.opacity = '1';
          favoriteCard.style.transform = 'scale(1)';
        }, 10);
      }
      
      return true;
    }
    
    return false;
  }

  // Créer un bouton de favori pour les cartes de contenu
  createFavoriteButton(contentItem) {
    const isFavorite = this.favoritesService.isFavorite(contentItem.id);
    
    const favoriteButton = document.createElement('button');
    favoriteButton.className = 'favorite-button';
    favoriteButton.innerHTML = isFavorite ? '♥' : '♡';
    favoriteButton.style = `
      width: 30px;
      height: 30px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.2);
      border: none;
      color: ${isFavorite ? '#d946ef' : 'white'};
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.3s ease;
    `;
    
    favoriteButton.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleFavorite(contentItem, favoriteButton);
    });
    
    return favoriteButton;
  }

  // Basculer l'état favori d'un élément
  toggleFavorite(contentItem, buttonElement) {
    const toggled = this.favoritesService.toggleFavorite(contentItem);
    const isFavorite = this.favoritesService.isFavorite(contentItem.id);
    
    // Mettre à jour l'apparence du bouton
    buttonElement.innerHTML = isFavorite ? '♥' : '♡';
    buttonElement.style.color = isFavorite ? '#d946ef' : 'white';
    
    // Animation
    buttonElement.style.transform = 'scale(1.2)';
    setTimeout(() => {
      buttonElement.style.transform = 'scale(1)';
    }, 200);
    
    // Notification
    if (isFavorite) {
      this.showNotification(`${contentItem.title} ajouté à vos favoris`);
    } else {
      this.showNotification(`${contentItem.title} retiré de vos favoris`);
    }
    
    return toggled;
  }

  // Afficher une notification
  showNotification(message) {
    // Vérifier si une notification existe déjà
    let notification = document.querySelector('.favorites-notification');
    
    if (!notification) {
      // Créer une nouvelle notification
      notification = document.createElement('div');
      notification.className = 'favorites-notification';
      notification.style = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: rgba(26, 25, 38, 0.9);
        color: white;
        padding: 1rem;
        border-radius: 8px;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
        z-index: 1000;
        opacity: 0;
        transform: translateY(20px);
        transition: all 0.3s ease;
      `;
      
      document.body.appendChild(notification);
    }
    
    // Mettre à jour le message
    notification.textContent = message;
    
    // Afficher la notification
    setTimeout(() => {
      notification.style.opacity = '1';
      notification.style.transform = 'translateY(0)';
    }, 10);
    
    // Masquer la notification après un délai
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateY(20px)';
      
      // Supprimer la notification après l'animation
      setTimeout(() => {
        notification.remove();
      }, 300);
    }, 3000);
  }
}
