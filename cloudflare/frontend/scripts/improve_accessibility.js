/**
 * Script d'amélioration de l'accessibilité pour FloDrama
 * 
 * Ce script analyse le code source et suggère des améliorations pour l'accessibilité
 * en se basant sur les bonnes pratiques WCAG 2.1.
 */

const fs = require('fs');
const path = require('path');
const { parse } = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const { JSDOM } = require('jsdom');

// Configuration
const SRC_DIR = path.join(__dirname, '../src');
const REPORT_PATH = path.join(__dirname, '../accessibility-reports');

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
  const reportFile = path.join(REPORT_PATH, `accessibility-report-${formatDateTime()}.json`);
  fs.writeFileSync(reportFile, JSON.stringify(results, null, 2));
  console.log(`Rapport généré: ${reportFile}`);
  
  // Générer un rapport HTML plus lisible
  const htmlReportFile = path.join(REPORT_PATH, `accessibility-report-${formatDateTime()}.html`);
  const htmlContent = generateHtmlReport(results);
  fs.writeFileSync(htmlReportFile, htmlContent);
  console.log(`Rapport HTML généré: ${htmlReportFile}`);
};

// Fonction pour générer un rapport HTML
const generateHtmlReport = (results) => {
  const issuesByFile = {};
  
  // Regrouper les problèmes par fichier
  results.issues.forEach(issue => {
    if (!issuesByFile[issue.file]) {
      issuesByFile[issue.file] = [];
    }
    issuesByFile[issue.file].push(issue);
  });
  
  // Générer le contenu HTML
  let html = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Rapport d'accessibilité FloDrama</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }
        h1 {
          color: #2563eb;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 10px;
        }
        h2 {
          color: #4b5563;
          margin-top: 30px;
        }
        .summary {
          background-color: #f3f4f6;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        .file-section {
          margin-bottom: 30px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
        }
        .file-header {
          background-color: #f9fafb;
          padding: 10px 15px;
          font-weight: bold;
          border-bottom: 1px solid #e5e7eb;
        }
        .issue {
          padding: 15px;
          border-bottom: 1px solid #e5e7eb;
        }
        .issue:last-child {
          border-bottom: none;
        }
        .issue-type {
          font-weight: bold;
          color: #dc2626;
        }
        .issue-location {
          font-family: monospace;
          background-color: #f3f4f6;
          padding: 2px 5px;
          border-radius: 4px;
        }
        .issue-description {
          margin-top: 5px;
        }
        .issue-suggestion {
          margin-top: 10px;
          padding: 10px;
          background-color: #ecfdf5;
          border-left: 4px solid #10b981;
          border-radius: 4px;
        }
        .severity-high {
          color: #dc2626;
        }
        .severity-medium {
          color: #f59e0b;
        }
        .severity-low {
          color: #3b82f6;
        }
      </style>
    </head>
    <body>
      <h1>Rapport d'accessibilité FloDrama</h1>
      
      <div class="summary">
        <h2>Résumé</h2>
        <p>Date du rapport: ${new Date().toLocaleString('fr-FR')}</p>
        <p>Nombre total de problèmes: ${results.issues.length}</p>
        <p>Fichiers analysés: ${results.filesAnalyzed}</p>
        <p>Problèmes par sévérité:</p>
        <ul>
          <li><span class="severity-high">Élevée:</span> ${results.issues.filter(i => i.severity === 'high').length}</li>
          <li><span class="severity-medium">Moyenne:</span> ${results.issues.filter(i => i.severity === 'medium').length}</li>
          <li><span class="severity-low">Faible:</span> ${results.issues.filter(i => i.severity === 'low').length}</li>
        </ul>
      </div>
  `;
  
  // Ajouter les problèmes par fichier
  Object.keys(issuesByFile).forEach(file => {
    const issues = issuesByFile[file];
    
    html += `
      <div class="file-section">
        <div class="file-header">${file}</div>
    `;
    
    issues.forEach(issue => {
      html += `
        <div class="issue">
          <div class="issue-type">
            <span class="severity-${issue.severity}">[${issue.severity.toUpperCase()}]</span> ${issue.type}
          </div>
          <div class="issue-location">Ligne ${issue.line}, Colonne ${issue.column}</div>
          <div class="issue-description">${issue.description}</div>
          <div class="issue-suggestion">${issue.suggestion}</div>
        </div>
      `;
    });
    
    html += `</div>`;
  });
  
  html += `
    </body>
    </html>
  `;
  
  return html;
};

// Fonction pour analyser un fichier JSX/TSX
const analyzeJsxFile = (filePath) => {
  const issues = [];
  const content = fs.readFileSync(filePath, 'utf-8');
  
  try {
    // Parser le code source
    const ast = parse(content, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript'],
      tokens: true
    });
    
    // Traverser l'AST pour trouver les problèmes d'accessibilité
    traverse(ast, {
      JSXOpeningElement(path) {
        const node = path.node;
        const tagName = node.name.name;
        
        // Vérifier les éléments img sans alt
        if (tagName === 'img') {
          const hasAlt = node.attributes.some(attr => 
            attr.type === 'JSXAttribute' && attr.name.name === 'alt'
          );
          
          if (!hasAlt) {
            issues.push({
              file: filePath,
              type: 'Image sans attribut alt',
              line: node.loc.start.line,
              column: node.loc.start.column,
              severity: 'high',
              description: 'Les images doivent avoir un attribut alt pour être accessibles aux lecteurs d\'écran.',
              suggestion: 'Ajouter un attribut alt descriptif à l\'image.'
            });
          }
        }
        
        // Vérifier les éléments interactifs sans attributs d'accessibilité
        if (tagName === 'button' || tagName === 'a') {
          const hasAccessibleName = node.attributes.some(attr => 
            attr.type === 'JSXAttribute' && 
            (attr.name.name === 'aria-label' || attr.name.name === 'aria-labelledby')
          );
          
          const hasChildren = path.parent.children && path.parent.children.length > 0;
          
          if (!hasAccessibleName && !hasChildren) {
            issues.push({
              file: filePath,
              type: `Élément ${tagName} sans nom accessible`,
              line: node.loc.start.line,
              column: node.loc.start.column,
              severity: 'high',
              description: `Les éléments ${tagName} doivent avoir un texte ou un attribut aria-label pour être accessibles.`,
              suggestion: 'Ajouter du texte à l\'élément ou un attribut aria-label.'
            });
          }
        }
        
        // Vérifier les éléments avec des gestionnaires d'événements clavier sans rôle
        const hasKeyboardHandler = node.attributes.some(attr => 
          attr.type === 'JSXAttribute' && 
          (attr.name.name === 'onKeyDown' || attr.name.name === 'onKeyUp' || attr.name.name === 'onKeyPress')
        );
        
        const hasRole = node.attributes.some(attr => 
          attr.type === 'JSXAttribute' && attr.name.name === 'role'
        );
        
        if (hasKeyboardHandler && !hasRole && tagName !== 'button' && tagName !== 'a' && tagName !== 'input') {
          issues.push({
            file: filePath,
            type: 'Élément avec gestionnaire clavier sans rôle',
            line: node.loc.start.line,
            column: node.loc.start.column,
            severity: 'medium',
            description: 'Les éléments avec des gestionnaires d\'événements clavier doivent avoir un rôle ARIA approprié.',
            suggestion: 'Ajouter un attribut role approprié à l\'élément.'
          });
        }
        
        // Vérifier les contrastes de couleur (approximatif, nécessite une analyse plus poussée)
        const hasStyle = node.attributes.some(attr => 
          attr.type === 'JSXAttribute' && attr.name.name === 'style'
        );
        
        if (hasStyle) {
          const styleAttr = node.attributes.find(attr => 
            attr.type === 'JSXAttribute' && attr.name.name === 'style'
          );
          
          if (styleAttr && styleAttr.value.type === 'JSXExpressionContainer') {
            const styleObj = styleAttr.value.expression;
            
            if (styleObj.type === 'ObjectExpression') {
              const hasColorProps = styleObj.properties.some(prop => 
                prop.key.name === 'color' || prop.key.name === 'backgroundColor'
              );
              
              if (hasColorProps) {
                issues.push({
                  file: filePath,
                  type: 'Contraste de couleur potentiellement insuffisant',
                  line: node.loc.start.line,
                  column: node.loc.start.column,
                  severity: 'medium',
                  description: 'Les couleurs de texte et d\'arrière-plan devraient avoir un contraste suffisant pour être lisibles.',
                  suggestion: 'Vérifier que le ratio de contraste est d\'au moins 4.5:1 pour le texte normal et 3:1 pour le texte large.'
                });
              }
            }
          }
        }
      }
    });
  } catch (error) {
    console.error(`Erreur lors de l'analyse de ${filePath}:`, error);
  }
  
  return issues;
};

