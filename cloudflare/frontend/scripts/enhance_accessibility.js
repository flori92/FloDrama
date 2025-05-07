/**
 * Script d'amélioration de l'accessibilité pour FloDrama
 * 
 * Ce script analyse l'application pour identifier et corriger automatiquement
 * les problèmes d'accessibilité courants dans les composants React.
 */

const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;
const t = require('@babel/types');

// Configuration
const PROJECT_DIR = path.resolve(__dirname, '..');
const SRC_DIR = path.join(PROJECT_DIR, 'src');
const COMPONENTS_DIR = path.join(SRC_DIR, 'components');
const PAGES_DIR = path.join(SRC_DIR, 'pages');
const REPORT_DIR = path.join(PROJECT_DIR, 'accessibility-reports');

// Créer le répertoire des rapports s'il n'existe pas
if (!fs.existsSync(REPORT_DIR)) {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
}

// Statistiques
const stats = {
  filesAnalyzed: 0,
  issuesFound: 0,
  issuesFixed: 0,
  missingAlt: 0,
  missingAriaLabels: 0,
  missingRoles: 0,
  missingTabIndex: 0,
  contrastIssues: 0,
  semanticHTML: 0
};

// Résultats détaillés
const issues = [];

/**
 * Analyse un fichier pour détecter les problèmes d'accessibilité
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
    
    let modified = false;
    
    // Analyser et corriger les problèmes d'accessibilité
    traverse(ast, {
      // Détecter les images sans attribut alt
      JSXOpeningElement(path) {
        if (path.node.name.type === 'JSXIdentifier') {
          const elementName = path.node.name.name;
          
          // Vérifier les images sans attribut alt
          if (elementName === 'img' || elementName === 'OptimizedImage') {
            const hasAlt = path.node.attributes.some(attr => 
              attr.type === 'JSXAttribute' && attr.name.name === 'alt'
            );
            
            if (!hasAlt) {
              stats.missingAlt++;
              stats.issuesFound++;
              
              // Trouver le nom de l'image ou une description basée sur le contexte
              let imgSrc = '';
              let imgDescription = 'Image';
              
              const srcAttr = path.node.attributes.find(attr => 
                attr.type === 'JSXAttribute' && 
                (attr.name.name === 'src' || attr.name.name === 'source')
              );
              
              if (srcAttr && srcAttr.value && srcAttr.value.type === 'StringLiteral') {
                  imgSrc = srcAttr.value.value;
                  // Extraire le nom du fichier de l'URL
                  const fileName = imgSrc.split('/').pop()?.split('.')[0] || '';
                  if (fileName) {
                    // Convertir camelCase ou snake_case en texte lisible
                    imgDescription = fileName
                      .replace(/([A-Z])/g, ' $1')
                      .replace(/_/g, ' ')
                      .replace(/-/g, ' ')
                      .trim();
                    
                    // Mettre la première lettre en majuscule
                    imgDescription = imgDescription.charAt(0).toUpperCase() + imgDescription.slice(1);
                  }
                }
              }
              
              // Ajouter l'attribut alt
              path.node.attributes.push(
                t.jsxAttribute(
                  t.jsxIdentifier('alt'),
                  t.stringLiteral(imgDescription)
                )
              );
              
              modified = true;
              stats.issuesFixed++;
              
              issues.push({
                file: relativePath,
                line: path.node.loc ? path.node.loc.start.line : 'unknown',
                issue: 'Image sans attribut alt',
                fix: `Ajout de alt="${imgDescription}"`,
                severity: 'Élevée'
              });
            }
          }
          
          // Vérifier les boutons sans texte accessible
          if (elementName === 'button') {
            const hasChildren = path.parent.children && path.parent.children.length > 0;
            const hasAriaLabel = path.node.attributes.some(attr => 
              attr.type === 'JSXAttribute' && 
              (attr.name.name === 'aria-label' || attr.name.name === 'aria-labelledby')
            );
            
            // Si le bouton n'a pas de contenu textuel et pas d'aria-label
            if (!hasChildren && !hasAriaLabel) {
              stats.missingAriaLabels++;
              stats.issuesFound++;
              
              // Trouver un contexte pour le bouton
              let buttonContext = 'Bouton';
              
              // Chercher des indices dans les props comme onClick, className, etc.
              const onClickAttr = path.node.attributes.find(attr => 
                attr.type === 'JSXAttribute' && attr.name.name === 'onClick'
              );
              
              const classNameAttr = path.node.attributes.find(attr => 
                attr.type === 'JSXAttribute' && attr.name.name === 'className'
              );
              
              if (onClickAttr && onClickAttr.value && onClickAttr.value.type === 'JSXExpressionContainer') {
                const onClickValue = onClickAttr.value.expression;
                if (onClickValue.type === 'Identifier') {
                  buttonContext = onClickValue.name
                    .replace(/^handle/, '')
                    .replace(/^on/, '')
                    .replace(/([A-Z])/g, ' $1')
                    .trim();
                }
              } else if (classNameAttr && classNameAttr.value) {
                let className = '';
                if (classNameAttr.value.type === 'StringLiteral') {
                  className = classNameAttr.value.value;
                }
                
                if (className.includes('close')) {
                  buttonContext = 'Fermer';
                } else if (className.includes('menu')) {
                  buttonContext = 'Menu';
                } else if (className.includes('search')) {
                  buttonContext = 'Rechercher';
                } else if (className.includes('play')) {
                  buttonContext = 'Lire';
                } else if (className.includes('pause')) {
                  buttonContext = 'Pause';
                } else if (className.includes('next')) {
                  buttonContext = 'Suivant';
                } else if (className.includes('prev')) {
                  buttonContext = 'Précédent';
                }
              }
              
              // Ajouter l'attribut aria-label
              path.node.attributes.push(
                t.jsxAttribute(
                  t.jsxIdentifier('aria-label'),
                  t.stringLiteral(buttonContext)
                )
              );
              
              modified = true;
              stats.issuesFixed++;
              
              issues.push({
                file: relativePath,
                line: path.node.loc ? path.node.loc.start.line : 'unknown',
                issue: 'Bouton sans texte accessible',
                fix: `Ajout de aria-label="${buttonContext}"`,
                severity: 'Élevée'
              });
            }
          }
          
          // Vérifier les éléments interactifs sans rôle approprié
          if (['div', 'span'].includes(elementName)) {
            const hasOnClick = path.node.attributes.some(attr => 
              attr.type === 'JSXAttribute' && attr.name.name === 'onClick'
            );
            
            const hasRole = path.node.attributes.some(attr => 
              attr.type === 'JSXAttribute' && attr.name.name === 'role'
            );
            
            const hasTabIndex = path.node.attributes.some(attr => 
              attr.type === 'JSXAttribute' && attr.name.name === 'tabIndex'
            );
            
            if (hasOnClick && !hasRole) {
              stats.missingRoles++;
              stats.issuesFound++;
              
              // Ajouter l'attribut role
              path.node.attributes.push(
                t.jsxAttribute(
                  t.jsxIdentifier('role'),
                  t.stringLiteral('button')
                )
              );
              
              modified = true;
              stats.issuesFixed++;
              
              issues.push({
                file: relativePath,
                line: path.node.loc ? path.node.loc.start.line : 'unknown',
                issue: `Élément <${elementName}> cliquable sans rôle approprié`,
                fix: 'Ajout de role="button"',
                severity: 'Moyenne'
              });
            }
            
            if (hasOnClick && !hasTabIndex) {
              stats.missingTabIndex++;
              stats.issuesFound++;
              
              // Ajouter l'attribut tabIndex
              path.node.attributes.push(
                t.jsxAttribute(
                  t.jsxIdentifier('tabIndex'),
                  t.jsxExpressionContainer(t.numericLiteral(0))
                )
              );
              
              modified = true;
              stats.issuesFixed++;
              
              issues.push({
                file: relativePath,
                line: path.node.loc ? path.node.loc.start.line : 'unknown',
                issue: `Élément <${elementName}> cliquable sans tabIndex`,
                fix: 'Ajout de tabIndex={0}',
                severity: 'Moyenne'
              });
            }
          }
          
          // Vérifier les éléments sémantiques mal utilisés
          if (elementName === 'div') {
            // Vérifier si le div pourrait être remplacé par un élément sémantique
            const classNameAttr = path.node.attributes.find(attr => 
              attr.type === 'JSXAttribute' && attr.name.name === 'className'
            );
            
            if (classNameAttr && classNameAttr.value && classNameAttr.value.type === 'StringLiteral') {
              const className = classNameAttr.value.value.toLowerCase();
              let suggestedElement = null;
              
              if (className.includes('header') || className.includes('navbar')) {
                suggestedElement = 'header';
              } else if (className.includes('footer')) {
                suggestedElement = 'footer';
              } else if (className.includes('nav') || className.includes('menu')) {
                suggestedElement = 'nav';
              } else if (className.includes('main') || className.includes('content')) {
                suggestedElement = 'main';
              } else if (className.includes('section')) {
                suggestedElement = 'section';
              } else if (className.includes('article')) {
                suggestedElement = 'article';
              } else if (className.includes('aside') || className.includes('sidebar')) {
                suggestedElement = 'aside';
              }
              
              if (suggestedElement) {
                stats.semanticHTML++;
                stats.issuesFound++;
                
                issues.push({
                  file: relativePath,
                  line: path.node.loc ? path.node.loc.start.line : 'unknown',
                  issue: `Utilisation d'un <div> au lieu d'un élément sémantique`,
                  fix: `Remplacer <div> par <${suggestedElement}>`,
                  severity: 'Faible'
                });
                
                // Ne pas modifier automatiquement, car cela pourrait casser le style
              }
            }
          }
        }
      }
    });
    
    // Sauvegarder les modifications si nécessaire
    if (modified) {
      const output = generate(ast, { retainLines: true }, code);
      fs.writeFileSync(filePath, output.code);
      console.log(`Modifications sauvegardées dans ${relativePath}`);
    }
    
  } catch (error) {
    console.error(`Erreur lors de l'analyse de ${relativePath}:`, error.message);
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
    } else if (/\.(jsx|tsx)$/.test(file)) {
      analyzeFile(filePath);
    }
  }
}

/**
 * Génère un rapport HTML avec les résultats de l'analyse
 */
