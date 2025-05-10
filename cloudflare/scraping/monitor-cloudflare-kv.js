/**
 * Script de monitoring des données Cloudflare KV
 * 
 * Ce script vérifie l'état des données dans Cloudflare KV, leur fraîcheur,
 * et génère un rapport de santé.
 * 
 * @author FloDrama Team
 * @version 1.0.0
 */

const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const { execSync } = require('child_process');

// Configuration
const CLOUDFLARE_ACCOUNT_ID = '42fc982266a2c31b942593b18097e4b3';
const CLOUDFLARE_NAMESPACE_ID = '7388919bd83241cfab509b44f819bb2f';
const CLOUDFLARE_API_TOKEN = 'E7aPZRNN-u--0TI0BE237AP9zL79kF7gQinJnh0M';
const REPORT_DIR = path.join(__dirname, 'kv-reports');
// Webhook Discord de GitHub pour les alertes de monitoring
const WEBHOOK_URL = 'https://discord.com/api/webhooks/1234567890/abcdefghijklmnopqrstuvwxyz'; // Remplacer par l'URL réelle du webhook Discord de GitHub

// Créer le dossier de rapports s'il n'existe pas
fs.ensureDirSync(REPORT_DIR);

// Liste des clés KV à surveiller
const KEYS_TO_MONITOR = [
  'anime',
  'anime-index',
  'bollywood',
  'bollywood-index',
  'drama',
  'drama-index',
  'film',
  'film-index',
  'global',
  'global-index',
  'mydramalist',
  'nekosama',
  'streamingdivx',
  'voiranime',
  'voirdrama',
  'bollystream'
];

// Seuils de fraîcheur des données (en jours)
const FRESHNESS_THRESHOLDS = {
  WARNING: 30, // Avertissement si les données ont plus de 30 jours
  CRITICAL: 60 // Critique si les données ont plus de 60 jours
};

// Seuils de taille des données (en octets)
const SIZE_THRESHOLDS = {
  WARNING: 512, // Avertissement si les données sont inférieures à 512 octets
  CRITICAL: 50 // Critique si les données sont inférieures à 50 octets
};

// Seuils de nombre d'éléments
const ITEM_COUNT_THRESHOLDS = {
  WARNING: 5, // Avertissement si moins de 5 éléments
  CRITICAL: 0 // Critique si aucun élément
};

/**
 * Fonction pour formater la taille des fichiers
 */
function formatFileSize(bytes) {
  if (bytes < 1024) {
    return bytes + ' bytes';
  } else if (bytes < 1048576) {
    return (bytes / 1024).toFixed(2) + ' KB';
  } else {
    return (bytes / 1048576).toFixed(2) + ' MB';
  }
}

/**
 * Fonction pour obtenir la liste des clés KV
 */
