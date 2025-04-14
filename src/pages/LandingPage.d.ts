import React from 'react';

export interface LandingPageProps {
  onEnter: () => void;
}

declare const LandingPage: React.FC<LandingPageProps>;

export default LandingPage;
