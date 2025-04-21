import React from 'react';
import HeroBanner from '../components/HeroBanner';
import ContentGrid from '../components/ContentGrid';

const Home: React.FC = () => {
  return (
    <div className="space-y-8">
      <HeroBanner />
      <ContentGrid title="Dramas Populaires" category="dramas" />
      <ContentGrid title="Films à ne pas manquer" category="movies" />
      <ContentGrid title="Anime Tendances" category="anime" />
      <ContentGrid title="Bollywood" category="bollywood" />
    </div>
  );
};

export default Home; 