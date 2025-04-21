import React, { useEffect, useState } from 'react';
import { ChevronRight, Heart, ThumbsDown, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getCategoryContent } from '../services/contentService';
import { useUserPreferences } from '../hooks/useUserPreferences';
import { useTrailerPreview } from '../hooks/useTrailerPreview';

interface ContentGridProps {
  title: string;
  category?: string;
  searchQuery?: string;
  userId: string;
  token: string;
}

interface ContentItem {
  _id: string;
  titre: string;
  imageUrl: string;
  type: string;
  genres: string[];
  trailerUrl?: string;
}

const ContentGrid: React.FC<ContentGridProps> = ({ title, category, searchQuery, userId, token }) => {
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Préférences utilisateur (likes, dislikes, favoris)
  const {
    preferences,
    isLoading: loadingPrefs,
    addFavori,
    removeFavori,
    setLike,
    setDislike
  } = useUserPreferences(userId, token);

  // Preview trailer
  const trailerPreview = useTrailerPreview(1000);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    getCategoryContent(category || '', token)
      .then(data => {
        if (isMounted) setContentItems(data);
      })
      .catch(() => setContentItems([]))
      .finally(() => { if (isMounted) setIsLoading(false); });
    return () => { isMounted = false; };
  }, [category, token]);

  const isLiked = (id: string, genres: string[]) => {
    if (!preferences) return false;
    // On considère qu'un like existe si la note moyenne du premier genre > 0
    const genre = genres[0] || 'drama';
    return preferences.notesMoyennes?.[genre] > 0;
  };
  const isDisliked = (id: string, genres: string[]) => {
    if (!preferences) return false;
    const genre = genres[0] || 'drama';
    return preferences.notesMoyennes?.[genre] < 0;
  };
  const isFavorite = (id: string) => {
    if (!preferences) return false;
    return preferences.favoris?.includes(id);
  };

  // Actions synchronisées
  const handleLike = async (id: string, genres: string[]) => {
    await setLike(id, genres[0] || 'drama');
  };
  const handleDislike = async (id: string, genres: string[]) => {
    await setDislike(id, genres[0] || 'drama');
  };
  const handleFavorite = async (id: string) => {
    if (isFavorite(id)) await removeFavori(id);
    else await addFavori(id);
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-2xl md:text-3xl font-bold font-sans bg-gradient-to-r from-flo-violet to-flo-blue bg-clip-text text-transparent drop-shadow">
          {title}
        </h2>
        <button className="flex items-center text-flo-blue hover:text-flo-violet font-semibold transition-colors">
          <span>Voir tout</span>
          <ChevronRight className="w-5 h-5 ml-1" />
        </button>
      </div>
      {isLoading || loadingPrefs ? (
        <div className="text-center text-flo-blue animate-pulse py-12">Chargement…</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {contentItems.map((item) => (
            <div
              key={item._id}
              className="relative group cursor-pointer rounded-xl overflow-hidden shadow-lg bg-flo-secondary hover:scale-105 transition-transform duration-300"
              onClick={() => navigate(`/content/${item._id}`)}
              tabIndex={0}
              role="button"
              aria-label={`Voir les détails de ${item.titre}`}
              onKeyPress={e => { if (e.key === 'Enter') navigate(`/content/${item._id}`); }}
              data-trailer-url={item.trailerUrl || ''}
              {...trailerPreview.bind}
            >
              <div className="aspect-w-2 aspect-h-3 w-full h-48 bg-black/30">
                <img
                  src={item.imageUrl}
                  alt={item.titre}
                  className="w-full h-full object-cover group-hover:brightness-110 transition-all duration-300"
                />
                {/* Overlay boutons + trailer preview */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end items-center p-2 gap-2">
                  <div className="flex gap-3 justify-center">
                    <button
                      className={`p-2 rounded-full bg-black/60 hover:bg-flo-violet ${isLiked(item._id, item.genres) ? 'text-flo-fuchsia' : 'text-flo-white'}`}
                      onClick={e => { e.stopPropagation(); handleLike(item._id, item.genres); }}
                      aria-label={isLiked(item._id, item.genres) ? 'Retirer le like' : 'Liker'}
                    >
                      <Heart fill={isLiked(item._id, item.genres) ? '#d946ef' : 'none'} />
                    </button>
                    <button
                      className={`p-2 rounded-full bg-black/60 hover:bg-flo-blue ${isDisliked(item._id, item.genres) ? 'text-flo-blue' : 'text-flo-white'}`}
                      onClick={e => { e.stopPropagation(); handleDislike(item._id, item.genres); }}
                      aria-label={isDisliked(item._id, item.genres) ? 'Retirer le dislike' : 'Disliker'}
                    >
                      <ThumbsDown fill={isDisliked(item._id, item.genres) ? '#3b82f6' : 'none'} />
                    </button>
                    <button
                      className={`p-2 rounded-full bg-black/60 hover:bg-flo-gold ${isFavorite(item._id) ? 'text-flo-gold' : 'text-flo-white'}`}
                      onClick={e => { e.stopPropagation(); handleFavorite(item._id); }}
                      aria-label={isFavorite(item._id) ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                    >
                      <Star fill={isFavorite(item._id) ? '#FFD700' : 'none'} />
                    </button>
                  </div>
                  {/* Trailer preview */}
                  {trailerPreview.isPreviewing && trailerPreview.trailerUrl === item.trailerUrl && item.trailerUrl && (
                    <video
                      src={item.trailerUrl}
                      autoPlay
                      muted
                      loop
                      className="rounded-lg shadow-xl max-w-full max-h-36 border-2 border-flo-blue mt-2"
                    />
                  )}
                </div>
              </div>
              <h3 className="mt-2 px-2 text-base font-semibold truncate text-flo-white">
                {item.titre}
              </h3>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default ContentGrid;