/** Polyfill pour net */
module.exports = {
  createServer: () => ({
    listen: () => {},
    close: () => {},
    on: () => {},
    once: () => {},
    removeListener: () => {},
    removeAllListeners: () => {}
  }),
  createConnection: () => ({
    on: () => {},
    once: () => {},
    write: () => {},
    end: () => {},
    destroy: () => {},
    setTimeout: () => {},
    setKeepAlive: () => {},
    setNoDelay: () => {}
  }),
  connect: () => ({
    on: () => {},
    once: () => {},
    write: () => {},
    end: () => {},
    destroy: () => {},
    setTimeout: () => {},
    setKeepAlive: () => {},
    setNoDelay: () => {}
  }),
  Socket: class Socket {
    constructor() {
      this.connecting = false;
      this.destroyed = false;
      this.readable = false;
      this.writable = false;
    }
    
    connect() { return this; }
    on() { return this; }
    once() { return this; }
    write() { return true; }
    end() { return this; }
    destroy() { return this; }
    setTimeout() { return this; }
    setKeepAlive() { return this; }
    setNoDelay() { return this; }
  },
  Server: class Server {
    constructor() {
      this.listening = false;
    }
    
    listen() { return this; }
    close() { return this; }
    on() { return this; }
    once() { return this; }
  }
};