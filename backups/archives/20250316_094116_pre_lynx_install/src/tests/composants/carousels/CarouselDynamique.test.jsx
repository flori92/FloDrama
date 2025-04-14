import React from 'react';
import { render, fireEvent, act } from '@lynx/testing-library';
import { CarouselDynamique } from '../../../composants/carousels/CarouselDynamique';
import { AppConfig } from '../../../app.config';

describe('CarouselDynamique', () => {
  const elementsTest = [
    {
      id: '1',
      titre: 'Drama Test 1',
      description: 'Description du drama 1',
      image: 'https://example.com/image1.jpg'
    },
    {
      id: '2',
      titre: 'Drama Test 2',
      description: 'Description du drama 2',
      image: 'https://example.com/image2.jpg'
    },
    {
      id: '3',
      titre: 'Drama Test 3',
      description: 'Description du drama 3',
      image: 'https://example.com/image3.jpg'
    }
  ];

  const configuration = {
    onElementSelect: jest.fn(),
    autoPlay: AppConfig.ui.components.carousel.autoPlay,
    interval: AppConfig.ui.components.carousel.interval
  };

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  const renduCarousel = (props = {}) => {
    return render(
      <CarouselDynamique
        elements={elementsTest}
        {...configuration}
        {...props}
      />
    );
  };

  describe('Rendu initial', () => {
    it('devrait afficher correctement le premier élément', () => {
      const { getByText, getByTestId } = renduCarousel();
      
      expect(getByText('Drama Test 1')).toBeTruthy();
      expect(getByTestId('carousel-slide-0')).toBeVisible();
    });

    it('devrait afficher tous les indicateurs', () => {
      const { getAllByTestId } = renduCarousel();
      const indicateurs = getAllByTestId('carousel-indicateur');
      
      expect(indicateurs).toHaveLength(elementsTest.length);
      expect(indicateurs[0]).toHaveStyle({ backgroundColor: AppConfig.ui.theme.colors.primary });
    });
  });

  describe('Navigation', () => {
    it('devrait naviguer au clic sur un indicateur', () => {
      const { getAllByTestId, getByText } = renduCarousel();
      const indicateurs = getAllByTestId('carousel-indicateur');
      
      fireEvent.press(indicateurs[1]);
      expect(getByText('Drama Test 2')).toBeTruthy();
    });

    it('devrait défiler automatiquement si autoPlay est activé', () => {
      const { getByText } = renduCarousel({ autoPlay: true });
      
      act(() => {
        jest.advanceTimersByTime(AppConfig.ui.components.carousel.interval);
      });
      
      expect(getByText('Drama Test 2')).toBeTruthy();
    });

    it('devrait arrêter le défilement automatique si non visible', () => {
      const { getByTestId } = renduCarousel({ autoPlay: true });
      const carousel = getByTestId('carousel-conteneur');
      
      fireEvent(carousel, 'onVisibilityChange', false);
      
      act(() => {
        jest.advanceTimersByTime(AppConfig.ui.components.carousel.interval);
      });
      
      // Vérifier que le carousel n'a pas défilé
      expect(getByTestId('carousel-slide-0')).toBeVisible();
    });
  });

  describe('Interactions', () => {
    it('devrait appeler onElementSelect au clic sur un élément', () => {
      const onElementSelect = jest.fn();
      const { getByTestId } = renduCarousel({ onElementSelect });
      
      fireEvent.press(getByTestId('carousel-slide-0'));
      expect(onElementSelect).toHaveBeenCalledWith(elementsTest[0]);
    });

    it('devrait gérer le swipe horizontal', () => {
      const { getByTestId, getByText } = renduCarousel();
      const carousel = getByTestId('carousel-conteneur');
      
      fireEvent(carousel, 'onScroll', {
        nativeEvent: {
          contentOffset: { x: window.innerWidth }
        }
      });
      
      expect(getByText('Drama Test 2')).toBeTruthy();
    });
  });

  describe('Performance', () => {
    it('devrait utiliser la détection de visibilité pour optimiser les performances', () => {
      const { getByTestId } = renduCarousel();
      const carousel = getByTestId('carousel-conteneur');
      
      // Simuler le scroll de la page
      fireEvent(carousel, 'onVisibilityChange', false);
      
      // Vérifier que l'animation est en pause
      expect(carousel.props.autoPlay).toBeFalsy();
    });

    it('devrait optimiser le rendu des images', () => {
      const { getAllByTestId } = renduCarousel();
      const images = getAllByTestId('carousel-image');
      
      images.forEach(image => {
        expect(image.props.loading).toBe('lazy');
        expect(image.props.decoding).toBe('async');
      });
    });
  });

  describe('Accessibilité', () => {
    it('devrait avoir les attributs d\'accessibilité corrects', () => {
      const { getByTestId } = renduCarousel();
      const carousel = getByTestId('carousel-conteneur');
      
      expect(carousel).toHaveAttribute('role', 'region');
      expect(carousel).toHaveAttribute('aria-label', 'Carrousel de dramas');
    });

    it('devrait avoir des boutons de navigation accessibles', () => {
      const { getAllByTestId } = renduCarousel();
      const indicateurs = getAllByTestId('carousel-indicateur');
      
      indicateurs.forEach((indicateur, index) => {
        expect(indicateur).toHaveAttribute('role', 'button');
        expect(indicateur).toHaveAttribute('aria-label', `Voir le drama ${index + 1}`);
      });
    });
  });
});
