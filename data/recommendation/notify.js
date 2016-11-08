function el(tag, attrs = {}, ...children) {
  const element = document.createElement(tag);
  for (let name of Object.keys(attrs)) { // eslint-disable-line prefer-const
    element[name] = attrs[name];
  }
  for (let child of children) { // eslint-disable-line prefer-const
    if (typeof child === 'string') {
      element.appendChild(document.createTextNode(child));
    } else {
      element.appendChild(child);
    }
  }
  return element;
}

class Notify {
  start() {
    this.target = document.body.appendChild(el('div'));
    const methodsToBind = ['handleNoAccount', 'handlePasswordChange', 'handleSignup',
                           'handleNoSignup', 'handleMoreInfo', 'handleDisableAll'];
    for (let key of methodsToBind) { // eslint-disable-line prefer-const
      this[key] = this[key].bind(this);
    }
    self.port.on('data', recs => {
      this.recs = recs;
      this.render('warn');
    });
    this.specialOffer = false;
    self.port.on('newFeatureSyncOffer', () => {
      this.specialOffer = true;
    });
  }

  prettifyCount(ISODate) {
    return ISODate.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  render(boxType) {
    const newPanel = el('div', { id: 'panel' });
    newPanel.appendChild(this.createBox(boxType));
    const currentPanel = this.target.children[0];
    if (currentPanel) {
      this.target.replaceChild(newPanel, currentPanel);
    } else {
      this.target.appendChild(newPanel);
    }
  }

  createBox(boxType) {
    return el('div', {},
      el('div', { className: 'info-box' },
        this.createHeader(boxType),
        this.createMessage(boxType)
      ),
      this.createFooter(boxType)
    );
  }

  createHeader(boxType) {
    if (boxType === 'moreInfo' || boxType === 'warn') {
      return el('div', { className: 'title' },
        el('img', { src: 'warningRed.svg' }),
        el('h1', {}, 'Change your password!')
      );
    } else if (boxType === 'changedPassword') {
      return el('div', { className: 'title' },
        el('img', { src: 'smile.svg' }),
        el('h1', {}, 'Great! Protect all your accounts')
      );
    }
    // boxType === 'noAccount'
    return el('div', { className: 'title' },
      el('img', { src: 'relief.svg' }),
      el('h1', {}, 'Phew. Protect other accounts')
    );
  }

  createMessage(boxType) {
    const date = new Date(this.recs.BreachDate);
    const year = date.getFullYear();
    const addedDate = new Date(this.recs.AddedDate);
    const addedYear = addedDate.getFullYear();
    const count = this.prettifyCount(this.recs.PwnCount);
    const site = this.recs.Title;

    if (boxType === 'warn') {
      return el('div', {},
        el('p', {},
          `${site} was compromised in ${year}, and your account may be affected. `,
          el('a', { onclick: this.handleMoreInfo }, 'Learn more...')
        ),
        el('p', {},
          `If you use this password on any other sites,
          we recommend you change those as well.`
        )
      );
    } else if (boxType === 'moreInfo') {
      return el('div', {},
        el('p', {},
          `${site} was compromised in ${year}, and the breach
          affected ${count} accounts. The breach was discovered
          in ${addedYear}.`
        ),
        el('p', {},
          "If you don't wish to recieve these notifcations anymore, you can ",
          el('a', { onclick: this.handleDisableAll }, 'disable all future warnings.')
        )
      );
    } else if (boxType === 'noAccount') {
      return el('div', {},
        el('p', {}, 'You dodged the bullet with not having an account here.'),
        this.createSyncOffer()
      );
    }
    // boxType === 'changedPassword'
    return el('div', {},
      el('p', {}, "You've just taken a step towards staying safe online."),
      this.createSyncOffer()
    );
  }

  createSyncOffer() {
    if (this.specialOffer) {
      return el('p', {},
        el('strong', {}, `
          Want to be notified immediately if one of your saved passwords is
          stolen?
        `),
        'Sign up for a Firefox Account for instant security updates.'
      );
    }
    return el('p', {},
      el('strong', {}, `
        Want to take all your passwords, tabs, and bookmarks with you on the
        road?
      `),
      'Sign up for a Firefox account to sync your data with your Mobile device.'
    );
  }

  createFooter(boxType) {
    if (boxType === 'warn' || boxType === 'moreInfo') {
      return el('footer', {},
        el('div', { onclick: this.handlePasswordChange }, "I've changed my password"),
        el('div', { onclick: this.handleNoAccount }, "I don't have an account")
      );
    }
    // boxType === changedPassword || boxType === noAccount
    return el('footer', {},
      el('div', { onclick: this.handleNoSignup }, 'No thanks'),
      el('div', { onclick: this.handleSignup }, 'Use Firefox Sync')
    );
  }

  handleMoreInfo() {
    this.render('moreInfo');
  }

  handleNoAccount() {
    this.render({
      boxType: 'noAccount',
    });
  }

  handlePasswordChange() {
    this.render({
      boxType: 'changedPassword',
    });
  }

  handleSignup() {
    self.port.emit('disableSite');
    self.port.emit('signup', this.specialOffer);
  }

  handleNoSignup() {
    self.port.emit('disableSite');
    self.port.emit('noSignup');
  }

  handleDisableAll() {
    self.port.emit('disableForever');
  }
}

const notify = new Notify();
notify.start();
