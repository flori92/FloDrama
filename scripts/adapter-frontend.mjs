#!/usr/bin/env node

/**
 * Script d'analyse et d'adaptation automatique du frontend FloDrama
 * Ce script analyse le SmartScrapingService et adapte l'interface ContentItem
 * pour garantir la compatibilité avec les données réelles de production.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// Obtenir le chemin du répertoire actuel en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Chemins des fichiers
const SMART_SCRAPING_SERVICE_PATH = path.resolve(__dirname, '../frontend/app/services/scraping/SmartScrapingService.js');
const CONTENT_TYPES_PATH = path.resolve(__dirname, '../frontend/app/services/scraping/index.ts');
const REPORT_PATH = path.resolve(__dirname, '../rapport-adaptation-frontend.md');

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

console.log(`${colors.bright}${colors.cyan}FloDrama - Analyse et adaptation automatique du frontend${colors.reset}\n`);

// Fonction principale
async function main() {
  try {
    // 1. Analyser le SmartScrapingService
    console.log(`${colors.yellow}[1/4] Analyse du SmartScrapingService...${colors.reset}`);
    const serviceCode = fs.readFileSync(SMART_SCRAPING_SERVICE_PATH, 'utf8');
    
    // Extraire la structure des données manipulées
    const dataStructure = analyzeServiceCode(serviceCode);
    console.log(`${colors.green}✓ Analyse terminée : ${Object.keys(dataStructure).length} champs identifiés${colors.reset}`);
    
    // 2. Analyser l'interface ContentItem actuelle
    console.log(`\n${colors.yellow}[2/4] Analyse de l'interface ContentItem actuelle...${colors.reset}`);
    const typesCode = fs.readFileSync(CONTENT_TYPES_PATH, 'utf8');
    const currentInterface = extractContentItemInterface(typesCode);
    console.log(`${colors.green}✓ Interface actuelle extraite : ${Object.keys(currentInterface).length} champs${colors.reset}`);
    
    // 3. Générer la nouvelle interface
    console.log(`\n${colors.yellow}[3/4] Génération de la nouvelle interface ContentItem...${colors.reset}`);
    const newInterface = mergeInterfaces(currentInterface, dataStructure);
    const updatedTypesCode = updateContentItemInterface(typesCode, newInterface);
    
    // Écrire le fichier mis à jour
    fs.writeFileSync(CONTENT_TYPES_PATH, updatedTypesCode, 'utf8');
    console.log(`${colors.green}✓ Interface ContentItem mise à jour avec ${Object.keys(newInterface).length} champs${colors.reset}`);
    
    // 4. Générer un rapport
    console.log(`\n${colors.yellow}[4/4] Génération du rapport d'adaptation...${colors.reset}`);
    const report = generateReport(currentInterface, dataStructure, newInterface);
    fs.writeFileSync(REPORT_PATH, report, 'utf8');
    console.log(`${colors.green}✓ Rapport généré : ${REPORT_PATH}${colors.reset}`);
    
    // 5. Commit des changements
    console.log(`\n${colors.yellow}[Bonus] Commit des changements...${colors.reset}`);
    try {
      execSync(`git add ${CONTENT_TYPES_PATH} ${REPORT_PATH}`);
      execSync(`git commit -m "✨ [FEAT] Adaptation automatique des types ContentItem selon l'analyse du SmartScrapingService"`);
      console.log(`${colors.green}✓ Changements commités${colors.reset}`);
    } catch (error) {
      console.log(`${colors.red}✗ Erreur lors du commit : ${error.message}${colors.reset}`);
    }
    
    console.log(`\n${colors.bright}${colors.green}Adaptation terminée avec succès !${colors.reset}`);
    
  } catch (error) {
    console.error(`\n${colors.red}Erreur : ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

// Analyse le code du service pour extraire la structure des données
function analyzeServiceCode(code) {
  const dataStructure = {};
  
  // Rechercher les accès aux propriétés des items
  const propertyAccessRegex = /item\.([a-zA-Z0-9_]+)/g;
  let match;
  while ((match = propertyAccessRegex.exec(code)) !== null) {
    const property = match[1];
    if (!dataStructure[property]) {
      dataStructure[property] = { type: 'any', required: false };
    }
  }
  
  // Rechercher les propriétés utilisées dans des conditions (probablement requises)
  const conditionalCheckRegex = /if\s*\(\s*item\.([a-zA-Z0-9_]+)\s*\)/g;
  while ((match = conditionalCheckRegex.exec(code)) !== null) {
    const property = match[1];
    if (dataStructure[property]) {
      dataStructure[property].required = true;
    }
  }
  
  // Déduire les types en fonction des opérations
  const numericOpRegex = /item\.([a-zA-Z0-9_]+)\s*[><+\-*/]/g;
  while ((match = numericOpRegex.exec(code)) !== null) {
    const property = match[1];
    if (dataStructure[property]) {
      dataStructure[property].type = 'number';
    }
  }
  
  const stringOpRegex = /item\.([a-zA-Z0-9_]+)\.toLowerCase\(\)/g;
  while ((match = stringOpRegex.exec(code)) !== null) {
    const property = match[1];
    if (dataStructure[property]) {
      dataStructure[property].type = 'string';
    }
  }
  
  const arrayOpRegex = /item\.([a-zA-Z0-9_]+)\.filter\(/g;
  while ((match = arrayOpRegex.exec(code)) !== null) {
    const property = match[1];
    if (dataStructure[property]) {
      dataStructure[property].type = 'array';
    }
  }
  
  return dataStructure;
}

