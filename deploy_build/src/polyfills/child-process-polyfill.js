// Polyfill pour child_process
module.exports = {
  spawn: () => {
    console.warn('child_process.spawn non disponible dans le navigateur');
    throw new Error('child_process.spawn non disponible dans le navigateur');
  },
  exec: () => {
    console.warn('child_process.exec non disponible dans le navigateur');
    throw new Error('child_process.exec non disponible dans le navigateur');
  },
  execSync: () => {
    console.warn('child_process.execSync non disponible dans le navigateur');
    throw new Error('child_process.execSync non disponible dans le navigateur');
  }
};