/**
 * Analyse des résultats de scraping FloDrama
 * 
 * Ce script analyse les résultats du scraping et génère un rapport détaillé
 * sur le nombre d'éléments récupérés par source, les catégories, etc.
 * 
 * @author FloDrama Team
 * @version 1.0.0
 */

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

// Configuration
const OUTPUT_DIR = path.join(__dirname, 'output');
const RELAY_OUTPUT_DIR = path.join(__dirname, 'relay-output');
const REPORT_DIR = path.join(__dirname, 'reports');

// Créer le dossier de rapports s'il n'existe pas
fs.ensureDirSync(REPORT_DIR);

/**
 * Analyse les fichiers JSON de sortie et génère un rapport
 */
function analyzeScrapingResults() {
  console.log(chalk.blue('🔍 Analyse des résultats de scraping...'));
  
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalItems: 0,
      categoryCounts: {},
      sourceCounts: {}
    },
    categories: {},
    sources: {}
  };
  
  // Analyser le fichier global.json
  const globalPath = path.join(OUTPUT_DIR, 'global.json');
  if (fs.existsSync(globalPath)) {
    const globalData = fs.readJsonSync(globalPath);
    report.summary.totalItems = globalData.length;
    
    // Compter par catégorie
    globalData.forEach(item => {
      const category = item.type || 'unknown';
      report.summary.categoryCounts[category] = (report.summary.categoryCounts[category] || 0) + 1;
      
      const source = item.source || 'unknown';
      report.summary.sourceCounts[source] = (report.summary.sourceCounts[source] || 0) + 1;
      
      // Détails par catégorie
      if (!report.categories[category]) {
        report.categories[category] = { count: 0, sources: {} };
      }
      report.categories[category].count++;
      report.categories[category].sources[source] = (report.categories[category].sources[source] || 0) + 1;
      
      // Détails par source
      if (!report.sources[source]) {
        report.sources[source] = { count: 0, categories: {} };
      }
      report.sources[source].count++;
      report.sources[source].categories[category] = (report.sources[source].categories[category] || 0) + 1;
    });
  } else {
    console.log(chalk.yellow('⚠️ Fichier global.json non trouvé'));
  }
  
  // Analyser les fichiers par catégorie
  const categoryFiles = ['drama.json', 'anime.json', 'film.json', 'bollywood.json'];
  categoryFiles.forEach(file => {
    const filePath = path.join(OUTPUT_DIR, file);
    if (fs.existsSync(filePath)) {
      const category = file.replace('.json', '');
      const data = fs.readJsonSync(filePath);
      
      if (!report.categories[category]) {
        report.categories[category] = { count: data.length, sources: {} };
      } else {
        report.categories[category].count = data.length;
      }
      
      // Compter par source dans cette catégorie
      data.forEach(item => {
        const source = item.source || 'unknown';
        report.categories[category].sources[source] = (report.categories[category].sources[source] || 0) + 1;
      });
    }
  });
  
  // Analyser les fichiers de sortie du relais
  if (fs.existsSync(RELAY_OUTPUT_DIR)) {
    const sourceDirs = fs.readdirSync(RELAY_OUTPUT_DIR).filter(dir => 
      fs.statSync(path.join(RELAY_OUTPUT_DIR, dir)).isDirectory()
    );
    
    sourceDirs.forEach(sourceDir => {
      const sourcePath = path.join(RELAY_OUTPUT_DIR, sourceDir);
      const jsonFiles = fs.readdirSync(sourcePath).filter(file => file.endsWith('.json') && !file.endsWith('-mock.json') && file !== 'config.json');
      
      jsonFiles.forEach(jsonFile => {
        const filePath = path.join(sourcePath, jsonFile);
        try {
          const data = fs.readJsonSync(filePath);
          if (Array.isArray(data)) {
            if (!report.sources[sourceDir]) {
              report.sources[sourceDir] = { count: data.length, categories: {}, relayCount: data.length };
            } else {
              report.sources[sourceDir].relayCount = data.length;
            }
          }
        } catch (error) {
          console.log(chalk.red(`❌ Erreur lors de la lecture de ${filePath}: ${error.message}`));
        }
      });
    });
  }
  
  // Générer des statistiques et recommandations
  report.recommendations = [];
  
  // Identifier les sources avec peu d'éléments
  const lowItemSources = Object.entries(report.sources)
    .filter(([_, data]) => data.count < 200)
    .sort(([_, a], [__, b]) => a.count - b.count);
  
  if (lowItemSources.length > 0) {
    report.recommendations.push({
      type: 'low_items',
      title: 'Sources avec peu d\'éléments',
      description: 'Ces sources ont moins de 200 éléments et devraient être optimisées',
      items: lowItemSources.map(([source, data]) => ({
        source,
        count: data.count,
        suggestion: 'Ajouter plus d\'URLs ou améliorer les sélecteurs CSS'
      }))
    });
  }
  
  // Identifier les catégories déséquilibrées
  const categoryBalance = Object.entries(report.categories)
    .map(([category, data]) => ({ category, count: data.count }))
    .sort((a, b) => a.count - b.count);
  
  if (categoryBalance.length > 1 && 
      categoryBalance[0].count < categoryBalance[categoryBalance.length - 1].count / 3) {
    report.recommendations.push({
      type: 'category_imbalance',
      title: 'Déséquilibre entre catégories',
      description: 'Certaines catégories ont beaucoup moins d\'éléments que d\'autres',
      items: categoryBalance.map(item => ({
        category: item.category,
        count: item.count,
        suggestion: item.count < 500 ? 'Ajouter plus de sources pour cette catégorie' : 'Équilibre satisfaisant'
      }))
    });
  }
  
  // Sauvegarder le rapport
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const reportPath = path.join(REPORT_DIR, `scraping-report-${timestamp}.json`);
  fs.writeJsonSync(reportPath, report, { spaces: 2 });
  
  // Créer un rapport de synthèse en format texte
  const summaryPath = path.join(REPORT_DIR, `scraping-summary-${timestamp}.txt`);
  let summaryText = `RAPPORT DE SCRAPING FLODRAMA - ${new Date().toLocaleString('fr-FR')}\n`;
  summaryText += `=================================================================\n\n`;
  
  summaryText += `RÉSUMÉ GLOBAL:\n`;
  summaryText += `- Total d'éléments: ${report.summary.totalItems}\n`;
  summaryText += `- Nombre de sources: ${Object.keys(report.sources).length}\n\n`;
  
  summaryText += `RÉPARTITION PAR CATÉGORIE:\n`;
  Object.entries(report.summary.categoryCounts).forEach(([category, count]) => {
    summaryText += `- ${category}: ${count} éléments (${Math.round(count/report.summary.totalItems*100)}%)\n`;
  });
  summaryText += `\n`;
  
  summaryText += `TOP 5 SOURCES:\n`;
  const topSources = Object.entries(report.sources)
    .sort(([_, a], [__, b]) => b.count - a.count)
    .slice(0, 5);
  
  topSources.forEach(([source, data], index) => {
    summaryText += `${index + 1}. ${source}: ${data.count} éléments\n`;
  });
  summaryText += `\n`;
  
  summaryText += `RECOMMANDATIONS:\n`;
  report.recommendations.forEach(rec => {
    summaryText += `${rec.title}:\n`;
    summaryText += `${rec.description}\n`;
    rec.items.forEach(item => {
      if (item.source) {
        summaryText += `- ${item.source}: ${item.count} éléments - ${item.suggestion}\n`;
      } else if (item.category) {
        summaryText += `- ${item.category}: ${item.count} éléments - ${item.suggestion}\n`;
      }
    });
    summaryText += `\n`;
  });
  
  fs.writeFileSync(summaryPath, summaryText);
  
  // Afficher un résumé dans la console
  console.log(chalk.green(`\n✅ Rapport d'analyse sauvegardé dans ${reportPath}`));
  console.log(chalk.green(`✅ Résumé sauvegardé dans ${summaryPath}`));
  
  // Afficher les statistiques clés
  console.log(chalk.yellow('\n📊 STATISTIQUES CLÉS:'));
  console.log(`Total d'éléments: ${chalk.bold(report.summary.totalItems)}`);
  
  console.log(chalk.yellow('\n📊 RÉPARTITION PAR CATÉGORIE:'));
  Object.entries(report.summary.categoryCounts)
    .sort(([_, a], [__, b]) => b - a)
    .forEach(([category, count]) => {
      const percentage = Math.round(count/report.summary.totalItems*100);
      const bar = '█'.repeat(Math.floor(percentage/5));
      console.log(`${category}: ${chalk.bold(count)} (${percentage}%) ${chalk.blue(bar)}`);
    });
  
  return report;
}

