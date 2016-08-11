exports['test main'] = (assert) => {
  assert.pass('Unit test running!');
};

exports['test main async'] = (assert, done) => {
  assert.pass('async Unit test running!');
  done();
};
