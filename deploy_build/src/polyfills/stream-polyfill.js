// Polyfill pour le module stream
import { EventEmitter } from 'events';

export class Stream extends EventEmitter {
  constructor(options = {}) {
    super();
    this.readable = false;
    this.writable = false;
  }
  
  pipe(destination, options = {}) {
    this.on('data', (chunk) => {
      if (destination.writable) destination.write(chunk);
    });
    
    this.on('end', () => {
      if (destination.writable && !options.end) destination.end();
    });
    
    this.on('error', (err) => destination.emit('error', err));
    destination.on('error', (err) => this.emit('error', err));
    
    return destination;
  }
}

export class Readable extends Stream {
  constructor(options = {}) {
    super(options);
    this.readable = true;
    this._buffer = [];
    this._ended = false;
  }
  
  push(chunk) {
    if (chunk === null) {
      this._ended = true;
      this.emit('end');
      return false;
    }
    
    this._buffer.push(chunk);
    this.emit('data', chunk);
    return true;
  }
  
  read() {
    return this._buffer.length === 0 ? null : this._buffer.shift();
  }
}

export class Writable extends Stream {
  constructor(options = {}) {
    super(options);
    this.writable = true;
    this._chunks = [];
    this._ended = false;
  }
  
  write(chunk, encoding, callback) {
    if (this._ended) throw new Error('Cannot write to ended stream');
    
    this._chunks.push(chunk);
    this.emit('data', chunk);
    
    if (typeof callback === 'function') callback();
    return true;
  }
  
  end(chunk, encoding, callback) {
    if (chunk) this.write(chunk, encoding);
    
    this._ended = true;
    this.emit('finish');
    
    if (typeof callback === 'function') callback();
  }
}

export default { Stream, Readable, Writable };