/** Polyfill pour worker_threads */
module.exports = {
  isMainThread: true,
  parentPort: null,
  workerData: null,
  threadId: 0,
  Worker: class Worker {
    constructor() {
      throw new Error('Worker threads are not supported in browsers');
    }
  },
  MessageChannel: class MessageChannel {
    constructor() {
      this.port1 = {
        on: () => {},
        once: () => {},
        postMessage: () => {},
        close: () => {}
      };
      this.port2 = {
        on: () => {},
        once: () => {},
        postMessage: () => {},
        close: () => {}
      };
    }
  },
  MessagePort: class MessagePort {
    constructor() {
      throw new Error('MessagePort direct instantiation is not supported');
    }
  },
  BroadcastChannel: class BroadcastChannel {
    constructor(name) {
      this.name = name;
    }
    
    postMessage() {}
    close() {}
    onmessage() {}
    onmessageerror() {}
  }
};