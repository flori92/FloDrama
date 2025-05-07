/**
 * Script d'analyse des performances pour FloDrama
 * 
 * Ce script analyse l'application pour identifier les opportunités d'optimisation
 * des performances, notamment :
 * - Composants à mémoriser avec React.memo
 * - Fonctions à mémoriser avec useCallback/useMemo
 * - Optimisations de rendu
 * - Stratégies de chargement différé
 * - Optimisations de cache
 */

const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const { performance } = require('perf_hooks');

// Configuration
const PROJECT_DIR = path.resolve(__dirname, '..');
const SRC_DIR = path.join(PROJECT_DIR, 'src');
const REPORT_DIR = path.join(PROJECT_DIR, 'performance-reports');
const COMPONENTS_DIR = path.join(SRC_DIR, 'components');
const PAGES_DIR = path.join(SRC_DIR, 'pages');
const SERVICES_DIR = path.join(SRC_DIR, 'services');

// Créer le répertoire des rapports s'il n'existe pas
if (!fs.existsSync(REPORT_DIR)) {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
}

// Statistiques
const stats = {
  filesAnalyzed: 0,
  componentsFound: 0,
  memoizableFunctions: 0,
  memoizableComponents: 0,
  lazyLoadCandidates: 0,
  apiCacheOpportunities: 0,
  renderOptimizations: 0,
  heavyRenders: 0,
  unnecessaryReRenders: 0
};

// Résultats détaillés
const results = {
  memoizableFunctions: [],
  memoizableComponents: [],
  lazyLoadCandidates: [],
  apiCacheOpportunities: [],
  renderOptimizations: [],
  heavyRenders: [],
  unnecessaryReRenders: []
};

/**
 * Analyse un fichier pour détecter les opportunités d'optimisation
 */
function analyzeFile(filePath) {
  const relativePath = path.relative(PROJECT_DIR, filePath);
  console.log(`Analyse de ${relativePath}...`);
  
  try {
    const code = fs.readFileSync(filePath, 'utf-8');
    stats.filesAnalyzed++;
    
    // Parser le code
    const ast = parser.parse(code, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript', 'classProperties', 'decorators-legacy']
    });
    
    // Analyser le code
    analyzeComponent(ast, filePath);
    analyzeAPICalls(ast, filePath);
    analyzeRenderPerformance(ast, filePath);
    
  } catch (error) {
    console.error(`Erreur lors de l'analyse de ${relativePath}:`, error.message);
  }
}

/**
 * Analyse les composants React pour identifier les opportunités de mémorisation
 */
