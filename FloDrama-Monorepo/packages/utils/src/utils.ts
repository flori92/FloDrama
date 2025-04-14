/**
 * Formate une date en chaîne de caractères selon le format français
 * @param date - La date à formater
 * @returns La date formatée en chaîne de caractères
 */
export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

/**
 * Vérifie si une chaîne est vide ou ne contient que des espaces
 * @param str - La chaîne à vérifier
 * @returns true si la chaîne est vide ou ne contient que des espaces
 */
export const isEmpty = (str: string): boolean => {
  return str.trim().length === 0;
};
