/**
 * Script de test pour le système d'images FloDrama
 * Ce script permet de tester les améliorations apportées au système de chargement d'images
 * 
 * @version 1.0.0
 */

// Configuration du test
const TEST_CONFIG = {
    CONTENT_COUNT: 20,
    TEST_DURATION: 30000, // 30 secondes
    INTERVAL_CHECK: 2000, // Vérification toutes les 2 secondes
    DISPLAY_LOGS: true,
    AUTO_START: true
};

// État du test
const testState = {
    startTime: null,
    endTime: null,
    running: false,
    results: {
        initialSuccess: 0,
        finalSuccess: 0,
        initialRate: '0%',
        finalRate: '0%',
        improvement: '0%',
        sources: {
            githubPages: 0,
            cloudfront: 0,
            s3direct: 0,
            local: 0
        },
        retryCount: 0,
        fallbackCount: 0
    }
};

// Système de logs
const testLogger = {
    log: function(message) {
        if (TEST_CONFIG.DISPLAY_LOGS) {
            console.log(`[Test Image System] ${message}`);
        }
        
        // Ajouter au conteneur de logs s'il existe
        const logContainer = document.getElementById('test-logs');
        if (logContainer) {
            const logEntry = document.createElement('div');
            logEntry.className = 'log-entry';
            logEntry.textContent = message;
            logContainer.appendChild(logEntry);
            logContainer.scrollTop = logContainer.scrollHeight;
        }
    },
    
    info: function(message) {
        this.log(`ℹ️ ${message}`);
    },
    
    success: function(message) {
        this.log(`✅ ${message}`);
    },
    
    warn: function(message) {
        this.log(`⚠️ ${message}`);
    },
    
    error: function(message) {
        this.log(`❌ ${message}`);
    },
    
    result: function(message) {
        this.log(`🔍 ${message}`);
    }
};

/**
 * Charge les données de contenu depuis le fichier JSON
 * @returns {Promise<Array>} - Données de contenu
 */
async function loadContentData() {
    testLogger.info('Chargement des données de contenu...');
    
    try {
        const response = await fetch('/data/content.json');
        if (!response.ok) {
            throw new Error(`Erreur lors du chargement des données: ${response.status}`);
        }
        
        const data = await response.json();
        if (!data.items || !Array.isArray(data.items)) {
            throw new Error('Format de données invalide');
        }
        
        testLogger.success(`${data.items.length} éléments de contenu chargés avec succès`);
        return data.items;
    } catch (error) {
        testLogger.error(`Erreur lors du chargement des données: ${error.message}`);
        return [];
    }
}

/**
 * Génère des éléments de contenu de test
 * @param {number} count - Nombre d'éléments à générer
 * @returns {Array} - Éléments de contenu générés
 */
function generateTestContent(count = 20) {
    testLogger.info(`Génération de ${count} éléments de contenu de test...`);
    
    const contentTypes = ['drama', 'movie', 'anime', 'kshow'];
    const genres = ['Action', 'Comédie', 'Drame', 'Romance', 'Thriller', 'Fantastique'];
    const years = [2018, 2019, 2020, 2021, 2022, 2023];
    
    const items = [];
    
    for (let i = 1; i <= count; i++) {
        const typeIndex = i % contentTypes.length;
        const type = contentTypes[typeIndex];
        
        const item = {
            id: `${type}${i.toString().padStart(3, '0')}`,
            title: `Test ${type.charAt(0).toUpperCase() + type.slice(1)} ${i}`,
            type: type,
            category: type,
            year: years[Math.floor(Math.random() * years.length)],
            genres: [
                genres[Math.floor(Math.random() * genres.length)],
                genres[Math.floor(Math.random() * genres.length)]
            ]
        };
        
        items.push(item);
    }
    
    testLogger.success(`${items.length} éléments de contenu générés`);
    return items;
}

/**
 * Crée une carte de contenu pour l'élément spécifié
 * @param {Object} item - Élément de contenu
 * @returns {HTMLElement} - Élément DOM de la carte
 */
