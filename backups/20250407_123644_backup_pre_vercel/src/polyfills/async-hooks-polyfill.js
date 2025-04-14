/** Polyfill pour async_hooks */
module.exports = {
  createHook: () => ({ enable: () => {}, disable: () => {} }),
  executionAsyncId: () => 1,
  triggerAsyncId: () => 0,
  AsyncLocalStorage: class AsyncLocalStorage {
    constructor() {
      this.store = new Map();
    }
    
    run(store, callback, ...args) {
      try {
        return callback(...args);
      } catch (error) {
        throw error;
      }
    }
    
    exit(callback, ...args) {
      try {
        return callback(...args);
      } catch (error) {
        throw error;
      }
    }
    
    getStore() {
      return undefined;
    }
    
    enterWith(store) {
      // Noop implementation
    }
    
    disable() {
      // Noop implementation
    }
  },
  AsyncResource: class AsyncResource {
    constructor(type, options) {
      this.type = type;
      this.options = options || {};
    }
    
    runInAsyncScope(fn, thisArg, ...args) {
      return fn.apply(thisArg, args);
    }
    
    emitDestroy() {
      // Noop implementation
    }
    
    asyncId() {
      return 1;
    }
    
    triggerAsyncId() {
      return 0;
    }
  }
};