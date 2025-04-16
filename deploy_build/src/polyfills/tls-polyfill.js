/** Polyfill pour tls */
module.exports = {
  createServer: () => ({
    listen: () => {},
    close: () => {},
    on: () => {},
    once: () => {},
    removeListener: () => {},
    removeAllListeners: () => {}
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
  TLSSocket: class TLSSocket {
    constructor() {
      this.authorized = false;
      this.encrypted = true;
    }
    
    on() { return this; }
    once() { return this; }
    write() { return true; }
    end() { return this; }
    destroy() { return this; }
  },
  Server: class Server {
    constructor() {
      this.listening = false;
    }
    
    listen() { return this; }
    close() { return this; }
    on() { return this; }
    once() { return this; }
  },
  getCiphers: () => [],
  checkServerIdentity: () => {}
};