function createContentCard(item) {
    const card = document.createElement('div');
    card.className = 'content-card';
    card.dataset.contentId = item.id;
    
    const imageType = 'poster';
    
    card.innerHTML = `
        <img class="card-image" 
             data-content-id="${item.id}" 
             data-type="${imageType}" 
             alt="${item.title}" 
             src="/assets/placeholders/loading.svg">
        <div class="card-content">
            <h3 class="card-title">${item.title}</h3>
            <div class="card-meta">${item.year} • ${item.genres.join(', ')}</div>
        </div>
    `;
    
    return card;
}

/**
 * Initialise la grille de contenu avec les éléments spécifiés
 * @param {Array} items - Éléments de contenu
 * @param {string} containerId - ID du conteneur
 */
function initContentGrid(items, containerId = 'test-content-grid') {
    testLogger.info(`Initialisation de la grille de contenu avec ${items.length} éléments...`);
    
    const container = document.getElementById(containerId);
    if (!container) {
        testLogger.error(`Conteneur ${containerId} non trouvé`);
        return;
    }
    
    // Vider le conteneur
    container.innerHTML = '';
    
    // Ajouter les cartes
    items.forEach(item => {
        container.appendChild(createContentCard(item));
    });
    
    testLogger.success('Grille de contenu initialisée');
}

/**
 * Met à jour les statistiques de test
 */
function updateTestStats() {
    if (!window.FloDramaImageSystem || !window.FloDramaImageSystem.getStats) {
        testLogger.warn('Système d\'images non disponible');
        return;
    }
    
    const stats = window.FloDramaImageSystem.getStats();
    
    // Mettre à jour les éléments d'interface s'ils existent
    const elements = {
        totalImages: document.getElementById('total-images'),
        successRate: document.getElementById('success-rate'),
        fallbackCount: document.getElementById('fallback-count'),
        retryCount: document.getElementById('retry-count'),
        githubPages: document.getElementById('github-pages'),
        cloudfront: document.getElementById('cloudfront'),
        s3direct: document.getElementById('s3-direct'),
        local: document.getElementById('local-sources')
    };
    
    if (elements.totalImages) elements.totalImages.textContent = stats.total || 0;
    if (elements.successRate) elements.successRate.textContent = stats.successRate || '0%';
    if (elements.fallbackCount) elements.fallbackCount.textContent = stats.fallbackUsed || 0;
    if (elements.retryCount) elements.retryCount.textContent = stats.retried || 0;
    
    // Sources
    if (elements.githubPages) elements.githubPages.textContent = stats.sources?.githubPages || 0;
    if (elements.cloudfront) elements.cloudfront.textContent = stats.sources?.cloudfront || 0;
    if (elements.s3direct) elements.s3direct.textContent = stats.sources?.s3direct || 0;
    if (elements.local) elements.local.textContent = stats.sources?.local || 0;
    
    return stats;
}

/**
 * Démarre le test du système d'images
 */
async function startImageSystemTest() {
    testLogger.info('Démarrage du test du système d\'images...');
    
    if (testState.running) {
        testLogger.warn('Un test est déjà en cours');
        return;
    }
    
    // Réinitialiser l'état du test
    testState.startTime = Date.now();
    testState.running = true;
    testState.results = {
        initialSuccess: 0,
        finalSuccess: 0,
        initialRate: '0%',
        finalRate: '0%',
        improvement: '0%',
        sources: {
            githubPages: 0,
            cloudfront: 0,
            s3direct: 0,
            local: 0
        },
        retryCount: 0,
        fallbackCount: 0
    };
    
    // Charger ou générer les données de contenu
    let contentItems = await loadContentData();
    if (!contentItems || contentItems.length === 0) {
        contentItems = generateTestContent(TEST_CONFIG.CONTENT_COUNT);
    }
    
    // Initialiser la grille de contenu
    initContentGrid(contentItems);
    
    // Enregistrer les statistiques initiales
    setTimeout(() => {
        const initialStats = updateTestStats();
        if (initialStats) {
            testState.results.initialSuccess = initialStats.success || 0;
            testState.results.initialRate = initialStats.successRate || '0%';
            
            testLogger.info(`Statistiques initiales: ${initialStats.success}/${initialStats.total} (${initialStats.successRate})`);
        }
        
        // Démarrer le timer pour la fin du test
        setTimeout(() => {
            endImageSystemTest();
        }, TEST_CONFIG.TEST_DURATION);
        
        // Mettre à jour les statistiques régulièrement
        const intervalId = setInterval(() => {
            if (!testState.running) {
                clearInterval(intervalId);
                return;
            }
            
            updateTestStats();
        }, TEST_CONFIG.INTERVAL_CHECK);
        
    }, 2000); // Attendre 2 secondes pour les statistiques initiales
}

