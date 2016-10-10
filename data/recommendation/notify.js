const yo = require('yo-yo');

class Notify {
  start() {
    this.target = document.body.appendChild(yo`<div></div>`);
    const methodsToBind = ['handleNoAccount', 'handlePasswordChange', 'handleSignup',
                           'handleNoThanks', 'handleMoreInfo', 'handleDisableAll'];
    for (let key of methodsToBind) { // eslint-disable-line prefer-const
      this[key] = this[key].bind(this);
    }
    self.port.on('data', recs => {
      this.recs = recs;
      this.render({
        boxType: 'warn',
      });
    });
  }

  prettifyCount(ISODate) {
    return ISODate.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  render(options) {
    const div = yo`<div id="panel"></div>`;
    if (options.boxType === 'warn') {
      div.appendChild(this.createWarningBox());
    } else if (options.boxType === 'moreInfo') {
      div.appendChild(this.createInfoBox());
    } else if (options.boxType === 'changedPassword') {
      div.appendChild(this.createPasswordChangedBox());
    } else if (options.boxType === 'noAccount') {
      div.appendChild(this.createNoAccountBox());
    } else {
      throw new Error(`Unrecognized boxType "${options.boxType}"`);
    }
    yo.update(this.target, div);
  }

  createWarningBox() {
    const date = new Date(this.recs.BreachDate);
    const year = date.getFullYear();
    const site = this.recs.Title;
    return yo`
      <div>
        <div class="info-box">
          <div class="title">
            <img src="warningRed.svg">
            <h1>Change your password!</h1>
          </div>
          <p>
            ${site} was compromised in ${year}, and your
            account may be affected.
          </p>
          <p>
            If you use this password on any other sites,
            we recommend you change those as well.
          </p>
          <p><a onclick=${this.handleMoreInfo}>Why am I seeing this?</a></p>
        </div>
        ${this.createWarningFooter()}
      </div>
    `;
  }

  createInfoBox() {
    const date = new Date(this.recs.BreachDate);
    const year = date.getFullYear();
    const addedDate = new Date(this.recs.AddedDate);
    const addedYear = addedDate.getFullYear();
    const count = this.prettifyCount(this.recs.PwnCount);
    const site = this.recs.Title;
    return yo`
      <div>
        <div class="info-box">
          <div class="title">
            <img src="warningRed.svg">
            <h1>Change your password!</h1>
          </div>
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
        ${this.createWarningFooter()}
      </div>
    `;
  }

  createWarningFooter() {
    return yo`
      <footer>
        <div onclick=${this.handleNoAccount}>I don't have an account</div>
        <div onclick=${this.handlePasswordChange}>Thanks!</div>
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

  handleMoreInfo() {
    this.render({
      boxType: 'moreInfo',
    });
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
    self.port.emit('signup');
  }

  handleNoThanks() {
    self.port.emit('disableSite');
  }

  handleDisableAll() {
    self.port.emit('disableForever');
  }
}

const notify = new Notify();
notify.start();
