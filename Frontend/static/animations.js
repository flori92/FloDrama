/**
 * FloDrama - Animations et interactions
 * Ce fichier contient toutes les animations et interactions pour l'interface utilisateur
 * Conforme à l'identité visuelle de FloDrama
 */

document.addEventListener('DOMContentLoaded', () => {
  // ===== ANIMATIONS AU CHARGEMENT =====
  
  // Animation du logo
  const logo = document.querySelector('.logo');
  if (logo) {
    logo.classList.add('fade-in');
  }
  
  // Animation des cartes avec délai progressif
  const cards = document.querySelectorAll('.card');
  cards.forEach((card, index) => {
    setTimeout(() => {
      card.classList.add('slide-up');
      card.style.opacity = '1';
    }, 100 + (index * 50)); // Délai progressif pour un effet cascade
  });
  
  // Animation des titres de section
  const sectionTitles = document.querySelectorAll('.category-title');
  sectionTitles.forEach((title, index) => {
    setTimeout(() => {
      title.classList.add('fade-in');
    }, 300 + (index * 100));
  });

  // ===== CARROUSEL HÉRO =====
  
  // Configuration du carrousel
  const carouselDots = document.querySelectorAll('.carousel-dot');
  const carouselItems = document.querySelectorAll('.carousel-item');
  let currentSlide = 0;
  let isPlaying = false;
  let slideInterval;
  const slideDelay = 8000; // 8 secondes entre chaque slide
  
  // Fonction pour changer de slide
  const goToSlide = (index) => {
    // Masquer tous les slides
    carouselItems.forEach(item => {
      item.classList.remove('active');
      item.style.opacity = '0';
    });
    
    // Désactiver tous les points
    carouselDots.forEach(dot => {
      dot.classList.remove('active');
    });
    
    // Activer le slide et le point courant
    carouselItems[index].classList.add('active');
    carouselItems[index].style.opacity = '1';
    carouselDots[index].classList.add('active');
    
    // Animation de transition
    setTimeout(() => {
      carouselItems[index].style.transform = 'scale(1)';
    }, 50);
    
    currentSlide = index;
  };
  
  // Démarrer le défilement automatique
  const startSlideshow = () => {
    if (!isPlaying) {
      slideInterval = setInterval(() => {
        const nextSlide = (currentSlide + 1) % carouselItems.length;
        goToSlide(nextSlide);
      }, slideDelay);
      isPlaying = true;
    }
  };
  
  // Arrêter le défilement automatique
  const stopSlideshow = () => {
    clearInterval(slideInterval);
    isPlaying = false;
  };
  
  // Ajouter des écouteurs d'événements pour les points du carrousel
  carouselDots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      goToSlide(index);
      stopSlideshow();
      startSlideshow(); // Redémarrer le défilement
    });
  });
  
  // Démarrer le carrousel
  startSlideshow();
  
  // ===== EFFETS DE SURVOL =====
  
  // Effet de survol pour les cartes
  cards.forEach(card => {
    const cardImage = card.querySelector('img');
    
    card.addEventListener('mouseenter', () => {
      card.style.transform = 'translateY(-10px) scale(1.03)';
      card.style.boxShadow = 'var(--shadow-hover)';
      
      if (cardImage) {
        cardImage.style.transform = 'scale(1.1)';
      }
    });
    
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'translateY(0) scale(1)';
      card.style.boxShadow = 'var(--shadow-default)';
      
      if (cardImage) {
        cardImage.style.transform = 'scale(1)';
      }
    });
  });
  
  // Effet de survol pour les boutons
  const buttons = document.querySelectorAll('.btn');
  buttons.forEach(button => {
    button.addEventListener('mouseenter', () => {
      button.style.transform = 'translateY(-3px)';
    });
    
    button.addEventListener('mouseleave', () => {
      button.style.transform = 'translateY(0)';
    });
  });
  
  // ===== ANIMATION DU HEADER AU DÉFILEMENT =====
  
  const header = document.querySelector('.header');
  
  window.addEventListener('scroll', () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    // Modifier l'opacité du fond en fonction du défilement
    if (scrollTop > 50) {
      header.style.backgroundColor = 'rgba(18, 17, 24, 0.95)';
      header.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.2)';
    } else {
      header.style.backgroundColor = 'rgba(18, 17, 24, 0.7)';
      header.style.boxShadow = 'none';
    }
  });
  
  // ===== ANIMATION AU DÉFILEMENT =====
  
  // Observer les éléments pour les animer lors du défilement
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
  };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('fade-in');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);
  
  // Observer les sections
  const sections = document.querySelectorAll('.section');
  sections.forEach(section => {
    section.style.opacity = '0';
    observer.observe(section);
  });
  
  // ===== SIMULATION DE LECTURE DE BANDE-ANNONCE =====
  
  const watchButton = document.querySelector('.carousel-buttons .btn-primary');
  if (watchButton) {
    watchButton.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Créer un élément de lecture vidéo
      const videoContainer = document.createElement('div');
      videoContainer.className = 'video-player';
      videoContainer.style.position = 'fixed';
      videoContainer.style.top = '0';
      videoContainer.style.left = '0';
      videoContainer.style.width = '100%';
      videoContainer.style.height = '100%';
      videoContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
      videoContainer.style.zIndex = '1000';
      videoContainer.style.display = 'flex';
      videoContainer.style.alignItems = 'center';
      videoContainer.style.justifyContent = 'center';
      videoContainer.style.opacity = '0';
      videoContainer.style.transition = 'opacity 0.3s ease';
      
      // Ajouter un message
      const message = document.createElement('div');
      message.textContent = 'Lecture de la bande-annonce...';
      message.style.color = 'white';
      message.style.fontSize = '24px';
      message.style.fontWeight = 'bold';
      message.style.textAlign = 'center';
      
      // Ajouter un bouton de fermeture
      const closeButton = document.createElement('button');
      closeButton.textContent = '✕';
      closeButton.style.position = 'absolute';
      closeButton.style.top = '20px';
      closeButton.style.right = '20px';
      closeButton.style.backgroundColor = 'transparent';
      closeButton.style.border = 'none';
      closeButton.style.color = 'white';
      closeButton.style.fontSize = '24px';
      closeButton.style.cursor = 'pointer';
      
      closeButton.addEventListener('click', () => {
        videoContainer.style.opacity = '0';
        setTimeout(() => {
          document.body.removeChild(videoContainer);
        }, 300);
      });
      
      videoContainer.appendChild(message);
      videoContainer.appendChild(closeButton);
      document.body.appendChild(videoContainer);
      
      // Afficher avec animation
      setTimeout(() => {
        videoContainer.style.opacity = '1';
      }, 10);
      
      // Fermer automatiquement après 3 secondes
      setTimeout(() => {
        videoContainer.style.opacity = '0';
        setTimeout(() => {
          document.body.removeChild(videoContainer);
        }, 300);
      }, 3000);
    });
  }
  
  // ===== SIMULATION DE L'AJOUT À LA LISTE =====
  
  const addToListButton = document.querySelector('.carousel-buttons .btn-secondary');
  if (addToListButton) {
    addToListButton.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Créer une notification
      const notification = document.createElement('div');
      notification.className = 'notification';
      notification.style.position = 'fixed';
      notification.style.bottom = '20px';
      notification.style.right = '20px';
      notification.style.backgroundColor = 'var(--color-background-tertiary)';
      notification.style.color = 'var(--color-text-primary)';
      notification.style.padding = '15px 20px';
      notification.style.borderRadius = 'var(--border-radius)';
      notification.style.boxShadow = 'var(--shadow-default)';
      notification.style.zIndex = '1000';
      notification.style.transform = 'translateX(100%)';
      notification.style.transition = 'transform 0.3s ease';
      
      // Ajouter un message
      notification.textContent = 'Ajouté à votre liste !';
      
      document.body.appendChild(notification);
      
      // Afficher avec animation
      setTimeout(() => {
        notification.style.transform = 'translateX(0)';
      }, 10);
      
      // Fermer automatiquement après 3 secondes
      setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
          document.body.removeChild(notification);
        }, 300);
      }, 3000);
    });
  }
});
