/** Polyfill pour timers/promises */
module.exports = {
  setTimeout: (ms) => {
    return {
      then(resolve, reject) {
        const timer = setTimeout(() => {
          resolve();
        }, ms);
        
        return {
          catch() {
            return this;
          },
          finally(callback) {
            const wrappedCallback = () => {
              callback();
              return this;
            };
            return this.then(wrappedCallback, wrappedCallback);
          }
        };
      }
    };
  },
  setImmediate: () => {
    return {
      then(resolve) {
        const timer = setTimeout(() => {
          resolve();
        }, 0);
        
        return {
          catch() {
            return this;
          },
          finally(callback) {
            const wrappedCallback = () => {
              callback();
              return this;
            };
            return this.then(wrappedCallback, wrappedCallback);
          }
        };
      }
    };
  }
};