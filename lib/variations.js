const { Cu } = require('chrome');
Cu.import('resource://gre/modules/Preferences.jsm'); /* globals Preferences: false */

const { Advisor } = require('./Advisor.js');

let Advise = null;

const variations = {
  'regular-sync-offer'() {
    Advise = new Advisor();
    Advise.start({ newOffer: false });
  },
  'new-features-sync-offer'() {
    Advise = new Advisor();
    Advise.start({ newOffer: true });
  },
  'observe-only'() {},
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
