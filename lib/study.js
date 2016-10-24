const self = require('sdk/self');
const shield = require('shield-studies-addon-utils');
const { when: unload } = require('sdk/system/unload');

const { Advisor } = require('./Advisor');

let Advise = null;

const studyConfig = {
  name: self.addonId,
  duration: 7,
  surveyUrls: {
    'end-of-study': 'mozilla.org',
    'user-ended-study': 'mozilla.org',
    ineligible: null,
  },
  variations: {
    'regular-sync-offer'() {
      Advise = new Advisor();
      Advise.start({ newOffer: false });
    },
    'new-features-sync-offer'() {
      Advise = new Advisor();
      Advise.start({ newOffer: true });
    },
    'observe-only'() {},
  },
};

class SecurityAdvisorStudy extends shield.Study {
  isEligible() {
    if (this.variation === 'observe-only') {
      return true;
    }
    return super.isEligible() && Advise.isEligible();
  }
  cleanup() {
    if (this.variation !== 'observe-only') {
      Advise.cleanup();
      Advise = null;
    }
    super.cleanup();  // cleanup simple-prefs, simple-storage
  }
}

const thisStudy = new SecurityAdvisorStudy(studyConfig);

// for testing / linting
exports.SecurityAdvisorStudy = SecurityAdvisorStudy;
exports.studyConfig = studyConfig;

// for use by index.js
exports.study = thisStudy;

unload((reason) => thisStudy.shutdown(reason));
