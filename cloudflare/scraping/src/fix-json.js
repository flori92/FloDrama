/**
 * Script amélioré pour réparer les fichiers JSON corrompus
 * Utilise une approche plus robuste pour la reconstruction
 */

const fs = require('fs');
const path = require('path');

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

// Fonction pour réparer un fichier JSON
function fixJsonFile(filePath) {
  console.log(`\n${colors.blue}🔍 Analyse du fichier: ${filePath}${colors.reset}`);
  
  try {
    // Lire le contenu du fichier
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Vérifier si le JSON est déjà valide
    try {
      JSON.parse(content);
      console.log(`${colors.green}✅ Fichier JSON déjà valide${colors.reset}`);
      return true;
    } catch (parseError) {
      console.log(`${colors.yellow}⚠️ Erreur JSON détectée: ${parseError.message}${colors.reset}`);
      
      // Sauvegarder une copie du fichier original
      const backupPath = `${filePath}.backup`;
      fs.writeFileSync(backupPath, content);
      console.log(`${colors.blue}💾 Sauvegarde créée: ${backupPath}${colors.reset}`);
      
      // Réparer le fichier
      console.log(`${colors.magenta}🛠️ Tentative de réparation avec méthode robuste...${colors.reset}`);
      
      // Détecter le format (JSON standard ou tableau d'items)
      if (content.includes('"items":')) {
        // Format avec un tableau d'items
        const fixed = fixItemsArray(content);
        fs.writeFileSync(filePath, fixed);
        
        // Vérifier que le JSON est maintenant valide
        try {
          JSON.parse(fixed);
          console.log(`${colors.green}✅ Fichier réparé avec succès${colors.reset}`);
          return true;
        } catch (e) {
          console.log(`${colors.red}❌ La réparation n'a pas créé un JSON valide: ${e.message}${colors.reset}`);
          
          // Restaurer le fichier original
          fs.copyFileSync(backupPath, filePath);
          console.log(`${colors.yellow}⚠️ Fichier original restauré${colors.reset}`);
          return false;
        }
      } else {
        // Format JSON standard
        const fixed = fixStandardJson(content);
        fs.writeFileSync(filePath, fixed);
        
        // Vérifier que le JSON est maintenant valide
        try {
          JSON.parse(fixed);
          console.log(`${colors.green}✅ Fichier réparé avec succès${colors.reset}`);
          return true;
        } catch (e) {
          console.log(`${colors.red}❌ La réparation n'a pas créé un JSON valide: ${e.message}${colors.reset}`);
          
          // Restaurer le fichier original
          fs.copyFileSync(backupPath, filePath);
          console.log(`${colors.yellow}⚠️ Fichier original restauré${colors.reset}`);
          return false;
        }
      }
    }
  } catch (error) {
    console.log(`${colors.red}❌ Erreur lors de la lecture du fichier: ${error.message}${colors.reset}`);
    return false;
  }
}