/**
 * Termine le test du système d'images
 */
function endImageSystemTest() {
    if (!testState.running) {
        testLogger.warn('Aucun test en cours');
        return;
    }
    
    testState.endTime = Date.now();
    testState.running = false;
    
    // Enregistrer les statistiques finales
    const finalStats = updateTestStats();
    if (finalStats) {
        testState.results.finalSuccess = finalStats.success || 0;
        testState.results.finalRate = finalStats.successRate || '0%';
        testState.results.sources = finalStats.sources || {};
        testState.results.retryCount = finalStats.retried || 0;
        testState.results.fallbackCount = finalStats.fallbackUsed || 0;
        
        // Calculer l'amélioration
        const initialRate = parseFloat(testState.results.initialRate);
        const finalRate = parseFloat(testState.results.finalRate);
        const improvement = finalRate - initialRate;
        testState.results.improvement = improvement > 0 ? `+${improvement.toFixed(1)}%` : `${improvement.toFixed(1)}%`;
        
        // Afficher les résultats
        testLogger.result('=== RÉSULTATS DU TEST ===');
        testLogger.result(`Durée: ${((testState.endTime - testState.startTime) / 1000).toFixed(1)} secondes`);
        testLogger.result(`Taux de succès initial: ${testState.results.initialRate}`);
        testLogger.result(`Taux de succès final: ${testState.results.finalRate}`);
        testLogger.result(`Amélioration: ${testState.results.improvement}`);
        testLogger.result(`Nombre de retries: ${testState.results.retryCount}`);
        testLogger.result(`Nombre de fallbacks: ${testState.results.fallbackCount}`);
        testLogger.result('Sources utilisées:');
        testLogger.result(`- GitHub Pages: ${testState.results.sources.githubPages || 0}`);
        testLogger.result(`- CloudFront: ${testState.results.sources.cloudfront || 0}`);
        testLogger.result(`- S3 Direct: ${testState.results.sources.s3direct || 0}`);
        testLogger.result(`- Local: ${testState.results.sources.local || 0}`);
    }
    
    // Afficher un rapport de test dans la console
    console.table({
        'Taux initial': testState.results.initialRate,
        'Taux final': testState.results.finalRate,
        'Amélioration': testState.results.improvement,
        'Retries': testState.results.retryCount,
        'Fallbacks': testState.results.fallbackCount,
        'GitHub Pages': testState.results.sources.githubPages || 0,
        'CloudFront': testState.results.sources.cloudfront || 0,
        'S3 Direct': testState.results.sources.s3direct || 0,
        'Local': testState.results.sources.local || 0
    });
    
    // Déclencher un événement pour signaler la fin du test
    document.dispatchEvent(new CustomEvent('imageSystemTestCompleted', {
        detail: {
            results: testState.results,
            duration: (testState.endTime - testState.startTime) / 1000
        }
    }));
}

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    testLogger.info('Page chargée, initialisation du test...');
    
    // Ajouter les gestionnaires d'événements pour les boutons s'ils existent
    const startButton = document.getElementById('start-test-btn');
    if (startButton) {
        startButton.addEventListener('click', startImageSystemTest);
    }
    
    const endButton = document.getElementById('end-test-btn');
    if (endButton) {
        endButton.addEventListener('click', endImageSystemTest);
    }
    
    // Démarrer automatiquement le test si configuré
    if (TEST_CONFIG.AUTO_START) {
        // Attendre que le système d'images soit initialisé
        setTimeout(() => {
            startImageSystemTest();
        }, 1000);
    }
});

// Exporter les fonctions pour une utilisation externe
window.FloDramaImageTest = {
    startTest: startImageSystemTest,
    endTest: endImageSystemTest,
    getResults: () => testState.results,
    updateStats: updateTestStats,
    config: TEST_CONFIG
};
