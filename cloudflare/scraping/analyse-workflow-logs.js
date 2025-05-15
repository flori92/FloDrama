/**
 * Script d'analyse des logs de workflow GitHub Actions pour FloDrama
 * 
 * Ce script permet d'analyser les logs des workflows GitHub Actions
 * pour identifier les problèmes potentiels dans le processus de scraping.
 * 
 * @author FloDrama Team
 * @version 1.0.0
 */

const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const readline = require('readline');

// Configuration
const LOG_DIR = path.join(__dirname, 'workflow-logs');
const ANALYSIS_FILE = path.join(LOG_DIR, 'analyse-resultats.md');
const GITHUB_REPO = 'flori92/FloDrama';

// Motifs d'erreurs courants à rechercher
const ERROR_PATTERNS = [
  {
    pattern: /Navigation timeout of \d+ ms exceeded/i,
    type: 'timeout',
    description: 'Timeout de navigation',
    suggestion: 'Augmenter le timeout de navigation ou optimiser le sélecteur d\'attente'
  },
  {
    pattern: /waiting for selector `([^`]+)` failed/i,
    type: 'selector',
    description: 'Sélecteur introuvable',
    suggestion: 'Vérifier que le sélecteur existe toujours sur la page ou le mettre à jour'
  },
  {
    pattern: /ERR_PROXY_CONNECTION_FAILED/i,
    type: 'proxy',
    description: 'Échec de connexion au proxy',
    suggestion: 'Vérifier la configuration du proxy ou utiliser le service relais Render'
  },
  {
    pattern: /net::ERR_NAME_NOT_RESOLVED/i,
    type: 'dns',
    description: 'Erreur de résolution DNS',
    suggestion: 'Vérifier la connectivité réseau ou utiliser le service relais Render'
  },
  {
    pattern: /net::ERR_CONNECTION_REFUSED/i,
    type: 'connection',
    description: 'Connexion refusée',
    suggestion: 'Le site cible bloque peut-être les requêtes, utiliser le service relais Render'
  },
  {
    pattern: /captcha|cloudflare|challenge/i,
    type: 'protection',
    description: 'Protection anti-bot détectée',
    suggestion: 'Utiliser le service relais Render qui contourne ces protections'
  },
  {
    pattern: /cannot read property .* of (undefined|null)/i,
    type: 'data',
    description: 'Données manquantes ou structure modifiée',
    suggestion: 'Mettre à jour les sélecteurs ou la logique d\'extraction des données'
  },
  {
    pattern: /TypeError: (.*)/i,
    type: 'type',
    description: 'Erreur de type',
    suggestion: 'Vérifier les types de données et ajouter des vérifications'
  },
  {
    pattern: /ECONNRESET|ETIMEDOUT|ESOCKETTIMEDOUT/i,
    type: 'network',
    description: 'Erreur réseau',
    suggestion: 'Ajouter des mécanismes de retry ou utiliser le service relais Render'
  }
];

// Fonction pour télécharger les logs des workflows récents
async function downloadWorkflowLogs() {
  console.log('📥 Téléchargement des logs des workflows récents...');
  
  try {
    // Créer le dossier de logs s'il n'existe pas
    fs.ensureDirSync(LOG_DIR);
    
    // Si nous sommes dans un environnement GitHub Actions avec un token
    if (process.env.GITHUB_TOKEN) {
      const octokit = require('@octokit/rest')({
        auth: process.env.GITHUB_TOKEN
      });
      
      // Récupérer les exécutions de workflow récentes
      const [owner, repo] = GITHUB_REPO.split('/');
      const { data } = await octokit.actions.listWorkflowRunsForRepo({
        owner,
        repo,
        per_page: 5
      });
      
      // Télécharger les logs pour chaque exécution
      for (const run of data.workflow_runs) {
        if (run.name.includes('Scraping')) {
          console.log(`Téléchargement des logs pour l'exécution #${run.id} (${run.created_at})...`);
          
          try {
            const logsResponse = await octokit.actions.downloadWorkflowRunLogs({
              owner,
              repo,
              run_id: run.id
            });
            
            // Sauvegarder les logs
            const logFile = path.join(LOG_DIR, `workflow-${run.id}.zip`);
            fs.writeFileSync(logFile, Buffer.from(logsResponse.data));
            console.log(`✅ Logs sauvegardés dans ${logFile}`);
            
            // Extraire les logs
            const extract = require('extract-zip');
            await extract(logFile, { dir: path.join(LOG_DIR, `run-${run.id}`) });
          } catch (error) {
            console.warn(`⚠️ Impossible de télécharger les logs pour l'exécution #${run.id}: ${error.message}`);
          }
        }
      }
    } else {
      console.log('⚠️ Token GitHub non disponible, utilisation des logs locaux uniquement');
    }
    
    return true;
  } catch (error) {
    console.error(`❌ Erreur lors du téléchargement des logs: ${error.message}`);
    return false;
  }
}

