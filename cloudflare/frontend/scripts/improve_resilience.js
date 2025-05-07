/**
 * Script d'amélioration de la résilience pour FloDrama
 * 
 * Ce script analyse et améliore la résilience de l'application en :
 * - Ajoutant des mécanismes de récupération d'erreur
 * - Implémentant des stratégies de retry pour les appels API
 * - Améliorant la gestion des timeouts
 * - Mettant en place un système de surveillance des erreurs
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
const SERVICES_DIR = path.join(SRC_DIR, 'services');
const COMPONENTS_DIR = path.join(SRC_DIR, 'components');
const PAGES_DIR = path.join(SRC_DIR, 'pages');
const REPORT_DIR = path.join(PROJECT_DIR, 'resilience-reports');

// Créer le répertoire des rapports s'il n'existe pas
if (!fs.existsSync(REPORT_DIR)) {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
}

// Statistiques
const stats = {
  filesAnalyzed: 0,
  issuesFound: 0,
  issuesFixed: 0,
  apiCallsWithoutErrorHandling: 0,
  apiCallsWithoutRetry: 0,
  apiCallsWithoutTimeout: 0,
  componentsWithoutErrorBoundaries: 0,
  missingFallbackContent: 0
};

// Résultats détaillés
const issues = [];

/**
 * Analyse un fichier pour détecter les problèmes de résilience
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
    
    // Analyser le code pour les problèmes de résilience
    traverse(ast, {
      // Détecter les appels API sans gestion d'erreur
      CallExpression(path) {
        // Vérifier si c'est un appel fetch ou axios
        const isApiCall = 
          (path.node.callee.type === 'Identifier' && path.node.callee.name === 'fetch') ||
          (path.node.callee.type === 'MemberExpression' && 
           path.node.callee.object && path.node.callee.object.name === 'axios');
        
        if (isApiCall) {
          // Vérifier si l'appel API est dans un try/catch
          let hasTryCatch = false;
          let currentPath = path;
          
          while (currentPath.parentPath) {
            currentPath = currentPath.parentPath;
            if (currentPath.node.type === 'TryStatement') {
              hasTryCatch = true;
              break;
            }
          }
          
          // Vérifier si l'appel API a un .catch() pour les promesses
          let hasCatch = false;
          currentPath = path;
          
          while (currentPath.parentPath) {
            currentPath = currentPath.parentPath;
            if (currentPath.node.type === 'MemberExpression' && 
                currentPath.node.property && 
                currentPath.node.property.name === 'catch') {
              hasCatch = true;
              break;
            }
          }
          
          if (!hasTryCatch && !hasCatch) {
            stats.apiCallsWithoutErrorHandling++;
            stats.issuesFound++;
            
            issues.push({
              file: relativePath,
              line: path.node.loc ? path.node.loc.start.line : 'unknown',
              issue: 'Appel API sans gestion d\'erreur',
              fix: 'Ajouter un bloc try/catch ou une méthode .catch()',
              severity: 'Élevée'
            });
          }
          
          // Vérifier si l'appel API a un timeout
          let hasTimeout = false;
          
          // Vérifier si c'est un appel à fetchWithTimeout
          if (path.node.callee.type === 'Identifier' && path.node.callee.name === 'fetchWithTimeout') {
            hasTimeout = true;
          }
          
          // Vérifier si axios a une configuration de timeout
          if (path.node.callee.type === 'MemberExpression' && 
              path.node.callee.object && 
              path.node.callee.object.name === 'axios' &&
              path.node.arguments.length > 1 && 
              path.node.arguments[1].type === 'ObjectExpression') {
              
              const configObject = path.node.arguments[1];
              hasTimeout = configObject.properties.some(prop => 
                prop.key.name === 'timeout'
              );
            }
          }
          
          if (!hasTimeout) {
            stats.apiCallsWithoutTimeout++;
            stats.issuesFound++;
            
            issues.push({
              file: relativePath,
              line: path.node.loc ? path.node.loc.start.line : 'unknown',
              issue: 'Appel API sans timeout',
              fix: 'Utiliser fetchWithTimeout ou ajouter une configuration de timeout',
              severity: 'Moyenne'
            });
          }
          
          // Vérifier si l'appel API a une stratégie de retry
          let hasRetry = false;
          
          // Vérifier le contexte pour des mots-clés liés au retry
          const fileContent = fs.readFileSync(filePath, 'utf-8');
          const functionContent = fileContent.substring(
            path.node.loc ? path.node.loc.start.offset : 0,
            path.node.loc ? path.node.loc.end.offset + 200 : fileContent.length
          );
          
          hasRetry = /retry|backoff|tentative|réessayer/i.test(functionContent);
          
          if (!hasRetry) {
            stats.apiCallsWithoutRetry++;
            stats.issuesFound++;
            
            issues.push({
              file: relativePath,
              line: path.node.loc ? path.node.loc.start.line : 'unknown',
              issue: 'Appel API sans stratégie de retry',
              fix: 'Implémenter une stratégie de retry avec backoff exponentiel',
              severity: 'Moyenne'
            });
          }
        }
      },
      
      // Détecter les composants sans contenu de fallback
      JSXElement(path) {
        // Vérifier si c'est un composant qui charge des données
        const hasDataLoading = path.toString().includes('loading') || 
                              path.toString().includes('isLoading') || 
                              path.toString().includes('chargement');
        
        // Vérifier si le composant a un contenu de fallback
        const hasConditionalRendering = path.toString().includes('?') || 
                                       path.toString().includes('&&') || 
                                       path.toString().includes('||');
        
        // Vérifier si le composant utilise un état d'erreur
        const hasErrorState = path.toString().includes('error') || 
                             path.toString().includes('erreur');
        
        if (hasDataLoading && (!hasConditionalRendering || !hasErrorState)) {
          stats.missingFallbackContent++;
          stats.issuesFound++;
          
          issues.push({
            file: relativePath,
            line: path.node.loc ? path.node.loc.start.line : 'unknown',
            issue: 'Composant sans contenu de fallback pour les erreurs',
            fix: 'Ajouter un rendu conditionnel pour gérer les états d\'erreur',
            severity: 'Moyenne'
          });
        }
      }
    });
    
    // Analyser si le fichier est un composant React sans ErrorBoundary
    if (/\.(jsx|tsx)$/.test(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const isComponent = /function\s+\w+\s*\(.*\)\s*{[\s\S]*return\s*\(/i.test(fileContent) || 
                         /const\s+\w+\s*=\s*\(.*\)\s*=>\s*{[\s\S]*return\s*\(/i.test(fileContent);
      
      if (isComponent) {
        const hasErrorBoundary = fileContent.includes('ErrorBoundary') || 
                                fileContent.includes('componentDidCatch') || 
                                fileContent.includes('getDerivedStateFromError');
        
        if (!hasErrorBoundary) {
          stats.componentsWithoutErrorBoundaries++;
          stats.issuesFound++;
          
          issues.push({
            file: relativePath,
            issue: 'Composant sans ErrorBoundary',
            fix: 'Envelopper le composant avec un ErrorBoundary pour capturer les erreurs de rendu',
            severity: 'Élevée'
          });
        }
      }
    }
    
  } catch (error) {
    console.error(`Erreur lors de l'analyse de ${relativePath}:`, error.message);
  }
}

/**
 * Crée un composant ErrorBoundary s'il n'existe pas déjà
 */
