import React, { useState } from 'react';
import { Search as SearchIcon } from 'lucide-react';
import ContentGrid from '../components/ContentGrid';

const Search: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="space-y-8">
      <div className="relative">
        <input
          type="text"
          placeholder="Rechercher des films, séries, anime..."
          className="w-full p-4 pl-12 bg-gray-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
      </div>

      {searchQuery ? (
        <ContentGrid title="Résultats de recherche" searchQuery={searchQuery} />
      ) : (
        <>
          <ContentGrid title="Suggestions" category="trending" />
          <ContentGrid title="Nouveautés" category="new" />
          <ContentGrid title="Populaires" category="popular" />
        </>
      )}
    </div>
  );
};

export default Search; 