const { Cu } = require('chrome');
Cu.import('resource://gre/modules/Services.jsm'); /* globals Services: false */

const { Panel: panel } = require('sdk/panel');
const request = require('sdk/request').Request;
const simplePrefs = require('sdk/simple-prefs');
const simpleStorage = require('sdk/simple-storage');
const tabs = require('sdk/tabs');
const { viewFor } = require('sdk/view/core');

const { Button } = require('lib/Button.js');
const { TelemetryLog } = require('lib/TelemetryLog.js');

const welcomeBoxHeight = 70;
const panelWidth = 452;
const panelHeight = 272;
const onboardDomain = 'https://wikipedia.org';

class Advisor {
  constructor() {
    this.telemetryLog = new TelemetryLog();
    const methodsToBind = ['endOnboard', 'showPanel', 'waitForWindow',
                           'handlePanelHide', 'handlePanelShow', 'hidePanel'];
    for (let key of methodsToBind) { // eslint-disable-line prefer-const
      this[key] = this[key].bind(this);
    }
    this.buttons = [];
    this.panel = this.createPanel();
    this.createRequestListeners();
    this.createWindowListeners();
  }

  start() {
    if (!simpleStorage.storage.recData) {
      simpleStorage.storage.recData = [];
      this.loadOwnedDomains();
    }
    this.activeRecDomain = '';
    if (!simplePrefs.prefs.onboarded) {
      this.onboard();
    }
  }

  destroy() {
    this.panel.destroy();
    this.removeWindowListener();
    this.deleteButtons();
  }

  onboard() {
    this.panel.port.emit('onboard');
    tabs.open({
      url: onboardDomain,
      onReady: () => {
        this.telemetryLog.onboard(onboardDomain);
        this.panel.on('hide', this.endOnboard);
      },
    });
  }

  endOnboard() {
    this.panel.removeListener('hide', this.endOnboard);
    this.panel.port.emit('endOnboard');
    this.telemetryLog.endOnboard();
    simplePrefs.prefs.onboarded = true;
    this.waitForWindow(); // reset the panel size
  }

  createPanel() {
    return panel({
      width: panelWidth,
      height: panelHeight,
      contentURL: './recommendation/recWindow.html',
      contentScriptFile: './recommendation/notify.js',
      onShow: this.handlePanelShow,
      onHide: this.handlePanelHide,
    });
  }

  showPanel(button) {
    button.handlePanelOpen();
    this.panel.show({
      position: button,
    });
  }

  handlePanelShow() {
    this.telemetryLog.showPanel(this.activeRecDomain);
  }

  handlePanelHide() {
    this.telemetryLog.hidePanel(this.activeRecDomain);
    const win = tabs.activeTab.window;
    const button = this.getButton(win);
    button.handlePanelHide();
  }

  // Prepares panel with info in background
  prepPanel(recs) {
    if (!simplePrefs.prefs.onboarded) {
      this.panel.height += welcomeBoxHeight;
    }
    this.panel.port.emit('data', recs);
  }

  getButton(win) {
    for (let button of this.buttons) { // eslint-disable-line prefer-const
      if (button.window === win) {
        return button;
      }
    }
    // if a button doesn't exist, make a new one
    const button = new Button(viewFor(win), this.showPanel);
    button.window = win;
    this.buttons.push(button);
    return button;
  }

  deleteButtons() {
    for (let button of this.buttons) { // eslint-disable-line prefer-const
      button.destroy();
    }
    this.buttons = [];
  }

  // Checks that current window is target domain
  waitForWindow() {
    const win = tabs.activeTab.window;
    const button = this.getButton(win);
    for (let rec of simpleStorage.storage.recData) { // eslint-disable-line prefer-const
      if (tabs.activeTab.url.includes(rec.domain)) {
        this.activeRecDomain = rec.domain;
        this.prepPanel(rec);
        this.telemetryLog.showButton(this.activeRecDomain);
        button.show();
        if (!simplePrefs.prefs.onboarded) {
          this.showPanel(button);
        }
        if (simplePrefs.prefs.autoOpenPanel && !rec.shown) {
          this.showPanel(button);
          rec.shown = true;
        }
        return;
      }
    }
    // only reached if no rec.domain matches current tab domain
    button.hide();
  }

  createRequestListeners() {
    this.createDisableSiteListener();
    this.createDisableForeverListener();
  }

  // TODO: make sure this works properly
  createDisableSiteListener() {
    this.panel.port.on('disableSite', () => {
      this.panel.hide();
      const win = tabs.activeTab.window;
      const button = this.getButton(win);
      button.hide();
      for (let i = 0; i < simpleStorage.storage.recData.length; i++) {
        if (simpleStorage.storage.recData[i].domain === this.activeRecDomain) {
          simpleStorage.storage.recData.splice(i, 1);
          return;
        }
      }
    });
  }

  createDisableForeverListener() {
    this.panel.port.on('disableForever', () => {
      this.panel.hide();
      const win = tabs.activeTab.window;
      const button = this.getButton(win);
      button.hide();
      simpleStorage.storage.recData = []; // clear all recs
      this.uninstallAddon(self.id, '');
    });
  }

  hidePanel() {
    this.panel.hide();
  }

  createWindowListeners() {
    tabs.on('activate', this.waitForWindow);
    tabs.on('ready', this.waitForWindow);
    tabs.on('deactivate', this.hidePanel);
    tabs.on('close', this.hidePanel);
  }

  removeWindowListener() {
    tabs.off('activate', this.waitForWindow);
    tabs.off('ready', this.waitForWindow);
    tabs.off('deactivate', this.hidePanel);
    tabs.off('close', this.hidePanel);
  }

  addRec(domain) {
    const rec = {
      domain,
    };
    simpleStorage.storage.recData.push(rec);
  }

  loadOwnedDomains() {
    const req = request({
      url: 'https://haveibeenpwned.com/api/v2/breaches',
      onComplete: response => {
        for (let site of response.json) { // eslint-disable-line prefer-const
          this.addRec(site.Domain);
        }
      },
    });
    req.get();
  }
}

exports.Advisor = Advisor;
