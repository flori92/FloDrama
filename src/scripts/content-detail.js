/**
 * Script de gestion de la page de détail de contenu
 * Permet l'affichage des informations détaillées et l'intégration du lecteur vidéo
 * 
 * @author FloDrama Team
 * @version 1.1.0
 */

// Initialisation des services
let contentDataService;
let favoritesService;

// États de la page
let currentContentId = null;
let currentContent = null;
let currentEpisodeIndex = 0;
let currentSeasonIndex = 0;

// Éléments DOM
const loadingState = document.getElementById('loadingState');
const errorState = document.getElementById('errorState');
const errorMessage = document.getElementById('errorMessage');
const contentDetail = document.getElementById('contentDetail');
const videoPlayerSection = document.getElementById('videoPlayerSection');
const episodesSection = document.getElementById('episodesSection');
const playButton = document.getElementById('playButton');
const trailerButton = document.getElementById('trailerButton');
const favoriteButton = document.getElementById('favoriteButton');
const watchPartyButton = document.getElementById('watchPartyButton');
const retryButton = document.getElementById('retryButton');

/**
 * Initialisation de la page
 */
async function init() {
    try {
        // Récupérer l'ID du contenu depuis l'URL
        const urlParams = new URLSearchParams(window.location.search);
        currentContentId = urlParams.get('id');
        
        if (!currentContentId) {
            showError('Aucun contenu spécifié. Veuillez sélectionner un contenu à afficher.');
            return;
        }
        
        // Initialiser les services
        // Vérifier que les classes sont disponibles globalement
        if (typeof window.ApiService === 'undefined' || 
            typeof window.StorageService === 'undefined' || 
            typeof window.ContentDataService === 'undefined' || 
            typeof window.FavoritesService === 'undefined' ||
            typeof window.VideoPlayerAdapter === 'undefined') {
            showError('Erreur de chargement des services nécessaires. Veuillez rafraîchir la page.');
            return;
        }
        
        const apiService = new window.ApiService();
        const storageService = new window.StorageService();
        
        contentDataService = new window.ContentDataService(apiService, storageService);
        favoritesService = new window.FavoritesService(storageService);
        
        // Charger les données du contenu
        await loadContentData();
        
        // Configurer les événements
        setupEventListeners();
        
    } catch (error) {
        console.error('Erreur lors de l\'initialisation:', error);
        showError('Une erreur est survenue lors du chargement de la page.');
    }
}

/**
 * Chargement des données du contenu
 */
async function loadContentData() {
    try {
        showLoading();
        
        // Récupérer les données du contenu
        currentContent = await contentDataService.getContentById(currentContentId);
        
        if (!currentContent) {
            showError('Contenu non trouvé. Il a peut-être été supprimé ou déplacé.');
            return;
        }
        
        // Mettre à jour le titre de la page
        document.title = `FloDrama - ${currentContent.title}`;
        
        // Afficher les détails du contenu
        displayContentDetails();
        
        // Charger le contenu similaire
        loadSimilarContent();
        
        // Vérifier si le contenu est une série avec des épisodes
        if (currentContent.type === 'serie' || currentContent.type === 'drama' || 
            currentContent.type === 'anime' || currentContent.episodes?.length > 0) {
            loadEpisodes();
        }
        
        // Vérifier si le contenu est dans les favoris
        updateFavoriteButton();
        
        hideLoading();
        showContent();
        
    } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        showError('Impossible de charger les informations du contenu.');
    }
}

/**
 * Affichage des détails du contenu
 */
