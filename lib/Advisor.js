const {Cu} = require('chrome');
Cu.import('resource://gre/modules/Services.jsm'); /* globals Services: false */

const {Class: sdkClass} = require('sdk/core/heritage');
const {getNodeView} = require('sdk/view/core');
const {Panel: panel} = require('sdk/panel');
const request = require('sdk/request').Request;
const sdkData = require('sdk/self').data;
const tabs = require('sdk/tabs');

const panelWidth = 452;
const panelHeight = 272;

const Button = sdkClass({
  initialize() {
    this.doc = Services.wm.getMostRecentWindow('navigator:browser').document;
    this.button = this.doc.createElement('div');
    this.button.id = 'recommend-button';
    this.buttonIcon = this.doc.createElement('div');
    this.buttonMessage = this.doc.createElement('div');
    this.buttonMessageIcon = this.doc.createElement('image');
    this.buttonMessageIcon.setAttribute('src', sdkData.url('recommendation/firefox.svg'));
    this.buttonMessageIcon.setAttribute('class', 'urlbar-icon');
    this.buttonMessage.appendChild(this.buttonMessageIcon);
    this.buttonMessageText = this.doc.createElement('h1');
    this.buttonMessageText.innerHTML = 'Your account could be at risk!';
    this.buttonMessage.appendChild(this.buttonMessageText);
    this.buttonMessage.style.background = 'linear-gradient(#d70000, #b00000)';
    this.buttonMessage.style.padding = '2px 40px 2px 32px';
    this.buttonMessage.style['border-radius'] = '3px';
    this.buttonMessage.style.color = 'white';
    this.buttonMessage.style['box-shadow'] = '0 1px 2px -2px #6A6A6A';
    this.buttonIcon.appendChild(this.buttonMessage);
    this.buttonIcon.setAttribute('hidden', 'true');
    this.button.appendChild(this.buttonIcon);
    this.doc.getElementById('urlbar-icons').appendChild(this.button);
  },
  remove() {
    this.doc.getElementById('recommend-button').remove();
  },
  show() {
    this.buttonIcon.setAttribute('hidden', 'false');
  },
  hide() {
    this.buttonIcon.setAttribute('hidden', 'true');
  },
  onClick(callback) {
    this.buttonIcon.addEventListener('click', callback);
  },
});
getNodeView.define(Button, button => button.button);

class Advisor {
  constructor() {
    this.window = Services.wm.getMostRecentWindow('navigator:browser');
    this.doc = this.window.document;
    this.domains = new Set();
  }

  init() {
    this.panel = this.createPanel();
    this.createButton();
    this.createRequestListener('signup');
    this.createRequestListener('finished');
    this.loadLocalDomains();
    this.loadOwnedDomains();
    this.createWindowListener();
  }

  destroy() {
    this.panel.destroy();
    this.button.remove();
    this.removeWindowListener();
  }

  createPanel() {
    return panel({
      width: panelWidth,
      height: panelHeight,
      contentURL: './recommendation/recWindow.html',
      contentScriptFile: './recommendation/notify.js',
    });
  }

  createButton() {
    this.button = new Button();
    this.button.onClick(this.showPanel.bind(this));
  }

  showPanel() {
    this.panel.show({
      position: this.button,
    });
  }

  // Checks that current window is target domain
  waitForWindow() {
    for (let domain of this.domains) { // eslint-disable-line prefer-const
      if (tabs.activeTab.url.includes(domain)) {
        this.button.show();
        this.panel.port.emit('domain', domain);
        return;
      }
    }
    this.button.hide(); // only reached if none of rec domains match
  }

  createRequestListener(request) {
    if(request === 'signup') {
      this.panel.port.on(request, () => {
        this.panel.hide();
        tabs.open('about:accounts?action=signup&entrypoint=menupanel');
      });
    } else if(request === 'finished') {
      this.panel.port.on(request, domain => {
        this.panel.hide();
        this.button.hide();
        this.domains.delete(domain);
      });
    }
  }

  createWindowListener() {
    tabs.on('activate', this.waitForWindow.bind(this));
    tabs.on('ready', this.waitForWindow.bind(this));
  }

  removeWindowListener() {
    tabs.off('activate', this.waitForWindow.bind(this));
    tabs.off('ready', this.waitForWindow.bind(this));
    this.window.clearInterval(this.interval);
  }

  addDomain(domain) {
    this.domains.add(domain);
  }

  loadLocalDomains() {
    let domains = sdkData.load('recommendation/localDomains.json');
    domains = JSON.parse(domains);
    for (let domain of domains) { // eslint-disable-line prefer-const
      this.addDomain(domain);
    }
  }

  loadOwnedDomains() {
    let req = request({
      url: 'https://haveibeenpwned.com/api/v2/breaches',
      onComplete: response => {
        for(let site of response.json) {
          this.addDomain(site.Domain);
        }
      },
    });
    req.get();
  }
}

const advisor = new Advisor();
advisor.init();

exports.Advisor = {
  stage(domain) {
    advisor.addDomain(domain);
  },
};
