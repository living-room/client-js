const test = require('ava')

test('we can load the built module', t => {
  const Room = require('../build/room')
  const room = new Room()
  t.true(true)
})
