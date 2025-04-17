// import React from 'react'; // Suppression de l'import inutile
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CarouselRecommandations from '@/components/features/CarouselRecommandations';
import RecommandationService from '@/services/RecommandationService';

// Mock du service de recommandation
jest.mock('@/services/RecommandationService');

// Données de test
const contenuTest = {
  id: '1',
  titre: 'Test Titre',
  description: 'Description test',
  imageUrl: 'https://example.com/image.jpg',
  type: 'film' as const,
  genres: ['action', 'drame'],
  duree: 120,
  note: 4.5,
  dateAjout: '2025-03-16'
};

describe('CarouselRecommandations', () => {
  beforeEach(() => {
    // Réinitialiser les mocks avant chaque test
    jest.clearAllMocks();
    
    // Mock par défaut pour le service
    (RecommandationService.getRecommandations as jest.Mock).mockResolvedValue([contenuTest]);
  });

  it('devrait afficher un message de chargement initialement', () => {
    render(
      <CarouselRecommandations
        userId="user123"
        nombreElements={1}
      />
    );

    expect(screen.getByText('Chargement des recommandations...')).toBeInTheDocument();
  });

  it('devrait afficher les contenus après le chargement', async () => {
    render(
      <CarouselRecommandations
        userId="user123"
        nombreElements={1}
      />
    );

    // Attendre que le contenu soit chargé
    await waitFor(() => {
      expect(screen.getByText(contenuTest.titre)).toBeInTheDocument();
    });

    // Vérifier les détails du contenu
    expect(screen.getByText(contenuTest.description)).toBeInTheDocument();
    expect(screen.getByText(`${contenuTest.duree} min`)).toBeInTheDocument();
    expect(screen.getByText(`★ ${contenuTest.note.toFixed(1)}`)).toBeInTheDocument();
  });

  it('devrait gérer les erreurs correctement', async () => {
    // Simuler une erreur
    (RecommandationService.getRecommandations as jest.Mock).mockRejectedValue(
      new Error('Erreur test')
    );

    render(
      <CarouselRecommandations
        userId="user123"
        nombreElements={1}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Une erreur est survenue/)).toBeInTheDocument();
    });
  });

  it('devrait appeler onSelectionContenu lors du clic sur un contenu', async () => {
    const onSelectionContenu = jest.fn();

    render(
      <CarouselRecommandations
        userId="user123"
        nombreElements={1}
        onSelectionContenu={onSelectionContenu}
      />
    );

    // Attendre le chargement du contenu
    await waitFor(() => {
      expect(screen.getByText(contenuTest.titre)).toBeInTheDocument();
    });

    // Simuler le clic sur le contenu
    fireEvent.click(screen.getByText(contenuTest.titre));

    // Vérifier que le callback a été appelé avec le bon contenu
    expect(onSelectionContenu).toHaveBeenCalledWith(contenuTest);
  });

  it('devrait respecter le nombre d\'éléments demandé', async () => {
    const nombreElements = 3;
    const contenusMultiples = Array(nombreElements)
      .fill(null)
      .map((_, index) => ({
        ...contenuTest,
        id: String(index + 1),
        titre: `Titre ${index + 1}`
      }));

    (RecommandationService.getRecommandations as jest.Mock).mockResolvedValue(contenusMultiples);

    render(
      <CarouselRecommandations
        userId="user123"
        nombreElements={nombreElements}
      />
    );

    // Vérifier que le service a été appelé avec le bon nombre d'éléments
    expect(RecommandationService.getRecommandations).toHaveBeenCalledWith(
      'user123',
      expect.any(Object),
      nombreElements
    );

    // Vérifier que tous les contenus sont affichés
    await waitFor(() => {
      contenusMultiples.forEach(contenu => {
        expect(screen.getByText(contenu.titre)).toBeInTheDocument();
      });
    });
  });

  // Test des props de style
  it('devrait appliquer les classes CSS correctement', () => {
    const className = 'test-class';
    render(
      <CarouselRecommandations
        userId="user123"
        className={className}
      />
    );

    expect(screen.getByTestId('carousel-recommandations')).toHaveClass(className);
  });
});

// Tests du hook useRecommandations
import { renderHook, act } from '@testing-library/react-hooks';
import { useRecommandations } from '@/hooks/useRecommandations';

describe('useRecommandations', () => {
  it('devrait charger les recommandations initiales', async () => {
    const recommandationsMock = [contenuTest];
    (RecommandationService.getRecommandations as jest.Mock).mockResolvedValue(recommandationsMock);

    const { result, waitForNextUpdate } = renderHook(() => useRecommandations({ userId: 'user123', nombreElements: 1 }));

    expect(result.current.isLoading).toBe(true);
    await waitForNextUpdate();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.contenus).toEqual(recommandationsMock);
    expect(result.current.error).toBeNull();
  });

  it('devrait gérer une erreur lors du chargement', async () => {
    (RecommandationService.getRecommandations as jest.Mock).mockRejectedValue(new Error('Erreur test'));
    const { result, waitForNextUpdate } = renderHook(() => useRecommandations({ userId: 'user123', nombreElements: 1 }));
    await waitForNextUpdate();
    expect(result.current.error).not.toBeNull();
    expect(result.current.contenus).toEqual([]);
  });

  it('devrait mettre à jour les préférences et recharger les recommandations', async () => {
    const recommandationsInitiales = [contenuTest];
    const recommandationsMaj = [{ ...contenuTest, id: '2', titre: 'Maj' }];
    (RecommandationService.getRecommandations as jest.Mock)
      .mockResolvedValueOnce(recommandationsInitiales)
      .mockResolvedValueOnce(recommandationsMaj);
    (RecommandationService.mettreAJourPreferences as jest.Mock).mockResolvedValue(true);

    const { result, waitForNextUpdate } = renderHook(() => useRecommandations({ userId: 'user123', nombreElements: 1 }));
    await waitForNextUpdate();
    expect(result.current.contenus).toEqual(recommandationsInitiales);

    await act(async () => {
      await result.current.mettreAJourPreferences({ genresPrefers: ['action'] });
    });
    expect(result.current.contenus).toEqual(recommandationsMaj);
    expect(result.current.error).toBeNull();
  });
});
