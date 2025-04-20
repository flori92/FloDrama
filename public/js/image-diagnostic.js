/**
 * FloDrama - Diagnostic du système d'images
 * Ce script vérifie l'accessibilité des images et génère un rapport détaillé
 * 
 * @version 1.0.0
 */

(function() {
  // Configuration
  const CONFIG = {
    // Nombre d'éléments de contenu à tester
    TEST_ITEMS: 10,
    
    // Types d'images à tester
    IMAGE_TYPES: ['poster', 'backdrop', 'thumbnail'],
    
    // Délai avant de commencer le diagnostic (ms)
    START_DELAY: 1000,
    
    // Délai entre chaque test (ms)
    TEST_INTERVAL: 100,
    
    // Afficher les résultats dans la console
    CONSOLE_OUTPUT: true,
    
    // Afficher un rapport visuel
    VISUAL_REPORT: true,
    
    // Envoyer le rapport au serveur
    SEND_REPORT: false,
    
    // URL du serveur pour envoyer le rapport
    REPORT_URL: '/api/diagnostic/images'
  };
  
  // Système de logs
  const logger = {
    info: function(message) {
      console.info(`[FloDrama Diagnostic] ${message}`);
    },
    
    warn: function(message) {
      console.warn(`[FloDrama Diagnostic] ${message}`);
    },
    
    error: function(message, error) {
      console.error(`[FloDrama Diagnostic] ${message}`, error);
    },
    
    debug: function(message) {
      console.debug(`[FloDrama Diagnostic] ${message}`);
    },
    
    group: function(title) {
      console.group(`[FloDrama Diagnostic] ${title}`);
    },
    
    groupEnd: function() {
      console.groupEnd();
    },
    
    table: function(data) {
      console.table(data);
    }
  };
  
  // Résultats des tests
  const results = {
    startTime: null,
    endTime: null,
    totalTests: 0,
    successfulTests: 0,
    failedTests: 0,
    items: [],
    
    // Ajouter un résultat
    addResult: function(contentId, type, source, success, time) {
      this.totalTests++;
      
      if (success) {
        this.successfulTests++;
      } else {
        this.failedTests++;
      }
      
      // Trouver l'élément existant ou en créer un nouveau
      let item = this.items.find(item => item.contentId === contentId);
      
      if (!item) {
        item = {
          contentId: contentId,
          types: {}
        };
        this.items.push(item);
      }
      
      // Ajouter le résultat pour ce type d'image
      if (!item.types[type]) {
        item.types[type] = {
          tested: 0,
          successful: 0,
          failed: 0,
          sources: []
        };
      }
      
      item.types[type].tested++;
      
      if (success) {
        item.types[type].successful++;
      } else {
        item.types[type].failed++;
      }
      
      // Ajouter la source testée
      item.types[type].sources.push({
        url: source,
        success: success,
        time: time
      });
    },
    
    // Obtenir un rapport
    getReport: function() {
      const duration = this.endTime - this.startTime;
      const successRate = this.totalTests > 0 ? (this.successfulTests / this.totalTests * 100).toFixed(1) : 0;
      
      return {
        duration: `${(duration / 1000).toFixed(2)}s`,
        totalTests: this.totalTests,
        successfulTests: this.successfulTests,
        failedTests: this.failedTests,
        successRate: `${successRate}%`,
        items: this.items.map(item => {
          const itemSuccessRate = {};
          let totalSuccessful = 0;
          let totalTested = 0;
          
          // Calculer le taux de succès pour chaque type
          Object.keys(item.types).forEach(type => {
            const typeData = item.types[type];
            const typeSuccessRate = typeData.tested > 0 ? (typeData.successful / typeData.tested * 100).toFixed(1) : 0;
            
            itemSuccessRate[type] = `${typeSuccessRate}%`;
            totalSuccessful += typeData.successful;
            totalTested += typeData.tested;
          });
          
          // Calculer le taux de succès global pour cet élément
          const globalSuccessRate = totalTested > 0 ? (totalSuccessful / totalTested * 100).toFixed(1) : 0;
          
          return {
            contentId: item.contentId,
            globalSuccessRate: `${globalSuccessRate}%`,
            typeSuccessRates: itemSuccessRate,
            details: item.types
          };
        })
      };
    }
  };
  
  /**
   * Teste l'accessibilité d'une image
   * @param {string} url - URL de l'image à tester
   * @returns {Promise<{success: boolean, time: number}>} - Résultat du test
   */
  function testImageUrl(url) {
    return new Promise(resolve => {
      const startTime = performance.now();
      const img = new Image();
      
      // Configurer un timeout
      const timeout = setTimeout(() => {
        resolve({ success: false, time: 3000 });
      }, 3000);
      
      // Configurer les gestionnaires d'événements
      img.onload = function() {
        clearTimeout(timeout);
        const endTime = performance.now();
        resolve({ success: true, time: endTime - startTime });
      };
      
      img.onerror = function() {
        clearTimeout(timeout);
        const endTime = performance.now();
        resolve({ success: false, time: endTime - startTime });
      };
      
      // Commencer le chargement
      img.src = url;
    });
  }
  
  /**
   * Teste l'accessibilité des images pour un contenu
   * @param {string} contentId - Identifiant du contenu
   * @param {string} type - Type d'image
   * @returns {Promise<void>} - Promise qui se résout lorsque tous les tests sont terminés
   */
  async function testContentImages(contentId, type) {
    // Vérifier que le système d'images est disponible
    if (!window.FloDramaImageSystem || !window.FloDramaImageSystem.generateImageSources) {
      logger.error("Système d'images non disponible");
      return;
    }
    
    // Générer les sources d'images
    const sources = window.FloDramaImageSystem.generateImageSources(contentId, type);
    
    // Tester chaque source
    for (const source of sources) {
      // Attendre un peu entre chaque test pour ne pas surcharger le navigateur
      await new Promise(resolve => setTimeout(resolve, CONFIG.TEST_INTERVAL));
      
      // Tester l'URL
      const result = await testImageUrl(source);
      
      // Enregistrer le résultat
      results.addResult(contentId, type, source, result.success, result.time);
      
      // Si une source a réussi, arrêter les tests pour ce contenu/type
      if (result.success) {
        break;
      }
    }
  }
  
  /**
   * Charge les données de contenu
   * @returns {Promise<Array>} - Liste des contenus
   */
  async function loadContentData() {
    try {
      const response = await fetch('/data/content.json');
      const data = await response.json();
      
      return data.items;
    } catch (error) {
      logger.error("Erreur lors du chargement des données de contenu", error);
      return [];
    }
  }
  
  /**
   * Affiche un rapport visuel
   * @param {Object} report - Rapport à afficher
   */
  function showVisualReport(report) {
    // Créer l'élément de rapport
    const reportElement = document.createElement('div');
    reportElement.id = 'image-diagnostic-report';
    reportElement.style.position = 'fixed';
    reportElement.style.top = '20px';
    reportElement.style.right = '20px';
    reportElement.style.width = '400px';
    reportElement.style.maxHeight = '80vh';
    reportElement.style.overflowY = 'auto';
    reportElement.style.background = '#121118';
    reportElement.style.color = '#fff';
    reportElement.style.padding = '15px';
    reportElement.style.borderRadius = '8px';
    reportElement.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.5)';
    reportElement.style.zIndex = '9999';
    reportElement.style.fontFamily = 'SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif';
    
    // Ajouter le titre
    const title = document.createElement('h2');
    title.textContent = 'Diagnostic des Images';
    title.style.margin = '0 0 15px 0';
    title.style.fontSize = '18px';
    title.style.fontWeight = 'bold';
    title.style.background = 'linear-gradient(to right, #3b82f6, #d946ef)';
    title.style.WebkitBackgroundClip = 'text';
    title.style.backgroundClip = 'text';
    title.style.WebkitTextFillColor = 'transparent';
    title.style.color = 'transparent';
    reportElement.appendChild(title);
    
    // Ajouter le résumé
    const summary = document.createElement('div');
    summary.style.marginBottom = '15px';
    summary.style.padding = '10px';
    summary.style.background = '#1A1926';
    summary.style.borderRadius = '6px';
    
    summary.innerHTML = `
      <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
        <span>Durée:</span>
        <span>${report.duration}</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
        <span>Tests:</span>
        <span>${report.totalTests}</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
        <span>Succès:</span>
        <span>${report.successfulTests}</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
        <span>Échecs:</span>
        <span>${report.failedTests}</span>
      </div>
      <div style="display: flex; justify-content: space-between; font-weight: bold;">
        <span>Taux de succès:</span>
        <span style="color: ${parseInt(report.successRate) > 50 ? '#10b981' : '#ef4444'}">${report.successRate}</span>
      </div>
    `;
    
    reportElement.appendChild(summary);
    
    // Ajouter les détails par contenu
    const detailsTitle = document.createElement('h3');
    detailsTitle.textContent = 'Détails par contenu';
    detailsTitle.style.margin = '15px 0 10px 0';
    detailsTitle.style.fontSize = '16px';
    detailsTitle.style.fontWeight = 'bold';
    reportElement.appendChild(detailsTitle);
    
    // Ajouter chaque élément de contenu
    report.items.forEach(item => {
      const itemElement = document.createElement('div');
      itemElement.style.marginBottom = '10px';
      itemElement.style.padding = '10px';
      itemElement.style.background = '#1A1926';
      itemElement.style.borderRadius = '6px';
      
      // Titre de l'élément
      const itemTitle = document.createElement('div');
      itemTitle.style.display = 'flex';
      itemTitle.style.justifyContent = 'space-between';
      itemTitle.style.marginBottom = '10px';
      itemTitle.style.fontWeight = 'bold';
      
      const itemId = document.createElement('span');
      itemId.textContent = item.contentId;
      itemTitle.appendChild(itemId);
      
      const itemRate = document.createElement('span');
      itemRate.textContent = item.globalSuccessRate;
      itemRate.style.color = parseInt(item.globalSuccessRate) > 50 ? '#10b981' : '#ef4444';
      itemTitle.appendChild(itemRate);
      
      itemElement.appendChild(itemTitle);
      
      // Détails par type
      Object.keys(item.typeSuccessRates).forEach(type => {
        const typeElement = document.createElement('div');
        typeElement.style.display = 'flex';
        typeElement.style.justifyContent = 'space-between';
        typeElement.style.marginBottom = '5px';
        typeElement.style.fontSize = '14px';
        
        const typeLabel = document.createElement('span');
        typeLabel.textContent = type;
        typeElement.appendChild(typeLabel);
        
        const typeRate = document.createElement('span');
        typeRate.textContent = item.typeSuccessRates[type];
        typeRate.style.color = parseInt(item.typeSuccessRates[type]) > 50 ? '#10b981' : '#ef4444';
        typeElement.appendChild(typeRate);
        
        itemElement.appendChild(typeElement);
      });
      
      reportElement.appendChild(itemElement);
    });
    
    // Ajouter le bouton de fermeture
    const closeButton = document.createElement('button');
    closeButton.textContent = 'Fermer';
    closeButton.style.display = 'block';
    closeButton.style.width = '100%';
    closeButton.style.padding = '10px';
    closeButton.style.marginTop = '15px';
    closeButton.style.background = 'linear-gradient(to right, #3b82f6, #d946ef)';
    closeButton.style.color = '#fff';
    closeButton.style.border = 'none';
    closeButton.style.borderRadius = '6px';
    closeButton.style.cursor = 'pointer';
    closeButton.style.fontWeight = 'bold';
    closeButton.style.transition = '0.3s ease';
    
    closeButton.addEventListener('mouseover', function() {
      this.style.opacity = '0.9';
    });
    
    closeButton.addEventListener('mouseout', function() {
      this.style.opacity = '1';
    });
    
    closeButton.addEventListener('click', function() {
      reportElement.remove();
    });
    
    reportElement.appendChild(closeButton);
    
    // Ajouter le rapport au document
    document.body.appendChild(reportElement);
  }
  
  /**
   * Exécute le diagnostic
   */
  async function runDiagnostic() {
    logger.info("Démarrage du diagnostic des images...");
    
    // Initialiser les résultats
    results.startTime = performance.now();
    
    // Charger les données de contenu
    const contents = await loadContentData();
    
    if (contents.length === 0) {
      logger.error("Aucun contenu disponible pour le diagnostic");
      return;
    }
    
    // Limiter le nombre d'éléments à tester
    const contentsToTest = contents.slice(0, CONFIG.TEST_ITEMS);
    
    logger.info(`Test de ${contentsToTest.length} éléments de contenu...`);
    
    // Tester chaque élément de contenu
    for (const content of contentsToTest) {
      // Tester chaque type d'image
      for (const type of CONFIG.IMAGE_TYPES) {
        await testContentImages(content.id, type);
      }
    }
    
    // Finaliser les résultats
    results.endTime = performance.now();
    
    // Générer le rapport
    const report = results.getReport();
    
    // Afficher le rapport dans la console
    if (CONFIG.CONSOLE_OUTPUT) {
      logger.group("Rapport de diagnostic des images");
      logger.info(`Durée: ${report.duration}`);
      logger.info(`Tests: ${report.totalTests}`);
      logger.info(`Succès: ${report.successfulTests}`);
      logger.info(`Échecs: ${report.failedTests}`);
      logger.info(`Taux de succès: ${report.successRate}`);
      
      logger.group("Détails par contenu");
      report.items.forEach(item => {
        logger.group(item.contentId);
        logger.info(`Taux de succès global: ${item.globalSuccessRate}`);
        
        logger.group("Taux de succès par type");
        Object.keys(item.typeSuccessRates).forEach(type => {
          logger.info(`${type}: ${item.typeSuccessRates[type]}`);
        });
        logger.groupEnd();
        
        logger.groupEnd();
      });
      logger.groupEnd();
      
      logger.groupEnd();
    }
    
    // Afficher un rapport visuel
    if (CONFIG.VISUAL_REPORT) {
      showVisualReport(report);
    }
    
    // Envoyer le rapport au serveur
    if (CONFIG.SEND_REPORT) {
      try {
        await fetch(CONFIG.REPORT_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(report)
        });
        
        logger.info("Rapport envoyé au serveur");
      } catch (error) {
        logger.error("Erreur lors de l'envoi du rapport au serveur", error);
      }
    }
    
    logger.info("Diagnostic des images terminé");
    
    return report;
  }
  
  /**
   * Initialise le diagnostic
   */
  function initDiagnostic() {
    logger.info("Initialisation du diagnostic des images...");
    
    // Attendre un peu avant de commencer le diagnostic
    setTimeout(() => {
      runDiagnostic().then(report => {
        // Stocker le rapport dans localStorage
        try {
          localStorage.setItem('flodrama_image_diagnostic', JSON.stringify(report));
        } catch (error) {
          logger.error("Erreur lors du stockage du rapport", error);
        }
      });
    }, CONFIG.START_DELAY);
  }
  
  // Initialiser le diagnostic au chargement de la page
  document.addEventListener('DOMContentLoaded', initDiagnostic);
  
  // Exposer l'API publique
  window.FloDramaDiagnostic = {
    runDiagnostic,
    getLastReport: function() {
      try {
        const storedReport = localStorage.getItem('flodrama_image_diagnostic');
        return storedReport ? JSON.parse(storedReport) : null;
      } catch (error) {
        logger.error("Erreur lors de la récupération du rapport", error);
        return null;
      }
    }
  };
})();