function displayContentDetails() {
    // Éléments principaux
    document.getElementById('contentTitle').textContent = currentContent.title;
    document.getElementById('contentDescription').textContent = currentContent.description;
    
    // Image de fond et poster
    const backdropUrl = currentContent.backdropUrl || currentContent.image;
    const posterUrl = currentContent.posterUrl || currentContent.image;
    
    document.getElementById('contentBackdrop').src = backdropUrl;
    document.getElementById('contentBackdrop').alt = currentContent.title;
    document.getElementById('contentPoster').src = posterUrl;
    document.getElementById('contentPoster').alt = currentContent.title;
    
    // Métadonnées
    document.getElementById('contentYear').textContent = currentContent.year || 'N/A';
    document.getElementById('contentDuration').textContent = currentContent.duration || 'N/A';
    
    const rating = currentContent.rating ? `${currentContent.rating.toFixed(1)}/10` : 'N/A';
    document.getElementById('contentRating').innerHTML = `<i class="fas fa-star"></i> ${rating}`;
    
    // Genres
    const genresContainer = document.getElementById('contentGenres');
    genresContainer.innerHTML = '';
    
    const genres = Array.isArray(currentContent.genre) 
        ? currentContent.genre 
        : (currentContent.category ? [currentContent.category] : []);
    
    genres.forEach(genre => {
        const genreSpan = document.createElement('span');
        genreSpan.textContent = genre;
        genresContainer.appendChild(genreSpan);
    });
    
    // Casting (si disponible)
    if (currentContent.actors && currentContent.actors.length > 0) {
        displayCast();
    }
}

/**
 * Affichage du casting
 */
function displayCast() {
    const castList = document.getElementById('castList');
    castList.innerHTML = '';
    
    const actors = Array.isArray(currentContent.actors) ? currentContent.actors : [];
    
    actors.forEach((actor, index) => {
        // Limiter à 10 acteurs maximum pour l'affichage
        if (index >= 10) return;
        
        const castCard = document.createElement('div');
        castCard.className = 'cast-card';
        
        castCard.innerHTML = `
            <div class="cast-card__image">
                <img src="/public/assets/images/cast/placeholder.jpg" alt="${actor}">
            </div>
            <div class="cast-card__info">
                <div class="cast-card__name">${actor}</div>
                <div class="cast-card__role">Acteur</div>
            </div>
        `;
        
        castList.appendChild(castCard);
    });
}

/**
 * Chargement et affichage des épisodes
 */
function loadEpisodes() {
    // Simuler des données d'épisodes si elles ne sont pas disponibles
    const episodes = currentContent.episodes || generateMockEpisodes();
    
    if (episodes.length === 0) {
        return;
    }
    
    // Organiser les épisodes par saison
    const seasons = {};
    episodes.forEach(episode => {
        const seasonNumber = episode.season || 1;
        if (!seasons[seasonNumber]) {
            seasons[seasonNumber] = [];
        }
        seasons[seasonNumber].push(episode);
    });
    
    // Afficher le sélecteur de saisons
    const seasonSelector = document.getElementById('seasonSelector');
    seasonSelector.innerHTML = '';
    
    Object.keys(seasons).forEach((seasonNum, index) => {
        const button = document.createElement('button');
        button.textContent = `Saison ${seasonNum}`;
        button.dataset.season = seasonNum;
        
        if (index === currentSeasonIndex) {
            button.classList.add('active');
        }
        
        button.addEventListener('click', () => {
            // Mettre à jour la saison active
            document.querySelectorAll('#seasonSelector button').forEach(btn => {
                btn.classList.remove('active');
            });
            button.classList.add('active');
            
            currentSeasonIndex = index;
            displayEpisodes(seasons[seasonNum]);
        });
        
        seasonSelector.appendChild(button);
    });
    
    // Afficher les épisodes de la première saison par défaut
    const firstSeason = Object.keys(seasons)[0];
    displayEpisodes(seasons[firstSeason]);
    
    // Afficher la section des épisodes
    episodesSection.classList.remove('hidden');
}

/**
 * Affichage des épisodes d'une saison
 */