// Répare un fichier JSON au format { "items": [...] }
function fixItemsArray(content) {
  // Créer une structure vide avec items
  const result = { items: [] };
  
  try {
    // Extraire tous les objets JSON potentiels
    const regex = /\{(?:[^{}]|(?:\{(?:[^{}]|(?:\{(?:[^{}]|(?:\{[^{}]*\}))*\}))*\}))*\}/g;
    const objects = content.match(regex) || [];
    
    // Pour chaque objet trouvé, essayer de le parser
    objects.forEach(objStr => {
      try {
        // Nettoyer l'objet des caractères problématiques
        let cleanObj = objStr.replace(/,\s*\}/g, '}');
        const obj = JSON.parse(cleanObj);
        
        // Si l'objet a un id, c'est probablement un item
        if (obj.id) {
          result.items.push(obj);
        }
      } catch (e) {
        // Ignorer les objets mal formés
      }
    });
    
    // Si nous n'avons rien trouvé, essayer une approche différente
    if (result.items.length === 0) {
      console.log(`${colors.yellow}⚠️ Tentative de récupération avec méthode alternative...${colors.reset}`);
      
      // Extraire la partie entre [ et le dernier ]
      const itemsStart = content.indexOf('"items": [');
      if (itemsStart > 0) {
        const bracketStart = content.indexOf('[', itemsStart);
        let bracketEnd = content.lastIndexOf(']');
        if (bracketEnd === -1) bracketEnd = content.length;
        
        const itemsContent = content.substring(bracketStart + 1, bracketEnd).trim();
        
        // Diviser en objets potentiels
        const itemStrings = itemsContent.split(/},\s*\{/);
        
        itemStrings.forEach((itemStr, index) => {
          // Reconstruire l'accolade de début si nécessaire
          if (index > 0) itemStr = '{' + itemStr;
          
          // Reconstruire l'accolade de fin si nécessaire
          if (!itemStr.endsWith('}')) itemStr += '}';
          
          try {
            const item = JSON.parse(itemStr);
            if (item.id) {
              result.items.push(item);
            }
          } catch(e) {
            // Ignorer les objets mal formés
          }
        });
      }
    }
    
    return JSON.stringify(result, null, 2);
  } catch (error) {
    console.log(`${colors.red}❌ Erreur lors de la réparation: ${error.message}${colors.reset}`);
    return content; // Retourner le contenu original en cas d'échec
  }
}

// Répare un fichier JSON standard
function fixStandardJson(content) {
  try {
    // Essayer de trouver un objet JSON valide
    const regex = /\{(?:[^{}]|(?:\{(?:[^{}]|(?:\{(?:[^{}]|(?:\{[^{}]*\}))*\}))*\}))*\}/g;
    const match = content.match(regex);
    
    if (match && match.length > 0) {
      // Prendre le premier objet JSON valide
      let cleanObj = match[0].replace(/,\s*\}/g, '}');
      try {
        JSON.parse(cleanObj); // Vérifier que c'est valide
        return cleanObj;
      } catch (e) {
        // Si ce n'est pas valide, utiliser un objet vide
        return '{}';
      }
    } else {
      // Aucun objet JSON valide trouvé
      return '{}';
    }
  } catch (error) {
    console.log(`${colors.red}❌ Erreur lors de la réparation: ${error.message}${colors.reset}`);
    return '{}'; // Retourner un objet vide en cas d'échec
  }
}

// Fonction principale
function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`${colors.yellow}Usage: node fix-json.js <chemin/vers/fichier.json>${colors.reset}`);
    console.log(`${colors.yellow}       node fix-json.js --all${colors.reset}`);
    return;
  }
  
  if (args[0] === '--all') {
    // Réparer tous les fichiers JSON dans le dossier output
    const outputDir = path.join(__dirname, '..', 'output');
    if (!fs.existsSync(outputDir)) {
      console.log(`${colors.red}❌ Le dossier output n'existe pas${colors.reset}`);
      return;
    }
    
    const files = fs.readdirSync(outputDir);
    
    let succeeded = 0;
    let failed = 0;
    
    for (const file of files) {
      if (file.endsWith('.json') && !file.endsWith('.backup')) {
        const filePath = path.join(outputDir, file);
        console.log(`\n${colors.magenta}=== Traitement de ${file} ===${colors.reset}`);
        
        if (fixJsonFile(filePath)) {
          succeeded++;
        } else {
          failed++;
        }
      }
    }
    
    console.log(`\n${colors.blue}📊 Résumé: ${colors.green}${succeeded} fichier(s) réparé(s)${colors.reset}, ${colors.red}${failed} échec(s)${colors.reset}`);
  } else {
    // Réparer un fichier spécifique
    const filePath = args[0];
    if (!fs.existsSync(filePath)) {
      console.log(`${colors.red}❌ Le fichier ${filePath} n'existe pas${colors.reset}`);
      return;
    }
    
    fixJsonFile(filePath);
  }
}

// Exécuter le script
main();
