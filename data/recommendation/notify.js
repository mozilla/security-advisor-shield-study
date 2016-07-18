class Notify {
  init() {
    this.domain;
    self.port.on('domain', domain => {
      this.domain = domain;
    });
    const signup = document.getElementById('signup');
    signup.addEventListener('click', () => {
      self.port.emit('signup');
    });
    const finished = document.getElementById('finished');
    finished.addEventListener('click', () => {
      self.port.emit('finished', this.domain);
    });
  }
}

const notify = new Notify();
notify.init();
