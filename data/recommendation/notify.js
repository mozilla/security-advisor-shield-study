class Notify {
  start() {
    this.setup();
    self.port.on('data', recs => {
      this.showAdvice(recs);
    });
    self.port.on('syncEnabled', () => {
      this.removeSyncSignup();
    });
    self.port.on('syncDisabled', () => {
      this.showSyncSignup();
    });
  }

  prettifyDate(ISODate) {
    return ISODate.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  showAdvice(recs) {
    const date = new Date(recs.BreachDate);
    const year = date.getFullYear();
    const victimCount = this.prettifyDate(recs.PwnCount);
    document.querySelector('#welcome').classList.remove('hidden');
    document.querySelector('#complete').classList.add('hidden');
    document.querySelector('#title').innerHTML = `Change your password for ${recs.Title}`;
    const dateTag = document.querySelector('#date');
    dateTag.innerHTML = `This site was hacked in ${year}`;
    document.querySelector('#count').innerHTML = `This has affected ${victimCount} users`;
  }
  showSuccess() {
    document.querySelector('#welcome').classList.add('hidden');
    document.querySelector('#complete').classList.remove('hidden');
    const domainH3 = document.querySelector('#message');
    domainH3.innerHTML = 'We won\'t show this message anymore for this domain';
  }

  setup() {
    const signupButton = document.querySelector('#signup');
    signupButton.addEventListener('click', () => {
      self.port.emit('signup');
    });
    const finishButton = document.querySelector('#finished');
    finishButton.addEventListener('click', () => {
      this.showSuccess();
    });
    const closeButton = document.querySelector('#done');
    closeButton.addEventListener('click', () => {
      self.port.emit('disableSite');
    });
  }

  removeSyncSignup() {
    document.querySelector('#sync').classList.add('hidden');
  }

  showSyncSignup() {
    document.querySelector('#sync').classList.remove('hidden');
  }
}

const notify = new Notify();
notify.start();
