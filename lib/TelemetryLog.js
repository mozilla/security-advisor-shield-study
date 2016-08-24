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
        passwordChangeCount: 0,
        noAccountCount: 0,
        signupCount: 0,
        noSignupCount: 0,
      };
    }
  }

  log(data) {
    const dataToReport = data;
    dataToReport.messageClass = 'advisor-logging';
    xutils.report(dataToReport);
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

  passwordChange(domain) {
    this.logData.passwordChangeCount += 1;
    this.log({
      messageType: 'passwordChange',
      domain,
      passwordChangeConfirmTime: Date.now(),
      passwordChangeCount: this.logData.passwordChangeCount,
    });
  }

  noAccount(domain) {
    this.logData.noAccountCount += 1;
    this.log({
      messageType: 'noAccount',
      domain,
      noAccountConfirmTime: Date.now(),
      noAccountCount: this.logData.noAccountCount,
    });
  }

  signup(domain) {
    this.logData.signupCount += 1;
    this.log({
      messageType: 'signupForSync',
      domain,
      signupTime: Date.now(),
      signupCount: this.logData.signupCount,
    });
  }

  noSignup(domain) {
    this.logData.noSignupCount += 1;
    this.log({
      messageType: 'noSignupForSync',
      domain,
      noSignupTime: Date.now(),
      noSignupCount: this.logData.noSignupCount,
    });
  }

  disableAll(domain) {
    this.log({
      messageType: 'disableAll',
      domain,
      disableAllTime: Date.now(),
    });
  }
}

exports.TelemetryLog = TelemetryLog;
