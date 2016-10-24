const { Advisor } = require('../lib/Advisor.js');
const { before, after } = require('sdk/test/utils');

let advisor;

exports['test main'] = (assert) => {
  assert.pass('Unit test running!');
};

exports['test main async'] = (assert, done) => {
  assert.pass('async Unit test running!');
  done();
};

exports['test advisor createPanel'] = (assert) => {
  assert.ok((advisor.panel.isShowing === false), 'Panel created!');
};

before(exports, () => {
  advisor = new Advisor();
});

require('sdk/test').run(exports);

after(exports, () => {
  advisor.cleanup();
  advisor = null;
});
