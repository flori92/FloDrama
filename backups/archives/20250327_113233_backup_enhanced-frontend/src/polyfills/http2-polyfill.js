// Polyfill pour http2
module.exports = {
  connect: () => {
    console.warn('http2.connect non disponible dans le navigateur');
    throw new Error('http2.connect non disponible dans le navigateur');
  },
  createServer: () => {
    console.warn('http2.createServer non disponible dans le navigateur');
    throw new Error('http2.createServer non disponible dans le navigateur');
  }
};