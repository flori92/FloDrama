import React from 'react';
import { render, fireEvent, act } from '@lynx/testing-library';
import { LecteurVideo } from '../../../composants/lecteur/LecteurVideo';
import { AppConfig } from '../../../app.config';

describe('LecteurVideo', () => {
  const mockSource = {
    uri: 'https://example.com/video.mp4'
  };

  const mockSousTitres = [
    { id: 'fr', url: 'https://example.com/subtitles-fr.vtt', langue: 'Français' }
  ];

  const setup = (props = {}) => {
    const defaultProps = {
      source: mockSource,
      sousTitres: mockSousTitres,
      onFinLecture: jest.fn(),
      autoPlay: false,
      qualiteParDefaut: 'auto'
    };

    return render(<LecteurVideo {...defaultProps} {...props} />);
  };

  it('devrait rendre le composant correctement', () => {
    const { getByTestId } = setup();
    expect(getByTestId('lecteur-video')).toBeTruthy();
  });

  it('devrait afficher les contrôles au clic', () => {
    const { getByTestId, queryByTestId } = setup();
    
    // Initialement, les contrôles sont visibles
    expect(queryByTestId('controles-video')).toBeTruthy();
    
    // Clic sur la vidéo
    fireEvent.press(getByTestId('lecteur-video'));
    
    // Les contrôles restent visibles pendant 3 secondes
    expect(queryByTestId('controles-video')).toBeTruthy();
    
    // Après 3 secondes, les contrôles disparaissent
    act(() => {
      jest.advanceTimersByTime(3000);
    });
    
    expect(queryByTestId('controles-video')).toBeNull();
  });

  it('devrait basculer la lecture au clic sur le bouton play/pause', () => {
    const { getByTestId } = setup();
    const boutonLecture = getByTestId('bouton-lecture');
    
    // État initial : pause
    expect(getByTestId('icone-lecture')).toBeTruthy();
    
    // Clic pour lancer la lecture
    fireEvent.press(boutonLecture);
    expect(getByTestId('icone-pause')).toBeTruthy();
    
    // Clic pour mettre en pause
    fireEvent.press(boutonLecture);
    expect(getByTestId('icone-lecture')).toBeTruthy();
  });

  it('devrait changer la qualité vidéo', () => {
    const { getByTestId } = setup();
    const boutonQualite = getByTestId('bouton-qualite');
    
    // Qualité initiale : auto
    expect(getByTestId('texte-qualite')).toHaveTextContent('AUTO');
    
    // Changement de qualité
    fireEvent.press(boutonQualite);
    expect(getByTestId('texte-qualite')).toHaveTextContent('HD');
  });

  it('devrait mettre à jour la barre de progression', () => {
    const { getByTestId } = setup();
    const progression = getByTestId('barre-progression');
    
    // Simuler la progression de la vidéo
    act(() => {
      fireEvent(progression, 'onProgress', {
        currentTime: 30,
        duration: 60
      });
    });
    
    expect(getByTestId('progression-actuelle')).toHaveStyle({
      width: '50%'
    });
  });

  it('devrait appeler onFinLecture à la fin de la vidéo', () => {
    const onFinLecture = jest.fn();
    const { getByTestId } = setup({ onFinLecture });
    
    act(() => {
      fireEvent(getByTestId('lecteur-video'), 'onEnd');
    });
    
    expect(onFinLecture).toHaveBeenCalled();
  });

  it('devrait utiliser les paramètres par défaut de AppConfig', () => {
    const { getByTestId } = setup();
    
    expect(getByTestId('texte-qualite')).toHaveTextContent(
      AppConfig.ui.components.player.defaultQuality.toUpperCase()
    );
  });
});