function createErrorBoundaryComponent() {
  const errorBoundaryPath = path.join(COMPONENTS_DIR, 'ErrorBoundary.tsx');
  
  if (!fs.existsSync(errorBoundaryPath)) {
    console.log("Création du composant ErrorBoundary...");
    
    const errorBoundaryContent = `import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Composant ErrorBoundary pour capturer les erreurs de rendu
 * et afficher un contenu de fallback.
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("Erreur capturée par ErrorBoundary:", error, errorInfo);
    
    // Appeler le gestionnaire d'erreur personnalisé si fourni
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
    
    // Enregistrer l'erreur dans un service de surveillance
    // TODO: Implémenter un service de surveillance des erreurs
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Utiliser le fallback personnalisé ou afficher un message d'erreur par défaut
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <div className="error-boundary">
          <h2>Une erreur est survenue</h2>
          <p>Nous sommes désolés pour ce problème. Veuillez rafraîchir la page ou réessayer plus tard.</p>
          <button 
            onClick={() => this.setState({ hasError: false, error: null })}
            className="retry-button"
          >
            Réessayer
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
`;
    
    fs.writeFileSync(errorBoundaryPath, errorBoundaryContent);
    console.log("Composant ErrorBoundary créé avec succès.");
  } else {
    console.log("Le composant ErrorBoundary existe déjà.");
  }
}

