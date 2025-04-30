import React from 'react';
import HeroBanner from '../components/HeroBanner';
import ContentGrid from '../components/ContentGrid';
import ContinueWatchingRow from '../components/ContinueWatchingRow';
import { useAuth } from '../hooks/useAuth';

const Home: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.id || '';
  const token = user?.token || '';

  return (
    <div className="space-y-12">
      <HeroBanner />
      {userId && token && (
        <ContinueWatchingRow userId={userId} token={token} />
      )}
      <ContentGrid title="Tendances" category="trending" userId={userId} token={token} />
      <ContentGrid title="Dramas" category="dramas" userId={userId} token={token} />
      <ContentGrid title="Films" category="movies" userId={userId} token={token} />
      <ContentGrid title="Animés" category="anime" userId={userId} token={token} />
      <ContentGrid title="Bollywood" category="bollywood" userId={userId} token={token} />
    </div>
  );
};

export default Home;