import React, { useState, useEffect } from 'react';
import { View, Video, TouchableOpacity, Text } from '@lynx/core';
import { styled } from '@lynx/styled';
import { useAnimationLynx } from '../../hooks/useAnimationLynx';
import { AppConfig } from '../../app.config';

const ConteneurLecteur = styled(View)`
  width: 100%;
  aspect-ratio: 16/9;
  background-color: ${props => props.theme.colors.background};
  position: relative;
`;

const ConteneurControles = styled(View)`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
`;

const BoutonControle = styled(TouchableOpacity)`
  padding: 8px;
  border-radius: 4px;
  background-color: rgba(255, 255, 255, 0.2);
  margin: 0 4px;
`;

const TexteControle = styled(Text)`
  color: #ffffff;
  font-size: 14px;
`;

const BarreProgression = styled(View)`
  height: 4px;
  background-color: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
  overflow: hidden;
  flex: 1;
  margin: 0 16px;
`;

const Progression = styled(View)`
  height: 100%;
  background-color: ${props => props.theme.colors.primary};
  width: ${props => props.progres}%;
`;

const ConteneurQualite = styled(View)`
  position: absolute;
  right: 16px;
  top: 16px;
  background-color: rgba(0, 0, 0, 0.7);
  border-radius: 4px;
  padding: 8px;
`;

export const LecteurVideo = ({ 
  source,
  sousTitres,
  onFinLecture,
  autoPlay = AppConfig.ui.components.player.autoPlay,
  qualiteParDefaut = AppConfig.ui.components.player.defaultQuality
}) => {
  const [enLecture, setEnLecture] = useState(autoPlay);
  const [progres, setProgres] = useState(0);
  const [duree, setDuree] = useState(0);
  const [qualite, setQualite] = useState(qualiteParDefaut);
  const [afficherControles, setAfficherControles] = useState(true);
  
  // Animation des contrôles
  const animationControles = useAnimationLynx({
    type: 'default',
    customConfig: {
      duration: 200
    }
  });

  // Gestion de l'affichage/masquage automatique des contrôles
  useEffect(() => {
    let timer;
    if (afficherControles && enLecture) {
      timer = setTimeout(() => {
        masquerControles();
      }, 3000);
    }
    return () => clearTimeout(timer);
  }, [afficherControles, enLecture]);

  const basculerLecture = () => {
    setEnLecture(!enLecture);
  };

  const afficherControles = async () => {
    setAfficherControles(true);
    await animationControles.fade({ direction: 'in' });
  };

  const masquerControles = async () => {
    await animationControles.fade({ direction: 'out' });
    setAfficherControles(false);
  };

  const changerQualite = (nouvelleQualite) => {
    setQualite(nouvelleQualite);
  };

  const onProgression = (event) => {
    const { currentTime, duration } = event;
    setProgres((currentTime / duration) * 100);
    setDuree(duration);
  };

  const formaterTemps = (secondes) => {
    const minutes = Math.floor(secondes / 60);
    const secondesRestantes = Math.floor(secondes % 60);
    return `${minutes}:${secondesRestantes.toString().padStart(2, '0')}`;
  };

  return (
    <ConteneurLecteur>
      <TouchableOpacity
        onPress={() => afficherControles()}
        activeOpacity={1}
      >
        <Video
          source={source}
          style={{ width: '100%', height: '100%' }}
          resizeMode="contain"
          playing={enLecture}
          quality={qualite}
          subtitles={sousTitres}
          onProgress={onProgression}
          onEnd={onFinLecture}
        />
      </TouchableOpacity>

      {afficherControles && (
        <ConteneurControles ref={animationControles.elementRef}>
          <BoutonControle onPress={basculerLecture}>
            <TexteControle>
              {enLecture ? '⏸️' : '▶️'}
            </TexteControle>
          </BoutonControle>

          <BarreProgression>
            <Progression progres={progres} />
          </BarreProgression>

          <TexteControle>
            {formaterTemps(duree * (progres / 100))} / {formaterTemps(duree)}
          </TexteControle>

          <BoutonControle onPress={() => setQualite(qualite === 'auto' ? 'hd' : 'auto')}>
            <TexteControle>
              {qualite.toUpperCase()}
            </TexteControle>
          </BoutonControle>
        </ConteneurControles>
      )}

      <ConteneurQualite>
        <TexteControle>
          {qualite === 'auto' ? 'Qualité Auto' : 'HD'}
        </TexteControle>
      </ConteneurQualite>
    </ConteneurLecteur>
  );
};
