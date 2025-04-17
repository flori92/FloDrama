import * as fs from 'fs';
import * as path from 'path';

interface PackageJson {
  dependencies?: { [key: string]: string };
  devDependencies?: { [key: string]: string };
}

interface LynxRepo {
  name: string;
  description: string;
  readme: string;
  topics: string[];
  updated_at: string;
  language?: string;
  dependencies: {
    package_json?: string;
    [key: string]: string | undefined;
  };
}

interface LynxReposData {
  repos: LynxRepo[];
}

interface RepoInfo {
  readme: string;
  dependencies: { [key: string]: string };
  topics: string[];
  lastUpdate: string;
}

interface LynxDependencies {
  [key: string]: string;
}

interface RepoSummary {
  totalRepos: number;
  lastUpdate: string;
  languageStats: Record<string, number>;
  topTopics: string[];
}

export class LynxDocumentationService {
  private static instance: LynxDocumentationService;
  private reposData: LynxReposData | null = null;
  private dataPath: string;
  private readonly encoding: BufferEncoding = 'utf8';

  private constructor() {
    this.dataPath = path.join(process.cwd(), 'data', 'lynx_repos.json');
    this.loadReposData();
  }

  public static getInstance(): LynxDocumentationService {
    if (!LynxDocumentationService.instance) {
      LynxDocumentationService.instance = new LynxDocumentationService();
    }
    return LynxDocumentationService.instance;
  }

