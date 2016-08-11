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
    if (!this.logData) {
      this.logData = {
        buttonShowCount: 0,
        panelShowCount: 0,
      };
    }
  }

  log(data) {
    const dataToReport = data;
    dataToReport.messageClass = 'advisor-logging';
    xutils.report(dataToReport);
  }

  onboard(domain) {
    this.log({
      messageType: 'onboard',
      domain,
      onboardInitTime: Date.now(),
    });
  }
  endOnboard() {
    this.log({
      messageType: 'endOnboard',
      onboardEndTime: Date.now(),
    });
  }
  showPanel(domain) {
    this.logData.panelShowCount += 1;
    this.log({
      messageType: 'showPanel',
      domain,
      panelShowTime: Date.now(),
      panelShowCount: this.logData.panelShowCount,
    });
  }

  hidePanel(domain) {
    this.log({
      messageType: 'hidePanel',
      domain,
      panelShowTime: Date.now(),
      panelShowCount: this.logData.panelShowCount,
    });
  }

  showButton(domain) {
    this.logData.buttonShowCount += 1;
    this.log({
      messageType: 'showButton',
      domain,
      buttonShowTime: Date.now(),
      buttonShowCount: this.logData.buttonShowCount,
    });
  }

  disableSite(domain) {
    this.logData.disableCount += 1;
    this.log({
      messageType: 'disableSite',
      domain,
      installRequestTime: Date.now(),
      disableCount: this.logData.disableCount,
    });
  }

  disableAll(domain) {
    this.log({
      messageType: 'disableAll',
      domain,
      installRequestTime: Date.now(),
    });
  }
}

exports.TelemetryLog = TelemetryLog;
