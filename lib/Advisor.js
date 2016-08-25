const { Cu } = require('chrome');
Cu.import('resource://gre/modules/Preferences.jsm'); /* globals Preferences: false */

const { Panel: panel } = require('sdk/panel');
const request = require('sdk/request').Request;
const sdkData = require('sdk/self').data;
const simplePrefs = require('sdk/simple-prefs');
const simpleStorage = require('sdk/simple-storage');
const tabs = require('sdk/tabs');
const { viewFor } = require('sdk/view/core');

const { Button } = require('lib/Button.js');
const { TelemetryLog } = require('lib/TelemetryLog.js');

const panelWidth = 400;
const panelHeight = 192;

class Advisor {
  constructor() {
    this.telemetryLog = new TelemetryLog();
    const methodsToBind = ['showPanel', 'waitForWindow', 'handlePanelHide',
                           'handlePanelShow', 'hidePanel'];
    for (let key of methodsToBind) { // eslint-disable-line prefer-const
      this[key] = this[key].bind(this);
    }
    this.buttons = [];
    this.panel = this.createPanel();
    this.createRequestListeners();
    this.createWindowListeners();
    Preferences.observe('services.sync.username', this.handleSyncChange.bind(this));
  }

  start() {
    if (!simpleStorage.storage.recData) {
      simpleStorage.storage.recData = {};
      this.loadLocalData();
    }
    this.loadAPIData(); // load API data every startup to check for new breaches
    this.activeRecDomain = '';
  }

  destroy() {
    this.panel.destroy();
    this.removeWindowListener();
    this.deleteButtons();
  }

  createPanel() {
    return panel({
      width: panelWidth,
      height: panelHeight,
      contentURL: './recommendation/recWindow.html',
      contentScriptFile: './recommendation/notifyDist.js',
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
    this.panel.port.emit('data', recs);
  }

  handleSyncChange() {
    if (Preferences.isSet('services.sync.username')) {
      // end study if they sign up for sync
      simpleStorage.storage.recData = undefined; // clear all recs
      this.uninstallAddon(self.id, '');
    }
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
    const sites = Object.values(simpleStorage.storage.recData);
    for (let site of sites) { // eslint-disable-line prefer-const
      if (tabs.activeTab.url.includes(site.Domain)) {
        this.activeRecDomain = site.Domain;
        this.prepPanel(site);
        this.telemetryLog.showButton(this.activeRecDomain);
        button.show();
        if (simplePrefs.prefs.autoOpenPanel && !site.shown) {
          this.showPanel(button);
          site.shown = true;
        }
        return;
      }
    }
    // only reached if no site.Domain matches current tab domain
    button.hide();
  }

  createRequestListeners() {
    this.createDisableSiteListener();
    this.createDisableForeverListener();
    this.createSignupListener();
  }

  createSignupListener() {
    this.panel.port.on('signup', () => {
      tabs.open('about:accounts?action=signup&entrypoint=menupanel');
    });
  }

  createDisableSiteListener() {
    this.panel.port.on('disableSite', () => {
      this.panel.hide();
      const win = tabs.activeTab.window;
      const button = this.getButton(win);
      button.hide();
      const sites = Object.values(simpleStorage.storage.recData);
      for (let site of sites) { // eslint-disable-line prefer-const
        if (site.Domain === this.activeRecDomain) {
          delete simpleStorage.storage.recData[site.Name];
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
      simpleStorage.storage.recData = undefined; // clear all recs
      this.uninstallAddon(self.id, '');
    });
  }

  hidePanel() {
    this.panel.hide();
  }

  createWindowListeners() {
    tabs.on('activate', this.waitForWindow);
    tabs.on('pageshow', this.waitForWindow);
    tabs.on('deactivate', this.hidePanel);
    tabs.on('close', this.hidePanel);
  }

  removeWindowListener() {
    tabs.off('activate', this.waitForWindow);
    tabs.off('pageshow', this.waitForWindow);
    tabs.off('deactivate', this.hidePanel);
    tabs.off('close', this.hidePanel);
  }

  loadAPIData() {
    const req = request({
      url: 'https://haveibeenpwned.com/api/v2/breaches',
      onComplete: response => {
        for (let site of response.json) { // eslint-disable-line prefer-const
          simpleStorage.storage.recData[site.Name] = site;
        }
      },
    });
    req.get();
  }

  loadLocalData() {
    let localData = sdkData.load('recommendation/localData.json');
    localData = JSON.parse(localData);
    for (let site of localData) { // eslint-disable-line prefer-const
      simpleStorage.storage.recData[site.Name] = site;
    }
  }
}

exports.Advisor = Advisor;
