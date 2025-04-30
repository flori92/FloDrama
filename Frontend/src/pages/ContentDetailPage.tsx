import React from 'react'
import { useParams } from 'react-router-dom'
import { useContentDetail } from '../hooks/useContentDetail'
import VideoPlayer from '../components/VideoPlayer';
import { getStreamingUrl } from '../services/streamingService';
import { useAuth } from '../hooks/useAuth';

const ContentDetailPage: React.FC = () => {
  const { id = '' } = useParams<{ id: string }>();
  const { data, loading, error } = useContentDetail(id);
  const { user } = useAuth();
  const [streamUrl, setStreamUrl] = React.useState<string | null>(null);
  const [isLoadingStream, setIsLoadingStream] = React.useState(false);
  const [streamError, setStreamError] = React.useState<string | null>(null);

  const handlePlay = async () => {
    if (!id) return;
    setIsLoadingStream(true);
    setStreamError(null);
    try {
      const url = await getStreamingUrl(id, user?.token);
      setStreamUrl(url);
    } catch (e: any) {
      setStreamError(e?.message || 'Erreur lors de la récupération du flux vidéo.');
    } finally {
      setIsLoadingStream(false);
    }
  };

  if (loading) return <div className="text-flo-white text-center mt-8">Chargement...</div>;
  if (error) return <div className="text-red-400 text-center mt-8">Erreur : {error}</div>;
  if (!data) return <div className="text-flo-white text-center mt-8">Aucun contenu trouvé.</div>;

  return (
    <main className="flex flex-col items-center py-8 px-2 md:px-8 min-h-[60vh]">
      <div className="w-full max-w-3xl bg-gradient-to-b from-flo-black to-flo-secondary rounded-2xl shadow-lg p-6 flex flex-col md:flex-row gap-8">
        <img src={data.image} alt={data.title} className="w-full md:w-64 h-80 object-cover rounded-xl shadow" />
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-flo-blue to-flo-fuchsia bg-clip-text text-transparent">{data.title}</h1>
            <div className="flex items-center gap-4 mb-2">
              <span className="text-flo-gold font-bold">{data.rating} ★</span>
              <span className="text-flo-white opacity-80">{data.year}</span>
              <span className="text-flo-fuchsia font-semibold capitalize">{data.type}</span>
            </div>
            <p className="text-flo-white opacity-90 mb-4">{data.description}</p>
            <button
              className="mt-2 px-6 py-2 rounded bg-gradient-to-r from-flo-blue to-flo-fuchsia text-white font-bold shadow hover:brightness-110 transition"
              onClick={handlePlay}
              disabled={isLoadingStream}
            >
              {isLoadingStream ? 'Chargement...' : 'Lecture'}
            </button>
            {streamError && <div className="text-red-400 mt-2">{streamError}</div>}
          </div>
        </div>
      </div>
      {streamUrl && (
        <VideoPlayer src={streamUrl} poster={data.image} title={data.title} />
      )}
    </main>
  );
}

export default ContentDetailPage
