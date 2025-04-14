import React, { useEffect, useState } from 'react';
import { LynxDocumentationService } from '../../services/documentation/LynxDocumentationService';
// @ts-ignore
import ReactMarkdown from 'react-markdown';

interface LynxDocumentationProps {
  selectedRepo?: string;
  onRepoSelect?: (repoName: string) => void;
}

// Interfaces pour les données
interface Repo {
  name: string;
  description?: string;
  language?: string;
  topics: string[];
}

interface RepoDoc {
  lastUpdate: string;
  topics: string[];
  readme: string;
  dependencies?: Record<string, string>;
  versions?: string[];
}

interface Summary {
  totalRepos: number;
  lastUpdate: string;
  languageStats: Record<string, number>;
  topTopics: string[];
}

/**
 * Composant d'affichage de la documentation Lynx
 */
export const LynxDocumentation: React.FC<LynxDocumentationProps> = ({
  selectedRepo,
  onRepoSelect
}) => {
  // Service de documentation
  const docService = LynxDocumentationService.getInstance();

  // États
  const [repos, setRepos] = useState<Repo[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [repoDoc, setRepoDoc] = useState<RepoDoc | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Chargement initial des données
  useEffect(() => {
    const loadData = () => {
      setIsLoading(true);
      
      // Chargement des repos
      // @ts-ignore - La méthode getAllRepos sera implémentée dans le service
      const allRepos = docService.getAllRepos();
      setRepos(allRepos);

      // Chargement du résumé
      // @ts-ignore - La méthode getReposSummary sera implémentée dans le service
      const reposSummary = docService.getReposSummary();
      setSummary(reposSummary);

      // Chargement de la documentation si un repo est sélectionné
      if (selectedRepo) {
        // @ts-ignore - La méthode getRepoDocumentation sera implémentée dans le service
        const doc = docService.getRepoDocumentation(selectedRepo);
        setRepoDoc(doc);
      }

      setIsLoading(false);
    };

    loadData();
  }, [selectedRepo, docService]);

  // Filtrage des repos
  const filteredRepos = repos.filter(repo => {
    const matchesSearch = searchQuery === '' || 
      repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      repo.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesLanguage = selectedLanguage === 'all' || 
      repo.language === selectedLanguage;

    const matchesTopic = selectedTopic === 'all' || 
      repo.topics.includes(selectedTopic);

    return matchesSearch && matchesLanguage && matchesTopic;
  });

  return (
    <div className="lynx-documentation">
      {/* En-tête */}
      <header className="documentation-header">
        <h1>Documentation Lynx</h1>
        
        {summary && (
          <div className="summary-stats">
            <div className="stat-item">
              <span className="stat-label">Total des repos</span>
              <span className="stat-value">{summary.totalRepos}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Dernière mise à jour</span>
              <span className="stat-value">{summary.lastUpdate}</span>
            </div>
          </div>
        )}
      </header>

      {/* Filtres */}
      <div className="documentation-filters">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Rechercher dans les repos..."
          className="search-input"
        />

        <select
          value={selectedLanguage}
          onChange={(e) => setSelectedLanguage(e.target.value)}
          className="language-filter"
        >
          <option value="all">Tous les langages</option>
          {summary && Object.keys(summary.languageStats).map(lang => (
            <option key={lang} value={lang}>
              {lang} ({summary.languageStats[lang]})
            </option>
          ))}
        </select>

        <select
          value={selectedTopic}
          onChange={(e) => setSelectedTopic(e.target.value)}
          className="topic-filter"
        >
          <option value="all">Tous les topics</option>
          {summary && summary.topTopics.map((topic: string) => (
            <option key={topic} value={topic}>{topic}</option>
          ))}
        </select>
      </div>

      {/* Contenu principal */}
      <div className="documentation-content">
        {/* Liste des repos */}
        <div className="repos-list">
          <h2>Repositories ({filteredRepos.length})</h2>
          {isLoading ? (
            <div className="loading">Chargement...</div>
          ) : filteredRepos.length === 0 ? (
            <div className="no-results">Aucun repository trouvé</div>
          ) : (
            filteredRepos.map(repo => (
              <div
                key={repo.name}
                className={`repo-item ${selectedRepo === repo.name ? 'selected' : ''}`}
                onClick={() => onRepoSelect && onRepoSelect(repo.name)}
              >
                <h3>{repo.name}</h3>
                <p className="repo-description">{repo.description}</p>
                <div className="repo-meta">
                  {repo.language && (
                    <span className="repo-language">
                      <span className="language-dot" style={{
                        backgroundColor: getLanguageColor(repo.language)
                      }}></span>
                      {repo.language}
                    </span>
                  )}
                  {repo.topics.length > 0 && (
                    <div className="repo-topics">
                      {repo.topics.slice(0, 3).map((topic: string) => (
                        <span key={topic} className="topic-tag">{topic}</span>
                      ))}
                      {repo.topics.length > 3 && (
                        <span className="topic-more">+{repo.topics.length - 3}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Documentation du repo sélectionné */}
        {selectedRepo && repoDoc && (
          <div className="repo-documentation">
            <h2>{selectedRepo}</h2>
            
            {/* Métadonnées */}
            <div className="repo-metadata">
              <p>Dernière mise à jour : {repoDoc.lastUpdate}</p>
              {repoDoc.topics.length > 0 && (
                <div className="topics-list">
                  <h3>Topics</h3>
                  <div className="topics-tags">
                    {repoDoc.topics.map((topic: string) => (
                      <span key={topic} className="topic-tag">{topic}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* README */}
            <div className="repo-readme">
              <h3>README</h3>
              <div className="markdown-content">
                <ReactMarkdown>{repoDoc.readme}</ReactMarkdown>
              </div>
            </div>

            {/* Dépendances */}
            {repoDoc.dependencies && (
              <div className="repo-dependencies">
                <h3>Dépendances</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Package</th>
                      <th>Version</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(repoDoc.dependencies).map(([pkg, version]) => (
                      <tr key={pkg}>
                        <td>{pkg}</td>
                        <td>{String(version)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Obtient la couleur associée à un langage
 */
const getLanguageColor = (language: string): string => {
  const colors: Record<string, string> = {
    JavaScript: '#f1e05a',
    TypeScript: '#2b7489',
    Python: '#3572A5',
    Java: '#b07219',
    C: '#555555',
    'C++': '#f34b7d',
    'C#': '#178600',
    Ruby: '#701516',
    Go: '#00ADD8',
    PHP: '#4F5D95',
    Swift: '#ffac45',
    Kotlin: '#F18E33',
    Rust: '#dea584',
    Scala: '#c22d40',
    Dart: '#00B4AB'
  };

  return colors[language] || '#cccccc';
};

export default LynxDocumentation;