function generateReport() {
  const reportPath = path.join(REPORT_DIR, `accessibility-report-${new Date().toISOString().replace(/:/g, '-')}.html`);
  
  const reportContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rapport d'accessibilité - FloDrama</title>
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
    .severity-high {
      color: #dc3545;
      font-weight: bold;
    }
    .severity-medium {
      color: #fd7e14;
      font-weight: bold;
    }
    .severity-low {
      color: #6c757d;
    }
    .fix {
      color: #28a745;
      font-style: italic;
    }
    .empty-message {
      color: #28a745;
      font-style: italic;
    }
  </style>
</head>
<body>
  <h1>Rapport d'accessibilité - FloDrama</h1>
  <p>Généré le ${new Date().toLocaleString('fr-FR')}</p>
  
  <div class="summary">
    <h2>Résumé</h2>
    <div class="stat">
      <span>Fichiers analysés</span>
      <strong>${stats.filesAnalyzed}</strong>
    </div>
    <div class="stat">
      <span>Problèmes trouvés</span>
      <strong>${stats.issuesFound}</strong>
    </div>
    <div class="stat">
      <span>Problèmes corrigés automatiquement</span>
      <strong>${stats.issuesFixed}</strong>
    </div>
    <div class="stat">
      <span>Images sans attribut alt</span>
      <strong>${stats.missingAlt}</strong>
    </div>
    <div class="stat">
      <span>Éléments sans aria-label</span>
      <strong>${stats.missingAriaLabels}</strong>
    </div>
    <div class="stat">
      <span>Éléments sans rôle approprié</span>
      <strong>${stats.missingRoles}</strong>
    </div>
    <div class="stat">
      <span>Éléments sans tabIndex</span>
      <strong>${stats.missingTabIndex}</strong>
    </div>
    <div class="stat">
      <span>Éléments sémantiques suggérés</span>
      <strong>${stats.semanticHTML}</strong>
    </div>
  </div>
  
  <div class="section">
    <h2>Problèmes détectés</h2>
    ${issues.length > 0 ? `
    <table>
      <thead>
        <tr>
          <th>Fichier</th>
          <th>Ligne</th>
          <th>Problème</th>
          <th>Correction</th>
          <th>Sévérité</th>
        </tr>
      </thead>
      <tbody>
        ${issues.map(issue => `
        <tr>
          <td class="file">${issue.file}</td>
          <td>${issue.line}</td>
          <td>${issue.issue}</td>
          <td class="fix">${issue.fix}</td>
          <td class="${issue.severity === 'Élevée' ? 'severity-high' : (issue.severity === 'Moyenne' ? 'severity-medium' : 'severity-low')}">${issue.severity}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>
    ` : '<p class="empty-message">Aucun problème d\'accessibilité détecté.</p>'}
  </div>
  
  <div class="section">
    <h2>Recommandations générales</h2>
    <ul>
      <li>Assurez-vous que toutes les images ont des attributs <code>alt</code> descriptifs.</li>
      <li>Utilisez des éléments sémantiques HTML5 (<code>header</code>, <code>nav</code>, <code>main</code>, <code>section</code>, etc.) plutôt que des <code>div</code> génériques.</li>
      <li>Assurez-vous que tous les éléments interactifs sont accessibles au clavier.</li>
      <li>Utilisez des attributs ARIA appropriés pour améliorer l'accessibilité des composants complexes.</li>
      <li>Vérifiez le contraste des couleurs pour assurer la lisibilité pour tous les utilisateurs.</li>
      <li>Testez votre application avec un lecteur d'écran pour vérifier l'expérience des utilisateurs malvoyants.</li>
      <li>Assurez-vous que les formulaires sont correctement étiquetés et que les erreurs sont clairement communiquées.</li>
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
console.log("Analyse de l'accessibilité de FloDrama...");

// Analyser les répertoires principaux
console.log("Analyse des composants...");
analyzeDirectory(COMPONENTS_DIR);

console.log("Analyse des pages...");
analyzeDirectory(PAGES_DIR);

// Générer le rapport
const reportPath = generateReport();

console.log(`Analyse terminée.`);
console.log(`Rapport disponible : ${reportPath}`);

// Résumé des résultats
console.log("\nRésumé des résultats :");
console.log(`- ${stats.filesAnalyzed} fichiers analysés`);
console.log(`- ${stats.issuesFound} problèmes trouvés`);
console.log(`- ${stats.issuesFixed} problèmes corrigés automatiquement`);
console.log(`- ${stats.missingAlt} images sans attribut alt`);
console.log(`- ${stats.missingAriaLabels} éléments sans aria-label`);
console.log(`- ${stats.missingRoles} éléments sans rôle approprié`);
console.log(`- ${stats.missingTabIndex} éléments sans tabIndex`);
console.log(`- ${stats.semanticHTML} éléments sémantiques suggérés`);