// Fonction pour analyser un fichier CSS
const analyzeCssFile = (filePath) => {
  const issues = [];
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Vérifier les tailles de police trop petites
  const fontSizeRegex = /font-size:\s*(\d+)px/g;
  let match;
  
  while ((match = fontSizeRegex.exec(content)) !== null) {
    const fontSize = parseInt(match[1], 10);
    const line = content.substring(0, match.index).split('\n').length;
    
    if (fontSize < 12) {
      issues.push({
        file: filePath,
        type: 'Taille de police trop petite',
        line,
        column: 1,
        severity: 'medium',
        description: `La taille de police de ${fontSize}px est trop petite et peut être difficile à lire.`,
        suggestion: 'Utiliser une taille de police d\'au moins 12px ou utiliser des unités relatives comme rem ou em.'
      });
    }
  }
  
  // Vérifier l'utilisation de :hover sans :focus
  const hoverRegex = /([^\s]+):hover\s*{/g;
  
  while ((match = hoverRegex.exec(content)) !== null) {
    const selector = match[1];
    const line = content.substring(0, match.index).split('\n').length;
    
    // Vérifier si le même sélecteur a un :focus
    const focusRegex = new RegExp(`${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}:focus`, 'g');
    if (!focusRegex.test(content)) {
      issues.push({
        file: filePath,
        type: 'Utilisation de :hover sans :focus',
        line,
        column: 1,
        severity: 'medium',
        description: 'Les styles appliqués au survol (:hover) devraient également être appliqués au focus (:focus) pour les utilisateurs clavier.',
        suggestion: `Ajouter une règle ${selector}:focus avec les mêmes styles que ${selector}:hover.`
      });
    }
  }
  
  return issues;
};

// Fonction pour trouver récursivement tous les fichiers dans un répertoire
const findFiles = (dir, extensions) => {
  let results = [];
  
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const itemPath = path.join(dir, item);
    const stat = fs.statSync(itemPath);
    
    if (stat.isDirectory()) {
      results = results.concat(findFiles(itemPath, extensions));
    } else if (extensions.includes(path.extname(itemPath).toLowerCase())) {
      results.push(itemPath);
    }
  }
  
  return results;
};

