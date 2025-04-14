/** Polyfill pour diagnostics_channel */
module.exports = {
  hasSubscribers: () => false,
  channel: () => ({
    hasSubscribers: () => false,
    publish: () => false,
    subscribe: () => {},
    unsubscribe: () => {}
  })
};