import { useEffect, useState } from "react";
import { getCategoryItems, ContentItem } from "../services/scraping";

export default function WatchPartyPage() {
  const [watchparties, setWatchparties] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    try {
      const data: ContentItem[] = getCategoryItems("watchparty", { limit: 24 });
      setWatchparties(data);
      setError(null);
    } catch (_err: unknown) {
      setError("Erreur lors du chargement des watchparties ou fonctionnalité non disponible.");
      setWatchparties([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold mb-6">WatchParty</h1>
      {loading && <p>Chargement des watchparties...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {!loading && !error && watchparties.length === 0 && <p>Aucune watchparty trouvée ou fonctionnalité à venir.</p>}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {watchparties.map((wp) => (
          <div key={wp.id} className="bg-white rounded shadow p-2 flex flex-col items-center">
            {wp.imageUrl && (
              <img
                src={wp.imageUrl}
                alt={wp.title}
                className="w-full h-48 object-cover rounded mb-2"
                loading="lazy"
              />
            )}
            <h2 className="font-semibold text-lg text-center truncate w-full" title={wp.title}>{wp.title}</h2>
            {wp.year && <span className="text-gray-500 text-sm">{wp.year}</span>}
            {wp.rating && (
              <span className="text-yellow-600 text-xs mt-1">⭐ {wp.rating}</span>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
