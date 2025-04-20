/**
 * FloDrama Modern Carousel
 * Implémentation inspirée de cinepulse.fr
 * 
 * Ce module crée des carrousels modernes avec défilement fluide
 * et gestion optimisée des images pour FloDrama
 */

(function() {
    'use strict';
    
    // Configuration par défaut
    const DEFAULT_CONFIG = {
        slidesToShow: 5,         // Nombre de slides visibles sur desktop
        slidesToScroll: 2,       // Nombre de slides à faire défiler
        autoplay: false,         // Défilement automatique
        autoplaySpeed: 5000,     // Vitesse de défilement auto (ms)
        infinite: true,          // Défilement infini
        speed: 500,              // Vitesse d'animation (ms)
        responsive: [            // Configuration responsive
            {
                breakpoint: 1200,
                settings: {
                    slidesToShow: 4,
                    slidesToScroll: 2
                }
            },
            {
                breakpoint: 992,
                settings: {
                    slidesToShow: 3,
                    slidesToScroll: 1
                }
            },
            {
                breakpoint: 768,
                settings: {
                    slidesToShow: 2,
                    slidesToScroll: 1
                }
            },
            {
                breakpoint: 480,
                settings: {
                    slidesToShow: 1,
                    slidesToScroll: 1
                }
            }
        ]
    };
    
    // Classe principale du carrousel
    class ModernCarousel {
        /**
         * Crée une nouvelle instance de carrousel
         * @param {HTMLElement} container - Élément conteneur du carrousel
         * @param {Object} options - Options de configuration
         */
        constructor(container, options = {}) {
            this.container = container;
            this.config = { ...DEFAULT_CONFIG, ...options };
            this.slides = Array.from(container.querySelectorAll('.carousel-item'));
            this.currentIndex = 0;
            this.isAnimating = false;
            this.autoplayInterval = null;
            this.touchStartX = 0;
            this.touchEndX = 0;
            
            // Vérifier si le conteneur existe
            if (!this.container) {
                console.error('Conteneur de carrousel non trouvé');
                return;
            }
            
            // Initialiser le carrousel
            this.init();
        }
        
        /**
         * Initialise le carrousel
         */
        init() {
            // Créer la structure du carrousel
            this.createCarouselStructure();
            
            // Ajouter les contrôles
            this.addControls();
            
            // Ajouter les gestionnaires d'événements
            this.addEventListeners();
            
            // Initialiser l'autoplay si activé
            if (this.config.autoplay) {
                this.startAutoplay();
            }
            
            // Appliquer la configuration responsive
            this.applyResponsiveSettings();
            
            // Initialiser les images avec le système d'images FloDrama
            this.initializeImages();
            
            console.log('FloDrama Modern Carousel initialisé');
        }
        
        /**
         * Crée la structure HTML du carrousel
         */
        createCarouselStructure() {
            // Ajouter les classes nécessaires
            this.container.classList.add('flodrama-carousel');
            
            // Créer le wrapper pour les slides
            const track = document.createElement('div');
            track.classList.add('carousel-track');
            
            // Déplacer les slides dans le track
            this.slides.forEach(slide => {
                slide.classList.add('carousel-slide');
                track.appendChild(slide);
            });
            
            // Vider le conteneur et ajouter le track
            this.container.innerHTML = '';
            this.container.appendChild(track);
            
            // Référencer le track
            this.track = track;
            
            // Appliquer les styles initiaux
            this.updateSlideStyles();
        }
        
        /**
         * Ajoute les contrôles du carrousel (boutons précédent/suivant)
         */
        addControls() {
            // Créer le conteneur de contrôles
            const controls = document.createElement('div');
            controls.classList.add('carousel-controls');
            
            // Bouton précédent
            const prevButton = document.createElement('button');
            prevButton.classList.add('carousel-control', 'prev-button');
            prevButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>';
            prevButton.setAttribute('aria-label', 'Précédent');
            
            // Bouton suivant
            const nextButton = document.createElement('button');
            nextButton.classList.add('carousel-control', 'next-button');
            nextButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>';
            nextButton.setAttribute('aria-label', 'Suivant');
            
            // Ajouter les boutons au conteneur de contrôles
            controls.appendChild(prevButton);
            controls.appendChild(nextButton);
            
            // Ajouter les contrôles au carrousel
            this.container.appendChild(controls);
            
            // Référencer les boutons
            this.prevButton = prevButton;
            this.nextButton = nextButton;
        }
        
        /**
         * Ajoute les gestionnaires d'événements
         */
        addEventListeners() {
            // Gestionnaires pour les boutons
            this.prevButton.addEventListener('click', () => this.goToPrev());
            this.nextButton.addEventListener('click', () => this.goToNext());
            
            // Gestionnaires pour le tactile
            this.track.addEventListener('touchstart', (e) => {
                this.touchStartX = e.changedTouches[0].screenX;
            }, { passive: true });
            
            this.track.addEventListener('touchend', (e) => {
                this.touchEndX = e.changedTouches[0].screenX;
                this.handleSwipe();
            }, { passive: true });
            
            // Gestionnaire pour le redimensionnement
            window.addEventListener('resize', () => {
                this.applyResponsiveSettings();
                this.updateSlideStyles();
            });
        }
        
        /**
         * Gère les événements de swipe tactile
         */
        handleSwipe() {
            const swipeThreshold = 50; // Seuil de détection du swipe en pixels
            const diff = this.touchStartX - this.touchEndX;
            
            if (Math.abs(diff) > swipeThreshold) {
                if (diff > 0) {
                    // Swipe vers la gauche -> slide suivant
                    this.goToNext();
                } else {
                    // Swipe vers la droite -> slide précédent
                    this.goToPrev();
                }
            }
        }
        
        /**
         * Démarre le défilement automatique
         */
        startAutoplay() {
            if (this.autoplayInterval) {
                clearInterval(this.autoplayInterval);
            }
            
            this.autoplayInterval = setInterval(() => {
                this.goToNext();
            }, this.config.autoplaySpeed);
        }
        
        /**
         * Arrête le défilement automatique
         */
        stopAutoplay() {
            if (this.autoplayInterval) {
                clearInterval(this.autoplayInterval);
                this.autoplayInterval = null;
            }
        }
        
        /**
         * Va au slide précédent
         */
        goToPrev() {
            if (this.isAnimating) return;
            
            const slidesToScroll = this.currentSlidesToScroll;
            
            if (this.currentIndex > 0) {
                this.goToSlide(this.currentIndex - slidesToScroll);
            } else if (this.config.infinite) {
                // Si défilement infini, aller au dernier groupe de slides
                this.goToSlide(this.slides.length - this.currentSlidesToShow);
            }
        }
        
        /**
         * Va au slide suivant
         */
        goToNext() {
            if (this.isAnimating) return;
            
            const slidesToScroll = this.currentSlidesToScroll;
            const maxIndex = this.slides.length - this.currentSlidesToShow;
            
            if (this.currentIndex < maxIndex) {
                this.goToSlide(this.currentIndex + slidesToScroll);
            } else if (this.config.infinite) {
                // Si défilement infini, revenir au début
                this.goToSlide(0);
            }
        }
        
        /**
         * Va à un slide spécifique
         * @param {number} index - Index du slide cible
         */
        goToSlide(index) {
            if (this.isAnimating) return;
            
            // Limiter l'index aux valeurs valides
            const maxIndex = this.slides.length - this.currentSlidesToShow;
            const targetIndex = Math.max(0, Math.min(index, maxIndex));
            
            // Si on est déjà à cet index, ne rien faire
            if (targetIndex === this.currentIndex) return;
            
            // Marquer comme en cours d'animation
            this.isAnimating = true;
            
            // Calculer la position de défilement
            const slideWidth = this.slides[0].offsetWidth;
            const scrollPosition = targetIndex * slideWidth;
            
            // Animer le défilement
            const startPosition = this.track.scrollLeft;
            const distance = scrollPosition - startPosition;
            const startTime = performance.now();
            
            const animateScroll = (currentTime) => {
                const elapsedTime = currentTime - startTime;
                
                if (elapsedTime < this.config.speed) {
                    // Calculer la nouvelle position avec easing
                    const progress = this.easeInOutQuad(elapsedTime / this.config.speed);
                    const newPosition = startPosition + distance * progress;
                    
                    // Appliquer la nouvelle position
                    this.track.scrollLeft = newPosition;
                    
                    // Continuer l'animation
                    requestAnimationFrame(animateScroll);
                } else {
                    // Fin de l'animation
                    this.track.scrollLeft = scrollPosition;
                    this.currentIndex = targetIndex;
                    this.isAnimating = false;
                    
                    // Précharger les images visibles
                    this.preloadVisibleImages();
                }
            };
            
            // Démarrer l'animation
            requestAnimationFrame(animateScroll);
        }
        
        /**
         * Fonction d'easing pour les animations
         * @param {number} t - Progression de l'animation (0 à 1)
         * @returns {number} - Valeur avec easing
         */
        easeInOutQuad(t) {
            return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        }
        
        /**
         * Applique les paramètres responsives en fonction de la largeur d'écran
         */
        applyResponsiveSettings() {
            // Récupérer la largeur de la fenêtre
            const windowWidth = window.innerWidth;
            
            // Paramètres par défaut
            let slidesToShow = this.config.slidesToShow;
            let slidesToScroll = this.config.slidesToScroll;
            
            // Parcourir les configurations responsives
            if (this.config.responsive) {
                for (const breakpoint of this.config.responsive) {
                    if (windowWidth <= breakpoint.breakpoint) {
                        slidesToShow = breakpoint.settings.slidesToShow;
                        slidesToScroll = breakpoint.settings.slidesToScroll;
                        break;
                    }
                }
            }
            
            // Mettre à jour les paramètres courants
            this.currentSlidesToShow = slidesToShow;
            this.currentSlidesToScroll = slidesToScroll;
        }
        
        /**
         * Met à jour les styles des slides
         */
        updateSlideStyles() {
            // Calculer la largeur des slides
            const containerWidth = this.container.clientWidth;
            const slideWidth = containerWidth / this.currentSlidesToShow;
            
            // Appliquer la largeur à chaque slide
            this.slides.forEach(slide => {
                slide.style.width = `${slideWidth}px`;
                slide.style.minWidth = `${slideWidth}px`;
            });
            
            // Configurer le track pour le défilement horizontal
            this.track.style.display = 'flex';
            this.track.style.overflowX = 'hidden';
            this.track.style.scrollBehavior = 'smooth';
            this.track.style.scrollSnapType = 'x mandatory';
            
            // Précharger les images visibles
            this.preloadVisibleImages();
        }
        
        /**
         * Initialise les images avec le système d'images FloDrama
         */
        initializeImages() {
            // Récupérer toutes les images dans le carrousel
            const images = this.container.querySelectorAll('img[data-content-id]');
            
            // Vérifier si le système d'images FloDrama est disponible
            if (window.FloDramaImageSystem && window.FloDramaImageSystem.loadImageWithRetry) {
                // Pour chaque image
                images.forEach(img => {
                    const contentId = img.dataset.contentId;
                    const type = img.dataset.type || 'poster';
                    
                    // Générer les sources d'images
                    if (contentId) {
                        const sources = window.FloDramaImageSystem.generateImageSources(contentId, type);
                        
                        // Définir les attributs pour le lazy loading
                        img.loading = 'lazy';
                        
                        // Charger l'image avec le système de retry
                        window.FloDramaImageSystem.loadImageWithRetry(img, sources);
                    }
                });
            }
        }
        
        /**
         * Précharge les images visibles dans le carrousel
         */
        preloadVisibleImages() {
            // Calculer les indices des slides visibles
            const visibleStartIndex = this.currentIndex;
            const visibleEndIndex = Math.min(this.currentIndex + this.currentSlidesToShow, this.slides.length);
            
            // Pour chaque slide visible
            for (let i = visibleStartIndex; i < visibleEndIndex; i++) {
                const slide = this.slides[i];
                if (!slide) continue;
                
                // Récupérer l'image dans le slide
                const img = slide.querySelector('img[data-content-id]');
                if (!img || img.complete) continue;
                
                // Charger l'image si elle n'est pas déjà chargée
                const contentId = img.dataset.contentId;
                const type = img.dataset.type || 'poster';
                
                if (contentId && window.FloDramaImageSystem && window.FloDramaImageSystem.loadImageWithRetry) {
                    const sources = window.FloDramaImageSystem.generateImageSources(contentId, type);
                    window.FloDramaImageSystem.loadImageWithRetry(img, sources);
                }
            }
        }
    }
    
    // Exposer la classe au niveau global
    window.FloDramaCarousel = ModernCarousel;
    
    // Fonction d'initialisation automatique
    function initCarousels() {
        // Rechercher tous les conteneurs de carrousel
        const carouselContainers = document.querySelectorAll('[data-carousel]');
        
        // Initialiser chaque carrousel
        carouselContainers.forEach(container => {
            // Récupérer les options du carrousel depuis les attributs data-*
            const options = {
                slidesToShow: parseInt(container.dataset.slidesToShow) || DEFAULT_CONFIG.slidesToShow,
                slidesToScroll: parseInt(container.dataset.slidesToScroll) || DEFAULT_CONFIG.slidesToScroll,
                autoplay: container.dataset.autoplay === 'true',
                autoplaySpeed: parseInt(container.dataset.autoplaySpeed) || DEFAULT_CONFIG.autoplaySpeed,
                infinite: container.dataset.infinite !== 'false'
            };
            
            // Créer une nouvelle instance de carrousel
            new ModernCarousel(container, options);
        });
    }
    
    // Initialiser les carrousels au chargement de la page
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCarousels);
    } else {
        initCarousels();
    }
})();
