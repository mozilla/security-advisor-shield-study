class Notify {
  start() {
    this.setup();
    self.port.on('data', recs => {
      this.showAdvice(recs);
    });
  }

  showAdvice(recs) {
    const date = new Date(recs.BreachDate);
    const year = date.getFullYear();
    const victimCount = recs.PwnCount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    document.getElementById('welcome').classList.remove('hidden');
    document.getElementById('complete').classList.add('hidden');
    document.getElementById('title').innerHTML = `Change your password for ${recs.Title}`;
    const dateTag = document.getElementById('date');
    dateTag.innerHTML = `This site was hacked in ${year}`;
    document.getElementById('count').innerHTML = `This has affected ${victimCount} users`;
  }
  showSuccess() {
    document.getElementById('welcome').classList.add('hidden');
    document.getElementById('complete').classList.remove('hidden');
    const domainH3 = document.getElementById('message');
    domainH3.innerHTML = 'We won\'t show this message anymore for this domain';
  }

  setup() {
    const signupButton = document.getElementById('signup');
    signupButton.addEventListener('click', () => {
      self.port.emit('signup');
    });
    const finishButton = document.getElementById('finished');
    finishButton.addEventListener('click', () => {
      this.showSuccess();
    });
    const closeButton = document.getElementById('done');
    closeButton.addEventListener('click', () => {
      self.port.emit('disableSite');
    });
  }
}

const notify = new Notify();
notify.start();