function analyzeComponent(ast, filePath) {
  const fileName = path.basename(filePath);
  const componentName = fileName.replace(/\.(jsx|tsx)$/, '');
  let isComponent = false;
  let hasMemo = false;
  let hasUseCallback = false;
  let hasUseMemo = false;
  let functionDeclarations = [];
  
  traverse(ast, {
    // Détecter les composants React
    FunctionDeclaration(path) {
      if (path.node.id && path.node.id.name) {
        functionDeclarations.push(path.node.id.name);
        
        // Vérifier si c'est un composant React (retourne du JSX)
        path.traverse({
          ReturnStatement(returnPath) {
            if (returnPath.node.argument && returnPath.node.argument.type === 'JSXElement') {
              isComponent = true;
              stats.componentsFound++;
            }
          }
        });
      }
    },
    
    // Détecter les composants React avec arrow functions
    VariableDeclarator(path) {
      if (path.node.id && path.node.id.name && path.node.init && 
          (path.node.init.type === 'ArrowFunctionExpression' || path.node.init.type === 'FunctionExpression')) {
        functionDeclarations.push(path.node.id.name);
        
        // Vérifier si c'est un composant React (retourne du JSX)
        path.traverse({
          ReturnStatement(returnPath) {
            if (returnPath.node.argument && returnPath.node.argument.type === 'JSXElement') {
              isComponent = true;
              stats.componentsFound++;
            }
          },
          ArrowFunctionExpression(arrowPath) {
            if (arrowPath.node.body && arrowPath.node.body.type === 'JSXElement') {
              isComponent = true;
              stats.componentsFound++;
            }
          }
        });
      }
    },
    
    // Détecter l'utilisation de React.memo
    CallExpression(path) {
      if (path.node.callee && 
          ((path.node.callee.type === 'MemberExpression' && 
            path.node.callee.object && path.node.callee.object.name === 'React' && 
            path.node.callee.property && path.node.callee.property.name === 'memo') ||
           (path.node.callee.type === 'Identifier' && path.node.callee.name === 'memo'))) {
        hasMemo = true;
      }
    },
    
    // Détecter l'utilisation de useCallback et useMemo
    CallExpression(path) {
      if (path.node.callee && path.node.callee.type === 'Identifier') {
        if (path.node.callee.name === 'useCallback') {
          hasUseCallback = true;
        } else if (path.node.callee.name === 'useMemo') {
          hasUseMemo = true;
        }
      }
    }
  });
  
  // Identifier les composants qui pourraient bénéficier de React.memo
  if (isComponent && !hasMemo) {
    stats.memoizableComponents++;
    results.memoizableComponents.push({
      file: path.relative(PROJECT_DIR, filePath),
      component: componentName,
      reason: "Ce composant pourrait bénéficier de React.memo pour éviter les rendus inutiles."
    });
  }
  
  // Identifier les fonctions qui pourraient bénéficier de useCallback/useMemo
  if (isComponent && (!hasUseCallback || !hasUseMemo)) {
    const code = fs.readFileSync(filePath, 'utf-8');
    
    // Rechercher les fonctions définies dans les composants
    let inlineHandlerCount = 0;
    traverse(ast, {
      JSXAttribute(path) {
        if (path.node.value && 
            (path.node.value.type === 'JSXExpressionContainer' && 
             path.node.value.expression.type === 'ArrowFunctionExpression')) {
          inlineHandlerCount++;
        }
      }
    });
    
    if (inlineHandlerCount > 0) {
      stats.memoizableFunctions++;
      results.memoizableFunctions.push({
        file: path.relative(PROJECT_DIR, filePath),
        component: componentName,
        count: inlineHandlerCount,
        reason: `${inlineHandlerCount} gestionnaires d'événements inline pourraient être mémorisés avec useCallback.`
      });
    }
  }
  
  // Identifier les candidats au chargement différé
  if (isComponent && filePath.includes(PAGES_DIR)) {
    const fileSize = fs.statSync(filePath).size;
    // Si le fichier est relativement grand (> 10 Ko), c'est un bon candidat pour le chargement différé
    if (fileSize > 10 * 1024) {
      stats.lazyLoadCandidates++;
      results.lazyLoadCandidates.push({
        file: path.relative(PROJECT_DIR, filePath),
        component: componentName,
        size: Math.round(fileSize / 1024) + ' Ko',
        reason: "Cette page est relativement grande et pourrait bénéficier d'un chargement différé avec React.lazy."
      });
    }
  }
}

/**
 * Analyse les appels API pour identifier les opportunités de mise en cache
 */
function analyzeAPICalls(ast, filePath) {
  const fileName = path.basename(filePath);
  let apiCalls = [];
  
  traverse(ast, {
    // Détecter les appels fetch ou axios
    CallExpression(path) {
      if (path.node.callee) {
        if (path.node.callee.type === 'Identifier' && path.node.callee.name === 'fetch') {
          apiCalls.push({ type: 'fetch', node: path.node });
        } else if (path.node.callee.type === 'MemberExpression' && 
                  path.node.callee.object && path.node.callee.object.name === 'axios') {
          apiCalls.push({ type: 'axios', node: path.node });
        }
      }
    }
  });
  
  // Analyser les appels API pour identifier les opportunités de mise en cache
  if (apiCalls.length > 0) {
    const code = fs.readFileSync(filePath, 'utf-8');
    
    // Vérifier si les appels API utilisent déjà une stratégie de mise en cache
    const hasCacheCheck = code.includes('localStorage') || 
                          code.includes('sessionStorage') || 
                          code.includes('cacheStorage');
    
    if (!hasCacheCheck && apiCalls.length > 0) {
      stats.apiCacheOpportunities++;
      results.apiCacheOpportunities.push({
        file: path.relative(PROJECT_DIR, filePath),
        callCount: apiCalls.length,
        reason: `${apiCalls.length} appels API pourraient bénéficier d'une stratégie de mise en cache.`
      });
    }
  }
}

/**
 * Analyse les performances de rendu
 */
