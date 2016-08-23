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
  return true;
}

function cleanup() {
  Advise.destroy();
  Advise = null;
}

module.exports = {
  isEligible,
  cleanup,
  variations,
};
