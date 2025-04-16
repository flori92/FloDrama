// Polyfill pour fs
module.exports = {
  readFile: (path, options, callback) => {
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }
    
    console.warn('fs.readFile non disponible dans le navigateur');
    callback(new Error('fs.readFile non disponible dans le navigateur'));
  },
  writeFile: (path, data, options, callback) => {
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }
    
    console.warn('fs.writeFile non disponible dans le navigateur');
    callback(new Error('fs.writeFile non disponible dans le navigateur'));
  },
  readFileSync: (path, options) => {
    console.warn('fs.readFileSync non disponible dans le navigateur');
    throw new Error('fs.readFileSync non disponible dans le navigateur');
  },
  writeFileSync: (path, data, options) => {
    console.warn('fs.writeFileSync non disponible dans le navigateur');
    throw new Error('fs.writeFileSync non disponible dans le navigateur');
  },
  existsSync: (path) => {
    console.warn('fs.existsSync non disponible dans le navigateur');
    return false;
  },
  promises: {
    readFile: async (path, options) => {
      console.warn('fs.promises.readFile non disponible dans le navigateur');
      throw new Error('fs.promises.readFile non disponible dans le navigateur');
    },
    writeFile: async (path, data, options) => {
      console.warn('fs.promises.writeFile non disponible dans le navigateur');
      throw new Error('fs.promises.writeFile non disponible dans le navigateur');
    }
  }
};