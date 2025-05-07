/**
 * Script d'optimisation des performances pour FloDrama
 * 
 * Ce script analyse le code source et implémente des optimisations pour améliorer
 * les performances de l'application, notamment avec le lazy loading et la mise en cache.
 */

const fs = require('fs');
const path = require('path');
const { parse } = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;
const t = require('@babel/types');

// Configuration
const SRC_DIR = path.join(__dirname, '../src');
const COMPONENTS_DIR = path.join(SRC_DIR, 'components');
const REPORT_PATH = path.join(__dirname, '../performance-reports');

// Créer le répertoire de rapport s'il n'existe pas
if (!fs.existsSync(REPORT_PATH)) {
  fs.mkdirSync(REPORT_PATH, { recursive: true });
}

// Fonction pour formater la date et l'heure
const formatDateTime = () => {
  const now = new Date();
  return now.toISOString().replace(/[:.]/g, '-');
};

// Fonction pour générer un rapport
const generateReport = (results) => {
  const reportFile = path.join(REPORT_PATH, `performance-report-${formatDateTime()}.json`);
  fs.writeFileSync(reportFile, JSON.stringify(results, null, 2));
  console.log(`Rapport généré: ${reportFile}`);
};

// Fonction pour trouver les composants qui pourraient bénéficier du lazy loading
const findLazyLoadingCandidates = () => {
  const candidates = [];
  const componentsFiles = fs.readdirSync(COMPONENTS_DIR)
    .filter(file => file.endsWith('.tsx') || file.endsWith('.jsx'));
  
  // Analyser chaque fichier de composant
  for (const file of componentsFiles) {
    const filePath = path.join(COMPONENTS_DIR, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const fileSize = fs.statSync(filePath).size;
    
    // Si le fichier est volumineux, c'est un bon candidat pour le lazy loading
    if (fileSize > 10000) { // Plus de 10 KB
      candidates.push({
        file: filePath,
        size: fileSize,
        name: path.basename(file, path.extname(file))
      });
    }
  }
  
  return candidates;
};

// Fonction pour trouver les imports qui pourraient être convertis en imports dynamiques
const findDynamicImportCandidates = () => {
  const candidates = [];
  
  // Trouver tous les fichiers JSX/TSX
  const jsxFiles = [];
  const findJsxFiles = (dir) => {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const itemPath = path.join(dir, item);
      const stat = fs.statSync(itemPath);
      
      if (stat.isDirectory()) {
        findJsxFiles(itemPath);
      } else if (item.endsWith('.tsx') || item.endsWith('.jsx')) {
        jsxFiles.push(itemPath);
      }
    }
  };
  
  findJsxFiles(SRC_DIR);
  
  // Analyser chaque fichier pour trouver les imports
  for (const file of jsxFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    
    try {
      const ast = parse(content, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript']
      });
      
      traverse(ast, {
        ImportDeclaration(path) {
          const node = path.node;
          const importPath = node.source.value;
          
          // Ignorer les imports de bibliothèques
          if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
            return;
          }
          
          // Vérifier si l'import est pour un composant
          if (importPath.includes('components')) {
            const importedComponents = node.specifiers
              .filter(s => s.type === 'ImportSpecifier' || s.type === 'ImportDefaultSpecifier')
              .map(s => s.local.name);
            
            // Vérifier si les composants importés sont utilisés dans des conditions
            let usedInCondition = false;
            
            traverse(ast, {
              JSXElement(innerPath) {
                const jsxNode = innerPath.node;
                const elementName = jsxNode.openingElement.name.name;
                
                if (importedComponents.includes(elementName)) {
                  // Vérifier si ce JSX est dans une condition
                  let currentPath = innerPath;
                  while (currentPath) {
                    if (t.isConditionalExpression(currentPath.parent) || 
                        t.isIfStatement(currentPath.parent) ||
                        t.isTernaryExpression(currentPath.parent)) {
                      usedInCondition = true;
                      break;
                    }
                    currentPath = currentPath.parentPath;
                  }
                }
              }
            }, path.scope);
            
            if (usedInCondition) {
              candidates.push({
                file,
                importPath,
                components: importedComponents,
                line: node.loc.start.line
              });
            }
          }
        }
      });
    } catch (error) {
      console.error(`Erreur lors de l'analyse de ${file}:`, error);
    }
  }
  
  return candidates;
};