// Fonction principale
const main = () => {
  console.log('Analyse d\'accessibilité en cours...');
  
  // Trouver tous les fichiers à analyser
  const jsxFiles = findFiles(SRC_DIR, ['.jsx', '.tsx']);
  const cssFiles = findFiles(SRC_DIR, ['.css']);
  
  console.log(`Fichiers JSX/TSX trouvés: ${jsxFiles.length}`);
  console.log(`Fichiers CSS trouvés: ${cssFiles.length}`);
  
  // Analyser les fichiers
  let allIssues = [];
  
  jsxFiles.forEach(file => {
    const issues = analyzeJsxFile(file);
    allIssues = allIssues.concat(issues);
  });
  
  cssFiles.forEach(file => {
    const issues = analyzeCssFile(file);
    allIssues = allIssues.concat(issues);
  });
  
  // Générer le rapport
  const results = {
    timestamp: new Date().toISOString(),
    filesAnalyzed: jsxFiles.length + cssFiles.length,
    issues: allIssues
  };
  
  generateReport(results);
  
  // Afficher un résumé
  console.log('\nRésumé de l\'analyse:');
  console.log(`Total des problèmes trouvés: ${allIssues.length}`);
  console.log(`Problèmes de sévérité élevée: ${allIssues.filter(i => i.severity === 'high').length}`);
  console.log(`Problèmes de sévérité moyenne: ${allIssues.filter(i => i.severity === 'medium').length}`);
  console.log(`Problèmes de sévérité faible: ${allIssues.filter(i => i.severity === 'low').length}`);
};

// Exécuter le script
main();
