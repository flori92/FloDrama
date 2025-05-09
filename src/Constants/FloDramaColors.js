// Palette de couleurs officielle FloDrama
// Basée sur la configuration Tailwind et l'identité visuelle

// Couleurs primaires (du logo et de la configuration Tailwind)
export const FLODRAMA_BLUE = '#3b82f6';     // Bleu officiel
export const FLODRAMA_FUCHSIA = '#d946ef';  // Fuchsia officiel

// Variantes pour les états (hover, active, etc.)
export const FLODRAMA_BLUE_LIGHT = '#60a5fa';    // Version plus claire du bleu
export const FLODRAMA_FUCHSIA_LIGHT = '#e879f9'; // Version plus claire du fuchsia

// Couleurs neutres pour le fond et le texte
export const FLODRAMA_DARK = '#141414';  // Fond sombre (défini dans tailwind.config)
export const FLODRAMA_LIGHT = '#f8fafc'; // Texte clair

// Dégradés prédéfinis pour les boutons et éléments d'interface
export const GRADIENT_PRIMARY = 'linear-gradient(90deg, #3b82f6 0%, #d946ef 100%)';
export const GRADIENT_HOVER = 'linear-gradient(90deg, rgba(59, 130, 246, 0.8) 0%, rgba(217, 70, 239, 0.8) 100%)';
export const GRADIENT_TRANSPARENT = 'linear-gradient(90deg, rgba(59, 130, 246, 0.2) 0%, rgba(217, 70, 239, 0.2) 100%)';

// Classes Tailwind pour les dégradés (correspondant aux définitions dans tailwind.config)
export const TAILWIND_GRADIENT = 'bg-gradient-to-r from-flodrama-blue to-flodrama-fuchsia';
export const TAILWIND_GRADIENT_HOVER = 'hover:from-flodrama-blue/80 hover:to-flodrama-fuchsia/80';
export const TAILWIND_GRADIENT_REVERSE = 'hover:from-flodrama-fuchsia hover:to-flodrama-blue';
export const TAILWIND_TEXT_GRADIENT = 'bg-clip-text text-transparent bg-gradient-to-r from-flodrama-blue to-flodrama-fuchsia';

// Fonction utilitaire pour générer un style de dégradé
export const getGradientStyle = (direction = '90deg') => ({
  background: `linear-gradient(${direction}, #3b82f6 0%, #d946ef 100%)`
});

// Fonction pour générer un style de dégradé avec opacité
export const getGradientWithOpacity = (direction = '90deg', opacity = 0.8) => ({
  background: `linear-gradient(${direction}, rgba(59, 130, 246, ${opacity}) 0%, rgba(217, 70, 239, ${opacity}) 100%)`
});
