class Notify {
  init() {
    this.domain;
    self.port.on('domain', domain => {
      this.domain = domain;
      this.showAdvice();
    });
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

  showAdvice() {
    document.getElementById('welcome').removeAttribute('hidden');
    document.getElementById('complete').setAttribute('hidden', true);
  }
  showSuccess() {
    document.getElementById('welcome').setAttribute('hidden', true);
    document.getElementById('complete').removeAttribute('hidden');
    const domainH3 = document.getElementById('message');
    domainH3.innerHTML = `We won't show this message anymore for ${this.domain}`;
  }
}

const notify = new Notify();
notify.init();