function analyzeRenderPerformance(ast, filePath) {
  const fileName = path.basename(filePath);
  let heavyOperations = [];
  
  traverse(ast, {
    // Détecter les opérations coûteuses dans les rendus
    CallExpression(path) {
      if (path.node.callee && path.node.callee.type === 'MemberExpression') {
        // Détecter les opérations coûteuses comme map, filter, reduce, sort
        if (['map', 'filter', 'reduce', 'sort', 'forEach'].includes(path.node.callee.property.name)) {
          // Vérifier si cette opération est dans un composant React
          let isInRender = false;
          let currentPath = path;
          
          while (currentPath.parentPath) {
            currentPath = currentPath.parentPath;
            if (currentPath.node.type === 'ReturnStatement' && 
                currentPath.findParent(p => p.node.type === 'FunctionDeclaration' || 
                                          p.node.type === 'ArrowFunctionExpression' || 
                                          p.node.type === 'FunctionExpression')) {
              isInRender = true;
              break;
            }
          }
          
          if (isInRender) {
            heavyOperations.push({
              operation: path.node.callee.property.name,
              line: path.node.loc ? path.node.loc.start.line : 'unknown'
            });
          }
        }
      }
    }
  });
  
  if (heavyOperations.length > 0) {
    stats.heavyRenders++;
    results.heavyRenders.push({
      file: path.relative(PROJECT_DIR, filePath),
      operations: heavyOperations,
      reason: `${heavyOperations.length} opérations coûteuses détectées dans le rendu. Envisagez d'utiliser useMemo pour mémoriser ces résultats.`
    });
  }
}

/**
 * Parcourt récursivement un répertoire pour analyser tous les fichiers
 */
function analyzeDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      analyzeDirectory(filePath);
    } else if (/\.(jsx|tsx|js|ts)$/.test(file)) {
      analyzeFile(filePath);
    }
  }
}

/**
 * Génère un rapport HTML avec les résultats de l'analyse
 */
function generateReport() {
  const reportPath = path.join(REPORT_DIR, `performance-report-${new Date().toISOString().replace(/:/g, '-')}.html`);
  
  const reportContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rapport d'analyse des performances - FloDrama</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    h1, h2, h3 {
      color: #2c3e50;
    }
    .summary {
      background-color: #f8f9fa;
      border-radius: 5px;
      padding: 20px;
      margin-bottom: 30px;
    }
    .stat {
      display: flex;
      justify-content: space-between;
      border-bottom: 1px solid #eee;
      padding: 10px 0;
    }
    .section {
      margin-bottom: 30px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 12px;
      text-align: left;
    }
    th {
      background-color: #f2f2f2;
    }
    tr:nth-child(even) {
      background-color: #f9f9f9;
    }
    .file {
      font-family: monospace;
      color: #e83e8c;
    }
    .reason {
      color: #6c757d;
    }
    .empty-message {
      color: #28a745;
      font-style: italic;
    }
  </style>
