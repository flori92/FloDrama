import { useRef, useEffect } from 'react';
import { useAnimation } from '@lynx/core';
import { AppConfig } from '../app.config';

/**
 * Hook personnalisé pour gérer les animations avec Lynx.js
 * @param {Object} options - Options de configuration
 * @param {string} options.type - Type d'animation ('default' ou 'page')
 * @param {Object} options.customConfig - Configuration personnalisée (optionnel)
 * @returns {Object} Méthodes et propriétés pour gérer l'animation
 */
export const useAnimationLynx = ({ type = 'default', customConfig = {} }) => {
  const elementRef = useRef(null);
  const animation = useAnimation();
  const config = AppConfig.ui.theme.animations[type];

  // Fusion de la configuration par défaut avec la configuration personnalisée
  const finalConfig = {
    duration: customConfig.duration || config.duration,
    easing: customConfig.easing || config.easing
  };

  /**
   * Lance une animation de fondu
   * @param {Object} params - Paramètres de l'animation
   */
  const fade = async ({ direction = 'in', onComplete } = {}) => {
    if (!elementRef.current) return;

    const opacity = {
      from: direction === 'in' ? 0 : 1,
      to: direction === 'in' ? 1 : 0
    };

    await animation.start({
      target: elementRef.current,
      property: 'opacity',
      from: opacity.from,
      to: opacity.to,
      duration: finalConfig.duration,
      easing: finalConfig.easing,
      onComplete
    });
  };

  /**
   * Lance une animation de translation
   * @param {Object} params - Paramètres de l'animation
   */
  const translate = async ({ 
    direction = 'left',
    distance = 100,
    onComplete 
  } = {}) => {
    if (!elementRef.current) return;

    const axis = direction === 'left' || direction === 'right' ? 'X' : 'Y';
    const sign = direction === 'left' || direction === 'up' ? '-' : '';

    await animation.start({
      target: elementRef.current,
      property: `translate${axis}`,
      from: 0,
      to: `${sign}${distance}px`,
      duration: finalConfig.duration,
      easing: finalConfig.easing,
      onComplete
    });
  };

  /**
   * Lance une animation d'échelle
   * @param {Object} params - Paramètres de l'animation
   */
  const scale = async ({ 
    from = 1,
    to = 1.1,
    onComplete 
  } = {}) => {
    if (!elementRef.current) return;

    await animation.start({
      target: elementRef.current,
      property: 'scale',
      from,
      to,
      duration: finalConfig.duration,
      easing: finalConfig.easing,
      onComplete
    });
  };

  /**
   * Lance une séquence d'animations
   * @param {Array} sequence - Séquence d'animations à exécuter
   */
  const sequence = async (sequence = []) => {
    if (!elementRef.current || !sequence.length) return;

    for (const animation of sequence) {
      switch (animation.type) {
        case 'fade':
          await fade(animation);
          break;
        case 'translate':
          await translate(animation);
          break;
        case 'scale':
          await scale(animation);
          break;
        default:
          console.warn(`Type d'animation non supporté: ${animation.type}`);
      }
    }
  };

  /**
   * Arrête toutes les animations en cours
   */
  const stop = () => {
    if (!elementRef.current) return;
    animation.stop(elementRef.current);
  };

  // Nettoyage des animations à la destruction du composant
  useEffect(() => {
    return () => {
      if (elementRef.current) {
        animation.stop(elementRef.current);
      }
    };
  }, []);

  return {
    elementRef,
    fade,
    translate,
    scale,
    sequence,
    stop
  };
};
