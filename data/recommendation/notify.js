const yo = require('yo-yo');

class Notify {
  start() {
    this.target = document.body.appendChild(yo`<div></div>`);
    const methodsToBind = ['handleNoAccount', 'handlePasswordChange', 'handleSignup',
                           'handleNoThanks'];
    for (let key of methodsToBind) { // eslint-disable-line prefer-const
      this[key] = this[key].bind(this);
    }
    self.port.on('data', recs => {
      const date = new Date(recs.BreachDate);
      const year = date.getFullYear();
      this.render({
        boxType: 'warn',
        site: recs.Title,
        year,
      });
    });
    this.hasSync = false;
    self.port.on('syncEnabled', () => {
      this.hasSync = true;
    });
    self.port.on('syncDisabled', () => {
      this.hasSync = false;
    });
  }

  render(options) {
    const div = yo`<div id="panel"></div>`;
    if (options.boxType === 'warn') {
      div.appendChild(this.createWarningBox(options.site, options.year));
    } else if (options.boxType === 'changedPassword') {
      div.appendChild(this.createPasswordChangedBox());
    } else if (options.boxType === 'noAccount') {
      div.appendChild(this.createNoAccountBox());
    } else {
      throw new Error(`Unrecognized boxType "${options.boxType}"`);
    }
    yo.update(this.target, div);
  }

  createWarningBox(site, year) {
    return yo`
      <div>
        <div class="info-box">
          <div class="title">
            <img src="warningRed.svg">
            <h1>Change your password!</h1>
          </div>
          <p>
            ${site} was compromised in ${year}, and your
            account may be affected. <a>Learn more...</a>
          </p>
          <p>
            If you use this password on any other sites,
            we recommend you change those as well.
          </p>
        </div>
        ${this.createWarningFooter()}
      </div>
    `;
  }

  createWarningFooter() {
    return yo`
      <footer>
        <div onclick=${this.handlePasswordChange}>I've changed my password</div>
        <div onclick=${this.handleNoAccount}>I don't have an account</div>
      </footer>
    `;
  }

  createPasswordChangedBox() {
    return yo`
      <div>
        <div class="info-box">
          <div class="title">
            <img src="smile.svg">
            <h1>Great! Protect all your accounts</h1>
          </div>
          <p>
            You've just taken a step towards staying safe online.
          </p>
          <p>
            Protect yourself further with Firefox Sync for your passwords
            and you will be informed each time one of your accounts might
            be at risk.
          </p>
        </div>
        ${this.createSignupFooter()}
      </div>
    `;
  }

  createNoAccountBox() {
    return yo`
      <div>
        <div class="info-box">
          <div class="title">
            <img src="relief.svg">
            <h1>Phew. Protect other accounts</h1>
          </div>
          <p>
            You dodged the bullet with not having an account here.
          </p>
          <p>
            Protect yourself with Firefox Sync for your passwords
            and you will be informed each time one of your accounts might
            be at risk.
          </p>
        </div>
        ${this.createSignupFooter()}
      </div>
    `;
  }

  createSignupFooter() {
    return yo`
      <footer>
        <div onclick=${this.handleNoThanks}>No thanks</div>
        <div onclick=${this.handleSignup}>Use Firefox Sync</div>
      </footer>
    `;
  }

  handleNoAccount() {
    if (!this.hasSync) {
      this.render({
        boxType: 'noAccount',
      });
    } else { // !hasSync
      self.port.emit('disableSite');
    }
  }

  handlePasswordChange() {
    if (!this.hasSync) {
      this.render({
        boxType: 'changedPassword',
      });
    } else { // !hasSync
      self.port.emit('disableSite');
    }
  }

  handleSignup() {
    self.port.emit('disableSite');
    self.port.emit('signup');
  }

  handleNoThanks() {
    self.port.emit('disableSite');
  }
}

const notify = new Notify();
notify.start();
