import React, { useState, useMemo } from 'react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import RecommendationCarousel from '../components/features/RecommendationCarousel';
import ContentGrid from '../components/features/ContentGrid';
import { useRecommendations } from '../hooks/useRecommendations';
import '../styles/PageSection.css';

const DramasPage = () => {
  // Utilise le hook IA pour récupérer tous les dramas (pas seulement les recommandations)
  const { allItems, loading, error } = useRecommendations({ section: 'drama', userId: null, all: true });
  const [search, setSearch] = useState('');
  const [year, setYear] = useState('');

  // Générer dynamiquement la liste des années présentes dans les items
  const yearOptions = useMemo(() => {
    const years = allItems ? Array.from(new Set(allItems.map(item => item.year).filter(Boolean))) : [];
    return years.sort((a, b) => b - a);
  }, [allItems]);

  // Filtrage local des items selon recherche et année
  const filteredItems = useMemo(() => {
    let filtered = allItems || [];
    if (search.trim()) {
      const term = search.trim().toLowerCase();
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(term) ||
        (item.description && item.description.toLowerCase().includes(term))
      );
    }
    if (year) {
      filtered = filtered.filter(item => String(item.year) === year);
    }
    return filtered;
  }, [allItems, search, year]);

  return (
    <div className="section-bg min-h-screen flex flex-col" style={{ background: 'linear-gradient(to right, #121118 60%, #1A1926 100%)' }}>
      <Navbar />
      <main className="flex-1 w-full mx-auto px-0 md:px-4 pt-8">
        <h1 className="text-3xl font-bold mb-8" style={{ color: 'var(--color-primary)' }}>Dramas</h1>
        <RecommendationCarousel section="drama" userId={null} />
        <h2 className="text-xl font-semibold mb-4 mt-12" style={{ color: 'var(--color-primary)' }}>Tous les dramas</h2>
        <div className="flex flex-col md:flex-row md:items-end gap-4 mb-6">
          <input
            type="text"
            className="contentgrid-search"
            placeholder="Rechercher un drama..."
            aria-label="Rechercher un drama"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select
            className="contentgrid-filter"
            aria-label="Filtrer par année"
            value={year}
            onChange={e => setYear(e.target.value)}
          >
            <option value="">Toutes les années</option>
            {yearOptions.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        {loading ? (
          <ContentGrid loading={true} />
        ) : error ? (
          <div className="contentgrid-empty">Erreur lors du chargement des dramas.</div>
        ) : (
          <ContentGrid items={filteredItems} />
        )}
      </main>
      <Footer />
    </div>
  );
};

export default DramasPage;
