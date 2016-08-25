const { Cu } = require('chrome');
Cu.import('resource://gre/modules/Preferences.jsm'); /* globals Preferences: false */

const { Advisor } = require('./Advisor.js');
const simplePrefs = require('sdk/simple-prefs');

let Advise = null;

const variations = {
  'passive-panel'() {
    Advise = new Advisor();
    Advise.start();
  },
  'auto-open-panel'() {
    simplePrefs.prefs.autoOpenPanel = true;
    Advise = new Advisor();
    Advise.start();
  },
  // 'observe-only'() {},
};

function isEligible() {
  return !Preferences.isSet('services.sync.username'); // users with sync are ineligible
}

function cleanup() {
  if (Advise) {
    Advise.destroy();
    Advise = null;
  }
}

module.exports = {
  isEligible,
  cleanup,
  variations,
};
