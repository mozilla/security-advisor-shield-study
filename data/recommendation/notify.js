const yo = require('yo-yo');

class Notify {
  start() {
    this.target = this.createBase();
    document.body.appendChild(this.target);
    const methodsToBind = ['handleEndWarning', 'handleEndSignup'];
    for (let key of methodsToBind) { // eslint-disable-line prefer-const
      this[key] = this[key].bind(this);
    }
    self.port.on('data', recs => {
      const date = new Date(recs.BreachDate);
      const year = date.getFullYear();
      this.render({
        warn: true,
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
    const div = this.createBase();
    if (options.warn) {
      div.appendChild(this.createWarningBox(options.site, options.year));
    } else { // !warn
      if (options.changedPassword) {
        div.appendChild(this.createPasswordChangedBox());
      } else { // !changedPassword
        div.appendChild(this.createNoAccountBox());
      }
    }
    yo.update(this.target, div);
  }

  createBase() {
    return yo`<div id="panel"></div>`;
  }

  createWarningBox(site, year) {
    return yo`
      <div>
        <div class="info-box">
          <h1>Change your password for ${site}!</h1>
          <p>
            This site was compromised in ${year}, and your
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
        <div onclick=${this.handleEndWarning(true)}>I've changed my password</div>
        <div onclick=${this.handleEndWarning(false)}>I don't have an account</div>
      </footer>
    `;
  }

  createPasswordChangedBox() {
    return yo`
      <div>
        <div class="info-box">
          <h1>Great! Protect all your accounts</h1>
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
          <h1>Phew! Protect other accounts</h1>
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
        <div onclick=${this.handleEndSignup(false)}>No, thanks</div>
        <div onclick=${this.handleEndSignup(true)}>Use Firefox Sync</div>
      </footer>
    `;
  }

  handleEndWarning(changedPassword) {
    if (!this.hasSync) {
      this.render({
        warn: false,
        changedPassword,
      });
    } else {
      self.port.emit('disableSite');
    }
  }

  handleEndSignup(wantsSync) {
    self.port.emit('disableSite');
    if (wantsSync) {
      self.port.emit('signup');
    }
  }
}

const notify = new Notify();
notify.start();