/**
 * Crée un service de surveillance des erreurs s'il n'existe pas déjà
 */
function createErrorMonitoringService() {
  const errorServicePath = path.join(SERVICES_DIR, 'errorMonitoringService.ts');
  
  if (!fs.existsSync(errorServicePath)) {
    console.log("Création du service de surveillance des erreurs...");
    
    const errorServiceContent = `/**
 * Service de surveillance des erreurs pour FloDrama
 * 
 * Ce service permet de centraliser la gestion des erreurs, leur journalisation,
 * et potentiellement leur envoi à un service externe.
 */

// Configuration
const ERROR_STORAGE_KEY = 'flodrama_errors';
const MAX_STORED_ERRORS = 50;

// Types
interface ErrorData {
  message: string;
  stack?: string;
  componentStack?: string;
  timestamp: number;
  url: string;
  userAgent: string;
}

/**
 * Capture et enregistre une erreur
 */
export function captureError(error: Error, componentStack?: string): void {
  console.error('Erreur capturée:', error);
  
  const errorData: ErrorData = {
    message: error.message,
    stack: error.stack,
    componentStack,
    timestamp: Date.now(),
    url: window.location.href,
    userAgent: navigator.userAgent
  };
  
  // Stocker l'erreur localement
  storeError(errorData);
  
  // TODO: Envoyer l'erreur à un service externe si nécessaire
  // sendErrorToExternalService(errorData);
}

/**
 * Stocke l'erreur dans le localStorage
 */
function storeError(errorData: ErrorData): void {
  try {
    // Récupérer les erreurs existantes
    const storedErrorsJson = localStorage.getItem(ERROR_STORAGE_KEY);
    const storedErrors: ErrorData[] = storedErrorsJson ? JSON.parse(storedErrorsJson) : [];
    
    // Ajouter la nouvelle erreur
    storedErrors.unshift(errorData);
    
    // Limiter le nombre d'erreurs stockées
    if (storedErrors.length > MAX_STORED_ERRORS) {
      storedErrors.length = MAX_STORED_ERRORS;
    }
    
    // Sauvegarder les erreurs
    localStorage.setItem(ERROR_STORAGE_KEY, JSON.stringify(storedErrors));
  } catch (e) {
    console.error('Erreur lors du stockage de l\'erreur:', e);
  }
}

/**
 * Récupère les erreurs stockées
 */
export function getStoredErrors(): ErrorData[] {
  try {
    const storedErrorsJson = localStorage.getItem(ERROR_STORAGE_KEY);
    return storedErrorsJson ? JSON.parse(storedErrorsJson) : [];
  } catch (e) {
    console.error('Erreur lors de la récupération des erreurs:', e);
    return [];
  }
}

/**
 * Efface les erreurs stockées
 */
export function clearStoredErrors(): void {
  localStorage.removeItem(ERROR_STORAGE_KEY);
}

/**
 * Configure un gestionnaire global pour les erreurs non capturées
 */
export function setupGlobalErrorHandling(): void {
  window.addEventListener('error', (event) => {
    captureError(event.error || new Error(event.message));
    // Ne pas empêcher le comportement par défaut
    return false;
  });
  
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason instanceof Error 
      ? event.reason 
      : new Error(String(event.reason));
    
    captureError(error);
    // Ne pas empêcher le comportement par défaut
    return false;
  });
  
  console.log('Gestionnaire global d\'erreurs configuré.');
}

/**
 * Crée une fonction fetch avec retry et timeout
 */
export function createFetchWithRetry(
  maxRetries: number = 3, 
  baseTimeout: number = 5000,
  backoffFactor: number = 1.5
): (url: string, options?: RequestInit) => Promise<Response> {
  return async function fetchWithRetry(url: string, options?: RequestInit): Promise<Response> {
    let retries = 0;
    let lastError: Error;
    
    while (retries <= maxRetries) {
      try {
        // Calculer le timeout pour cette tentative
        const timeout = baseTimeout * Math.pow(backoffFactor, retries);
        
        // Créer un contrôleur d'abandon pour le timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        // Ajouter le signal au contrôleur d'abandon aux options
        const fetchOptions = {
          ...options,
          signal: controller.signal
        };
        
        // Faire la requête
        const response = await fetch(url, fetchOptions);
        
        // Annuler le timeout
        clearTimeout(timeoutId);
        
        // Vérifier si la réponse est OK
        if (!response.ok) {
          throw new Error(\`Erreur HTTP: \${response.status}\`);
        }
        
        return response;
      } catch (error) {
        lastError = error as Error;
        
        // Si c'est une erreur d'abandon (timeout), ne pas réessayer
        if (lastError.name === 'AbortError') {
          throw new Error(\`Timeout après \${baseTimeout * Math.pow(backoffFactor, retries)}ms\`);
        }
        
        // Si c'est la dernière tentative, lancer l'erreur
        if (retries === maxRetries) {
          throw lastError;
        }
        
        // Attendre avant de réessayer (backoff exponentiel)
        const waitTime = Math.pow(2, retries) * 1000;
        await new Promise(resolve => setTimeout(resolve, waitTime));
        
        retries++;
        console.log(\`Réessai \${retries}/\${maxRetries} pour \${url}\`);
      }
    }
    
    // Ne devrait jamais arriver, mais TypeScript l'exige
    throw lastError!;
  };
}

// Exporter une instance par défaut de fetchWithRetry
export const fetchWithRetry = createFetchWithRetry();
`;
    
    fs.writeFileSync(errorServicePath, errorServiceContent);
    console.log("Service de surveillance des erreurs créé avec succès.");
  } else {
    console.log("Le service de surveillance des erreurs existe déjà.");
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
  const reportPath = path.join(REPORT_DIR, `resilience-report-${new Date().toISOString().replace(/:/g, '-')}.html`);
  
  const reportContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rapport de résilience - FloDrama</title>
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
  <h1>Rapport de résilience - FloDrama</h1>
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
      <span>Appels API sans gestion d'erreur</span>
      <strong>${stats.apiCallsWithoutErrorHandling}</strong>
    </div>
    <div class="stat">
      <span>Appels API sans stratégie de retry</span>
      <strong>${stats.apiCallsWithoutRetry}</strong>
    </div>
    <div class="stat">
      <span>Appels API sans timeout</span>
      <strong>${stats.apiCallsWithoutTimeout}</strong>
    </div>
    <div class="stat">
      <span>Composants sans ErrorBoundary</span>
      <strong>${stats.componentsWithoutErrorBoundaries}</strong>
    </div>
    <div class="stat">
      <span>Composants sans contenu de fallback</span>
      <strong>${stats.missingFallbackContent}</strong>
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
          <td>${issue.line || 'N/A'}</td>
          <td>${issue.issue}</td>
          <td class="fix">${issue.fix}</td>
          <td class="${issue.severity === 'Élevée' ? 'severity-high' : (issue.severity === 'Moyenne' ? 'severity-medium' : 'severity-low')}">${issue.severity}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>
    ` : '<p class="empty-message">Aucun problème de résilience détecté.</p>'}
  </div>
  
  <div class="section">
    <h2>Améliorations implémentées</h2>
    <ul>
      <li>Création d'un composant ErrorBoundary pour capturer les erreurs de rendu</li>
      <li>Création d'un service de surveillance des erreurs</li>
      <li>Implémentation d'une fonction fetch avec retry et timeout</li>
    </ul>
  </div>
  
  <div class="section">
    <h2>Recommandations générales</h2>
    <ul>
      <li>Enveloppez les composants critiques avec le composant ErrorBoundary</li>
      <li>Utilisez fetchWithRetry pour tous les appels API</li>
      <li>Implémentez des états de chargement et d'erreur pour tous les composants qui chargent des données</li>
      <li>Ajoutez des contenus de fallback pour les erreurs et les états de chargement</li>
      <li>Configurez le service de surveillance des erreurs pour envoyer les erreurs à un service externe</li>
      <li>Testez régulièrement la résilience de l'application avec le script de test de résilience</li>
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
console.log("Analyse de la résilience de FloDrama...");

// Créer les composants et services nécessaires
createErrorBoundaryComponent();
createErrorMonitoringService();

// Analyser les répertoires principaux
console.log("Analyse des services...");
analyzeDirectory(SERVICES_DIR);

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
console.log(`- ${stats.apiCallsWithoutErrorHandling} appels API sans gestion d'erreur`);
console.log(`- ${stats.apiCallsWithoutRetry} appels API sans stratégie de retry`);
console.log(`- ${stats.apiCallsWithoutTimeout} appels API sans timeout`);
console.log(`- ${stats.componentsWithoutErrorBoundaries} composants sans ErrorBoundary`);
console.log(`- ${stats.missingFallbackContent} composants sans contenu de fallback`);
