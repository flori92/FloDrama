import React from 'react';
import { fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { renderWithLynx } from '../../../test-utils/lynx-test-utils';
import { TEST_CONFIG } from '../../../config/test-config';
import CarouselDynamique from '../../../composants/carousels/CarouselDynamique';

describe('CarouselDynamique', () => {
  const testIdPrefix = TEST_CONFIG.components.carousel.testIdPrefix;
  const elementsTest = [
    {
      id: '1',
      titre: 'Drama Test 1',
      image: 'https://example.com/image1.jpg',
      description: 'Description du drama 1'
    },
    {
      id: '2',
      titre: 'Drama Test 2',
      image: 'https://example.com/image2.jpg',
      description: 'Description du drama 2'
    },
    {
      id: '3',
      titre: 'Drama Test 3',
      image: 'https://example.com/image3.jpg',
      description: 'Description du drama 3'
    }
  ];

  const defaultProps = {
    elements: elementsTest,
    onElementSelect: jest.fn(),
    autoplay: TEST_CONFIG.components.carousel.defaultAutoplay,
    interval: TEST_CONFIG.components.carousel.defaultInterval,
    showIndicators: TEST_CONFIG.components.carousel.defaultShowIndicators
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('devrait rendre correctement le carousel', () => {
    const { getByTestId, getAllByTestId } = renderWithLynx(
      <CarouselDynamique {...defaultProps} />
    );

    const container = getByTestId(`${testIdPrefix}-container`);
    const slides = getAllByTestId(`${testIdPrefix}-slide`);

    expect(container).toBeInTheDocument();
    expect(slides).toHaveLength(elementsTest.length);
  });

  it('devrait naviguer entre les slides avec les boutons', () => {
    const { getByTestId } = renderWithLynx(
      <CarouselDynamique {...defaultProps} />
    );

    const nextButton = getByTestId(`${testIdPrefix}-next`);
    const prevButton = getByTestId(`${testIdPrefix}-prev`);
    const activeSlide = getByTestId(`${testIdPrefix}-active-slide`);

    // Vérifier le slide initial
    expect(activeSlide).toHaveAttribute('data-slide-id', elementsTest[0].id);

    // Naviguer vers le prochain slide
    fireEvent.click(nextButton);
    expect(activeSlide).toHaveAttribute('data-slide-id', elementsTest[1].id);

    // Naviguer vers le slide précédent
    fireEvent.click(prevButton);
    expect(activeSlide).toHaveAttribute('data-slide-id', elementsTest[0].id);
  });

  it('devrait gérer l\'autoplay correctement', () => {
    const { getByTestId } = renderWithLynx(
      <CarouselDynamique {...defaultProps} autoplay={true} />
    );

    const activeSlide = getByTestId(`${testIdPrefix}-active-slide`);

    // Vérifier le slide initial
    expect(activeSlide).toHaveAttribute('data-slide-id', elementsTest[0].id);

    // Avancer le temps pour déclencher l'autoplay
    jest.advanceTimersByTime(TEST_CONFIG.components.carousel.defaultInterval);

    // Vérifier que le slide a changé
    expect(activeSlide).toHaveAttribute('data-slide-id', elementsTest[1].id);
  });

  it('devrait appeler onElementSelect au clic sur un slide', () => {
    const { getAllByTestId } = renderWithLynx(
      <CarouselDynamique {...defaultProps} />
    );

    const slides = getAllByTestId(`${testIdPrefix}-slide`);
    
    // Cliquer sur le deuxième slide
    fireEvent.click(slides[1]);
    expect(defaultProps.onElementSelect).toHaveBeenCalledWith(elementsTest[1]);
  });

  it('devrait afficher les indicateurs si showIndicators est true', () => {
    const { getAllByTestId } = renderWithLynx(
      <CarouselDynamique {...defaultProps} showIndicators={true} />
    );

    const indicators = getAllByTestId(`${testIdPrefix}-indicator`);
    expect(indicators).toHaveLength(elementsTest.length);
  });

  it('devrait naviguer au clic sur un indicateur', () => {
    const { getAllByTestId, getByTestId } = renderWithLynx(
      <CarouselDynamique {...defaultProps} showIndicators={true} />
    );

    const indicators = getAllByTestId(`${testIdPrefix}-indicator`);
    const activeSlide = getByTestId(`${testIdPrefix}-active-slide`);

    // Cliquer sur le deuxième indicateur
    fireEvent.click(indicators[1]);
    expect(activeSlide).toHaveAttribute('data-slide-id', elementsTest[1].id);
  });
});