function displayEpisodes(episodes) {
    const episodesList = document.getElementById('episodesList');
    episodesList.innerHTML = '';
    
    episodes.forEach((episode, index) => {
        const episodeCard = document.createElement('div');
        episodeCard.className = 'episode-card';
        episodeCard.dataset.index = index;
        
        episodeCard.innerHTML = `
            <div class="episode-card__image">
                <img src="${episode.thumbnail || currentContent.image}" alt="Épisode ${episode.number}">
                <div class="episode-card__play">
                    <i class="fas fa-play"></i>
                </div>
            </div>
            <div class="episode-card__content">
                <div class="episode-card__number">Épisode ${episode.number}</div>
                <div class="episode-card__title">${episode.title || `Épisode ${episode.number}`}</div>
                <div class="episode-card__duration">${episode.duration || '45 min'}</div>
            </div>
        `;
        
        episodeCard.addEventListener('click', () => {
            currentEpisodeIndex = index;
            playEpisode(episode);
        });
        
        episodesList.appendChild(episodeCard);
    });
}

/**
 * Génération d'épisodes fictifs pour les tests
 */
function generateMockEpisodes() {
    const episodes = [];
    const numEpisodes = Math.floor(Math.random() * 12) + 8; // Entre 8 et 20 épisodes
    
    for (let i = 1; i <= numEpisodes; i++) {
        episodes.push({
            id: `${currentContentId}-ep${i}`,
            number: i,
            title: `Épisode ${i}`,
            description: `Description de l'épisode ${i} de ${currentContent.title}`,
            duration: '45 min',
            thumbnail: currentContent.image,
            videoUrl: '#', // URL fictive
            season: 1
        });
    }
    
    return episodes;
}

/**
 * Chargement du contenu similaire
 */
async function loadSimilarContent() {
    try {
        const similarContent = await contentDataService.getSimilarContent(currentContent);
        displaySimilarContent(similarContent);
    } catch (error) {
        console.error('Erreur lors du chargement du contenu similaire:', error);
    }
}

/**
 * Affichage du contenu similaire
 */
function displaySimilarContent(similarContent) {
    const similarContentList = document.getElementById('similarContentList');
    similarContentList.innerHTML = '';
    
    similarContent.forEach(item => {
        const contentCard = document.createElement('div');
        contentCard.className = 'content-card';
        
        contentCard.innerHTML = `
            <div class="content-card__image">
                <img src="${item.image}" alt="${item.title}">
                <div class="content-card__overlay"></div>
            </div>
            <div class="content-card__info">
                <h3>${item.title}</h3>
                <div class="content-card__meta">
                    <span>${item.year || ''}</span>
                    <span>${item.duration || ''}</span>
                </div>
            </div>
        `;
        
        contentCard.addEventListener('click', () => {
            window.location.href = `content-detail.html?id=${item.id}`;
        });
        
        similarContentList.appendChild(contentCard);
    });
}

/**
 * Lecture d'un épisode ou du contenu principal
 */
async function playEpisode(episode = null) {
    try {
        const videoData = episode || currentContent;
        const videoUrl = videoData.videoUrl || '#';
        const videoTitle = episode 
            ? `${currentContent.title} - ${episode.title || `Épisode ${episode.number}`}`
            : currentContent.title;
        
        // Préparer les options du lecteur vidéo
        const playerOptions = {
            videoId: currentContent.id,
            episodeId: episode ? episode.id : null,
            title: videoTitle,
            source: videoUrl,
            poster: videoData.thumbnail || currentContent.image,
            subtitles: videoData.subtitles || [],
            quality: videoData.quality || [
                { label: 'HD', url: videoUrl },
                { label: 'SD', url: videoUrl }
            ],
            autoPlay: true,
            watchPartyEnabled: true,
            onNext: episode ? () => navigateToNextEpisode() : null,
            onPrevious: episode ? () => navigateToPreviousEpisode() : null
        };
        
        // Afficher la section du lecteur vidéo
        videoPlayerSection.classList.remove('hidden');
        
        // Monter le lecteur vidéo via l'adaptateur
        const videoPlayerAdapter = new window.VideoPlayerAdapter('videoPlayerContainer');
        await videoPlayerAdapter.mount(playerOptions);
        
        // Faire défiler jusqu'au lecteur
        videoPlayerSection.scrollIntoView({ behavior: 'smooth' });
        
    } catch (error) {
        console.error('Erreur lors de la lecture de la vidéo:', error);
        alert('Impossible de lire cette vidéo. Veuillez réessayer plus tard.');
    }
}

