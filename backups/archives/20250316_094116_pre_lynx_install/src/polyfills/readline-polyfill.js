/** Polyfill pour readline */
module.exports = {
  createInterface: () => ({
    question: (query, callback) => {
      // Dans un navigateur, on ne peut pas vraiment demander une entrée utilisateur de cette façon
      callback('');
    },
    close: () => {},
    on: () => {},
    once: () => {},
    setPrompt: () => {},
    prompt: () => {},
    write: () => {},
    pause: () => {},
    resume: () => {},
    removeListener: () => {},
    removeAllListeners: () => {}
  }),
  clearLine: () => {},
  clearScreenDown: () => {},
  cursorTo: () => {},
  moveCursor: () => {},
  emitKeypressEvents: () => {}
};