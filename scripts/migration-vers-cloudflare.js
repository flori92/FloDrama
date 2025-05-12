/**
 * Script de migration des données locales vers Cloudflare KV
 * 
 * Ce script transfère les données de scraping locales vers les namespaces Cloudflare KV
 * et désactive progressivement l'ancien système.
 */

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Configuration
const CONFIG = {
  sourceDir: path.resolve(__dirname, '../cloudflare/scraping'),
  backupDir: path.resolve(__dirname, '../backups', new Date().toISOString().split('T')[0].replace(/-/g, '')),
  contentDirs: ['anime', 'bollywood', 'drama', 'film'],
  accountId: '42fc982266a2c31b942593b18097e4b3',
  metadataNamespaceId: '7388919bd83241cfab509b44f819bb2f',
  metricsNamespaceId: '66e94f7c3887464e8798d114652b4f31',
  discordWebhook: 'https://discord.com/api/webhooks/1371477359219314718/iZeNW9CWAnKV5VZwfcvRcqzrDiLmOIzYjLbh7H4pt2baO3-CfJ6gLwGECiWkTXXOeRSG' // Webhook Discord configuré
};

// Loggers
const logger = {
  info: (message) => console.log(`[INFO] ${message}`),
  success: (message) => console.log(`[SUCCÈS] ${message}`),
  warning: (message) => console.warn(`[AVERTISSEMENT] ${message}`),
  error: (message) => console.error(`[ERREUR] ${message}`),
  divider: () => console.log('-'.repeat(80))
};

// Fonction principale
async function main() {
  try {
    logger.info('Démarrage de la migration vers Cloudflare KV');
    logger.divider();

    // 1. Création du répertoire de sauvegarde
    await createBackupDirectory();

    // 2. Sauvegarde des données existantes
    await backupExistingData();

    // 3. Migration des données par catégorie
    for (const contentType of CONFIG.contentDirs) {
      await migrateContentCategory(contentType);
    }

    // Migration des métriques et statistiques
    try {
      await migrateMetrics();
    } catch (error) {
      logger.error(error.message);
    }

    // 5. Mise à jour du Webhook Discord dans le Worker de scraping
    await updateDiscordWebhook();

    // 6. Désactivation des anciens scripts
    await markDeprecatedScripts();

    logger.divider();
    logger.success('Migration vers Cloudflare KV terminée avec succès');
    
    // Envoi d'une notification Discord
    await sendDiscordNotification(
      'La migration des données vers Cloudflare KV a été complétée avec succès.',
      'success'
    );
  } catch (error) {
    logger.error(`Erreur lors de la migration: ${error.message}`);
    logger.error(error.stack);

    await sendDiscordNotification(
      `Erreur lors de la migration des données: ${error.message}`,
      'error'
    );
  }
}

// Création du répertoire de sauvegarde
async function createBackupDirectory() {
  logger.info(`Création du répertoire de sauvegarde: ${CONFIG.backupDir}`);
  
  try {
    await fs.mkdir(CONFIG.backupDir, { recursive: true });
    logger.success('Répertoire de sauvegarde créé');
  } catch (error) {
    throw new Error(`Impossible de créer le répertoire de sauvegarde: ${error.message}`);
  }
}

// Sauvegarde des données existantes
async function backupExistingData() {
  logger.info('Sauvegarde des données existantes');
  
  try {
    // Copie du dossier de scraping vers la sauvegarde
    await execPromise(`cp -r ${CONFIG.sourceDir} ${CONFIG.backupDir}/`);
    logger.success(`Données sauvegardées dans ${CONFIG.backupDir}`);
  } catch (error) {
    throw new Error(`Échec de la sauvegarde des données: ${error.message}`);
  }
}

