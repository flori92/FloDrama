import { useState, useEffect } from 'react';

/**
 * Hook personnalisé pour débouncer une valeur
 * Utile pour éviter des appels API trop fréquents lors de la saisie utilisateur
 * 
 * @param {any} value - La valeur à débouncer
 * @param {number} delay - Délai en millisecondes
 * @returns {any} La valeur debouncée
 */
export function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Définir un timer pour mettre à jour la valeur debouncée après le délai
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Nettoyer le timer si la valeur change avant la fin du délai
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
