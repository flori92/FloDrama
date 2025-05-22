/**
 * Script pour réparer les fichiers JSON corrompus
 * 
 * Ce script analyse et corrige les erreurs de syntaxe dans les fichiers JSON
 * en se concentrant particulièrement sur les erreurs d'objets non fermés.
 */

const fs = require('fs');
const path = require('path');

// Fonction pour réparer le fichier JSON
function repairJson(filePath) {
  console.log(`🔍 Analyse du fichier: ${filePath}`);
  
  try {
    // Lire le contenu du fichier
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Essayer de parser pour voir si c'est déjà valide
    try {
      JSON.parse(content);
      console.log('✅ Le fichier JSON est déjà valide.');
      return true;
    } catch (parseError) {
      console.log(`⚠️ Erreur JSON détectée: ${parseError.message}`);
      
      // Essayer de réparer le fichier
      console.log('🛠️ Tentative de réparation...');
      
      // Approche 1: Réparer les objets non fermés correctement
      try {
        // Convertir le contenu en structure d'items valide
        const repaired = repairItemsArray(content);
        
        // Écrire le contenu réparé dans un nouveau fichier
        const backupPath = `${filePath}.backup`;
        fs.writeFileSync(backupPath, content);
        console.log(`💾 Sauvegarde créée: ${backupPath}`);
        
        fs.writeFileSync(filePath, repaired);
        console.log('✅ Fichier réparé avec succès.');
        
        // Vérifier que le fichier réparé est valide
        try {
          JSON.parse(repaired);
          return true;
        } catch (e) {
          console.log(`❌ La réparation n'a pas créé un JSON valide: ${e.message}`);
          return false;
        }
      } catch (repairError) {
        console.log(`❌ Échec de la réparation: ${repairError.message}`);
        return false;
      }
    }
  } catch (error) {
    console.log(`❌ Erreur lors de la lecture du fichier: ${error.message}`);
    return false;
  }
}

// Fonction pour réparer un tableau d'items
function repairItemsArray(content) {
  // Si le fichier contient un tableau "items"
  if (content.includes('"items":')) {
    const itemsStart = content.indexOf('"items":');
    const itemsValueStart = content.indexOf('[', itemsStart);
    
    // Extraire le préambule (tout jusqu'au début des items)
    const prelude = content.substring(0, itemsValueStart + 1);
    
    // Extraire le reste du contenu
    const itemsContent = content.substring(itemsValueStart + 1);
    
    // Séparer les items individuels
    const itemRegex = /\s*\{\s*"id":/g;
    let items = [];
    let lastIndex = 0;
    let match;
    
    // Trouver tous les débuts d'objets items
    const matches = [...itemsContent.matchAll(itemRegex)];
    
    for (let i = 0; i < matches.length; i++) {
      const start = matches[i].index;
      const nextStart = i < matches.length - 1 ? matches[i + 1].index : itemsContent.length;
      
      // Extraire l'item
      let item = itemsContent.substring(start, nextStart).trim();
      
      // Vérifier si l'item se termine correctement par "}"
      if (!item.endsWith('}')) {
        item += '}';
      }
      
      // Supprimer la première accolade si ce n'est pas le premier élément
      if (i > 0 && item.startsWith('{')) {
        items.push(item);
      } else if (i === 0) {
        items.push(item);
      }
    }
    
    // Reconstruire le tableau d'items
    const repairedItems = items.join(',\n');
    
    // Reconstruire le document JSON complet
    return `${prelude}\n${repairedItems}\n]}\n`;
  } else {
    // Approche basique: essayer de réparer en reconstruisant la structure
    try {
      // Analyse du JSON en ignorant les erreurs de syntaxe
      const lines = content.split('\n');
      const objects = [];
      let currentObject = '';
      let depth = 0;
      
      for (const line of lines) {
        // Comptage des accolades ouvrantes et fermantes
        for (const char of line) {
          if (char === '{') depth++;
          if (char === '}') depth--;
        }
        
        currentObject += line + '\n';
        
        // Si la profondeur revient à 0, nous avons un objet complet
        if (depth === 0 && currentObject.trim().length > 0) {
          try {
            // Essayer de parser l'objet
            JSON.parse(currentObject);
            objects.push(currentObject);
            currentObject = '';
          } catch (e) {
            // Si ça ne marche pas, continuer d'accumuler des lignes
          }
        }
      }
      
      if (objects.length > 0) {
        return objects[0]; // Retourner le premier objet valide
      } else {
        throw new Error('Impossible de trouver une structure JSON valide');
      }
    } catch (e) {
      console.log(`Approche basique échouée: ${e.message}`);
      throw e;
    }
  }
}

// Fonction principale
function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node repair-json.js <chemin/vers/fichier.json>');
    console.log('       node repair-json.js --all');
    return;
  }
  
  if (args[0] === '--all') {
    // Réparer tous les fichiers JSON dans le dossier output
    const outputDir = path.join(__dirname, '..', 'output');
    const files = fs.readdirSync(outputDir);
    
    let succeeded = 0;
    let failed = 0;
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(outputDir, file);
        console.log(`\n=== Traitement de ${file} ===`);
        
        if (repairJson(filePath)) {
          succeeded++;
        } else {
          failed++;
        }
      }
    }
    
    console.log(`\n📊 Résumé: ${succeeded} fichier(s) réparé(s), ${failed} échec(s)`);
  } else {
    // Réparer un fichier spécifique
    const filePath = args[0];
    repairJson(filePath);
  }
}

// Exécuter le script
main();
