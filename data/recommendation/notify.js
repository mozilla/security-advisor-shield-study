const yo = require('yo-yo');

class Notify {
  start() {
    this.target = document.body.appendChild(yo`<div></div>`);
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
    const div = yo`<div id="panel"></div>`;
    div.appendChild(this.createBox(boxType));
    yo.update(this.target, div);
  }

  createBox(boxType) {
    return yo`
      <div>
        <div class="info-box">
          ${this.createHeader(boxType)}
          ${this.createMessage(boxType)}
        </div>
        ${this.createFooter(boxType)}
      </div>
    `;
  }

  createHeader(boxType) {
    if (boxType === 'moreInfo' || boxType === 'warn') {
      return yo`
      <div class="title">
        <img src="warningRed.svg">
        <h1>Change your password!</h1>
      </div>
      `;
    } else if (boxType === 'changedPassword') {
      return yo`
        <div class="title">
          <img src="smile.svg">
          <h1>Great! Protect all your accounts</h1>
        </div>
      `;
    }
    // boxType === 'noAccount'
    return yo`
    <div class="title">
      <img src="relief.svg">
      <h1>Phew. Protect other accounts</h1>
    </div>
    `;
  }

  createMessage(boxType) {
    const date = new Date(this.recs.BreachDate);
    const year = date.getFullYear();
    const addedDate = new Date(this.recs.AddedDate);
    const addedYear = addedDate.getFullYear();
    const count = this.prettifyCount(this.recs.PwnCount);
    const site = this.recs.Title;

    if (boxType === 'warn') {
      return yo`
        <div>
          <p>
            ${site} was compromised in ${year}, and your
            account may be affected. <a onclick=${this.handleMoreInfo}>Learn more...</a>
          </p>
          <p>
            If you use this password on any other sites,
            we recommend you change those as well.
          </p>
        </div>
      `;
    } else if (boxType === 'moreInfo') {
      return yo`
        <div>
          <p>
            ${site} was compromised in ${year}, and the breach
            affected ${count} accounts. The breach was discovered
            in ${addedYear}.
          </p>
          <p>
            If you don't wish to recieve these notifcations anymore, you can
            <a onclick=${this.handleDisableAll}> disable all future warnings.</a>
          </p>
        </div>
      `;
    } else if (boxType === 'noAccount') {
      return yo`
        <div>
          <p>You dodged the bullet with not having an account here.</p>
          ${this.createSyncOffer()}
        </div>
      `;
    }
    // boxType === 'changedPassword'
    return yo`
      <div>
        <p>You've just taken a step towards staying safe online.</p>
        ${this.createSyncOffer()}
      </div>
    `;
  }

  createSyncOffer() {
    if (this.specialOffer) {
      return yo`
        <p>
          Protect yourself further with Firefox Sync for your passwords
          and you will be informed each time one of your accounts might
          be at risk.
        </p>
      `;
    }
    return yo`
      <p>
        Protect yourself further with Firefox Sync for your passwords. All your
        passwords, synced safely on all of your devices.
      </p>
    `;
  }

  createFooter(boxType) {
    if (boxType === 'warn' || boxType === 'moreInfo') {
      return yo`
        <footer>
          <div onclick=${this.handlePasswordChange}>I've changed my password</div>
          <div onclick=${this.handleNoAccount}>I don't have an account</div>
        </footer>
      `;
    }
    // boxType === changedPassword || boxType === noAccount
    return yo`
      <footer>
        <div onclick=${this.handleNoSignup}>No thanks</div>
        <div onclick=${this.handleSignup.bind(this)}>Use Firefox Sync</div>
      </footer>
    `;
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
