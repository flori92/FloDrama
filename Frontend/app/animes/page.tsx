import { useEffect, useState } from "react";
import { getAnimes, ContentItem } from "../services/scraping";

export default function AnimesPage() {
  const [animes, setAnimes] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    getAnimes(24)
      .then((data) => {
        if (isMounted) {
          setAnimes(data);
          setError(null);
        }
      })
      .catch((_err) => {
        if (isMounted) {
          setError("Erreur lors du chargement des animés.");
          setAnimes([]);
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
      <h1 className="text-3xl font-bold mb-6">Animés</h1>
      {loading && <p>Chargement des animés...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {!loading && !error && animes.length === 0 && <p>Aucun animé trouvé.</p>}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {animes.map((anime) => (
          <div key={anime.id} className="bg-white rounded shadow p-2 flex flex-col items-center">
            {anime.imageUrl && (
              <img
                src={anime.imageUrl}
                alt={anime.title}
                className="w-full h-48 object-cover rounded mb-2"
                loading="lazy"
              />
            )}
            <h2 className="font-semibold text-lg text-center truncate w-full" title={anime.title}>{anime.title}</h2>
            {anime.year && <span className="text-gray-500 text-sm">{anime.year}</span>}
            {anime.rating && (
              <span className="text-yellow-600 text-xs mt-1">⭐ {anime.rating}</span>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