/**
 * Fonction principale
 */
function main() {
  try {
    console.log(chalk.blue('🚀 Démarrage de l\'analyse des résultats de scraping...'));
    
    // Vérifier que les dossiers existent
    if (!fs.existsSync(OUTPUT_DIR)) {
      console.log(chalk.red(`❌ Le dossier de sortie ${OUTPUT_DIR} n'existe pas`));
      return;
    }
    
    // Analyser les résultats
    const report = analyzeScrapingResults();
    
    // Afficher les recommandations
    if (report.recommendations.length > 0) {
      console.log(chalk.yellow('\n💡 RECOMMANDATIONS:'));
      report.recommendations.forEach(rec => {
        console.log(chalk.bold(`\n${rec.title}:`));
        console.log(`${rec.description}`);
        rec.items.forEach(item => {
          if (item.source) {
            console.log(`- ${chalk.cyan(item.source)}: ${item.count} éléments - ${chalk.italic(item.suggestion)}`);
          } else if (item.category) {
            console.log(`- ${chalk.cyan(item.category)}: ${item.count} éléments - ${chalk.italic(item.suggestion)}`);
          }
        });
      });
    }
    
    console.log(chalk.green('\n✅ Analyse terminée'));
    
  } catch (error) {
    console.error(chalk.red(`❌ Erreur: ${error.message}`));
    console.error(error);
  }
}

// Exécuter le script
main();