// Fonction pour analyser un fichier de log
async function analyzeLogFile(filePath) {
  console.log(`🔍 Analyse du fichier de log: ${filePath}`);
  
  const errors = [];
  const warnings = [];
  const stats = {
    totalLines: 0,
    errorLines: 0,
    warningLines: 0,
    sources: {},
    startTime: null,
    endTime: null
  };
  
  // Créer une interface de lecture de ligne
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });
  
  // Parcourir le fichier ligne par ligne
  for await (const line of rl) {
    stats.totalLines++;
    
    // Extraire l'horodatage si présent
    const timestampMatch = line.match(/\[(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z)\]/);
    if (timestampMatch) {
      const timestamp = new Date(timestampMatch[1]);
      if (!stats.startTime || timestamp < stats.startTime) {
        stats.startTime = timestamp;
      }
      if (!stats.endTime || timestamp > stats.endTime) {
        stats.endTime = timestamp;
      }
    }
    
    // Détecter les sources
    const sourceMatch = line.match(/Source: ([a-z0-9-]+)/i);
    if (sourceMatch) {
      const source = sourceMatch[1];
      if (!stats.sources[source]) {
        stats.sources[source] = {
          items: 0,
          errors: 0,
          warnings: 0
        };
      }
    }
    
    // Détecter les éléments récupérés
    const itemsMatch = line.match(/Récupéré (\d+) éléments? pour ([a-z0-9-]+)/i);
    if (itemsMatch) {
      const count = parseInt(itemsMatch[1]);
      const source = itemsMatch[2];
      if (stats.sources[source]) {
        stats.sources[source].items += count;
      }
    }
    
    // Détecter les erreurs connues
    for (const errorPattern of ERROR_PATTERNS) {
      const match = line.match(errorPattern.pattern);
      if (match) {
        stats.errorLines++;
        
        // Extraire la source concernée si possible
        let source = 'inconnue';
        const sourceContext = line.match(/Source: ([a-z0-9-]+)/i);
        if (sourceContext) {
          source = sourceContext[1];
          if (stats.sources[source]) {
            stats.sources[source].errors++;
          }
        }
        
        errors.push({
          line: stats.totalLines,
          type: errorPattern.type,
          description: errorPattern.description,
          suggestion: errorPattern.suggestion,
          source,
          text: line
        });
        
        break;
      }
    }
    
    // Détecter les avertissements
    if (line.includes('⚠️') || line.toLowerCase().includes('warning')) {
      stats.warningLines++;
      
      // Extraire la source concernée si possible
      let source = 'inconnue';
      const sourceContext = line.match(/Source: ([a-z0-9-]+)/i);
      if (sourceContext) {
        source = sourceContext[1];
        if (stats.sources[source]) {
          stats.sources[source].warnings++;
        }
      }
      
      warnings.push({
        line: stats.totalLines,
        source,
        text: line
      });
    }
  }
  
  return {
    filePath,
    stats,
    errors,
    warnings
  };
}

