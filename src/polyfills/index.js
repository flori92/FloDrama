// Index des polyfills
export * from './diagnostics-channel-polyfill.js';
export * from './tls-polyfill.js';
export * from './net-polyfill.js';
export * from './perf-hooks-polyfill.js';
export * from './util-types-polyfill.js';
export * from './dns-polyfill.js';
export * from './readline-polyfill.js';
export * from './worker-threads-polyfill.js';
export * from './process-browser-polyfill.js';

import Readline from './readline-polyfill.js';
import WorkerThreads from './worker-threads-polyfill.js';
import Process from './process-browser-polyfill.js';

import Dns from './dns-polyfill.js';
import UtilTypes from './util-types-polyfill.js';
import PerfHooks from './perf-hooks-polyfill.js';
import Net from './net-polyfill.js';
import Tls from './tls-polyfill.js';
import DiagnosticsChannel from './diagnostics-channel-polyfill.js';
export default { DiagnosticsChannel, Tls, Net, PerfHooks, UtilTypes, Dns, Readline, WorkerThreads, Process };