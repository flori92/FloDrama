import React from 'react';
import { View, Image, Text, ScrollView, TouchableOpacity } from '@lynx/core';
import { styled } from '@lynx/styled';
import { useAnimation, useVisibility } from '@lynx/hooks';
import { AppConfig } from '../../app.config';

const ConteneurCarousel = styled(View)`
  height: 400px;
  background-color: ${props => props.theme.colors.background};
`;

const ConteneurSlide = styled(TouchableOpacity)`
  width: 100%;
  height: 100%;
  position: relative;
`;

const ImageSlide = styled(Image)`
  width: 100%;
  height: 100%;
  resize-mode: cover;
`;

const ConteneurInfo = styled(View)`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20px;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
`;

const TitreSlide = styled(Text)`
  color: #ffffff;
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 8px;
`;

const DescriptionSlide = styled(Text)`
  color: #ffffff;
  font-size: 16px;
  opacity: 0.8;
`;

const ConteneurIndicateurs = styled(View)`
  flex-direction: row;
  justify-content: center;
  align-items: center;
  position: absolute;
  bottom: 16px;
  left: 0;
  right: 0;
`;

const Indicateur = styled(View)`
  width: 8px;
  height: 8px;
  border-radius: 4px;
  margin: 0 4px;
  background-color: ${props => 
    props.actif ? props.theme.colors.primary : 'rgba(255, 255, 255, 0.5)'};
  transition: all 0.3s ease;
`;

export const CarouselDynamique = ({ elements = [], onElementSelect }) => {
  const [indexActif, setIndexActif] = React.useState(0);
  const scrollRef = React.useRef(null);
  const animation = useAnimation();
  const visibility = useVisibility();

  // Configuration du carrousel depuis app.config.js
  const { autoPlay, interval } = AppConfig.ui.components.carousel;

  // Gestion du défilement automatique
  React.useEffect(() => {
    if (!autoPlay) return;

    const timer = setInterval(() => {
      const nouveauIndex = (indexActif + 1) % elements.length;
      defilerVers(nouveauIndex);
    }, interval);

    return () => clearInterval(timer);
  }, [indexActif, elements.length]);

  // Animation de défilement fluide
  const defilerVers = (index) => {
    if (!scrollRef.current) return;

    animation.start({
      target: scrollRef.current,
      property: 'scrollX',
      to: index * scrollRef.current.width,
      duration: 500,
      easing: 'easeInOutCubic'
    });

    setIndexActif(index);
  };

  // Optimisation du rendu avec la détection de visibilité
  const handleVisibilityChange = (visible) => {
    if (!visible && autoPlay) {
      // Mettre en pause le défilement automatique si non visible
      clearInterval(timer);
    }
  };

  return (
    <ConteneurCarousel>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={(event) => {
          const offset = event.nativeEvent.contentOffset.x;
          const index = Math.round(offset / scrollRef.current.width);
          if (index !== indexActif) setIndexActif(index);
        }}
        scrollEventThrottle={16}
      >
        {elements.map((element, index) => (
          <ConteneurSlide
            key={element.id}
            onPress={() => onElementSelect?.(element)}
            onVisibilityChange={handleVisibilityChange}
          >
            <ImageSlide source={{ uri: element.image }} />
            <ConteneurInfo>
              <TitreSlide>{element.titre}</TitreSlide>
              <DescriptionSlide numberOfLines={2}>
                {element.description}
              </DescriptionSlide>
            </ConteneurInfo>
          </ConteneurSlide>
        ))}
      </ScrollView>

      <ConteneurIndicateurs>
        {elements.map((_, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => defilerVers(index)}
          >
            <Indicateur actif={index === indexActif} />
          </TouchableOpacity>
        ))}
      </ConteneurIndicateurs>
    </ConteneurCarousel>
  );
};