// Fonction pour générer un rapport d'analyse
function generateAnalysisReport(analysisResults) {
  console.log('📝 Génération du rapport d\'analyse...');
  
  let report = `# Rapport d'analyse des logs de workflow FloDrama\n\n`;
  report += `*Généré le ${new Date().toLocaleString('fr-FR')}*\n\n`;
  
  // Résumé global
  report += `## Résumé global\n\n`;
  
  let totalErrors = 0;
  let totalWarnings = 0;
  let totalItems = 0;
  const sourcesStats = {};
  
  analysisResults.forEach(result => {
    totalErrors += result.errors.length;
    totalWarnings += result.warnings.length;
    
    // Agréger les statistiques par source
    Object.entries(result.stats.sources).forEach(([source, stats]) => {
      if (!sourcesStats[source]) {
        sourcesStats[source] = { items: 0, errors: 0, warnings: 0 };
      }
      sourcesStats[source].items += stats.items;
      sourcesStats[source].errors += stats.errors;
      sourcesStats[source].warnings += stats.warnings;
      totalItems += stats.items;
    });
  });
  
  report += `- **Fichiers analysés**: ${analysisResults.length}\n`;
  report += `- **Erreurs détectées**: ${totalErrors}\n`;
  report += `- **Avertissements**: ${totalWarnings}\n`;
  report += `- **Éléments récupérés**: ${totalItems}\n\n`;
  
  // Tableau des sources
  report += `### Performance par source\n\n`;
  report += `| Source | Éléments | Erreurs | Avertissements | Taux de succès |\n`;
  report += `|--------|----------|---------|----------------|---------------|\n`;
  
  Object.entries(sourcesStats).forEach(([source, stats]) => {
    const successRate = stats.errors > 0 ? 
      Math.round((1 - stats.errors / (stats.items > 0 ? stats.items : 1)) * 100) : 
      (stats.items > 0 ? 100 : 0);
    
    report += `| ${source} | ${stats.items} | ${stats.errors} | ${stats.warnings} | ${successRate}% |\n`;
  });
  
  report += `\n`;
  
  // Analyse des erreurs par type
  report += `## Types d'erreurs fréquentes\n\n`;
  
  const errorTypes = {};
  analysisResults.forEach(result => {
    result.errors.forEach(error => {
      if (!errorTypes[error.type]) {
        errorTypes[error.type] = {
          count: 0,
          description: error.description,
          suggestion: error.suggestion,
          examples: []
        };
      }
      errorTypes[error.type].count++;
      
      // Ajouter un exemple si nous n'en avons pas trop
      if (errorTypes[error.type].examples.length < 3) {
        errorTypes[error.type].examples.push({
          source: error.source,
          text: error.text
        });
      }
    });
  });
  
  // Trier par fréquence
  const sortedErrorTypes = Object.entries(errorTypes)
    .sort((a, b) => b[1].count - a[1].count)
    .map(([type, data]) => ({ type, ...data }));
  
  sortedErrorTypes.forEach(error => {
    report += `### ${error.description} (${error.count} occurrences)\n\n`;
    report += `**Suggestion**: ${error.suggestion}\n\n`;
    
    if (error.examples.length > 0) {
      report += `**Exemples**:\n\n`;
      error.examples.forEach(example => {
        report += `- Source: ${example.source}\n`;
        report += `  \`\`\`\n  ${example.text}\n  \`\`\`\n`;
      });
    }
    
    report += `\n`;
  });
  
  // Analyse détaillée par fichier
  report += `## Analyse détaillée par fichier\n\n`;
  
  analysisResults.forEach(result => {
    const fileName = path.basename(result.filePath);
    const duration = result.stats.endTime && result.stats.startTime ? 
      ((result.stats.endTime - result.stats.startTime) / 1000 / 60).toFixed(2) : 
      'N/A';
    
    report += `### ${fileName}\n\n`;
    report += `- **Durée**: ${duration} minutes\n`;
    report += `- **Lignes totales**: ${result.stats.totalLines}\n`;
    report += `- **Erreurs**: ${result.errors.length}\n`;
    report += `- **Avertissements**: ${result.warnings.length}\n\n`;
    
    if (result.errors.length > 0) {
      report += `#### Erreurs\n\n`;
      result.errors.slice(0, 10).forEach(error => {
        report += `- Ligne ${error.line} (${error.type}): ${error.text.substring(0, 100)}...\n`;
      });
      
      if (result.errors.length > 10) {
        report += `- ... et ${result.errors.length - 10} autres erreurs\n`;
      }
      
      report += `\n`;
    }
  });
  
  // Recommandations
  report += `## Recommandations\n\n`;
  
  // Déterminer les recommandations basées sur les erreurs les plus fréquentes
  if (sortedErrorTypes.length > 0) {
    const topError = sortedErrorTypes[0];
    
    if (topError.type === 'protection') {
      report += `1. **Utiliser le service relais Render**: La majorité des erreurs sont liées à des protections anti-bot. Le service relais Render est spécialement conçu pour contourner ces protections.\n\n`;
      report += `2. **Mettre à jour les sélecteurs**: Certains sélecteurs semblent ne plus fonctionner, ce qui suggère que les sites cibles ont été mis à jour.\n\n`;
    } else if (topError.type === 'timeout' || topError.type === 'network') {
      report += `1. **Augmenter les timeouts**: De nombreuses erreurs sont liées à des timeouts. Augmenter les valeurs de timeout pourrait aider.\n\n`;
      report += `2. **Implémenter un mécanisme de retry**: Ajouter des tentatives automatiques en cas d'échec réseau.\n\n`;
      report += `3. **Utiliser le service relais Render**: Ce service dispose d'une meilleure connectivité et stabilité.\n\n`;
    } else if (topError.type === 'selector' || topError.type === 'data') {
      report += `1. **Mettre à jour les sélecteurs**: Les sites cibles ont probablement modifié leur structure HTML.\n\n`;
      report += `2. **Ajouter plus de vérifications**: Vérifier l'existence des éléments avant d'essayer d'y accéder.\n\n`;
      report += `3. **Utiliser des sélecteurs plus robustes**: Préférer des sélecteurs basés sur des attributs data-* plutôt que des classes qui changent souvent.\n\n`;
    }
  }
  
  report += `### Recommandation générale\n\n`;
  report += `Basé sur l'analyse des logs, nous recommandons d'utiliser principalement le service relais Render pour le scraping, avec un fallback vers TMDB pour l'enrichissement des données. Cette approche hybride devrait améliorer significativement la fiabilité du pipeline de scraping.\n\n`;
  
  return report;
}

