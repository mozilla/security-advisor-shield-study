const { Cu } = require('chrome');
Cu.import('resource://gre/modules/Preferences.jsm'); /* globals Preferences: false */

const { AddonManager } = require('resource://gre/modules/AddonManager.jsm');
const { Panel: panel } = require('sdk/panel');
const request = require('sdk/request').Request;
const self = require('sdk/self');
const sdkData = require('sdk/self').data;
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
    this.checkForSync();
    Preferences.observe('services.sync.username', this.checkForSync.bind(this));
  }

  start(options) {
    if (!simpleStorage.storage.recData) {
      simpleStorage.storage.recData = {};
      this.loadLocalData();
    }
    this.activeRecDomain = '';
    if (options.newOffer) {
      this.panel.port.emit('newFeatureSyncOffer');
    }
  }

  cleanup() {
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
    this.telemetryLog.logUIEvent('panelShow', this.activeRecDomain);
  }

  handlePanelHide() {
    this.telemetryLog.logUIEvent('panelHide', this.activeRecDomain);
    const win = tabs.activeTab.window;
    const button = this.getButton(win);
    button.handlePanelHide();
  }

  // Prepares panel with info in background
  prepPanel(recs) {
    this.panel.port.emit('data', recs);
  }

  isSyncSetup() {
    return Preferences.isSet('services.sync.username');
  }

  checkForSync() {
    if (this.isSyncSetup()) {
      // end study if they sign up for sync
      this.uninstallSelf();
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
        this.telemetryLog.logUIEvent('buttonShow', this.activeRecDomain);
        button.show();
        if (!site.shown) { // auto-open panel on first visit
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
    this.createPasswordChangeListener();
    this.createNoAccountListener();
    this.createSignupListener();
    this.createNoSignupListener();
    this.createDisableSiteListener();
    this.createDisableForeverListener();
  }

  createPasswordChangeListener() {
    this.panel.port.on('passwordChange', () => {
      this.telemetryLog.logUIEvent('passwordChange', this.activeRecDomain);
    });
  }

  createNoAccountListener() {
    this.panel.port.on('noAccount', () => {
      this.telemetryLog.logUIEvent('noAccount', this.activeRecDomain);
    });
  }

  createSignupListener() {
    this.panel.port.on('signup', () => {
      tabs.open('about:accounts?action=signup&entrypoint=menupanel');
      this.telemetryLog.logUIEvent('signup', this.activeRecDomain);
    });
  }

  createNoSignupListener() {
    this.panel.port.on('noSignup', () => {
      this.telemetryLog.logUIEvent('noSignup', this.activeRecDomain);
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
      this.telemetryLog.logUIEvent('disableAll', this.activeRecDomain);
      this.panel.hide();
      const win = tabs.activeTab.window;
      const button = this.getButton(win);
      button.hide();
      this.uninstallSelf();
    });
  }

  uninstallSelf() {
    simpleStorage.storage.recData = undefined; // clear all recs
    AddonManager.getAddonByID(self.id, addon => {
      addon.uninstall();
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
