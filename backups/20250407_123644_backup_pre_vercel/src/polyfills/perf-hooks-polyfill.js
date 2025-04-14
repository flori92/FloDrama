/** Polyfill pour perf_hooks */
const performance = global.performance || {
  now: () => Date.now(),
  mark: () => {},
  measure: () => {},
  getEntriesByName: () => [],
  getEntriesByType: () => [],
  getEntries: () => [],
  clearMarks: () => {},
  clearMeasures: () => {},
  clearResourceTimings: () => {},
  setResourceTimingBufferSize: () => {}
};

class PerformanceObserver {
  constructor(callback) {
    this.callback = callback;
    this.observed = false;
  }
  
  observe() {
    this.observed = true;
    return this;
  }
  
  disconnect() {
    this.observed = false;
    return this;
  }
}

module.exports = {
  performance,
  PerformanceObserver,
  monitorEventLoopDelay: () => ({
    enable: () => {},
    disable: () => {},
    reset: () => {},
    percentile: () => 0,
    percentiles: () => ({}),
    min: () => 0,
    max: () => 0,
    mean: () => 0,
    stddev: () => 0
  })
};