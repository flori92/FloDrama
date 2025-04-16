/**
 * Patch pour résoudre les problèmes de compatibilité entre date-fns v2.x et les composants qui utilisent
 * des chemins d'importation internes de date-fns v4.x
 * 
 * Ce fichier est utilisé comme polyfill pour les chemins d'importation non exportés
 * dans date-fns v2.x mais attendus par certaines bibliothèques comme @mui/x-date-pickers
 */

// Exporte les formateurs longs pour date-fns
const longFormatters = {
  p: function (val, options) {
    return options.isLower ? 'am' : 'AM';
  },
  P: function (val, options) {
    return options.isLower ? 'pm' : 'PM';
  }
};

export default longFormatters;
