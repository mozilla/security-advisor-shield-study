const prefSvc = require('sdk/preferences/service');
const shield = require('shield-studies-addon-utils');
const { when: unload } = require('sdk/system/unload');

const { Advisor } = require('./Advisor');

let advisor = null;
let thisStudy = null;

function createAdvisor(study) {
  const newAdvisor = new Advisor();

  newAdvisor.on('sync-installed', () => {
    study.uninstall('sync-installed-inelligible');
  });
  newAdvisor.on('signup', specialOffer => {
    if (specialOffer) {
      study.uninstall('user-converted-feature-offer');
    } else {
      study.uninstall('user-converted-no-offer');
    }
  });
  newAdvisor.on('disable-forever', () => {
    study.uninstall('user-disabled-all-warnings');
  });

  return newAdvisor;
}

const surveyUrl = 'https://qsurvey.mozilla.com/s3/security-advisor';
const studyConfig = {
  name: 'security-advisor',
  duration: 14,
  surveyUrls: {
    'end-of-study': surveyUrl,
    'user-ended-study': surveyUrl,
    'sync-installed-inelligible': surveyUrl,
    'user-converted-feature-offer': surveyUrl,
    'user-converted-no-offer': surveyUrl,
    'user-disabled-all-warnings': surveyUrl,
    ineligible: null,
  },
  variations: {
    'regular-sync-offer'() {
      advisor = createAdvisor(thisStudy);
      advisor.start({ newOffer: false });
    },
    'new-features-sync-offer'() {
      advisor = createAdvisor(thisStudy);
      advisor.start({ newOffer: true });
    },
    'observe-only'() {},
  },
};

class SecurityAdvisorStudy extends shield.Study {
  isEligible() {
    return super.isEligible() && !prefSvc.isSet('services.sync.username');
  }

  uninstall(reason) {
    this.flags.dying = true;
    this.report({
      study_name: this.config.name,
      branch: this.config.variation,
      study_state: reason,
    });
    shield.generateTelemetryIdIfNeeded().then(() => {
      this.showSurvey(reason);
    });
    shield.die();
  }

  cleanup() {
    if (this.variation !== 'observe-only') {
      advisor.cleanup();
      advisor = null;
    }
    super.cleanup();  // cleanup simple-prefs, simple-storage
  }
}

thisStudy = new SecurityAdvisorStudy(studyConfig);

// for testing / linting
exports.SecurityAdvisorStudy = SecurityAdvisorStudy;
exports.studyConfig = studyConfig;

// for use by index.js
exports.study = thisStudy;

unload((reason) => thisStudy.shutdown(reason));
