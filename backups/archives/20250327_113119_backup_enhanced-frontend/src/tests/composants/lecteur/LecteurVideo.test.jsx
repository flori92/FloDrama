import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { renderWithLynx } from '../../../test-utils/lynx-test-utils';
import { TEST_CONFIG } from '../../../config/test-config';
import { LecteurVideo } from '../../../composants/lecteur/LecteurVideo';
import { AppConfig } from '../../../app.config';

describe('LecteurVideo', () => {
  const testIdPrefix = TEST_CONFIG.components.video.testIdPrefix;
  const mockSource = {
    uri: 'https://example.com/video.mp4'
  };

  const mockSousTitres = [
    { id: 'fr', url: 'https://example.com/subtitles-fr.vtt', langue: 'Français' }
  ];

  const defaultProps = {
    source: mockSource,
    sousTitres: mockSousTitres,
    onFinLecture: jest.fn(),
    autoPlay: false,
    qualiteParDefaut: TEST_CONFIG.components.video.defaultQuality
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const setup = (props = {}) => {
    return renderWithLynx(<LecteurVideo {...defaultProps} {...props} />);
  };

  it('devrait rendre le composant correctement', () => {
    const { getByTestId } = setup();
    expect(getByTestId(`${testIdPrefix}-lecteur-video`)).toBeTruthy();
  });

  it('devrait afficher les contrôles au clic', () => {
    const { getByTestId } = setup();
    
    // Initialement, les contrôles sont visibles
    expect(getByTestId(`${testIdPrefix}-controles-video`)).toBeTruthy();
    
    // Clic sur la vidéo
    fireEvent.press(getByTestId(`${testIdPrefix}-lecteur-video`));
    
    // Les contrôles restent visibles pendant 3 secondes
    expect(getByTestId(`${testIdPrefix}-controles-video`)).toBeTruthy();
    
    // Après 3 secondes, les contrôles disparaissent
    jest.advanceTimersByTime(3000);
    
    // Utilisation de queryBy pour vérifier l'absence des contrôles
    expect(screen.queryByTestId(`${testIdPrefix}-controles-video`)).not.toBeInTheDocument();
  });

  it('devrait basculer la lecture au clic sur le bouton play/pause', () => {
    const { getByTestId } = setup();
    const boutonLecture = getByTestId(`${testIdPrefix}-bouton-lecture`);
    
    // État initial : pause
    expect(getByTestId(`${testIdPrefix}-icone-lecture`)).toBeTruthy();
    
    // Clic pour lancer la lecture
    fireEvent.press(boutonLecture);
    expect(getByTestId(`${testIdPrefix}-icone-pause`)).toBeTruthy();
    
    // Clic pour mettre en pause
    fireEvent.press(boutonLecture);
    expect(getByTestId(`${testIdPrefix}-icone-lecture`)).toBeTruthy();
  });

  it('devrait changer la qualité vidéo', () => {
    const { getByTestId } = setup();
    const boutonQualite = getByTestId(`${testIdPrefix}-bouton-qualite`);
    
    // Qualité initiale : auto
    expect(getByTestId(`${testIdPrefix}-texte-qualite`)).toHaveTextContent(TEST_CONFIG.components.video.defaultQuality.toUpperCase());
    
    // Changement de qualité
    fireEvent.press(boutonQualite);
    expect(getByTestId(`${testIdPrefix}-texte-qualite`)).toHaveTextContent('HD');
  });

  it('devrait mettre à jour la barre de progression', () => {
    const { getByTestId } = setup();
    const progression = getByTestId(`${testIdPrefix}-barre-progression`);
    
    // Simuler la progression de la vidéo
    fireEvent(progression, 'onProgress', {
      currentTime: 30,
      duration: 60
    });
    
    expect(getByTestId(`${testIdPrefix}-progression-actuelle`)).toHaveStyle({
      width: '50%'
    });
  });

  it('devrait appeler onFinLecture à la fin de la vidéo', () => {
    const onFinLecture = jest.fn();
    const { getByTestId } = setup({ onFinLecture });
    
    fireEvent(getByTestId(`${testIdPrefix}-lecteur-video`), 'onEnd');
    
    expect(onFinLecture).toHaveBeenCalled();
  });

  it('devrait utiliser les paramètres par défaut de AppConfig', () => {
    const { getByTestId } = setup();
    
    expect(getByTestId(`${testIdPrefix}-texte-qualite`)).toHaveTextContent(
      AppConfig.ui.components.player.defaultQuality.toUpperCase()
    );
  });
});