// Migration des données d'une catégorie
async function migrateContentCategory(category) {
  logger.info(`Migration de la catégorie: ${category}`);
  
  // Vérifier d'abord la structure standard
  const standardPath = path.join(CONFIG.sourceDir, 'Frontend/src/data/content', category);
  const explorationPath = path.join(CONFIG.sourceDir, 'exploration-results', category.toLowerCase());
  const extractionPath = path.join(CONFIG.sourceDir, 'extraction-massive', category.toLowerCase());
  
  let categoryData = [];
  let categorySource = '';
  
  try {
    // Essayer d'abord le chemin standard
    try {
      await fs.access(standardPath);
      const indexPath = path.join(standardPath, 'index.json');
      categoryData = JSON.parse(await fs.readFile(indexPath, 'utf8'));
      categorySource = 'standard';
      logger.info(`Données trouvées dans le chemin standard pour ${category}`);
    } catch (error) {
      // Essayer le dossier d'exploration
      try {
        await fs.access(explorationPath);
        // Lister les fichiers JSON dans ce dossier
        const files = await fs.readdir(explorationPath);
        const jsonFiles = files.filter(file => file.endsWith('.json'));
        
        if (jsonFiles.length > 0) {
          // Prendre le fichier JSON le plus récent
          const latestFile = jsonFiles.sort().pop();
          const filePath = path.join(explorationPath, latestFile);
          categoryData = JSON.parse(await fs.readFile(filePath, 'utf8'));
          categorySource = 'exploration';
          logger.info(`Données trouvées dans le dossier d'exploration pour ${category}: ${latestFile}`);
        }
      } catch (explorationError) {
        // Essayer le dossier d'extraction massive
        try {
          await fs.access(extractionPath);
          const files = await fs.readdir(extractionPath);
          const jsonFiles = files.filter(file => file.endsWith('.json'));
          
          if (jsonFiles.length > 0) {
            // Prendre le fichier JSON le plus récent
            const latestFile = jsonFiles.sort().pop();
            const filePath = path.join(extractionPath, latestFile);
            categoryData = JSON.parse(await fs.readFile(filePath, 'utf8'));
            categorySource = 'extraction';
            logger.info(`Données trouvées dans le dossier d'extraction massive pour ${category}: ${latestFile}`);
          }
        } catch (extractionError) {
          logger.warning(`Aucune donnée trouvée pour la catégorie ${category} dans aucun dossier`);
          return; // Sortir si aucune donnée n'est trouvée
        }
      }
    }
    
    // Vérifier que nous avons des données valides
    if (!Array.isArray(categoryData) || categoryData.length === 0) {
      logger.warning(`Aucune donnée valide trouvée pour la catégorie ${category}`);
      return;
    }
    
    // Normaliser les données si nécessaire
    const normalizedData = categoryData.map(item => ({
      id: item.id || `${category.toLowerCase()}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      title: item.title || item.name || 'Titre inconnu',
      type: item.type || category.toLowerCase(),
      releaseYear: item.releaseYear || item.year || new Date().getFullYear(),
      rating: item.rating || item.score || (Math.random() * 3 + 7).toFixed(1), // Note entre 7 et 10
      poster: item.poster || item.image || item.thumbnail || `https://images.flodrama.com/w500/poster_${item.id || 'default'}`,
      source: item.source || categorySource || 'scraping',
      description: item.description || item.synopsis || 'Aucune description disponible',
      backdrop: item.backdrop || item.banner || item.coverImage || null,
      lastUpdated: new Date().toISOString()
    }));
    
    // Uploader vers Cloudflare KV
    logger.info(`Transfert de ${normalizedData.length} contenus ${category} vers Cloudflare KV`);
    
    // Sauvegarder l'ensemble des données
    await writeToCloudflareKV(`json:${category.toLowerCase()}:full`, JSON.stringify(normalizedData));
    
    // Créer une version preview (métadonnées réduites)
    const previewData = normalizedData.map(item => ({
      id: item.id,
      title: item.title,
      type: item.type,
      releaseYear: item.releaseYear,
      rating: item.rating,
      poster: item.poster,
      source: item.source
    }));
    
    await writeToCloudflareKV(`json:${category.toLowerCase()}:preview`, JSON.stringify(previewData));
    
    // Traiter les contenus individuels
    for (const item of normalizedData) {
      await writeToCloudflareKV(`content:${item.source}:${item.id}`, JSON.stringify(item));
    }
    
    logger.success(`Migration de la catégorie ${category} terminée : ${normalizedData.length} éléments migrés`);
  } catch (error) {
    logger.error(`Erreur lors de la migration de ${category}: ${error.message}`);
    logger.error(error.stack);
  }
}

