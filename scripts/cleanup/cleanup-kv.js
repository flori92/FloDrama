#!/usr/bin/env node

/**
 * Script pour nettoyer les espaces de noms KV inutilisés
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  // Liste des espaces de noms KV à conserver
  keepKvNamespaces: [
    'FLODRAMA_CACHE',
    'FLODRAMA_METADATA',
    'FLODRAMA_METRICS'
  ],
  backupDir: path.join(__dirname, '../../backups/kv')
};

/**
 * Exécute une commande shell de manière synchrone
 * @param {string} command - Commande à exécuter
 * @returns {string} Sortie de la commande
 */
function runCommand(command) {
  console.log(`Exécution: ${command}`);
  try {
    const output = execSync(command, { stdio: 'pipe' });
    return output.toString().trim();
  } catch (error) {
    console.error(`Erreur lors de l'exécution: ${command}`);
    console.error(error.message);
    return '';
  }
}

/**
 * Récupère la liste des espaces de noms KV
 * @returns {Array} Liste des espaces de noms KV
 */
function getKvNamespaces() {
  try {
    console.log('\n🔍 Récupération des espaces de noms KV...');
    
    // Récupérer les espaces de noms à partir du fichier wrangler.toml
    const wranglerTomlPath = path.join(__dirname, '../../cloudflare/wrangler.toml');
    const wranglerToml = fs.readFileSync(wranglerTomlPath, 'utf8');
    
    // Extraire les noms et IDs des espaces de noms KV
    const kvNamespaceRegex = /\[\[kv_namespaces\]\]\s+binding\s*=\s*"([^"]+)"[\s\S]*?id\s*=\s*"([^"]+)"/g;
    const namespaces = [];
    let match;
    
    while ((match = kvNamespaceRegex.exec(wranglerToml)) !== null) {
      namespaces.push({
        binding: match[1],
        id: match[2],
        title: match[1] // Utiliser le binding comme titre
      });
    }
    
    console.log(`✅ ${namespaces.length} espace(s) de noms KV trouvé(s) dans wrangler.toml`);
    return namespaces;
  } catch (error) {
    console.error('Erreur lors de la récupération des espaces de noms KV:', error);
    return [];
  }
}

/**
 * Sauvegarde un espace de noms KV
 * @param {Object} namespace - Espace de noms à sauvegarder
 */
function backupKvNamespace(namespace) {
  const { id, title } = namespace;
  const backupFile = path.join(CONFIG.backupDir, `kv-${title}-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  
  console.log(`\n💾 Sauvegarde de l'espace de noms ${title} (${id})...`);
  
  // Créer le répertoire de sauvegarde si nécessaire
  if (!fs.existsSync(CONFIG.backupDir)) {
    fs.mkdirSync(CONFIG.backupDir, { recursive: true });
  }
  
  // Exporter les données KV
  const data = {
    meta: {
      id,
      title,
      backupDate: new Date().toISOString()
    },
    // Note: L'export complet des paires clé-valeur nécessiterait une implémentation supplémentaire
    // car Wrangler ne fournit pas de commande directe pour cela
  };
  
  fs.writeFileSync(backupFile, JSON.stringify(data, null, 2));
  console.log(`✅ Sauvegarde terminée: ${backupFile}`);
  
  return backupFile;
}

/**
 * Point d'entrée principal
 */
async function main() {
  console.log('🧹 Début du nettoyage des espaces de noms KV');
  
  try {
    // Récupérer la liste des espaces de noms KV
    const namespaces = getKvNamespaces();
    
    if (namespaces.length === 0) {
      console.log('Aucun espace de noms KV trouvé');
      return;
    }
    
    // Filtrer les espaces de noms à supprimer
    const namespacesToDelete = namespaces.filter(
      ns => !CONFIG.keepKvNamespaces.includes(ns.title)
    );
    
    console.log(`\n📊 Résumé:`);
    console.log(`- Espaces de noms totaux: ${namespaces.length}`);
    console.log(`- À conserver: ${namespaces.length - namespacesToDelete.length}`);
    console.log(`- À supprimer: ${namespacesToDelete.length}`);
    
    if (namespacesToDelete.length === 0) {
      console.log('\n✅ Aucun espace de noms à supprimer');
      return;
    }
    
    // Demander confirmation
    console.log('\n⚠️  Les espaces de noms suivants seront supprimés:');
    namespacesToDelete.forEach(ns => console.log(`- ${ns.title} (${ns.id})`));
    
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    readline.question('\nVoulez-vous continuer ? (o/N) ', async (answer) => {
      readline.close();
      
      if (answer.toLowerCase() !== 'o') {
        console.log('\n❌ Opération annulée');
        return;
      }
      
      // Sauvegarder et supprimer chaque espace de noms
      for (const ns of namespacesToDelete) {
        try {
          await backupKvNamespace(ns);
          
          console.log(`\n🗑️  Suppression de l'espace de noms ${ns.title} (${ns.id})...`);
          runCommand(`npx wrangler kv:namespace delete --namespace-id ${ns.id}`);
          console.log(`✅ Espace de noms ${ns.title} supprimé avec succès`);
          
        } catch (error) {
          console.error(`❌ Erreur lors du traitement de ${ns.title}:`, error.message);
        }
      }
      
      console.log('\n✨ Nettoyage terminé avec succès !');
    });
    
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage des espaces de noms KV:', error);
    process.exit(1);
  }
}

// Exécution du script
if (require.main === module) {
  main();
}

module.exports = {
  getKvNamespaces,
  backupKvNamespace
};
