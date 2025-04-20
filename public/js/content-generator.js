/**
 * FloDrama - Générateur de contenu
 * Ce script génère un grand nombre d'éléments de contenu pour toutes les catégories
 * 
 * @version 1.0.0
 */

(function() {
  // Configuration
  const CONFIG = {
    // Nombre d'éléments à générer par catégorie
    ITEMS_PER_CATEGORY: {
      drama: 250,
      movie: 250,
      anime: 250,
      tvshow: 250,
      bollywood: 250
    },
    
    // Années de sortie possibles
    YEARS: Array.from({ length: 25 }, (_, i) => 2000 + i),
    
    // Pays possibles
    COUNTRIES: {
      drama: ['kr', 'jp', 'cn', 'th', 'tw'],
      movie: ['kr', 'jp', 'cn', 'th', 'tw', 'us'],
      anime: ['jp', 'kr'],
      tvshow: ['kr', 'jp', 'cn', 'th', 'tw', 'us'],
      bollywood: ['in']
    },
    
    // Genres possibles
    GENRES: {
      drama: ['Romance', 'Comédie', 'Drame', 'Action', 'Thriller', 'Fantastique', 'Historique', 'Médical', 'Policier', 'Mystère'],
      movie: ['Action', 'Aventure', 'Comédie', 'Drame', 'Horreur', 'Science-fiction', 'Thriller', 'Romance', 'Fantastique', 'Animation'],
      anime: ['Shonen', 'Shojo', 'Seinen', 'Josei', 'Action', 'Aventure', 'Comédie', 'Drame', 'Fantastique', 'Science-fiction'],
      tvshow: ['Variété', 'Téléréalité', 'Jeu', 'Talk-show', 'Documentaire', 'Cuisine', 'Voyage', 'Musique', 'Divertissement'],
      bollywood: ['Romance', 'Comédie', 'Drame', 'Action', 'Musical', 'Historique', 'Biopic', 'Thriller']
    },
    
    // Acteurs possibles
    ACTORS: {
      drama: [
        'Hyun Bin', 'Son Ye-jin', 'Lee Min-ho', 'Park Shin-hye', 'Kim Soo-hyun', 'Jun Ji-hyun', 
        'Gong Yoo', 'Kim Go-eun', 'Park Seo-joon', 'IU', 'Lee Jong-suk', 'Han Hyo-joo',
        'Ji Chang-wook', 'Nam Joo-hyuk', 'Bae Suzy', 'Lee Sung-kyung', 'Seo In-guk', 'Jung Hae-in'
      ],
      movie: [
        'Song Kang-ho', 'Choi Min-sik', 'Ha Jung-woo', 'Lee Byung-hun', 'Jeon Do-yeon', 'Son Ye-jin',
        'Kim Hye-soo', 'Hwang Jung-min', 'Ma Dong-seok', 'Takeshi Kaneshiro', 'Tony Leung', 'Andy Lau'
      ],
      anime: [
        'Megumi Ogata', 'Romi Park', 'Mamoru Miyano', 'Kana Hanazawa', 'Hiroshi Kamiya', 'Yuki Kaji',
        'Daisuke Ono', 'Rie Kugimiya', 'Tomokazu Sugita', 'Miyuki Sawashiro', 'Takehito Koyasu'
      ],
      tvshow: [
        'Yoo Jae-suk', 'Kang Ho-dong', 'Lee Soo-geun', 'Kim Jong-kook', 'Haha', 'Park Myung-soo',
        'Jun Hyun-moo', 'Lee Kwang-soo', 'Shin Dong-yup', 'Kim Gura', 'Heechul', 'Defconn'
      ],
      bollywood: [
        'Shah Rukh Khan', 'Amitabh Bachchan', 'Aamir Khan', 'Salman Khan', 'Hrithik Roshan', 
        'Deepika Padukone', 'Priyanka Chopra', 'Alia Bhatt', 'Kareena Kapoor', 'Katrina Kaif'
      ]
    },
    
    // Réalisateurs possibles
    DIRECTORS: {
      drama: [
        'Kim Eun-sook', 'Park Ji-eun', 'Lee Byung-hun', 'Kim Won-seok', 'Shin Won-ho', 'Jo Hyun-tak',
        'Ahn Pan-seok', 'Lee Eung-bok', 'Baek Sang-hoon', 'Park Chan-wook', 'Kim Jin-min'
      ],
      movie: [
        'Bong Joon-ho', 'Park Chan-wook', 'Kim Jee-woon', 'Na Hong-jin', 'Lee Chang-dong',
        'Hirokazu Kore-eda', 'Takashi Miike', 'Wong Kar-wai', 'Ang Lee', 'Johnnie To'
      ],
      anime: [
        'Hayao Miyazaki', 'Makoto Shinkai', 'Mamoru Hosoda', 'Satoshi Kon', 'Hideaki Anno',
        'Masaaki Yuasa', 'Shinichiro Watanabe', 'Naoko Yamada', 'Kunihiko Ikuhara'
      ],
      tvshow: [
        'Na Young-seok', 'Kim Tae-ho', 'Lee Se-young', 'Park Geun-hong', 'Choi Bo-pil',
        'Jung Chul-min', 'Kim Jin-ho', 'Lee Hwan-jin', 'Kim Sung-yoon'
      ],
      bollywood: [
        'Sanjay Leela Bhansali', 'Karan Johar', 'Rajkumar Hirani', 'Anurag Kashyap', 'Zoya Akhtar',
        'Imtiaz Ali', 'Rohit Shetty', 'Farhan Akhtar', 'Aditya Chopra', 'S.S. Rajamouli'
      ]
    },
    
    // Nombre d'épisodes possibles
    EPISODES: {
      drama: [12, 16, 20, 24, 32],
      anime: [12, 13, 24, 25, 26, 50, 100],
      tvshow: [8, 10, 12, 13, 16, 20, 24, 30, 50, 100, 200]
    },
    
    // Durées possibles (en minutes)
    DURATIONS: {
      drama: [60, 70, 75, 80, 90],
      movie: [90, 100, 110, 120, 130, 140, 150, 160, 170, 180],
      anime: [22, 24, 25],
      tvshow: [60, 70, 80, 90, 100, 120],
      bollywood: [120, 130, 140, 150, 160, 170, 180]
    }
  };
  
  // Système de logs
  const logger = {
    info: function(message) {
      console.info(`[FloDrama Content Generator] ${message}`);
    },
    
    warn: function(message) {
      console.warn(`[FloDrama Content Generator] ${message}`);
    },
    
    error: function(message, error) {
      console.error(`[FloDrama Content Generator] ${message}`, error);
    },
    
    debug: function(message) {
      console.debug(`[FloDrama Content Generator] ${message}`);
    }
  };
  
  /**
   * Génère un nombre aléatoire entre min et max (inclus)
   * @param {number} min - Valeur minimale
   * @param {number} max - Valeur maximale
   * @returns {number} - Nombre aléatoire
   */
  function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  
  /**
   * Sélectionne un élément aléatoire dans un tableau
   * @param {Array} array - Tableau d'éléments
   * @returns {*} - Élément aléatoire
   */
  function getRandomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
  }
  
  /**
   * Sélectionne plusieurs éléments aléatoires dans un tableau
   * @param {Array} array - Tableau d'éléments
   * @param {number} count - Nombre d'éléments à sélectionner
   * @returns {Array} - Éléments aléatoires
   */
  function getRandomElements(array, count) {
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }
  
  /**
   * Génère un élément de contenu
   * @param {string} category - Catégorie de l'élément
   * @param {number} index - Index de l'élément
   * @returns {Object} - Élément de contenu
   */
  function generateContentItem(category, index) {
    // Générer l'ID
    const id = `${category}${String(index + 1).padStart(3, '0')}`;
    
    // Sélectionner un pays
    const country = getRandomElement(CONFIG.COUNTRIES[category] || CONFIG.COUNTRIES.drama);
    
    // Sélectionner une année
    const year = getRandomElement(CONFIG.YEARS);
    
    // Sélectionner des genres (2 à 4)
    const genreCount = getRandomInt(2, 4);
    const genres = getRandomElements(CONFIG.GENRES[category] || CONFIG.GENRES.drama, genreCount);
    
    // Sélectionner des acteurs (3 à 6)
    const actorCount = getRandomInt(3, 6);
    const cast = getRandomElements(CONFIG.ACTORS[category] || CONFIG.ACTORS.drama, actorCount);
    
    // Sélectionner un réalisateur
    const director = getRandomElement(CONFIG.DIRECTORS[category] || CONFIG.DIRECTORS.drama);
    
    // Générer un nombre d'épisodes (si applicable)
    let episodes = null;
    if (category === 'drama' || category === 'anime' || category === 'tvshow') {
      episodes = getRandomElement(CONFIG.EPISODES[category] || CONFIG.EPISODES.drama);
    }
    
    // Générer une durée
    const duration = getRandomElement(CONFIG.DURATIONS[category] || CONFIG.DURATIONS.drama);
    
    // Générer une note (entre 7.0 et 9.9)
    const rating = (7 + Math.random() * 2.9).toFixed(1);
    
    // Générer une popularité (entre 1000 et 10000000)
    const popularity = getRandomInt(1000, 10000000);
    
    // Générer une date d'ajout (dans les 3 dernières années)
    const currentDate = new Date();
    const pastDate = new Date(currentDate);
    pastDate.setFullYear(currentDate.getFullYear() - 3);
    const randomTimestamp = pastDate.getTime() + Math.random() * (currentDate.getTime() - pastDate.getTime());
    const addedDate = new Date(randomTimestamp).toISOString();
    
    // Générer un titre fictif basé sur la catégorie et l'index
    let title, originalTitle;
    
    switch (category) {
      case 'drama':
        title = `Korean Drama ${index + 1}`;
        originalTitle = `한국 드라마 ${index + 1}`;
        break;
      case 'movie':
        title = `Asian Movie ${index + 1}`;
        originalTitle = `아시아 영화 ${index + 1}`;
        break;
      case 'anime':
        title = `Anime Series ${index + 1}`;
        originalTitle = `アニメシリーズ ${index + 1}`;
        break;
      case 'tvshow':
        title = `K-Variety Show ${index + 1}`;
        originalTitle = `한국 예능 ${index + 1}`;
        break;
      case 'bollywood':
        title = `Bollywood Film ${index + 1}`;
        originalTitle = `बॉलीवुड फिल्म ${index + 1}`;
        break;
      default:
        title = `Content ${index + 1}`;
        originalTitle = `콘텐츠 ${index + 1}`;
    }
    
    // Créer l'élément de contenu
    return {
      id,
      title,
      originalTitle,
      type: category,
      category,
      country,
      year,
      rating: parseFloat(rating),
      episodes,
      duration,
      synopsis: `Ceci est une description générée automatiquement pour ${title}, un ${category} de ${country.toUpperCase()} sorti en ${year}.`,
      genres,
      cast,
      director,
      popularity,
      addedDate,
      maturityRating: getRandomElement(['ALL', '7+', '12+', '15+', '18+'])
    };
  }
  
  /**
   * Génère tous les éléments de contenu
   * @returns {Object} - Données de contenu
   */
  function generateAllContent() {
    logger.info("Génération du contenu...");
    
    const items = [];
    
    // Générer les éléments pour chaque catégorie
    Object.keys(CONFIG.ITEMS_PER_CATEGORY).forEach(category => {
      const count = CONFIG.ITEMS_PER_CATEGORY[category];
      
      logger.info(`Génération de ${count} éléments pour la catégorie ${category}...`);
      
      for (let i = 0; i < count; i++) {
        items.push(generateContentItem(category, i));
      }
    });
    
    logger.info(`${items.length} éléments générés au total`);
    
    return {
      items,
      count: items.length,
      categories: Object.keys(CONFIG.ITEMS_PER_CATEGORY),
      generatedAt: new Date().toISOString()
    };
  }
  
  /**
   * Sauvegarde les données de contenu
   * @param {Object} data - Données de contenu
   */
  function saveContentData(data) {
    try {
      // Convertir en JSON
      const jsonData = JSON.stringify(data, null, 2);
      
      // Créer un Blob
      const blob = new Blob([jsonData], { type: 'application/json' });
      
      // Créer une URL pour le Blob
      const url = URL.createObjectURL(blob);
      
      // Créer un lien de téléchargement
      const a = document.createElement('a');
      a.href = url;
      a.download = 'content.json';
      a.style.display = 'none';
      
      // Ajouter le lien au document
      document.body.appendChild(a);
      
      // Cliquer sur le lien
      a.click();
      
      // Nettoyer
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      logger.info("Données de contenu sauvegardées avec succès");
    } catch (error) {
      logger.error("Erreur lors de la sauvegarde des données de contenu", error);
    }
  }
  
  /**
   * Initialise le générateur de contenu
   */
  function initContentGenerator() {
    logger.info("Initialisation du générateur de contenu...");
    
    // Créer un bouton pour générer le contenu
    const button = document.createElement('button');
    button.textContent = 'Générer le contenu';
    button.style.position = 'fixed';
    button.style.bottom = '20px';
    button.style.left = '20px';
    button.style.padding = '10px 20px';
    button.style.background = 'linear-gradient(to right, #3b82f6, #d946ef)';
    button.style.color = '#fff';
    button.style.border = 'none';
    button.style.borderRadius = '8px';
    button.style.fontFamily = 'SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif';
    button.style.fontWeight = 'bold';
    button.style.cursor = 'pointer';
    button.style.zIndex = '9999';
    button.style.boxShadow = '0 4px 10px rgba(0, 0, 0, 0.3)';
    button.style.transition = '0.3s ease';
    
    button.addEventListener('mouseover', function() {
      this.style.opacity = '0.9';
      this.style.transform = 'translateY(-2px)';
    });
    
    button.addEventListener('mouseout', function() {
      this.style.opacity = '1';
      this.style.transform = 'translateY(0)';
    });
    
    button.addEventListener('click', function() {
      const data = generateAllContent();
      saveContentData(data);
    });
    
    // Ajouter le bouton au document
    document.body.appendChild(button);
    
    logger.info("Générateur de contenu initialisé");
  }
  
  // Initialiser le générateur au chargement de la page
  document.addEventListener('DOMContentLoaded', initContentGenerator);
  
  // Exposer l'API publique
  window.FloDramaContentGenerator = {
    generate: generateAllContent,
    save: saveContentData
  };
})();