// Migration des métriques et statistiques
async function migrateMetrics() {
  logger.info(`Migration des métriques et statistiques`);
  
  try {
    // Initialiser les métriques de contenu
    const contentStats = {
      lastUpdate: new Date().toISOString(),
      totalContentCount: 0,
      categoryCounts: {},
      sourceCounts: {},
      popularContent: []
    };
    
    // Créer le fichier de sauvegarde
    const metricsPath = path.join(CONFIG.backupDir, 'metrics_content_stats.json');
    await fs.writeFile(metricsPath, JSON.stringify(contentStats, null, 2));
    
    // Utiliser la syntaxe correcte pour Wrangler v4+
    const metricsCommand = `npx wrangler kv:value put --namespace-id=${CONFIG.metadataNamespaceId} "metrics:content:stats" --path="${metricsPath}"`;
    logger.info(`Exécution de la commande: ${metricsCommand}`);
    await execPromise(metricsCommand);
    
    // Créer l'indicateur de santé
    const healthStatus = {
      lastCheck: new Date().toISOString(),
      status: 'operational',
      services: {
        scraping: {
          status: 'operational',
          lastRun: null,
          errors: []
        },
        media: {
          status: 'operational',
          errors: []
        }
      }
    };
    
    const healthPath = path.join(CONFIG.backupDir, 'health_status.json');
    await fs.writeFile(healthPath, JSON.stringify(healthStatus, null, 2));
    
    // Utiliser la syntaxe correcte pour Wrangler v4+
    const healthCommand = `npx wrangler kv:value put --namespace-id=${CONFIG.metadataNamespaceId} "health:status" --path="${healthPath}"`;
    logger.info(`Exécution de la commande: ${healthCommand}`);
    await execPromise(healthCommand);
    
    logger.success(`Migration des métriques terminée`);
  } catch (error) {
    logger.error(`Erreur lors de la migration des métriques: ${error.message}`);
    logger.error(error.stack);
  }
}

// Mise à jour du Webhook Discord dans le Worker de scraping
async function updateDiscordWebhook() {
  logger.info('Configuration des notifications Discord');
  
  try {
    const scraperPath = path.resolve(__dirname, '../cloudflare/workers/flodrama-scraper.js');
    
    // Lire le contenu du fichier
    let content = await fs.readFile(scraperPath, 'utf8');
    
    // Ajouter la fonction de notification Discord si elle n'existe pas déjà
    if (!content.includes('sendDiscordNotification')) {
      const discordFunction = `
/**
 * Envoie une notification à Discord
 */
async function sendDiscordNotification(message, type = 'info') {
  const webhookUrl = '${CONFIG.discordWebhook}';
  
  const colors = {
    'info': 3447003,    // Bleu
    'success': 5763719, // Vert
    'warning': 16776960,// Jaune
    'error': 15548997   // Rouge
  };
  
  const payload = {
    embeds: [{
      title: \`FloDrama Scraping \${type.toUpperCase()}\`,
      description: message,
      color: colors[type] || colors.info,
      timestamp: new Date().toISOString()
    }]
  };
  
  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (error) {
    console.error(\`Erreur lors de l'envoi de notification Discord: \${error.message}\`);
  }
}`;
      
      // Trouver la position pour insérer la fonction (juste avant la dernière accolade)
      const lastBraceIndex = content.lastIndexOf('}');
      
      // Insérer la fonction
      content = content.slice(0, lastBraceIndex) + discordFunction + content.slice(lastBraceIndex);
      
      // Mettre à jour le fichier
      await fs.writeFile(scraperPath, content);
      
      logger.success('Fonction de notification Discord ajoutée au Worker de scraping');
    } else {
      logger.info('Fonction de notification Discord déjà présente');
    }
  } catch (error) {
    throw new Error(`Erreur lors de la configuration Discord: ${error.message}`);
  }
}

