const { LivingRoomService } = require(`@living-room/service-js`)
const Room = require(`../build/room`)
const test = require(`ava`)

test.beforeEach(async t => {
  t.context.service = new LivingRoomService()
  await t.context.service.listen({verbose: false})
  t.context.room = new Room(`http://localhost:${t.context.service.port}`)
})

test.afterEach(async t => {
  t.context.service.close()
})

test(`await assert`, async t => {
  const { room } = t.context
  const { facts } = await room.assert(`hello`)
  t.deepEqual(facts, [{assert: `hello`}])
  const result = await room.select(`$word`)
  t.deepEqual(result, [{
    word: { word: `hello` }
  }])
})

test.cb(`no callback subscribe`, t => {
  const { room } = t.context
  room.subscribe(`$what callback assert`, ({assertions, retractions}) => {
    t.deepEqual(assertions, [{what: `no`}])
    t.deepEqual(retractions, [])
    t.end()
  })

  room.assert(`no callback assert`)
})

test.cb(`no callback assert`, t => {
  const { room } = t.context
  room.on(`$what callback assert`, ({what}) => {
    t.is(what, `no`)
    t.end()
  })

  room.assert(`no callback assert`)
})

test.cb(`multiple asserts`, t => {
  const { room } = t.context
  const animal = new Set([
    `party`,
    `car`,
    `animal`,
    `blue`,
    `me`
  ])

  const asserts = Array.from(animal.values())
    .map(what => ({ assert: `animal ${what}` }))

  room.on(`animal $what`, ({what}) => {
    t.true(animal.delete(what))
    if (animal.size === 0) t.end()
  })

  room
     .assert(`animal party`)
     .assert(`animal car`)
     .assert(`animal animal`)

  room
     .assert(`animal blue`)
     .assert(`animal me`)
})

/*
test.cb(`once only gets called for existing assertions`, t => {
  const { room } = t.context
  const asserts = new Set([ `first`, `second` ])
  let times = false

  const number = ({number}) => {
    if (times) return
    t.true([`first`, `second`].includes(number))
    times = true
  }

  room.on(`$number`, number)

  room
    .assert(`first`)
    .assert(`second`)

  setTimeout(() => {
    room.assert(`third`).then(() => t.end())
  }, 150)
})
*/

/*
test.cb(`called for all assertions`, t => {
  const { room } = t.context
  let asserts = new Set([ `first`, `second`, `third` ])
  t.plan(asserts.size)

  const what = ({what}) => {
    t.true(asserts.delete(what))
  }

  room.on(`$what`, what)

  room
    .assert(`first`)
    .assert(`second`)

  setTimeout(() => {
    room.assert(`third`)
      .then(() => {
        t.is(asserts.size, 0)
        //room.off(`$what`, what)
        t.end()
      })
  }, 150)
})
*/

/*
test.cb('setImmediate clears calls a second time', t => {
  const { room } = t.context
  let times = 0
  const processed = response => {
    if (times === 0) {
      t.deepEqual(response, {facts: [{assert: 'this'}, {assert: 'is'}, {assert: 'cool'}]})
    } else {
      t.deepEqual(response, {facts: [{assert: 'like'}, {assert: 'the'}, {assert: 'coolest'}]})
    }
    times++
  }

  room.on('$processed', processed)

  room
    .assert('this')
    .assert('is')
    .assert('cool')
    .then()

  room
    .assert('like')
    .assert('the')
    .assert('coolest')
    .then(response=> {
      t.is(response, {facts: [{assert: `like`}, {assert: `the`}, {assert: `coolest`}]})
      t.end()
    })
})
*/
