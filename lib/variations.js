const { Advisor } = require('./Advisor.js');
const simplePrefs = require('sdk/simple-prefs');

let Advise = null;

const variations = {
  'passive-panel': function passivePanel() {
    Advise = new Advisor();
    Advise.start();
  },
  'auto-open-panel': function autoOpenPanel() {
    simplePrefs.prefs.autoOpenPanel = true;
    Advise = new Advisor();
    Advise.start();
  },
  // 'observe-only'() {},
};

function isEligible() {
  return true;
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
