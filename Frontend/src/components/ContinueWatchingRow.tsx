import React, { useEffect, useState } from 'react';
import { useWatchlist } from '../hooks/useWatchlist';
import { getContentDetail } from '../services/contentService';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

interface ContinueWatchingRowProps {
  userId: string;
  token: string;
}

interface EnrichedWatchlistItem {
  contenuId: string;
  dateVisionnage: string;
  tempsVisionnage: number;
  termine: boolean;
  titre?: string;
  imageUrl?: string;
  type?: string;
}

const ContinueWatchingRow: React.FC<ContinueWatchingRowProps> = ({ userId, token }) => {
  const { watchlist, isLoading, error, refresh, updateProgress } = useWatchlist(userId, token);
  const [enriched, setEnriched] = useState<EnrichedWatchlistItem[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const navigate = useNavigate();

  useEffect(() => { refresh(); }, [userId, token]);

  useEffect(() => {
    let isMounted = true;
    if (!watchlist.length) {
      setEnriched([]); setLoadingMeta(false); return;
    }
    setLoadingMeta(true);
    Promise.all(
      watchlist.map(async item => {
        try {
          const meta = await getContentDetail(item.contenuId, token);
          return { ...item, titre: meta.titre, imageUrl: meta.imageUrl, type: meta.type };
        } catch {
          return { ...item };
        }
      })
    ).then(result => { if (isMounted) setEnriched(result); })
     .finally(() => { if (isMounted) setLoadingMeta(false); });
    return () => { isMounted = false; };
  }, [watchlist, token]);

  if (isLoading || loadingMeta) return <div className="text-flo-blue animate-pulse py-8">Chargement…</div>;
  if (error) return <div className="text-red-500 py-8">Erreur lors du chargement de la watchlist.</div>;
  if (!enriched.length) return null;

  return (
    <section className="space-y-3 mt-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl md:text-2xl font-bold font-sans bg-gradient-to-r from-flo-blue to-flo-violet bg-clip-text text-transparent drop-shadow">
          Continuer la lecture
        </h2>
        <button className="flex items-center text-flo-blue hover:text-flo-violet font-semibold transition-colors">
          <span>Tout voir</span>
          <ChevronRight className="w-5 h-5 ml-1" />
        </button>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {enriched.map(item => (
          <div
            key={item.contenuId}
            className="relative min-w-[180px] max-w-[210px] bg-flo-secondary rounded-xl overflow-hidden shadow-lg group cursor-pointer hover:scale-105 transition-transform duration-300"
            onClick={() => navigate(`/content/${item.contenuId}`)}
            tabIndex={0}
            role="button"
            aria-label={`Reprendre le visionnage de ${item.titre || 'ce contenu'}`}
            onKeyPress={e => { if (e.key === 'Enter') navigate(`/content/${item.contenuId}`); }}
          >
            <div className="aspect-w-2 aspect-h-3 w-full h-36 bg-black/30 flex flex-col justify-end">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.titre || ''} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-flo-blue/30 to-flo-fuchsia/30" />
              )}
              <div className="absolute bottom-0 left-0 w-full h-2 bg-flo-blue/30">
                <div
                  className="h-2 bg-gradient-to-r from-flo-blue to-flo-fuchsia rounded-r-xl transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.round((item.tempsVisionnage / 3600) * 100))}%` }}
                />
              </div>
            </div>
            <div className="p-2">
              <h3 className="text-base font-semibold truncate text-flo-white">{item.titre || `Contenu #${item.contenuId}`}</h3>
              <button
                className="mt-2 w-full py-1 rounded bg-gradient-to-r from-flo-blue to-flo-fuchsia text-white font-bold shadow hover:brightness-110 transition"
                onClick={e => { e.stopPropagation(); navigate(`/content/${item.contenuId}`); }}
                aria-label={`Reprendre ${item.titre || ''}`}
              >
                Reprendre
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ContinueWatchingRow;