// Fonction principale
async function analyzeWorkflowLogs() {
  console.log('🔍 Analyse des logs de workflow GitHub Actions');
  console.log('================================================================================');
  
  try {
    // Télécharger les logs récents si possible
    await downloadWorkflowLogs();
    
    // Trouver tous les fichiers de log à analyser
    const logFiles = [];
    
    // Chercher dans le dossier principal
    const dirFiles = fs.readdirSync(LOG_DIR);
    dirFiles.forEach(file => {
      if (file.endsWith('.log')) {
        logFiles.push(path.join(LOG_DIR, file));
      }
    });
    
    // Chercher dans les sous-dossiers d'exécution
    const runDirs = dirFiles.filter(file => file.startsWith('run-'));
    runDirs.forEach(runDir => {
      const runPath = path.join(LOG_DIR, runDir);
      if (fs.statSync(runPath).isDirectory()) {
        const runFiles = fs.readdirSync(runPath);
        runFiles.forEach(file => {
          if (file.includes('scraping') && file.endsWith('.txt')) {
            logFiles.push(path.join(runPath, file));
          }
        });
      }
    });
    
    // Si aucun fichier n'est trouvé, créer un exemple
    if (logFiles.length === 0) {
      console.log('⚠️ Aucun fichier de log trouvé, création d\'un exemple...');
      
      const exampleLogDir = path.join(LOG_DIR, 'example');
      fs.ensureDirSync(exampleLogDir);
      
      const exampleLogFile = path.join(exampleLogDir, 'example-workflow.log');
      fs.writeFileSync(exampleLogFile, `
[2023-05-01T12:00:00.000Z] 🔍 Démarrage du scraping...
[2023-05-01T12:00:01.000Z] Source: allocine-films
[2023-05-01T12:00:10.000Z] ⚠️ Warning: Slow response from server
[2023-05-01T12:00:20.000Z] ❌ Error: Navigation timeout of 30000 ms exceeded
[2023-05-01T12:00:21.000Z] Source: allocine-series
[2023-05-01T12:00:30.000Z] Récupéré 5 éléments pour allocine-series
[2023-05-01T12:00:31.000Z] Source: senscritique-films
[2023-05-01T12:00:40.000Z] ❌ Error: waiting for selector \`.sc-e24fcf0d-5\` failed: timeout 30000ms exceeded
[2023-05-01T12:00:41.000Z] Source: tmdb-films
[2023-05-01T12:00:50.000Z] Récupéré 20 éléments pour tmdb-films
[2023-05-01T12:01:00.000Z] ✅ Scraping terminé avec succès
      `);
      
      logFiles.push(exampleLogFile);
    }
    
    console.log(`📋 Analyse de ${logFiles.length} fichiers de log...`);
    
    // Analyser chaque fichier de log
    const analysisResults = [];
    for (const logFile of logFiles) {
      const result = await analyzeLogFile(logFile);
      analysisResults.push(result);
    }
    
    // Générer le rapport d'analyse
    const report = generateAnalysisReport(analysisResults);
    fs.writeFileSync(ANALYSIS_FILE, report);
    
    console.log(`✅ Rapport d'analyse généré: ${ANALYSIS_FILE}`);
    console.log('================================================================================');
    
    return true;
  } catch (error) {
    console.error(`❌ Erreur lors de l'analyse des logs: ${error.message}`);
    return false;
  }
}

// Exécution de la fonction principale
analyzeWorkflowLogs().catch(error => {
  console.error(`❌ Erreur fatale: ${error.message}`);
  process.exit(1);
});
