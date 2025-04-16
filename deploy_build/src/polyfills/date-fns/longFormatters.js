// Polyfill pour date-fns/_lib/format/longFormatters
// Basé sur la structure de date-fns v2.x pour compatibilité avec v4.x

const longFormatters = {
  p: function (val, options) {
    return options.isLower ? 'am' : 'AM';
  },
  P: function (val, options) {
    return options.isLower ? 'pm' : 'PM';
  }
};

export default longFormatters;