// Fonction pour analyser les requêtes API qui pourraient bénéficier d'une meilleure stratégie de mise en cache
const findApiCacheCandidates = () => {
  const candidates = [];
  
  // Trouver tous les fichiers de services
  const serviceFiles = [];
  const servicesDir = path.join(SRC_DIR, 'services');
  
  if (fs.existsSync(servicesDir)) {
    const items = fs.readdirSync(servicesDir);
    
    for (const item of items) {
      const itemPath = path.join(servicesDir, item);
      const stat = fs.statSync(itemPath);
      
      if (!stat.isDirectory() && (item.endsWith('.ts') || item.endsWith('.js'))) {
        serviceFiles.push(itemPath);
      }
    }
  }
  
  // Analyser chaque fichier de service pour trouver les requêtes API
  for (const file of serviceFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    
    try {
      const ast = parse(content, {
        sourceType: 'module',
        plugins: ['typescript']
      });
      
      traverse(ast, {
        CallExpression(path) {
          const node = path.node;
          
          // Vérifier si c'est un appel fetch ou axios
          const callee = node.callee;
          let isFetchCall = false;
          
          if (t.isIdentifier(callee) && callee.name === 'fetch') {
            isFetchCall = true;
          } else if (t.isMemberExpression(callee) && 
                    t.isIdentifier(callee.object) && 
                    callee.object.name === 'axios') {
            isFetchCall = true;
          }
          
          if (isFetchCall) {
            // Vérifier si la requête est déjà mise en cache
            let isAlreadyCached = false;
            let currentPath = path;
            
            while (currentPath && currentPath.parentPath) {
              const parent = currentPath.parentPath.node;
              
              if (t.isCallExpression(parent) && 
                  t.isIdentifier(parent.callee) && 
                  (parent.callee.name.includes('cache') || parent.callee.name.includes('Cache'))) {
                isAlreadyCached = true;
                break;
              }
              
              currentPath = currentPath.parentPath;
            }
            
            if (!isAlreadyCached) {
              candidates.push({
                file,
                line: node.loc.start.line,
                column: node.loc.start.column,
                code: content.split('\n')[node.loc.start.line - 1].trim()
              });
            }
          }
        }
      });
    } catch (error) {
      console.error(`Erreur lors de l'analyse de ${file}:`, error);
    }
  }
  
  return candidates;
};

// Fonction pour générer le code de lazy loading pour un composant
const generateLazyLoadingCode = (componentName) => {
  return `
// Lazy loading pour le composant ${componentName}
const ${componentName} = React.lazy(() => import('./${componentName}'));

// Utilisation avec Suspense
const ${componentName}WithSuspense = (props) => (
  <React.Suspense fallback={<div className="loading-skeleton">${componentName} en cours de chargement...</div>}>
    <${componentName} {...props} />
  </React.Suspense>
);
`;
};

// Fonction pour générer le code d'import dynamique
const generateDynamicImportCode = (importPath, componentName) => {
  return `
// Import dynamique pour ${componentName}
const ${componentName} = React.lazy(() => import('${importPath}').then(module => ({ 
  default: module.${componentName} 
})));

// Utilisation avec Suspense
const ${componentName}WithSuspense = (props) => (
  <React.Suspense fallback={<div className="loading-skeleton">${componentName} en cours de chargement...</div>}>
    <${componentName} {...props} />
  </React.Suspense>
);
`;
};

// Fonction pour générer le code de mise en cache améliorée
const generateImprovedCacheCode = (apiCall) => {
  return `
// Mise en cache améliorée pour ${apiCall}
const cachedFetch = async (url, options = {}) => {
  const cacheKey = \`api_\${url}\`;
  
  // Vérifier si les données sont en cache et valides
  const cachedData = localStorage.getItem(cacheKey);
  if (cachedData) {
    const { data, timestamp } = JSON.parse(cachedData);
    const isValid = Date.now() - timestamp < 5 * 60 * 1000; // 5 minutes
    
    if (isValid) {
      return data;
    }
  }
  
  // Sinon, faire la requête
  const response = await fetch(url, options);
  const data = await response.json();
  
  // Mettre en cache
  localStorage.setItem(cacheKey, JSON.stringify({
    data,
    timestamp: Date.now()
  }));
  
  return data;
};

// Utilisation
const data = await cachedFetch(${apiCall});
`;
};

// Fonction principale
const main = () => {
  console.log('Analyse des performances en cours...');
  
  // Trouver les candidats pour les optimisations
  const lazyLoadingCandidates = findLazyLoadingCandidates();
  const dynamicImportCandidates = findDynamicImportCandidates();
  const apiCacheCandidates = findApiCacheCandidates();
  
  console.log(`Candidats pour le lazy loading: ${lazyLoadingCandidates.length}`);
  console.log(`Candidats pour les imports dynamiques: ${dynamicImportCandidates.length}`);
  console.log(`Candidats pour l'amélioration du cache API: ${apiCacheCandidates.length}`);
  
  // Générer des exemples de code pour chaque optimisation
  const optimizationExamples = {
    lazyLoading: lazyLoadingCandidates.map(candidate => ({
      ...candidate,
      suggestedCode: generateLazyLoadingCode(candidate.name)
    })),
    
    dynamicImports: dynamicImportCandidates.map(candidate => ({
      ...candidate,
      suggestedCode: candidate.components.map(comp => 
        generateDynamicImportCode(candidate.importPath, comp)
      ).join('\n')
    })),
    
    apiCache: apiCacheCandidates.map(candidate => ({
      ...candidate,
      suggestedCode: generateImprovedCacheCode(candidate.code)
    }))
  };
  
  // Générer le rapport
  const results = {
    timestamp: new Date().toISOString(),
    optimizationCandidates: {
      lazyLoading: lazyLoadingCandidates.length,
      dynamicImports: dynamicImportCandidates.length,
      apiCache: apiCacheCandidates.length
    },
    examples: optimizationExamples
  };
  
  generateReport(results);
  
  // Afficher un résumé
  console.log('\nRésumé de l\'analyse:');
  console.log(`Composants candidats pour le lazy loading: ${lazyLoadingCandidates.length}`);
  console.log(`Imports candidats pour la conversion en imports dynamiques: ${dynamicImportCandidates.length}`);
  console.log(`Requêtes API candidates pour l'amélioration du cache: ${apiCacheCandidates.length}`);
  console.log(`\nRapport généré avec des exemples de code pour chaque optimisation.`);
};

// Exécuter le script
main();
