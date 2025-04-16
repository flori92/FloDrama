// Patch pour résoudre le problème d'importation de process/browser dans axios
import process from '../polyfills/process-browser-polyfill.js';

// Exposer process globalement pour axios
window.process = process;

export default process;