// Extrait l'interface ContentItem actuelle
function extractContentItemInterface(code) {
  const interfaceRegex = /export\s+interface\s+ContentItem\s*\{([^}]+)\}/s;
  const match = interfaceRegex.exec(code);
  
  if (!match) {
    throw new Error("Interface ContentItem non trouvée");
  }
  
  const interfaceContent = match[1];
  const properties = {};
  
  // Extraire chaque propriété
  const propertyRegex = /([a-zA-Z0-9_]+)(\??):\s*([^;]+);/g;
  let propMatch;
  while ((propMatch = propertyRegex.exec(interfaceContent)) !== null) {
    const name = propMatch[1];
    const optional = propMatch[2] === '?';
    const type = propMatch[3].trim();
    
    properties[name] = {
      type,
      required: !optional
    };
  }
  
  return properties;
}

// Fusionne les interfaces pour créer une nouvelle version complète
function mergeInterfaces(current, discovered) {
  const merged = { ...current };
  
  // Ajouter les propriétés découvertes qui n'existent pas encore
  for (const [name, info] of Object.entries(discovered)) {
    if (!merged[name]) {
      let type = 'any';
      
      // Mapper les types découverts aux types TypeScript
      if (info.type === 'number') {
        type = 'number';
      } else if (info.type === 'string') {
        type = 'string';
      } else if (info.type === 'array') {
        type = 'any[]';
      }
      
      merged[name] = {
        type,
        required: info.required
      };
    }
  }
  
  return merged;
}

// Met à jour le code de l'interface ContentItem
function updateContentItemInterface(code, newInterface) {
  let interfaceContent = 'export interface ContentItem {\n';
  
  // Générer le contenu de l'interface
  for (const [name, info] of Object.entries(newInterface)) {
    const optional = !info.required ? '?' : '';
    interfaceContent += `  ${name}${optional}: ${info.type};\n`;
  }
  
  interfaceContent += '}';
  
  // Remplacer l'ancienne interface
  return code.replace(/export\s+interface\s+ContentItem\s*\{[^}]+\}/s, interfaceContent);
}

// Génère un rapport d'adaptation
function generateReport(oldInterface, discovered, newInterface) {
  const report = `# Rapport d'adaptation automatique du frontend FloDrama

## Date : ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}

## Résumé
- **Interface ContentItem initiale** : ${Object.keys(oldInterface).length} champs
- **Champs découverts dans SmartScrapingService** : ${Object.keys(discovered).length} champs
- **Nouvelle interface ContentItem** : ${Object.keys(newInterface).length} champs

## Champs ajoutés
${Object.keys(newInterface)
  .filter(key => !oldInterface[key])
  .map(key => `- \`${key}\`: ${newInterface[key].type}${newInterface[key].required ? ' (requis)' : ' (optionnel)'}`)
  .join('\n') || '- Aucun champ ajouté'}

## Champs modifiés
${Object.keys(oldInterface)
  .filter(key => newInterface[key] && (oldInterface[key].type !== newInterface[key].type || oldInterface[key].required !== newInterface[key].required))
  .map(key => `- \`${key}\`: ${oldInterface[key].type} ${oldInterface[key].required ? '(requis)' : '(optionnel)'} → ${newInterface[key].type} ${newInterface[key].required ? '(requis)' : '(optionnel)'}`)
  .join('\n') || '- Aucun champ modifié'}

## Compatibilité avec les données de production
L'interface ContentItem a été adaptée pour garantir la compatibilité avec les données manipulées par SmartScrapingService.
Cette adaptation assure que le frontend peut correctement afficher et manipuler les données réelles provenant de la production AWS.

## Prochaines étapes recommandées
1. Vérifier visuellement le rendu des pages utilisant ContentItem
2. Tester la recherche et le filtrage des contenus
3. Valider l'affichage des détails des contenus
4. Mettre à jour la documentation technique

## Note technique
Cette adaptation a été réalisée par analyse statique du code et peut nécessiter des ajustements manuels
pour les types complexes ou les relations entre entités qui ne peuvent pas être détectées automatiquement.
`;

  return report;
}

// Exécuter le script
main();