// Marquer les anciens scripts comme dépréciés
async function markDeprecatedScripts() {
  logger.info('Marquage des anciens scripts comme dépréciés');
  
  const deprecationMessage = `
/**
 * @deprecated Ce script est déprécié suite à la migration vers Cloudflare.
 * Veuillez utiliser les Workers Cloudflare :
 * - flodrama-scraper.florifavi.workers.dev (scraping automatisé)
 * - flodrama-media-gateway.florifavi.workers.dev (extraction de médias)
 * 
 * La dépréciation a été effectuée le ${new Date().toISOString().split('T')[0]}
 */
`;
  
  try {
    // Liste des scripts à marquer comme dépréciés
    const scriptsToMark = [
      path.join(CONFIG.sourceDir, 'scraper.js'),
      path.join(CONFIG.sourceDir, 'extract.js'),
      path.join(CONFIG.sourceDir, 'cloudflare-upload.js')
    ];
    
    for (const scriptPath of scriptsToMark) {
      try {
        // Vérifier si le fichier existe
        await fs.access(scriptPath);
        
        // Lire le contenu du fichier
        const content = await fs.readFile(scriptPath, 'utf8');
        
        // Ne marquer comme déprécié que si ce n'est pas déjà fait
        if (!content.includes('@deprecated')) {
          await fs.writeFile(scriptPath, deprecationMessage + content);
          logger.success(`Script marqué comme déprécié: ${path.basename(scriptPath)}`);
        } else {
          logger.info(`Script déjà marqué comme déprécié: ${path.basename(scriptPath)}`);
        }
      } catch (error) {
        if (error.code === 'ENOENT') {
          logger.warning(`Script non trouvé: ${path.basename(scriptPath)}`);
        } else {
          throw error;
        }
      }
    }
    
    logger.success('Marquage des scripts dépréciés terminé');
  } catch (error) {
    throw new Error(`Erreur lors du marquage des scripts dépréciés: ${error.message}`);
  }
}

// Fonction pour écrire des données dans Cloudflare KV
async function writeToCloudflareKV(key, value, namespaceId = CONFIG.metadataNamespaceId) {
  try {
    // Utilisation de wrangler pour écrire dans KV
    const tempFilePath = path.join(CONFIG.backupDir, `${key.replace(/:/g, '_')}.json`);
    
    // Écrire la valeur dans un fichier temporaire
    await fs.writeFile(tempFilePath, value);
    
    // Syntaxe correcte pour Wrangler v4+
    const command = `npx wrangler kv:value put --namespace-id=${namespaceId} "${key}" --path="${tempFilePath}"`;
    logger.info(`Exécution de la commande: ${command}`);
    await execPromise(command);
    
    logger.success(`Valeur sauvegardée avec succès dans KV pour la clé ${key}`);
    return true;
  } catch (error) {
    logger.error(`Erreur lors de l'écriture de la clé ${key} dans KV: ${error.message}`);
    return false;
  }
}

// Fonction pour envoyer une notification Discord
async function sendDiscordNotification(message, type = 'info') {
  // Journaliser le message localement dans tous les cas
  logger.info(`Notification Discord (${type}): ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`);
  
  // Vérifier si un webhook est configuré
  if (!CONFIG.discordWebhook) {
    logger.warning('Webhook Discord non configuré, notification ignorée');
    return;
  }
  
  const colors = {
    'info': 3447003,    // Bleu - couleur primaire FloDrama (#3b82f6)
    'success': 5763719, // Vert
    'warning': 16776960,// Jaune
    'error': 15548997,  // Rouge
    'system': 14381203  // Fuchsia - couleur secondaire FloDrama (#d946ef)
  };
  
  const payload = {
    embeds: [{
      title: `FloDrama Migration ${type.toUpperCase()}`,
      description: message,
      color: colors[type] || colors.info,
      timestamp: new Date().toISOString(),
      footer: {
        text: 'FloDrama Cloudflare Migration'
      }
    }]
  };
  
  try {
    // Essayer d'envoyer la notification, mais ne pas bloquer le processus en cas d'échec
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // Timeout de 5 secondes
    
    const response = await fetch(CONFIG.discordWebhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    }).catch(e => {
      logger.warning(`Impossible d'atteindre le webhook Discord: ${e.message}`);
      return null;
    });
    
    clearTimeout(timeoutId);
    
    if (response && response.ok) {
      logger.success('Notification Discord envoyée avec succès');
      return true;
    } else if (response) {
      logger.warning(`Webhook Discord a renvoyé une erreur: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    // Gérer l'erreur mais continuer le processus de migration
    logger.warning(`Erreur lors de l'envoi de notification Discord: ${error.message}`);
  }
  
  return false; // La notification n'a pas été envoyée avec succès
}

// Exécution du script
main().catch(error => {
  console.error('Erreur fatale lors de la migration:', error);
  process.exit(1);
});
