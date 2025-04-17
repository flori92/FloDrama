/**
 * Utilitaires de gestion du presse-papiers pour FloDrama
 * Compatible avec les environnements web et mobile
 */

/**
 * Copie un texte dans le presse-papiers
 * @param {string} text - Texte à copier
 * @returns {Promise<boolean>} - Succès de l'opération
 */
export const copyToClipboard = async (text) => {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      // API moderne du presse-papiers (navigateurs récents)
      await navigator.clipboard.writeText(text);
      return true;
    } else if (document.execCommand) {
      // Méthode de secours pour les navigateurs plus anciens
      const textArea = document.createElement('textarea');
      textArea.value = text;
      
      // Rendre l'élément invisible
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      
      // Sélectionner et copier le texte
      textArea.focus();
      textArea.select();
      const success = document.execCommand('copy');
      
      // Nettoyer
      document.body.removeChild(textArea);
      
      return success;
    }
    
    console.warn('Aucune méthode de copie disponible dans ce navigateur');
    return false;
  } catch (error) {
    console.error('Erreur lors de la copie dans le presse-papiers:', error);
    return false;
  }
};

/**
 * Lit le contenu du presse-papiers
 * @returns {Promise<string|null>} - Contenu du presse-papiers ou null en cas d'erreur
 */
export const readFromClipboard = async () => {
  try {
    if (navigator.clipboard && navigator.clipboard.readText) {
      // API moderne du presse-papiers (navigateurs récents)
      return await navigator.clipboard.readText();
    }
    
    console.warn('La lecture du presse-papiers n\'est pas supportée dans ce navigateur');
    return null;
  } catch (error) {
    console.error('Erreur lors de la lecture du presse-papiers:', error);
    return null;
  }
};
