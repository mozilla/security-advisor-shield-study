class Notify {
  start() {
    this.setup();
    self.port.on('data', (/* recs */) => {
      this.showAdvice();
    });
  }

  showAdvice() {
    document.getElementById('welcome').classList.remove('hidden');
    document.getElementById('complete').classList.add('hidden');
  }
  showSuccess() {
    document.getElementById('welcome').classList.add('hidden');
    document.getElementById('complete').classList.remove('hidden');
    const domainH3 = document.getElementById('message');
    domainH3.innerHTML = 'We won\'t show this message anymore for this domain';
  }

  // TODO: convert anonymous functions to named functions
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
      self.port.emit('finished', this.domain);
    });
  }
}

const notify = new Notify();
notify.start();
