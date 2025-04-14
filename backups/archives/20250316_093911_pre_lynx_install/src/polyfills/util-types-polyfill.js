/** Polyfill pour util/types */
module.exports = {
  isAnyArrayBuffer: (obj) => obj instanceof ArrayBuffer,
  isArgumentsObject: (obj) => Object.prototype.toString.call(obj) === '[object Arguments]',
  isArrayBuffer: (obj) => obj instanceof ArrayBuffer,
  isAsyncFunction: (obj) => Object.prototype.toString.call(obj) === '[object AsyncFunction]',
  isBigInt64Array: (obj) => false, // Non supporté dans les navigateurs
  isBigUint64Array: (obj) => false, // Non supporté dans les navigateurs
  isBooleanObject: (obj) => typeof obj === 'object' && obj !== null && obj.constructor === Boolean,
  isBoxedPrimitive: (obj) => 
    (typeof obj === 'object' && obj !== null) && 
    (obj.constructor === Boolean || 
     obj.constructor === Number || 
     obj.constructor === String || 
     obj.constructor === Symbol),
  isDataView: (obj) => obj instanceof DataView,
  isDate: (obj) => obj instanceof Date,
  isExternal: (obj) => false, // Non supporté dans les navigateurs
  isFloat32Array: (obj) => obj instanceof Float32Array,
  isFloat64Array: (obj) => obj instanceof Float64Array,
  isGeneratorFunction: (obj) => Object.prototype.toString.call(obj) === '[object GeneratorFunction]',
  isGeneratorObject: (obj) => Object.prototype.toString.call(obj) === '[object Generator]',
  isInt8Array: (obj) => obj instanceof Int8Array,
  isInt16Array: (obj) => obj instanceof Int16Array,
  isInt32Array: (obj) => obj instanceof Int32Array,
  isMap: (obj) => obj instanceof Map,
  isMapIterator: (obj) => false, // Difficile à détecter dans les navigateurs
  isModuleNamespaceObject: (obj) => false, // Non supporté dans les navigateurs
  isNativeError: (obj) => obj instanceof Error,
  isNumberObject: (obj) => typeof obj === 'object' && obj !== null && obj.constructor === Number,
  isPromise: (obj) => obj instanceof Promise,
  isProxy: (obj) => false, // Non supporté dans les navigateurs
  isRegExp: (obj) => obj instanceof RegExp,
  isSet: (obj) => obj instanceof Set,
  isSetIterator: (obj) => false, // Difficile à détecter dans les navigateurs
  isSharedArrayBuffer: (obj) => false, // Peut ne pas être supporté dans tous les navigateurs
  isStringObject: (obj) => typeof obj === 'object' && obj !== null && obj.constructor === String,
  isSymbolObject: (obj) => typeof obj === 'object' && obj !== null && obj.constructor === Symbol,
  isTypedArray: (obj) => 
    obj instanceof Int8Array || 
    obj instanceof Uint8Array || 
    obj instanceof Uint8ClampedArray || 
    obj instanceof Int16Array || 
    obj instanceof Uint16Array || 
    obj instanceof Int32Array || 
    obj instanceof Uint32Array || 
    obj instanceof Float32Array || 
    obj instanceof Float64Array,
  isUint8Array: (obj) => obj instanceof Uint8Array,
  isUint8ClampedArray: (obj) => obj instanceof Uint8ClampedArray,
  isUint16Array: (obj) => obj instanceof Uint16Array,
  isUint32Array: (obj) => obj instanceof Uint32Array,
  isWeakMap: (obj) => obj instanceof WeakMap,
  isWeakSet: (obj) => obj instanceof WeakSet,
  isWebAssemblyCompiledModule: (obj) => false // Peut ne pas être supporté dans tous les navigateurs
};