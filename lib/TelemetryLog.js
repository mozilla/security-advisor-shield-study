const simpleStorage = require('sdk/simple-storage');
const xutils = require('shield-studies-addon-utils');

class TelemetryLog {
  get logData() {
    return simpleStorage.storage.telemetryLogData;
  }

  set logData(newObject) {
    simpleStorage.storage.telemetryLogData = newObject;
  }

  constructor() {
    const eventTypes = ['buttonShow', 'panelShow', 'panelHide', 'passwordChange',
                        'noAccount', 'signup', 'noSignup', 'disableAll'];
    if (!this.logData) {
      this.logData = {};
      for (let eventType of eventTypes) { // eslint-disable-line prefer-const
        this.logData[`${eventType}Count`] = 0;
      }
    }
  }

  log(data) {
    const dataToReport = data;
    dataToReport.messageClass = 'advisor-logging';
    xutils.report(dataToReport);
  }

  logUIEvent(eventType, domain) {
    this.logData[`${eventType}Count`] += 1;
    this.log({
      eventType,
      domain,
      [`${eventType}ConfirmTime`]: Date.now(),
      [`${eventType}Count`]: this.logData[`${eventType}Count`],
    });
  }
}

exports.TelemetryLog = TelemetryLog;