</head>
<body>
  <h1>Rapport d'analyse des performances - FloDrama</h1>
  <p>Généré le ${new Date().toLocaleString('fr-FR')}</p>
  
  <div class="summary">
    <h2>Résumé</h2>
    <div class="stat">
      <span>Fichiers analysés</span>
      <strong>${stats.filesAnalyzed}</strong>
    </div>
    <div class="stat">
      <span>Composants trouvés</span>
      <strong>${stats.componentsFound}</strong>
    </div>
    <div class="stat">
      <span>Composants à mémoriser</span>
      <strong>${stats.memoizableComponents}</strong>
    </div>
    <div class="stat">
      <span>Fonctions à mémoriser</span>
      <strong>${stats.memoizableFunctions}</strong>
    </div>
    <div class="stat">
      <span>Candidats au chargement différé</span>
      <strong>${stats.lazyLoadCandidates}</strong>
    </div>
    <div class="stat">
      <span>Opportunités de mise en cache API</span>
      <strong>${stats.apiCacheOpportunities}</strong>
    </div>
    <div class="stat">
      <span>Rendus coûteux</span>
      <strong>${stats.heavyRenders}</strong>
    </div>
  </div>
  
  <div class="section">
    <h2>Composants à mémoriser avec React.memo</h2>
    ${results.memoizableComponents.length > 0 ? `
    <table>
      <thead>
        <tr>
          <th>Fichier</th>
          <th>Composant</th>
          <th>Raison</th>
        </tr>
      </thead>
      <tbody>
        ${results.memoizableComponents.map(item => `
        <tr>
          <td class="file">${item.file}</td>
          <td>${item.component}</td>
          <td class="reason">${item.reason}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>
    ` : '<p class="empty-message">Aucun composant à mémoriser trouvé.</p>'}
  </div>
  
  <div class="section">
    <h2>Fonctions à mémoriser avec useCallback/useMemo</h2>
    ${results.memoizableFunctions.length > 0 ? `
    <table>
      <thead>
        <tr>
          <th>Fichier</th>
          <th>Composant</th>
          <th>Nombre</th>
          <th>Raison</th>
        </tr>
      </thead>
      <tbody>
        ${results.memoizableFunctions.map(item => `
        <tr>
          <td class="file">${item.file}</td>
          <td>${item.component}</td>
          <td>${item.count}</td>
          <td class="reason">${item.reason}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>
    ` : '<p class="empty-message">Aucune fonction à mémoriser trouvée.</p>'}
  </div>
  
  <div class="section">
    <h2>Candidats au chargement différé</h2>
    ${results.lazyLoadCandidates.length > 0 ? `
    <table>
      <thead>
        <tr>
          <th>Fichier</th>
          <th>Composant</th>
          <th>Taille</th>
          <th>Raison</th>
        </tr>
      </thead>
      <tbody>
        ${results.lazyLoadCandidates.map(item => `
        <tr>
          <td class="file">${item.file}</td>
          <td>${item.component}</td>
          <td>${item.size}</td>
          <td class="reason">${item.reason}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>
    ` : '<p class="empty-message">Aucun candidat au chargement différé trouvé.</p>'}
  </div>
  
  <div class="section">
    <h2>Opportunités de mise en cache API</h2>
    ${results.apiCacheOpportunities.length > 0 ? `
    <table>
      <thead>
        <tr>
          <th>Fichier</th>
          <th>Nombre d'appels</th>
          <th>Raison</th>
        </tr>
      </thead>
      <tbody>
        ${results.apiCacheOpportunities.map(item => `
        <tr>
          <td class="file">${item.file}</td>
          <td>${item.callCount}</td>
          <td class="reason">${item.reason}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>
    ` : '<p class="empty-message">Aucune opportunité de mise en cache API trouvée.</p>'}
  </div>
  
  <div class="section">
    <h2>Rendus coûteux</h2>
    ${results.heavyRenders.length > 0 ? `
    <table>
      <thead>
        <tr>
          <th>Fichier</th>
          <th>Opérations</th>
          <th>Raison</th>
        </tr>
      </thead>
      <tbody>
        ${results.heavyRenders.map(item => `
        <tr>
          <td class="file">${item.file}</td>
          <td>${item.operations.map(op => `${op.operation} (ligne ${op.line})`).join(', ')}</td>
          <td class="reason">${item.reason}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>
    ` : '<p class="empty-message">Aucun rendu coûteux trouvé.</p>'}
  </div>
  
  <div class="section">
    <h2>Recommandations générales</h2>
    <ul>
      <li>Utilisez <code>React.memo</code> pour les composants qui reçoivent souvent les mêmes props mais sont rendus fréquemment.</li>
      <li>Mémorisez les fonctions de gestion d'événements avec <code>useCallback</code> pour éviter les rendus inutiles des composants enfants.</li>
      <li>Utilisez <code>useMemo</code> pour les calculs coûteux effectués pendant le rendu.</li>
      <li>Implémentez le chargement différé (<code>React.lazy</code>) pour les composants lourds qui ne sont pas nécessaires immédiatement.</li>
      <li>Mettez en cache les résultats d'API qui ne changent pas fréquemment pour réduire les appels réseau.</li>
      <li>Évitez les opérations coûteuses comme <code>map</code>, <code>filter</code>, <code>sort</code> directement dans le rendu.</li>
    </ul>
  </div>
</body>
</html>
  `;
  
  fs.writeFileSync(reportPath, reportContent);
  console.log(`Rapport généré : ${reportPath}`);
  
  return reportPath;
}

// Exécution principale
console.log("Analyse des performances de FloDrama...");
const startTime = performance.now();

// Analyser les répertoires principaux
console.log("Analyse des composants...");
analyzeDirectory(COMPONENTS_DIR);

console.log("Analyse des pages...");
analyzeDirectory(PAGES_DIR);

console.log("Analyse des services...");
analyzeDirectory(SERVICES_DIR);

// Générer le rapport
const reportPath = generateReport();

const endTime = performance.now();
console.log(`Analyse terminée en ${((endTime - startTime) / 1000).toFixed(2)} secondes.`);
console.log(`Rapport disponible : ${reportPath}`);

// Résumé des résultats
console.log("\nRésumé des résultats :");
console.log(`- ${stats.filesAnalyzed} fichiers analysés`);
console.log(`- ${stats.componentsFound} composants trouvés`);
console.log(`- ${stats.memoizableComponents} composants à mémoriser`);
console.log(`- ${stats.memoizableFunctions} fonctions à mémoriser`);
console.log(`- ${stats.lazyLoadCandidates} candidats au chargement différé`);
console.log(`- ${stats.apiCacheOpportunities} opportunités de mise en cache API`);
console.log(`- ${stats.heavyRenders} rendus coûteux`);
