/** Polyfill pour dns */
module.exports = {
  lookup: (hostname, options, callback) => {
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }
    
    // Simulation d'une résolution DNS
    setTimeout(() => {
      callback(null, '127.0.0.1', 4);
    }, 0);
  },
  
  resolve: (hostname, callback) => {
    setTimeout(() => {
      callback(null, ['127.0.0.1']);
    }, 0);
  },
  
  resolve4: (hostname, callback) => {
    setTimeout(() => {
      callback(null, ['127.0.0.1']);
    }, 0);
  },
  
  resolve6: (hostname, callback) => {
    setTimeout(() => {
      callback(null, []);
    }, 0);
  },
  
  reverse: (ip, callback) => {
    setTimeout(() => {
      callback(null, ['localhost']);
    }, 0);
  },
  
  getServers: () => [],
  
  setServers: () => {},
  
  NODATA: 'ENODATA',
  FORMERR: 'EFORMERR',
  SERVFAIL: 'ESERVFAIL',
  NOTFOUND: 'ENOTFOUND',
  NOTIMP: 'ENOTIMP',
  REFUSED: 'EREFUSED',
  BADQUERY: 'EBADQUERY',
  BADNAME: 'EBADNAME',
  BADFAMILY: 'EBADFAMILY',
  BADRESP: 'EBADRESP',
  CONNREFUSED: 'ECONNREFUSED',
  TIMEOUT: 'ETIMEOUT',
  EOF: 'EOF',
  FILE: 'EFILE',
  NOMEM: 'ENOMEM',
  DESTRUCTION: 'EDESTRUCTION',
  BADSTR: 'EBADSTR',
  BADFLAGS: 'EBADFLAGS',
  NONAME: 'ENONAME',
  BADHINTS: 'EBADHINTS',
  NOTINITIALIZED: 'ENOTINITIALIZED',
  LOADIPHLPAPI: 'ELOADIPHLPAPI',
  ADDRGETNETWORKPARAMS: 'EADDRGETNETWORKPARAMS',
  CANCELLED: 'ECANCELLED'
};