// settings.js
const Store = require('electron-store');

const store = new Store({
  name: 'user-preferences',
  defaults: {
    autolockMinutes: 5,     // lock after 5 minutes
    clipboardSeconds: 20,   // clear clipboard after 20s
  },
});

module.exports = {
  get(key) { return store.get(key); },
  set(key, value) { store.set(key, value); },
  all() { return store.store; },
};