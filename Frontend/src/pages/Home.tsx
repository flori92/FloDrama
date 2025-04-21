import React from 'react';
import HeroBanner from '../components/HeroBanner';
import ContentGrid from '../components/ContentGrid';

const Home: React.FC = () => {
  return (
    <div className="space-y-12">
      <HeroBanner />
      <ContentGrid title="Tendances" category="trending" />
      <ContentGrid title="Dramas" category="dramas" />
      <ContentGrid title="Films" category="movies" />
      <ContentGrid title="Animés" category="anime" />
      <ContentGrid title="Bollywood" category="bollywood" />
    </div>
  );
};

export default Home;