  private loadReposData(): void {
    try {
      if (fs.existsSync(this.dataPath)) {
        const rawData = fs.readFileSync(this.dataPath, this.encoding);
        const jsonData = typeof rawData === 'string' ? rawData : rawData.toString(this.encoding);
        this.reposData = JSON.parse(jsonData);
        console.info('Données des repos Lynx chargées avec succès');
      } else {
        console.warn('Fichier de données des repos Lynx non trouvé');
        // Créer des données fictives pour le développement
        this.createMockData();
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données des repos:', error);
      // Créer des données fictives en cas d'erreur
      this.createMockData();
    }
  }

  private createMockData(): void {
    this.reposData = {
      repos: [
        {
          name: 'lynx-core',
          description: 'Bibliothèque principale du framework Lynx',
          readme: Buffer.from('# Lynx Core\n\nBibliothèque principale du framework Lynx pour le développement d\'applications multiplateformes.').toString('base64'),
          topics: ['framework', 'typescript', 'multiplatform'],
          updated_at: new Date().toISOString(),
          language: 'TypeScript',
          dependencies: {
            package_json: Buffer.from(JSON.stringify({
              dependencies: {
                'react': '^18.2.0',
                'react-dom': '^18.2.0',
                'typescript': '^5.0.0'
              }
            })).toString('base64')
          }
        },
        {
          name: 'lynx-react',
          description: 'Composants React pour Lynx',
          readme: Buffer.from('# Lynx React\n\nComposants React pour le framework Lynx.').toString('base64'),
          topics: ['react', 'components', 'ui'],
          updated_at: new Date().toISOString(),
          language: 'TypeScript',
          dependencies: {
            package_json: Buffer.from(JSON.stringify({
              dependencies: {
                'react': '^18.2.0',
                'react-dom': '^18.2.0',
                'typescript': '^5.0.0'
              }
            })).toString('base64')
          }
        }
      ]
    };
  }

  /**
   * Récupère la liste de tous les repos
   * @returns Liste des repos avec leurs informations de base
   */
  public getAllRepos(): Array<{
    name: string;
    description?: string;
    language?: string;
    topics: string[];
  }> {
    if (!this.reposData) {
      console.warn('Données des repos non disponibles');
      return [];
    }

    return this.reposData.repos.map(repo => ({
      name: repo.name,
      description: repo.description,
      language: repo.language,
      topics: repo.topics || []
    }));
  }

  /**
   * Récupère un résumé des repos
   * @returns Résumé des repos avec statistiques
   */
  public getReposSummary(): RepoSummary {
    if (!this.reposData) {
      console.warn('Données des repos non disponibles pour le résumé');
      return {
        totalRepos: 0,
        lastUpdate: new Date().toLocaleString('fr-FR'),
        languageStats: {},
        topTopics: []
      };
    }

    // Calcul des statistiques
    const languageStats: Record<string, number> = {};
    const topicsCount: Record<string, number> = {};
    let lastUpdateDate = new Date(0);

    for (const repo of this.reposData.repos) {
      // Statistiques des langages
      if (repo.language) {
        languageStats[repo.language] = (languageStats[repo.language] || 0) + 1;
      }

      // Comptage des topics
      for (const topic of repo.topics) {
        topicsCount[topic] = (topicsCount[topic] || 0) + 1;
      }

      // Dernière mise à jour
      const repoDate = new Date(repo.updated_at);
      if (repoDate > lastUpdateDate) {
        lastUpdateDate = repoDate;
      }
    }

    // Top topics (les 10 plus populaires)
    const topTopics = Object.entries(topicsCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([topic]) => topic);

    return {
      totalRepos: this.reposData.repos.length,
      lastUpdate: lastUpdateDate.toLocaleString('fr-FR'),
      languageStats,
      topTopics
    };
  }

  /**
   * Récupère la documentation d'un repo spécifique
   * @param repoName Nom du repo
   * @returns Documentation complète du repo
   */
  public getRepoDocumentation(repoName: string): {
    lastUpdate: string;
    topics: string[];
    readme: string;
    dependencies?: Record<string, string>;
    versions?: string[];
  } | null {
    const repo = this.getRepoByName(repoName);
    if (!repo) {
      console.warn('Repo non trouvé:', repoName);
      return null;
    }

    const readmeContent = Buffer.from(repo.readme, 'base64').toString(this.encoding);
    const dependencies = this.getRepoDependencies(repoName);
    
    return {
      readme: readmeContent,
      dependencies: dependencies || {},
      topics: repo.topics,
      lastUpdate: new Date(repo.updated_at).toLocaleString('fr-FR'),
      versions: this.getRepoVersions(repoName)
    };
  }

  private getRepoByName(repoName: string): LynxRepo | null {
    if (!this.reposData) return null;
    return this.reposData.repos.find(repo => repo.name === repoName) || null;
  }

  public getRepoInfo(repoName: string): RepoInfo | null {
    const repo = this.getRepoByName(repoName);
    if (!repo) {
      console.warn('Repo non trouvé:', repoName);
      return null;
    }

    const readmeContent = Buffer.from(repo.readme, 'base64').toString(this.encoding);
    
    return {
      readme: readmeContent,
      dependencies: this.getRepoDependencies(repoName) || {},
      topics: repo.topics,
      lastUpdate: new Date(repo.updated_at).toLocaleString('fr-FR')
    };
  }

  private getRepoDependencies(repoName: string): LynxDependencies {
    const repo = this.getRepoByName(repoName);
    if (!repo || !repo.dependencies.package_json) {
      return {};
    }

    try {
      const packageJson = this.readDependencyFile(Buffer.from(repo.dependencies.package_json, 'base64').toString(this.encoding));
      return {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
      };
    } catch (error) {
      console.error('Erreur lors de la lecture des dépendances:', error);
      return {};
    }
  }

  /**
   * Récupère les versions disponibles d'un repo
   * @param _repoName Nom du repo (non utilisé pour le moment, mais conservé pour la cohérence de l'API)
   * @returns Liste des versions disponibles
   */
  private getRepoVersions(_repoName: string): string[] {
    // Simulation des versions disponibles
    // Dans une implémentation réelle, cela pourrait venir d'une API GitHub ou similaire
    return ['1.0.0', '1.1.0', '1.2.0', '2.0.0'];
  }

  private readDependencyFile(fileContent: string): PackageJson {
    try {
      return JSON.parse(fileContent) as PackageJson;
    } catch (error) {
      console.error(`Erreur lors de la lecture du fichier de dépendances : ${error}`);
      return {};
    }
  }

  public searchInReadme(query: string): { [repoName: string]: string[] } {
    const results: { [repoName: string]: string[] } = {};

    if (!this.reposData) {
      console.warn('Données des repos non disponibles pour la recherche');
      return results;
    }

    for (const repo of this.reposData.repos) {
      const readmeContent = Buffer.from(repo.readme, 'base64').toString(this.encoding);
      const lines = readmeContent.split('\n');
      const matchingLines = lines.filter((line: string) => 
        line.toLowerCase().includes(query.toLowerCase())
      );

      if (matchingLines.length > 0) {
        results[repo.name] = matchingLines;
      }
    }

    return results;
  }
}
