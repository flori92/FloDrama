import { useEffect, useState } from "react";
import { getBollywoodContent, ContentItem } from "../services/scraping";

export default function BollywoodPage() {
  const [bollywood, setBollywood] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    getBollywoodContent(24)
      .then((data) => {
        if (isMounted) {
          setBollywood(data);
          setError(null);
        }
      })
      .catch((_err) => {
        if (isMounted) {
          setError("Erreur lors du chargement des films Bollywood.");
          setBollywood([]);
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold mb-6">Bollywood</h1>
      {loading && <p>Chargement des films Bollywood...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {!loading && !error && bollywood.length === 0 && <p>Aucun film Bollywood trouvé.</p>}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {bollywood.map((film) => (
          <div key={film.id} className="bg-white rounded shadow p-2 flex flex-col items-center">
            {film.imageUrl && (
              <img
                src={film.imageUrl}
                alt={film.title}
                className="w-full h-48 object-cover rounded mb-2"
                loading="lazy"
              />
            )}
            <h2 className="font-semibold text-lg text-center truncate w-full" title={film.title}>{film.title}</h2>
            {film.year && <span className="text-gray-500 text-sm">{film.year}</span>}
            {film.rating && (
              <span className="text-yellow-600 text-xs mt-1">⭐ {film.rating}</span>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
