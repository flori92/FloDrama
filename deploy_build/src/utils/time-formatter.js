/**
 * Utilitaires de formatage du temps pour FloDrama
 * Utilisé principalement pour la fonctionnalité Watch Party
 */

/**
 * Formate un timestamp en secondes au format HH:MM:SS ou MM:SS
 * @param {number} seconds - Nombre de secondes à formater
 * @param {boolean} showHours - Afficher les heures même si elles sont à 0
 * @returns {string} - Chaîne formatée
 */
export const formatTimestamp = (seconds, showHours = false) => {
  if (!seconds && seconds !== 0) return '--:--';
  
  const totalSeconds = Math.floor(seconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainingSeconds = totalSeconds % 60;
  
  // Format avec les heures si nécessaire
  if (hours > 0 || showHours) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  
  // Format sans les heures
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

/**
 * Convertit une chaîne de format HH:MM:SS ou MM:SS en secondes
 * @param {string} timeString - Chaîne au format HH:MM:SS ou MM:SS
 * @returns {number} - Nombre de secondes
 */
export const parseTimestamp = (timeString) => {
  if (!timeString) return 0;
  
  const parts = timeString.split(':').map(part => parseInt(part, 10));
  
  if (parts.length === 3) {
    // Format HH:MM:SS
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    // Format MM:SS
    return parts[0] * 60 + parts[1];
  }
  
  return 0;
};

/**
 * Formate la durée d'une vidéo en format lisible
 * @param {number} durationInSeconds - Durée en secondes
 * @returns {string} - Durée formatée
 */
export const formatDuration = (durationInSeconds) => {
  if (!durationInSeconds) return '';
  
  const hours = Math.floor(durationInSeconds / 3600);
  const minutes = Math.floor((durationInSeconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}min`;
  }
  
  return `${minutes} min`;
};

/**
 * Génère un timestamp relatif (il y a X minutes, etc.)
 * @param {Date|string|number} date - Date à formater
 * @returns {string} - Timestamp relatif
 */
export const getRelativeTime = (date) => {
  if (!date) return '';
  
  const now = new Date();
  const dateObj = new Date(date);
  const diffInSeconds = Math.floor((now - dateObj) / 1000);
  
  if (diffInSeconds < 60) {
    return 'À l\'instant';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `Il y a ${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''}`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `Il y a ${diffInHours} heure${diffInHours > 1 ? 's' : ''}`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `Il y a ${diffInDays} jour${diffInDays > 1 ? 's' : ''}`;
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `Il y a ${diffInMonths} mois`;
  }
  
  const diffInYears = Math.floor(diffInMonths / 12);
  return `Il y a ${diffInYears} an${diffInYears > 1 ? 's' : ''}`;
};