async function listKvKeys() {
  try {
    const response = await axios({
      method: 'get',
      url: `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/storage/kv/namespaces/${CLOUDFLARE_NAMESPACE_ID}/keys`,
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data.success) {
      return response.data.result;
    } else {
      console.error(`❌ Erreur lors de la récupération des clés KV: ${JSON.stringify(response.data.errors)}`);
      return [];
    }
  } catch (error) {
    console.error(`❌ Erreur lors de la récupération des clés KV: ${error.message}`);
    if (error.response) {
      console.error(`  Détails: ${JSON.stringify(error.response.data)}`);
    }
    return [];
  }
}

/**
 * Fonction pour obtenir la valeur d'une clé KV
 */
async function getKvValue(key) {
  try {
    const response = await axios({
      method: 'get',
      url: `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/storage/kv/namespaces/${CLOUDFLARE_NAMESPACE_ID}/values/${key}`,
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error(`❌ Erreur lors de la récupération de la valeur de la clé ${key}: ${error.message}`);
    if (error.response) {
      console.error(`  Détails: ${JSON.stringify(error.response.data)}`);
    }
    return null;
  }
}

/**
 * Fonction pour obtenir les métadonnées d'une clé KV
 */
async function getKvMetadata(key) {
  try {
    const response = await axios({
      method: 'get',
      url: `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/storage/kv/namespaces/${CLOUDFLARE_NAMESPACE_ID}/metadata/${key}`,
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data.success) {
      return response.data.result;
    } else {
      console.error(`❌ Erreur lors de la récupération des métadonnées de la clé ${key}: ${JSON.stringify(response.data.errors)}`);
      return null;
    }
  } catch (error) {
    console.error(`❌ Erreur lors de la récupération des métadonnées de la clé ${key}: ${error.message}`);
    if (error.response) {
      console.error(`  Détails: ${JSON.stringify(error.response.data)}`);
    }
    return null;
  }
}

/**
 * Fonction pour analyser la santé d'une clé KV
 */
async function analyzeKeyHealth(key) {
  console.log(`🔍 Analyse de la santé de la clé ${key}...`);
  
  const report = {
    key,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    issues: [],
    warnings: [],
    metadata: null,
    value: null,
    size: 0,
    itemCount: 0,
    lastModified: null
  };
  
  // Récupérer les métadonnées de la clé
  const metadata = await getKvMetadata(key);
  if (metadata) {
    report.metadata = metadata;
    report.size = metadata.size || 0;
    report.lastModified = new Date(metadata.last_modified_ts * 1000);
    
    // Vérifier la fraîcheur des données
    const ageInDays = (Date.now() - report.lastModified) / (1000 * 60 * 60 * 24);
    if (ageInDays > FRESHNESS_THRESHOLDS.CRITICAL) {
      report.issues.push(`Données trop anciennes (${Math.round(ageInDays)} jours)`);
      report.status = 'critical';
    } else if (ageInDays > FRESHNESS_THRESHOLDS.WARNING) {
      report.warnings.push(`Données anciennes (${Math.round(ageInDays)} jours)`);
      if (report.status === 'healthy') {
        report.status = 'warning';
      }
    }
    
    // Vérifier la taille des données
    if (report.size < SIZE_THRESHOLDS.CRITICAL) {
      report.issues.push(`Taille des données critique (${formatFileSize(report.size)})`);
      report.status = 'critical';
    } else if (report.size < SIZE_THRESHOLDS.WARNING) {
      report.warnings.push(`Taille des données faible (${formatFileSize(report.size)})`);
      if (report.status === 'healthy') {
        report.status = 'warning';
      }
    }
  } else {
    report.issues.push('Impossible de récupérer les métadonnées');
    report.status = 'critical';
  }
  
  // Récupérer la valeur de la clé
  const value = await getKvValue(key);
  if (value) {
    try {
      // Si la valeur est un tableau JSON
      if (Array.isArray(value)) {
        report.itemCount = value.length;
        
        // Vérifier le nombre d'éléments
        if (report.itemCount < ITEM_COUNT_THRESHOLDS.CRITICAL) {
          report.issues.push(`Nombre d'éléments critique (${report.itemCount})`);
          report.status = 'critical';
        } else if (report.itemCount < ITEM_COUNT_THRESHOLDS.WARNING) {
          report.warnings.push(`Nombre d'éléments faible (${report.itemCount})`);
          if (report.status === 'healthy') {
            report.status = 'warning';
          }
        }
      } else if (typeof value === 'object') {
        // Si la valeur est un objet JSON
        report.itemCount = Object.keys(value).length;
        
        // Vérifier le nombre de propriétés
        if (report.itemCount < ITEM_COUNT_THRESHOLDS.CRITICAL) {
          report.issues.push(`Nombre de propriétés critique (${report.itemCount})`);
          report.status = 'critical';
        } else if (report.itemCount < ITEM_COUNT_THRESHOLDS.WARNING) {
          report.warnings.push(`Nombre de propriétés faible (${report.itemCount})`);
          if (report.status === 'healthy') {
            report.status = 'warning';
          }
        }
      } else {
        // Si la valeur est une chaîne ou autre
        report.itemCount = 1;
      }
    } catch (error) {
      report.issues.push(`Erreur lors de l'analyse de la valeur: ${error.message}`);
      report.status = 'critical';
    }
  } else {
    report.issues.push('Impossible de récupérer la valeur');
    report.status = 'critical';
  }
  
  return report;
}

/**
 * Fonction pour envoyer une alerte Discord
 */
async function sendDiscordAlert(report) {
  if (!WEBHOOK_URL) return;
  
  try {
    const statusEmoji = {
      healthy: '✅',
      warning: '⚠️',
      critical: '❌'
    };
    
    const embed = {
      title: `${statusEmoji[report.status]} Rapport de santé Cloudflare KV`,
      description: `Rapport généré le ${new Date().toLocaleString('fr-FR')}`,
      color: report.status === 'critical' ? 16711680 : (report.status === 'warning' ? 16776960 : 65280),
      fields: [
        {
          name: 'Statut général',
          value: `${statusEmoji[report.status]} ${report.status.toUpperCase()}`,
          inline: true
        },
        {
          name: 'Clés surveillées',
          value: `${report.keyReports.length}`,
          inline: true
        },
        {
          name: 'Problèmes critiques',
          value: `${report.criticalCount}`,
          inline: true
        }
      ]
    };
    
    // Ajouter des détails sur les clés problématiques
    const criticalKeys = report.keyReports.filter(kr => kr.status === 'critical');
    if (criticalKeys.length > 0) {
      embed.fields.push({
        name: '❌ Clés critiques',
        value: criticalKeys.map(kr => `**${kr.key}**: ${kr.issues.join(', ')}`).join('\n')
      });
    }
    
    const warningKeys = report.keyReports.filter(kr => kr.status === 'warning');
    if (warningKeys.length > 0) {
      embed.fields.push({
        name: '⚠️ Clés avec avertissements',
        value: warningKeys.map(kr => `**${kr.key}**: ${kr.warnings.join(', ')}`).join('\n')
      });
    }
    
    await axios.post(WEBHOOK_URL, {
      embeds: [embed]
    });
    
    console.log('✅ Alerte Discord envoyée avec succès');
  } catch (error) {
    console.error(`❌ Erreur lors de l'envoi de l'alerte Discord: ${error.message}`);
  }
}

/**
 * Fonction principale pour générer un rapport de santé
 */
async function generateHealthReport() {
  console.log('🏥 Génération du rapport de santé Cloudflare KV...');
  
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const keyReports = [];
  
  // Récupérer la liste des clés KV
  const keys = await listKvKeys();
  const keyNames = keys.map(k => k.name);
  
  // Vérifier si toutes les clés attendues sont présentes
  const missingKeys = KEYS_TO_MONITOR.filter(k => !keyNames.includes(k));
  if (missingKeys.length > 0) {
    console.warn(`⚠️ Clés manquantes: ${missingKeys.join(', ')}`);
  }
  
  // Analyser la santé de chaque clé
  for (const key of KEYS_TO_MONITOR) {
    if (keyNames.includes(key)) {
      const keyReport = await analyzeKeyHealth(key);
      keyReports.push(keyReport);
    } else {
      keyReports.push({
        key,
        status: 'critical',
        timestamp: new Date().toISOString(),
        issues: ['Clé manquante'],
        warnings: [],
        metadata: null,
        value: null,
        size: 0,
        itemCount: 0,
        lastModified: null
      });
    }
  }
  
  // Générer les statistiques
  const healthyCount = keyReports.filter(r => r.status === 'healthy').length;
  const warningCount = keyReports.filter(r => r.status === 'warning').length;
  const criticalCount = keyReports.filter(r => r.status === 'critical').length;
  
  // Déterminer le statut global
  let globalStatus = 'healthy';
  if (criticalCount > 0) {
    globalStatus = 'critical';
  } else if (warningCount > 0) {
    globalStatus = 'warning';
  }
  
  // Créer le rapport global
  const report = {
    timestamp,
    status: globalStatus,
    keyReports,
    healthyCount,
    warningCount,
    criticalCount,
    totalCount: keyReports.length
  };
  
  // Sauvegarder le rapport
  const reportPath = path.join(REPORT_DIR, `health-report-${timestamp}.json`);
  fs.writeJsonSync(reportPath, report, { spaces: 2 });
  
  // Créer un rapport de synthèse
  const summaryPath = path.join(REPORT_DIR, 'latest-health-summary.json');
  fs.writeJsonSync(summaryPath, {
    timestamp,
    status: globalStatus,
    healthyCount,
    warningCount,
    criticalCount,
    totalCount: keyReports.length
  }, { spaces: 2 });
  
  // Créer un rapport en texte
  const textReportPath = path.join(REPORT_DIR, `health-report-${timestamp}.txt`);
  let textReport = `RAPPORT DE SANTÉ CLOUDFLARE KV - ${new Date().toLocaleString('fr-FR')}\n`;
  textReport += `=================================================================\n\n`;
  textReport += `Statut global: ${globalStatus.toUpperCase()}\n\n`;
  textReport += `Statistiques:\n`;
  textReport += `- Total: ${keyReports.length} clés\n`;
  textReport += `- Saines: ${healthyCount} clés\n`;
  textReport += `- Avertissements: ${warningCount} clés\n`;
  textReport += `- Critiques: ${criticalCount} clés\n\n`;
  
  if (criticalCount > 0) {
    textReport += `CLÉS CRITIQUES:\n`;
    keyReports.filter(r => r.status === 'critical').forEach(r => {
      textReport += `- ${r.key}:\n`;
      textReport += `  Taille: ${formatFileSize(r.size)}\n`;
      textReport += `  Éléments: ${r.itemCount}\n`;
      textReport += `  Dernière modification: ${r.lastModified ? r.lastModified.toLocaleString('fr-FR') : 'N/A'}\n`;
      textReport += `  Problèmes: ${r.issues.join(', ')}\n\n`;
    });
  }
  
  if (warningCount > 0) {
    textReport += `CLÉS AVEC AVERTISSEMENTS:\n`;
    keyReports.filter(r => r.status === 'warning').forEach(r => {
      textReport += `- ${r.key}:\n`;
      textReport += `  Taille: ${formatFileSize(r.size)}\n`;
      textReport += `  Éléments: ${r.itemCount}\n`;
      textReport += `  Dernière modification: ${r.lastModified ? r.lastModified.toLocaleString('fr-FR') : 'N/A'}\n`;
      textReport += `  Avertissements: ${r.warnings.join(', ')}\n\n`;
    });
  }
  
  fs.writeFileSync(textReportPath, textReport);
  
  // Afficher un résumé
  console.log('\n📊 Résumé du rapport de santé:');
  console.log(`  - Statut global: ${globalStatus.toUpperCase()}`);
  console.log(`  - Total: ${keyReports.length} clés`);
  console.log(`  - Saines: ${healthyCount} clés`);
  console.log(`  - Avertissements: ${warningCount} clés`);
  console.log(`  - Critiques: ${criticalCount} clés`);
  console.log(`\n✅ Rapport sauvegardé dans ${reportPath}`);
  
  // Envoyer une alerte Discord si nécessaire
  if (globalStatus !== 'healthy' && WEBHOOK_URL) {
    await sendDiscordAlert(report);
  }
  
  return report;
}

/**
 * Fonction principale
 */
async function main() {
  try {
    console.log('🚀 Démarrage du monitoring Cloudflare KV...');
    
    // Créer le dossier de rapports s'il n'existe pas
    fs.ensureDirSync(REPORT_DIR);
    
    // Générer le rapport
    const report = await generateHealthReport();
    
    // Actions en fonction du statut
    if (report.status === 'critical') {
      console.log('\n❌ Des problèmes critiques ont été détectés !');
      console.log('   Consultez le rapport pour plus de détails.');
      
      // Lancer un scraping d'urgence si nécessaire
      if (report.criticalCount > 3) {
        console.log('\n🚨 Trop de problèmes critiques détectés. Lancement d\'un scraping d\'urgence...');
        // Décommenter pour activer le scraping d'urgence
        // execSync('cd .. && ./lancer-scraping-complet.sh', { stdio: 'inherit' });
      }
    } else if (report.status === 'warning') {
      console.log('\n⚠️ Des avertissements ont été détectés.');
      console.log('   Consultez le rapport pour plus de détails.');
    } else {
      console.log('\n✅ Toutes les clés KV sont en bonne santé !');
    }
    
    console.log('\n✅ Monitoring terminé');
    
  } catch (error) {
    console.error(`❌ Erreur: ${error.message}`);
    console.error(error);
  }
}

// Exécuter le script
main().catch(console.error);