/**
 * Navigation vers l'épisode suivant
 */
function navigateToNextEpisode() {
    const episodes = currentContent.episodes || [];
    if (episodes.length > 0 && currentEpisodeIndex < episodes.length - 1) {
        currentEpisodeIndex++;
        playEpisode(episodes[currentEpisodeIndex]);
    }
}

/**
 * Navigation vers l'épisode précédent
 */
function navigateToPreviousEpisode() {
    const episodes = currentContent.episodes || [];
    if (episodes.length > 0 && currentEpisodeIndex > 0) {
        currentEpisodeIndex--;
        playEpisode(episodes[currentEpisodeIndex]);
    }
}

/**
 * Mise à jour du bouton de favoris
 */
function updateFavoriteButton() {
    const isFavorite = favoritesService && favoritesService.isFavorite(currentContentId);
    
    if (isFavorite) {
        favoriteButton.innerHTML = '<i class="fas fa-heart"></i>';
        favoriteButton.classList.add('active');
    } else {
        favoriteButton.innerHTML = '<i class="far fa-heart"></i>';
        favoriteButton.classList.remove('active');
    }
}

/**
 * Configuration des écouteurs d'événements
 */
function setupEventListeners() {
    // Bouton de lecture
    playButton.addEventListener('click', () => {
        playEpisode();
    });
    
    // Bouton de bande-annonce
    trailerButton.addEventListener('click', () => {
        const trailerUrl = currentContent.trailerUrl;
        if (trailerUrl) {
            // Créer une modal pour la bande-annonce
            const modal = document.createElement('div');
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal__content">
                    <button class="modal__close">&times;</button>
                    <div class="modal__body">
                        <iframe 
                            width="100%" 
                            height="100%" 
                            src="${trailerUrl}" 
                            frameborder="0" 
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                            allowfullscreen>
                        </iframe>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // Fermer la modal
            modal.querySelector('.modal__close').addEventListener('click', () => {
                document.body.removeChild(modal);
            });
            
            // Fermer la modal en cliquant en dehors
            modal.addEventListener('click', (event) => {
                if (event.target === modal) {
                    document.body.removeChild(modal);
                }
            });
        } else {
            alert('Bande-annonce non disponible pour ce contenu.');
        }
    });
    
    // Bouton de favoris
    favoriteButton.addEventListener('click', () => {
        if (favoritesService) {
            const isFavorite = favoritesService.isFavorite(currentContentId);
            
            if (isFavorite) {
                favoritesService.removeFavorite(currentContentId);
            } else {
                favoritesService.addFavorite(currentContent);
            }
            
            updateFavoriteButton();
        }
    });
    
    // Bouton Watch Party
    watchPartyButton.addEventListener('click', () => {
        // Rediriger vers la page Watch Party avec l'ID du contenu
        window.location.href = `watchparty.html?id=${currentContentId}`;
    });
    
    // Bouton de nouvelle tentative
    retryButton.addEventListener('click', () => {
        loadContentData();
    });
}

/**
 * Afficher l'état de chargement
 */
function showLoading() {
    loadingState.classList.remove('hidden');
    errorState.classList.add('hidden');
    contentDetail.classList.add('hidden');
}

/**
 * Masquer l'état de chargement
 */
function hideLoading() {
    loadingState.classList.add('hidden');
}

/**
 * Afficher une erreur
 */
function showError(message) {
    loadingState.classList.add('hidden');
    errorState.classList.remove('hidden');
    contentDetail.classList.add('hidden');
    
    errorMessage.textContent = message;
}

/**
 * Afficher le contenu
 */
function showContent() {
    loadingState.classList.add('hidden');
    errorState.classList.add('hidden');
    contentDetail.classList.remove('hidden');
}

// Initialiser la page au chargement
document.addEventListener('DOMContentLoaded', init);
